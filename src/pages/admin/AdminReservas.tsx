import { useState } from 'react';
import SyncAsaasButton from '../../components/admin/SyncAsaasButton';
import BookingPaymentPanel from '../../components/admin/BookingPaymentPanel';
import { useApp } from '../../store/AppContext';
import type { Booking } from '../../types';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_LABELS: Record<Booking['paymentStatus'], string> = {
  paid: 'Pago', pending: 'Pendente', cancelled: 'Cancelado', refunded: 'Reembolsado',
};

const STATUS_COLORS: Record<Booking['paymentStatus'], string> = {
  paid: 'bg-green-500/20 text-green-400',
  pending: 'bg-amber-500/20 text-amber-400',
  cancelled: 'bg-red-500/20 text-red-400',
  refunded: 'bg-foreground/10 text-foreground/30',
};

const METHOD_LABELS: Record<Booking['paymentMethod'], string> = {
  pix: 'Pix', credit: 'Crédito', debit: 'Débito', boleto: 'Boleto',
};

export default function AdminReservas() {
  const { bookings, updateBookingStatus } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = bookings.filter(b => {
    const matchSearch = !search || b.customerName.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase()) || b.excursionTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-['Outfit'] font-black text-3xl text-foreground">Reservas</h1>
          <p className="text-foreground/30 text-sm mt-1">{bookings.length} reservas · Receita paga: {formatCurrency(totalRevenue)}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, ID ou evento…"
            className="flex-1 max-w-sm px-4 py-2.5 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-card text-foreground placeholder-foreground/20 transition-colors" />
          <div className="flex gap-2 flex-wrap">
            {(['all', 'paid', 'pending', 'cancelled'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-[#F97316] text-white' : 'bg-card border border-foreground/10 text-foreground/40 hover:border-[#F97316]/40 hover:text-white'}`}>
                {s === 'all' ? 'Todos' : STATUS_LABELS[s as Booking['paymentStatus']]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-foreground/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foreground/10 bg-foreground/5">
                  {['ID / Data', 'Cliente', 'Evento', 'Pagamento', 'Total', 'Status', 'Ações'].map(h => (
                    <th key={h} className={`text-left px-5 py-4 text-xs font-semibold text-foreground/20 uppercase tracking-wide ${['Evento', 'Pagamento'].includes(h) ? 'hidden lg:table-cell' : h === 'Cliente' ? 'hidden sm:table-cell' : h === 'Ações' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-foreground/5 transition-colors cursor-pointer" onClick={() => setSelected(b)}>
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-bold text-[#F97316]">{b.id}</p>
                      <p className="text-xs text-foreground/20 mt-0.5">{b.bookingDate}</p>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="font-semibold text-foreground text-sm">{b.customerName}</p>
                      <p className="text-xs text-foreground/30">{b.customerEmail}</p>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <p className="text-foreground/60 text-xs max-w-[160px] truncate">{b.excursionTitle}</p>
                      <p className="text-foreground/20 text-xs">{b.seats} pessoa{b.seats > 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-foreground/30 text-xs">{METHOD_LABELS[b.paymentMethod]}</td>
                    <td className="px-4 py-4 font-['Outfit'] font-black text-foreground">{formatCurrency(b.totalAmount)}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[b.paymentStatus]}`}>
                        {STATUS_LABELS[b.paymentStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                      <SyncAsaasButton booking={b} />
                      <select value={b.paymentStatus} onChange={e => updateBookingStatus(b.id, e.target.value as Booking['paymentStatus'])}
                        className="text-xs border border-foreground/10 rounded-lg px-2 py-1.5 text-foreground/50 bg-surface outline-none focus:border-[#F97316]">
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
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
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-foreground/30 text-sm">Nenhuma reserva encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setSelected(null)}>
          <div className="bg-card border border-foreground/10 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="font-mono text-sm font-bold text-[#F97316]">{selected.id}</p>
                <h3 className="font-['Outfit'] font-bold text-xl text-foreground mt-1">Detalhes da reserva</h3>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg text-foreground/30 hover:bg-foreground/10 flex items-center justify-center transition-colors">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { label: 'Cliente', value: selected.customerName },
                { label: 'E-mail', value: selected.customerEmail },
                { label: 'Telefone', value: selected.customerPhone },
                { label: 'CPF', value: selected.customerCpf },
                { label: 'Evento', value: selected.excursionTitle },
                { label: 'Pessoas', value: `${selected.seats} pessoa${selected.seats > 1 ? 's' : ''}` },
                { label: 'Total', value: formatCurrency(selected.totalAmount) },
                { label: 'Pagamento', value: METHOD_LABELS[selected.paymentMethod] },
                { label: 'Data', value: selected.bookingDate },
                ...(selected.ticketCode ? [{ label: 'Código ingresso', value: selected.ticketCode }] : []),
              ].map(row => (
                <div key={row.label} className="flex justify-between border-b border-foreground/5 pb-2">
                  <span className="text-foreground/30">{row.label}</span>
                  <span className={`font-semibold text-right ${row.label === 'Código ingresso' ? 'font-mono text-[#F97316]' : 'text-foreground'}`}>{row.value}</span>
                </div>
              ))}
            </div>

            <BookingPaymentPanel booking={selected} onChange={setSelected} />

            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelected(null)} className="px-5 py-2.5 rounded-xl bg-[#F97316] text-white font-bold text-sm hover:bg-[#EA580C] transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
