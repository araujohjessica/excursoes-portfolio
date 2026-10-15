import { useState } from 'react';
import SyncAsaasButton from '../../components/admin/SyncAsaasButton';
import BookingPaymentPanel from '../../components/admin/BookingPaymentPanel';
import { useParams, Link } from 'react-router';
import { useApp } from '../../store/AppContext';
import type { Booking } from '../../types';
import { imageUrl } from '../../services/api';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_LABELS: Record<Booking['paymentStatus'], string> = {
  paid: 'Pago', pending: 'Pendente', cancelled: 'Cancelado', refunded: 'Reembolsado',
};

const STATUS_COLORS: Record<Booking['paymentStatus'], string> = {
  paid: 'bg-green-500/20 text-green-400 border-green-500/20',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/20',
  refunded: 'bg-foreground/10 text-foreground/30 border-foreground/10',
};

const METHOD_LABELS: Record<Booking['paymentMethod'], string> = {
  pix: 'Pix', credit: 'Crédito', debit: 'Débito', boleto: 'Boleto',
};

export default function AdminEventoParticipantes() {
  const { id } = useParams();
  const { excursions, bookings, updateBookingStatus } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const exc = excursions.find(e => e.id === id);
  if (!exc) return (
    <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">🎟️</p>
        <p className="text-foreground/40 text-sm">Evento não encontrado</p>
        <Link to="/admin/eventos" className="text-[#F97316] text-sm mt-3 block hover:underline">← Voltar</Link>
      </div>
    </div>
  );

  const eventBookings = bookings.filter(b => b.excursionId === exc.id);

  const filtered = eventBookings.filter(b => {
    const matchSearch = !search ||
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      b.customerCpf.includes(search) ||
      (b.ticketCode || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = eventBookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0);
  const totalSeats = eventBookings.reduce((s, b) => s + b.seats, 0);
  const confirmedSeats = eventBookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.seats, 0);
  const spotsLeft = exc.maxSpots - exc.bookedSpots;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const exportCSV = () => {
    const header = ['ID', 'Nome', 'E-mail', 'Telefone', 'CPF', 'Pessoas', 'Total', 'Pagamento', 'Status', ...(exc?.hasTickets ? ['Ingresso'] : []), 'Data'].join(';');
    const rows = eventBookings.map(b =>
      [b.id, b.customerName, b.customerEmail, b.customerPhone, b.customerCpf, b.seats, b.totalAmount, METHOD_LABELS[b.paymentMethod], STATUS_LABELS[b.paymentStatus], ...(exc?.hasTickets ? [b.ticketCode || ''] : []), b.bookingDate].join(';')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes-${exc.slug || exc.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-foreground/20 mb-6">
          <Link to="/admin" className="hover:text-foreground/50 transition-colors">Admin</Link>
          <span>/</span>
          <Link to="/admin/eventos" className="hover:text-foreground/50 transition-colors">Eventos</Link>
          <span>/</span>
          <span className="text-foreground/50 truncate">{exc.eventName}</span>
        </nav>

        {/* Event header */}
        <div className="bg-card rounded-2xl border border-foreground/10 overflow-hidden mb-6">
          <div className="relative h-32 overflow-hidden">
            <img src={imageUrl(exc.image, 1200, 300)} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/80 to-transparent" />
            <div className="absolute inset-0 flex items-center px-7">
              <div className="min-w-0">
                <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest mb-1">{exc.eventName}</p>
                <h1 className="font-['Outfit'] font-black text-2xl text-foreground truncate">{exc.title}</h1>
                <p className="text-foreground/30 text-sm mt-1">
                  {exc.eventDate} · {exc.eventVenue}
                </p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-foreground/10 border-t border-foreground/10">
            {[
              { label: 'Total de reservas', value: String(eventBookings.length), color: 'text-foreground' },
              { label: 'Pessoas confirmadas', value: `${confirmedSeats} / ${exc.maxSpots}`, color: 'text-green-400' },
              { label: 'Receita (pago)', value: formatCurrency(totalPaid), color: 'text-[#F97316]' },
              { label: 'Vagas restantes', value: String(spotsLeft), color: spotsLeft === 0 ? 'text-red-400' : spotsLeft <= 5 ? 'text-amber-400' : 'text-foreground' },
            ].map(s => (
              <div key={s.label} className="px-6 py-4 text-center">
                <p className={`font-['Outfit'] font-black text-xl ${s.color}`}>{s.value}</p>
                <p className="text-foreground/20 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, CPF ou código…"
            className="flex-1 max-w-sm px-4 py-2.5 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-card text-foreground placeholder-foreground/20 transition-colors"
          />
          <div className="flex gap-2 flex-wrap">
            {(['all', 'paid', 'pending', 'cancelled'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-[#F97316] text-white' : 'bg-card border border-foreground/10 text-foreground/40 hover:border-[#F97316]/40 hover:text-white'}`}>
                {s === 'all' ? `Todos (${eventBookings.length})` : `${STATUS_LABELS[s as Booking['paymentStatus']]} (${eventBookings.filter(b => b.paymentStatus === s).length})`}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-foreground/10 text-foreground/40 text-xs font-semibold hover:border-[#F97316]/40 hover:text-[#F97316] transition-colors whitespace-nowrap"
          >
            ↓ Exportar CSV
          </button>
        </div>

        {/* Table */}
        {eventBookings.length === 0 ? (
          <div className="bg-card rounded-2xl border border-foreground/10 py-20 text-center">
            <p className="text-5xl mb-4">👥</p>
            <h3 className="font-['Outfit'] font-bold text-lg text-foreground mb-2">Nenhuma reserva ainda</h3>
            <p className="text-foreground/30 text-sm">As reservas para este evento aparecerão aqui.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border border-foreground/10 py-16 text-center">
            <p className="text-foreground/30 text-sm">Nenhum resultado para "{search}"</p>
            <button onClick={() => setSearch('')} className="text-[#F97316] text-xs mt-2 hover:underline">Limpar busca</button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-foreground/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-foreground/10 bg-foreground/[0.03]">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/20 uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-foreground/20 uppercase tracking-wide">Participante</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-foreground/20 uppercase tracking-wide hidden md:table-cell">Contato</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-foreground/20 uppercase tracking-wide hidden lg:table-cell">CPF</th>
                    {exc.hasTickets && <th className="text-left px-4 py-3.5 text-xs font-semibold text-foreground/20 uppercase tracking-wide">Ingresso</th>}
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-foreground/20 uppercase tracking-wide hidden sm:table-cell">Vagas</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-foreground/20 uppercase tracking-wide">Status</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-foreground/20 uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {filtered.map((b, idx) => (
                    <tr
                      key={b.id}
                      className="hover:bg-foreground/5 transition-colors cursor-pointer"
                      onClick={() => setSelected(b)}
                    >
                      <td className="px-5 py-4 text-foreground/20 text-xs font-mono">{idx + 1}</td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F97316]/20 border border-[#F97316]/30 flex items-center justify-center text-[#F97316] text-xs font-black flex-shrink-0">
                            {b.customerName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{b.customerName}</p>
                            <p className="text-foreground/20 text-xs font-mono">{b.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="text-foreground/50 text-xs">{b.customerEmail}</p>
                        <p className="text-foreground/30 text-xs mt-0.5">{b.customerPhone}</p>
                      </td>

                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="text-foreground/40 text-xs font-mono">{b.customerCpf}</span>
                          <button
                            onClick={e => { e.stopPropagation(); copyToClipboard(b.customerCpf, `cpf-${b.id}`); }}
                            className="text-foreground/20 hover:text-[#F97316] transition-colors"
                            title="Copiar CPF"
                          >
                            {copied === `cpf-${b.id}` ? (
                              <span className="text-green-400 text-[10px]">✓</span>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>

                      {exc.hasTickets && (
                      <td className="px-4 py-4">
                        {b.ticketCode ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-[#F97316] font-bold">{b.ticketCode}</span>
                            <button
                              onClick={e => { e.stopPropagation(); copyToClipboard(b.ticketCode!, `tk-${b.id}`); }}
                              className="text-foreground/20 hover:text-[#F97316] transition-colors"
                              title="Copiar código"
                            >
                              {copied === `tk-${b.id}` ? (
                                <span className="text-green-400 text-[10px]">✓</span>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-foreground/20 text-xs">—</span>
                        )}
                      </td>
                      )}

                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="text-foreground font-bold text-sm">{b.seats}</span>
                        <span className="text-foreground/30 text-xs ml-1">pessoa{b.seats > 1 ? 's' : ''}</span>
                      </td>

                      <td className="px-4 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${STATUS_COLORS[b.paymentStatus]}`}>
                          {STATUS_LABELS[b.paymentStatus]}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2">
                        <SyncAsaasButton booking={b} />
                        <select
                          value={b.paymentStatus}
                          onChange={e => updateBookingStatus(b.id, e.target.value as Booking['paymentStatus'])}
                          className="text-xs border border-foreground/10 rounded-lg px-2 py-1.5 text-foreground/50 bg-surface outline-none focus:border-[#F97316] cursor-pointer"
                        >
                          <option value="pending">Pendente</option>
                          <option value="paid">Confirmado</option>
                          <option value="cancelled">Cancelado</option>
                          <option value="refunded">Reembolsado</option>
                        </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            <div className="border-t border-foreground/10 px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-foreground/[0.02]">
              <p className="text-foreground/30 text-xs">
                {filtered.length} participante{filtered.length !== 1 ? 's' : ''} · {filtered.reduce((s, b) => s + b.seats, 0)} vagas ocupadas
              </p>
              <p className="text-foreground/30 text-xs">
                Receita filtrada: <span className="text-[#F97316] font-semibold">{formatCurrency(filtered.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0))}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setSelected(null)}>
          <div className="bg-card border border-foreground/10 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#F97316]/20 border border-[#F97316]/30 flex items-center justify-center text-[#F97316] font-black">
                  {selected.customerName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h3 className="font-['Outfit'] font-bold text-lg text-foreground">{selected.customerName}</h3>
                  <p className="font-mono text-xs text-[#F97316]">{selected.id}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg text-foreground/30 hover:bg-foreground/10 flex items-center justify-center transition-colors">✕</button>
            </div>

            <div className="space-y-2.5 text-sm mb-6">
              {[
                { label: 'E-mail', value: selected.customerEmail, copyKey: `modal-email-${selected.id}`, copyValue: selected.customerEmail },
                { label: 'Telefone / WhatsApp', value: selected.customerPhone, copyKey: `modal-phone-${selected.id}`, copyValue: selected.customerPhone },
                { label: 'CPF', value: selected.customerCpf, copyKey: `modal-cpf-${selected.id}`, copyValue: selected.customerCpf },
                { label: 'Pessoas', value: `${selected.seats} pessoa${selected.seats > 1 ? 's' : ''}` },
                { label: 'Total pago', value: formatCurrency(selected.totalAmount) },
                { label: 'Forma de pagamento', value: METHOD_LABELS[selected.paymentMethod] },
                { label: 'Data da reserva', value: selected.bookingDate },
                ...(selected.ticketCode ? [{ label: 'Código do ingresso', value: selected.ticketCode, copyKey: `modal-tk-${selected.id}`, copyValue: selected.ticketCode }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between border-b border-foreground/5 pb-2.5">
                  <span className="text-foreground/30 flex-shrink-0">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-right ${row.label === 'Código do ingresso' ? 'font-mono text-[#F97316]' : 'text-foreground'}`}>
                      {row.value}
                    </span>
                    {row.copyKey && (
                      <button
                        onClick={() => copyToClipboard(row.copyValue!, row.copyKey!)}
                        className="text-foreground/20 hover:text-[#F97316] transition-colors flex-shrink-0"
                      >
                        {copied === row.copyKey ? (
                          <span className="text-green-400 text-[10px] font-bold">✓</span>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <BookingPaymentPanel booking={selected} onChange={setSelected} />

            <div className="flex gap-3 mt-4">
              <a
                href={`https://wa.me/55${selected.customerPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="px-4 py-2.5 rounded-xl bg-green-500/20 border border-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/30 transition-colors whitespace-nowrap"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
