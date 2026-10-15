import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { DemandItem, ExcursionRequest } from '../../types';
import { adminCommsApi } from '../../services/customerApi';
import { tokenStorage } from '../../services/api';
import { useRealtime } from '../../services/realtime';

type Filter = ExcursionRequest['status'] | 'all';

const STATUS: Record<ExcursionRequest['status'], { label: string; cls: string }> = {
  new: { label: 'Novo', cls: 'bg-[#F97316]/15 text-[#F97316]' },
  contacted: { label: 'Em contato', cls: 'bg-blue-500/15 text-blue-400' },
  planned: { label: 'Vai virar excursão', cls: 'bg-green-500/15 text-green-400' },
  archived: { label: 'Arquivado', cls: 'bg-foreground/10 text-foreground/40' },
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'new', label: 'Novos' },
  { key: 'contacted', label: 'Em contato' },
  { key: 'planned', label: 'Vão virar excursão' },
  { key: 'archived', label: 'Arquivados' },
  { key: 'all', label: 'Todos' },
];

const formatDateTime = (d: string) =>
  new Date(d.replace(' ', 'T') + (d.includes('Z') ? '' : 'Z')).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function AdminPedidos() {
  const [filter, setFilter] = useState<Filter>('new');
  const [requests, setRequests] = useState<ExcursionRequest[]>([]);
  const [ranking, setRanking] = useState<DemandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [savedNote, setSavedNote] = useState<number | null>(null);

  const load = useCallback(() => {
    adminCommsApi.requests(filter === 'all' ? undefined : filter)
      .then(r => { setRequests(r.requests); setRanking(r.ranking); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  useRealtime(tokenStorage.get(), e => {
    if (e.type === 'request:new' || e.type === 'reconnected') load();
  });

  const update = async (r: ExcursionRequest, data: { status?: ExcursionRequest['status']; adminNotes?: string }) => {
    try {
      const updated = await adminCommsApi.updateRequest(r.id, data);
      setRequests(list => (filter !== 'all' && data.status && data.status !== filter
        ? list.filter(x => x.id !== r.id)
        : list.map(x => (x.id === r.id ? updated : x))));
      if (data.adminNotes !== undefined) {
        setSavedNote(r.id);
        setTimeout(() => setSavedNote(n => (n === r.id ? null : n)), 1500);
      }
      if (data.status) adminCommsApi.requests().then(x => setRanking(x.ranking)).catch(() => {});
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  };

  const remove = async (r: ExcursionRequest) => {
    if (!confirm(`Excluir o pedido de ${r.name}?`)) return;
    await adminCommsApi.deleteRequest(r.id).catch(() => {});
    setRequests(list => list.filter(x => x.id !== r.id));
  };

  const whatsappLink = (r: ExcursionRequest) => {
    const text = `Olá, ${r.name.split(' ')[0]}! Aqui é da Excursões Brasil. Recebemos seu pedido de excursão para ${r.eventName} e queremos conversar com você.`;
    return `https://wa.me/55${r.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-['Outfit'] font-black text-3xl text-foreground">Pedidos de excursão</h1>
            <p className="text-foreground/30 text-sm mt-1">Eventos que os clientes querem ir e ainda não estão no site.</p>
          </div>
          <Link to="/admin/eventos/novo" className="self-start px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold">+ Criar excursão</Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div>
            <div className="flex flex-wrap gap-2 mb-5">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === f.key ? 'bg-[#F97316] text-white' : 'bg-foreground/5 text-foreground/50 hover:bg-foreground/10'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {loading && !requests.length ? (
              <div className="py-16 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-foreground/10 border-t-[#F97316] animate-spin" /></div>
            ) : !requests.length ? (
              <div className="bg-card border border-foreground/10 rounded-2xl py-16 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-foreground/40 text-sm">Nenhum pedido aqui.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(r => (
                  <div key={r.id} className="bg-card border border-foreground/10 rounded-2xl p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-['Outfit'] font-bold text-lg text-foreground">{r.eventName}</p>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                        </div>
                        <p className="text-foreground/40 text-xs mt-1">
                          👥 {r.people >= 30 ? '20+ pessoas' : `${r.people} pessoa${r.people > 1 ? 's' : ''}`}
                          {r.departureCity && <> · 🚌 saindo de {r.departureCity}</>}
                          {r.eventCity && <> · 📍 {r.eventCity}</>}
                          {r.eventDate && <> · 📅 {r.eventDate}</>}
                        </p>
                      </div>
                      <span className="text-foreground/25 text-xs">{formatDateTime(r.createdAt)}</span>
                    </div>

                    {r.message && <p className="text-foreground/60 text-sm mt-3 bg-foreground/[0.03] rounded-xl px-4 py-3">“{r.message}”</p>}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm">
                      <span className="text-foreground font-semibold">{r.name}</span>
                      <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Excursão para ${r.eventName}`)}`} className="text-foreground/50 hover:text-[#F97316]">{r.email}</a>
                      <span className="text-foreground/50">{r.phone}</span>
                    </div>

                    <textarea
                      value={notes[r.id] ?? r.adminNotes ?? ''}
                      onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))}
                      onBlur={e => { if (e.target.value !== (r.adminNotes ?? '')) update(r, { adminNotes: e.target.value }); }}
                      rows={1} placeholder="Anotações internas (salva ao sair do campo)…"
                      className="w-full mt-3 px-3 py-2 rounded-lg border border-foreground/10 text-xs outline-none focus:border-[#F97316] bg-foreground/[0.03] text-foreground/70 placeholder-foreground/20 resize-y"
                    />
                    {savedNote === r.id && <p className="text-green-400 text-[11px] mt-1">✓ Anotação salva</p>}

                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-foreground/5">
                      <a href={whatsappLink(r)} target="_blank" rel="noreferrer" onClick={() => r.status === 'new' && update(r, { status: 'contacted' })}
                        className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/30">💬 Chamar no WhatsApp</a>
                      <select value={r.status} onChange={e => update(r, { status: e.target.value as ExcursionRequest['status'] })}
                        className="text-xs border border-foreground/10 rounded-lg px-2 py-2 text-foreground/60 bg-surface outline-none focus:border-[#F97316]">
                        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <button onClick={() => remove(r)} className="ml-auto px-3 py-2 rounded-lg text-red-400/70 text-xs font-semibold hover:bg-red-500/10">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ranking de demanda */}
          <aside className="bg-card border border-foreground/10 rounded-2xl p-5 lg:sticky lg:top-24">
            <h2 className="font-['Outfit'] font-bold text-foreground">🔥 Mais pedidos</h2>
            <p className="text-foreground/30 text-xs mb-4">Soma de pessoas interessadas (sem arquivados)</p>
            {!ranking.length ? (
              <p className="text-foreground/30 text-sm">Sem pedidos ainda.</p>
            ) : (
              <ol className="space-y-3">
                {ranking.map((d, i) => {
                  const max = ranking[0].people || 1;
                  return (
                    <li key={d.eventName}>
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-foreground/80 truncate"><span className="text-foreground/30 mr-1">{i + 1}.</span>{d.eventName}</span>
                        <span className="text-[#F97316] font-bold flex-shrink-0">{d.people}</span>
                      </div>
                      <div className="h-1.5 bg-foreground/5 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-[#F97316] rounded-full" style={{ width: `${(d.people / max) * 100}%` }} />
                      </div>
                      <p className="text-foreground/30 text-[11px] mt-1">
                        {d.requests} pedido{d.requests > 1 ? 's' : ''}{d.departureCities.length ? ` · ${d.departureCities.join(', ')}` : ''}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
