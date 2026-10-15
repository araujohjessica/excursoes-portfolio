import { useState } from 'react';
import type { Booking } from '../../types';
import { useApp } from '../../store/AppContext';

export default function SyncAsaasButton({ booking }: { booking: Booking }) {
  const { syncBooking } = useApp();
  const [busy, setBusy] = useState(false);

  if (!booking.asaasPaymentId) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    await syncBooking(booking.id);
    setBusy(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title="Consultar pagamento no Asaas"
      className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-foreground/10 text-foreground/40 hover:text-[#F97316] hover:border-[#F97316] disabled:opacity-50 transition-colors"
    >
      <svg className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  );
}
