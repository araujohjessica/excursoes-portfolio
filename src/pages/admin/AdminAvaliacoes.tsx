import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router';
import type { Review } from '../../types';
import { adminCommsApi } from '../../services/customerApi';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Aguardando' },
  { key: 'approved', label: 'Publicadas' },
  { key: 'rejected', label: 'Recusadas' },
  { key: 'all', label: 'Todas' },
];

const STATUS_BADGE: Record<NonNullable<Review['status']>, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-green-500/15 text-green-400',
  rejected: 'bg-foreground/10 text-foreground/40',
};
const STATUS_LABEL = { pending: 'Aguardando', approved: 'Publicada', rejected: 'Recusada' };

export default function AdminAvaliacoes() {
  const [filter, setFilter] = useState<Filter>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminCommsApi.reviews(filter === 'all' ? undefined : filter).then(setReviews).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  useEffect(load, [load]);

  const act = async (id: number, fn: () => Promise<unknown>) => {
    setBusy(id);
    try {
      await fn();
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro');
    } finally {
      setBusy(null);
    }
  };

  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-['Outfit'] font-black text-3xl text-foreground mb-1">Avaliações</h1>
        <p className="text-foreground/30 text-sm mb-6">Aprove as avaliações que aparecem em “O que falam de nós”. As em destaque aparecem primeiro.</p>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === f.key ? 'bg-[#F97316] text-white' : 'bg-foreground/5 text-foreground/50 hover:bg-foreground/10'}`}>
              {f.label}
            </button>
          ))}
          {reviews.length > 0 && (
            <span className="ml-auto text-foreground/40 text-sm">{reviews.length} avaliação(ões) · média <span className="text-amber-400 font-semibold">{average.toFixed(1)} ★</span></span>
          )}
        </div>

        {loading && !reviews.length ? (
          <div className="py-16 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-foreground/10 border-t-[#F97316] animate-spin" /></div>
        ) : !reviews.length ? (
          <p className="text-foreground/30 text-center py-16">Nenhuma avaliação aqui.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className={`bg-card border rounded-2xl p-5 ${r.featured ? 'border-[#F97316]/40' : 'border-foreground/10'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-foreground font-semibold">{r.customerName} {r.customerCity && <span className="text-foreground/30 font-normal text-sm">· {r.customerCity}</span>}</p>
                    <p className="text-foreground/30 text-xs mt-0.5">
                      {r.customerEmail} · <span className="font-mono">{r.bookingId}</span> · {new Date(r.createdAt + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                    <Link to={`/excursao/${r.excursionSlug}`} className="text-[#F97316] text-xs hover:underline">{r.excursionTitle}</Link>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.featured && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F97316]/15 text-[#F97316] font-semibold">⭐ Destaque</span>}
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[r.status!]}`}>{STATUS_LABEL[r.status!]}</span>
                  </div>
                </div>
                <p className="text-amber-400 mb-2">{'★'.repeat(r.rating)}<span className="text-foreground/15">{'★'.repeat(5 - r.rating)}</span></p>
                <p className="text-foreground/70 text-sm leading-relaxed">“{r.comment}”</p>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-foreground/5">
                  {r.status !== 'approved' && (
                    <button disabled={busy === r.id} onClick={() => act(r.id, () => adminCommsApi.moderate(r.id, { status: 'approved' }))}
                      className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/30 disabled:opacity-50">✓ Publicar</button>
                  )}
                  {r.status !== 'rejected' && (
                    <button disabled={busy === r.id} onClick={() => act(r.id, () => adminCommsApi.moderate(r.id, { status: 'rejected' }))}
                      className="px-3 py-2 rounded-lg bg-foreground/10 text-foreground/60 text-xs font-semibold hover:bg-foreground/15 disabled:opacity-50">✕ Recusar</button>
                  )}
                  {r.status === 'approved' && (
                    <button disabled={busy === r.id} onClick={() => act(r.id, () => adminCommsApi.moderate(r.id, { featured: !r.featured }))}
                      className="px-3 py-2 rounded-lg bg-[#F97316]/15 text-[#F97316] text-xs font-semibold hover:bg-[#F97316]/25 disabled:opacity-50">
                      {r.featured ? 'Remover destaque' : '⭐ Destacar'}
                    </button>
                  )}
                  <Link to={`/admin/mensagens?cliente=${encodeURIComponent(r.customerEmail || '')}`}
                    className="px-3 py-2 rounded-lg bg-foreground/5 text-foreground/50 text-xs font-semibold hover:bg-foreground/10">💬 Mensagem</Link>
                  <button disabled={busy === r.id} onClick={() => confirm('Excluir esta avaliação definitivamente?') && act(r.id, () => adminCommsApi.deleteReview(r.id))}
                    className="ml-auto px-3 py-2 rounded-lg text-red-400/70 text-xs font-semibold hover:bg-red-500/10 disabled:opacity-50">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
