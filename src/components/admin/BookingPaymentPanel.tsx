import { useState } from 'react';
import { IS_DEMO } from '../../services/demo';
import type { Booking } from '../../types';
import { useApp } from '../../store/AppContext';

const ASAAS_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando pagamento',
  AWAITING_RISK_ANALYSIS: 'Em análise de risco',
  CONFIRMED: 'Confirmado (a receber)',
  RECEIVED: 'Recebido',
  RECEIVED_IN_CASH: 'Recebido em dinheiro',
  OVERDUE: 'Vencido',
  REFUNDED: 'Estornado',
  REFUND_REQUESTED: 'Estorno solicitado',
  REFUND_IN_PROGRESS: 'Estorno em andamento',
  CHARGEBACK_REQUESTED: 'Chargeback',
  DELETED: 'Cobrança removida',
  EXPIRED: 'Expirada (24h sem pagamento)',
};

function formatDate(d?: string) {
  return d ? new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
}

interface Props {
  booking: Booking;
  onChange: (b: Booking) => void;
}

export default function BookingPaymentPanel({ booking, onChange }: Props) {
  const { updateBookingStatus, syncBooking } = useApp();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const clientUrl = booking.publicToken ? (IS_DEMO ? `${window.location.origin}${window.location.pathname}#/pagamento/${booking.publicToken}` : `${window.location.origin}/pagamento/${booking.publicToken}`) : '';

  const run = async (fn: () => Promise<Booking | null>) => {
    setBusy(true);
    const updated = await fn();
    setBusy(false);
    if (updated) onChange(updated);
  };

  const changeStatus = (status: Booking['paymentStatus']) => {
    const confirmText: Partial<Record<Booking['paymentStatus'], string>> = {
      cancelled: 'Cancelar esta reserva? A cobrança no Asaas será removida e a vaga liberada.',
      refunded: 'Reembolsar esta reserva? O valor será estornado ao cliente pelo Asaas.',
      paid: 'Confirmar pagamento recebido por fora (dinheiro/transferência)? Isso dá baixa na cobrança do Asaas.',
    };
    if (confirmText[status] && !confirm(confirmText[status])) return;
    run(() => updateBookingStatus(booking.id, status));
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(clientUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const s = booking.paymentStatus;

  return (
    <div className="mt-5 rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-foreground/30 text-xs uppercase tracking-wide font-semibold">Pagamento (Asaas)</span>
        {booking.asaasPaymentId && (
          <button onClick={() => run(() => syncBooking(booking.id))} disabled={busy}
            className="text-xs text-[#F97316] hover:underline disabled:opacity-50">
            {busy ? 'Consultando…' : '↻ Consultar Asaas'}
          </button>
        )}
      </div>

      {booking.asaasPaymentId ? (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-foreground/30">Status no Asaas</p><p className="text-foreground font-semibold">{ASAAS_STATUS_LABELS[booking.asaasStatus || ''] || booking.asaasStatus || '—'}</p></div>
            <div><p className="text-foreground/30">{booking.expiresAt ? 'Expira em' : 'Vencimento'}</p><p className="text-foreground font-semibold">{booking.expiresAt ? new Date(booking.expiresAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : formatDate(booking.dueDate)}</p></div>
            <div><p className="text-foreground/30">Parcelas</p><p className="text-foreground font-semibold">{booking.installments}x</p></div>
            <div><p className="text-foreground/30">Pago em</p><p className="text-foreground font-semibold">{formatDate(booking.paidAt)}</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {booking.invoiceUrl && (
              <a href={booking.invoiceUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-foreground/70 text-xs">Fatura ↗</a>
            )}
            {booking.bankSlipUrl && (
              <a href={booking.bankSlipUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-foreground/70 text-xs">Boleto ↗</a>
            )}
            {clientUrl && (
              <button onClick={copyLink} className="px-3 py-1.5 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-foreground/70 text-xs">
                {copied ? '✓ Link copiado' : 'Copiar link do cliente'}
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-foreground/30 text-xs">Reserva sem cobrança no Asaas.</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {s === 'pending' && (
          <>
            <button disabled={busy} onClick={() => changeStatus('paid')} className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/30 disabled:opacity-50">Recebido por fora</button>
            <button disabled={busy} onClick={() => changeStatus('cancelled')} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 disabled:opacity-50">Cancelar reserva</button>
          </>
        )}
        {s === 'paid' && (
          <button disabled={busy} onClick={() => changeStatus('refunded')} className="px-3 py-2 rounded-lg bg-foreground/10 text-foreground/70 text-xs font-semibold hover:bg-foreground/15 disabled:opacity-50">Reembolsar</button>
        )}
        {s === 'cancelled' && !booking.asaasPaymentId && (
          <button disabled={busy} onClick={() => changeStatus('paid')} className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/30 disabled:opacity-50">Reativar como pago</button>
        )}
      </div>
    </div>
  );
}
