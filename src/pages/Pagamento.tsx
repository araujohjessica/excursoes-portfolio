import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import type { PublicBooking } from '../types';
import { api, imageUrl, ApiError } from '../services/api';
import { useCountdown, formatExpiry } from '../components/Countdown';

const POLL_MS = 5000;

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const METHOD_LABELS: Record<PublicBooking['paymentMethod'], string> = {
  pix: 'Pix', credit: 'Cartão de crédito', debit: 'Cartão de débito', boleto: 'Boleto',
};

export default function Pagamento() {
  const { token } = useParams();
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Quando o prazo zera, recarrega: a API confere o Asaas e cancela se não houve pagamento
  const countdown = useCountdown(booking?.expiresAt, () => setTimeout(() => setReloadKey(k => k + 1), 1500));

  useEffect(() => {
    if (!token) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const load = async () => {
      try {
        const data = await api.getPublicBooking(token);
        if (!active) return;
        setBooking(data);
        setError('');
        if (data.paymentStatus === 'pending') timer = setTimeout(load, POLL_MS);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) setError('Reserva não encontrada.');
        else {
          setError('Não foi possível atualizar o status. Tentando novamente…');
          timer = setTimeout(load, POLL_MS * 2);
        }
      }
    };

    load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [token, reloadKey]);

  const copyPix = async () => {
    if (!booking?.pixPayload) return;
    await navigator.clipboard.writeText(booking.pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20 px-4 text-center">
        {error ? (
          <div>
            <p className="text-6xl mb-4">🔎</p>
            <h2 className="font-['Outfit'] font-bold text-2xl mb-2">{error}</h2>
            <Link to="/excursoes" className="text-[#F97316] hover:underline">Ver excursões</Link>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full border-4 border-border border-t-[#F97316] animate-spin" />
        )}
      </div>
    );
  }

  const status = booking.paymentStatus;

  const header = {
    pending: { icon: '⏳', bg: 'bg-orange-100', title: 'Aguardando pagamento', text: `Reserva criada! Sua vaga fica guardada por 24 horas${booking.expiresAt ? `, até ${formatExpiry(booking.expiresAt)}` : ''}. Enviamos a cobrança para ${booking.customerEmail}.` },
    paid: { icon: '✅', bg: 'bg-green-100', title: 'Pagamento confirmado!', text: `Tudo certo, ${booking.customerName.split(' ')[0]}! Sua vaga está garantida. O comprovante foi enviado para ${booking.customerEmail}.` },
    cancelled: { icon: '⌛', bg: 'bg-red-100', title: 'Reserva cancelada', text: 'O pagamento não foi identificado em 24 horas (ou a reserva foi cancelada) e a vaga foi liberada. Se ainda quiser ir, faça uma nova reserva.' },
    refunded: { icon: '↩️', bg: 'bg-gray-100', title: 'Pagamento reembolsado', text: 'O valor desta reserva foi devolvido. Em caso de dúvidas, fale com a gente.' },
  }[status];

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="max-w-lg mx-auto px-4 pt-12">
        <div className="text-center">
          <div className={`w-20 h-20 rounded-full ${header.bg} flex items-center justify-center mx-auto mb-6`}>
            <span className="text-4xl">{header.icon}</span>
          </div>
          <h1 className="font-['Outfit'] font-black text-3xl text-foreground mb-2">{header.title}</h1>
          <p className="text-muted-foreground mb-8">{header.text}</p>
        </div>

        {status === 'pending' && booking.expiresAt && (
          <div className={`mb-5 rounded-2xl border p-4 text-center ${countdown.ms < 3_600_000 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${countdown.ms < 3_600_000 ? 'text-red-600' : 'text-orange-700'}`}>
              {countdown.expired ? 'Prazo encerrado, verificando pagamento…' : 'Tempo para pagar'}
            </p>
            {!countdown.expired && <p className="font-mono font-black text-3xl text-foreground mt-1">{countdown.label}</p>}
            <p className="text-xs text-muted-foreground mt-1">Depois disso a reserva é cancelada e a vaga liberada.</p>
          </div>
        )}

        {status === 'pending' && (
          <div className="mb-6">
            {booking.paymentMethod === 'pix' && (
              <div className="bg-[#F4FDF6] border border-green-200 rounded-2xl p-6 text-center">
                <p className="text-green-800 font-semibold mb-4">Escaneie o QR Code com o app do seu banco</p>
                {booking.pixQrImage ? (
                  <img src={`data:image/${booking.pixQrImage.startsWith('PHN2') ? 'svg+xml' : 'png'};base64,${booking.pixQrImage}`} alt="QR Code Pix" className="w-52 h-52 mx-auto rounded-xl bg-white p-2" />
                ) : (
                  <p className="text-green-700 text-sm">QR Code indisponível. Use o link de pagamento abaixo.</p>
                )}
                {booking.pixPayload && (
                  <>
                    <p className="text-green-700 text-xs mt-4 mb-2">Ou use o Pix copia e cola:</p>
                    <div className="bg-card border border-green-200 rounded-lg p-3 text-[11px] font-mono text-[#444] break-all text-left max-h-20 overflow-y-auto">{booking.pixPayload}</div>
                    <button onClick={copyPix} className="mt-3 w-full py-3 rounded-xl bg-[#32BCAD] hover:bg-[#2aa396] text-white font-bold text-sm transition-colors">
                      {copied ? '✓ Código copiado!' : 'Copiar código Pix'}
                    </button>
                  </>
                )}
              </div>
            )}

            {booking.paymentMethod === 'boleto' && booking.bankSlipUrl && (
              <a href={booking.bankSlipUrl} target="_blank" rel="noreferrer" className="block w-full py-4 rounded-xl bg-foreground hover:opacity-90 text-background font-bold text-center transition-colors">
                📄 Abrir boleto
              </a>
            )}

            {booking.paymentMethod === 'credit' && booking.invoiceUrl && (
              <a href={booking.invoiceUrl} target="_blank" rel="noreferrer" className="block w-full py-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-center transition-colors">
                💳 Pagar com cartão{booking.installments > 1 ? ` em ${booking.installments}x` : ''} →
              </a>
            )}

            {booking.invoiceUrl && booking.paymentMethod !== 'credit' && (
              <a href={booking.invoiceUrl} target="_blank" rel="noreferrer" className="block text-center text-sm text-muted-foreground hover:text-[#F97316] mt-3">
                Abrir fatura completa no Asaas ↗
              </a>
            )}

            <p className="flex items-center justify-center gap-2 text-xs text-[#A0A0A0] mt-5">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              Esta página atualiza sozinha quando o pagamento for confirmado
            </p>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
          <div className="flex gap-3 p-5 border-b border-border">
            <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-orange-100">
              <img src={imageUrl(booking.excursion.image, 160, 120)} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground leading-snug">{booking.excursion.title}</p>
              <p className="text-xs text-muted-foreground mt-1">Saída em {formatDate(booking.excursion.departureDate)}</p>
            </div>
          </div>
          <div className="p-5 space-y-3 text-sm">
            {[
              ['Reserva', <span className="font-mono font-bold text-[#F97316]">{booking.id}</span>],
              ['Pessoas', `${booking.seats} pessoa${booking.seats > 1 ? 's' : ''}`],
              ['Forma de pagamento', `${METHOD_LABELS[booking.paymentMethod]}${booking.installments > 1 ? ` · ${booking.installments}x` : ''}`],
              ['Total', <span className="font-['Outfit'] font-bold text-base">{formatCurrency(booking.totalAmount)}</span>],
              ...(status === 'paid' && booking.paidAt ? [['Pago em', formatDate(booking.paidAt)]] : []),
              ...(status === 'paid' && booking.excursion.meetingPoint ? [['Ponto de encontro', booking.excursion.meetingPoint]] : []),
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground text-right">{value}</span>
              </div>
            ))}
            {status === 'paid' && booking.ticketCode && (
              <div className="border-t border-border pt-4">
                <p className="text-muted-foreground text-xs mb-1">Código do ingresso</p>
                <p className="font-mono font-bold text-xl text-[#F97316] tracking-widest">{booking.ticketCode}</p>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-center text-xs text-red-500 mb-4">{error}</p>}

        <p className="text-center text-xs text-[#A0A0A0] mb-6">
          Acompanhe tudo em <Link to="/minha-conta" className="text-[#F97316] hover:underline">Minha conta</Link> usando o e-mail {booking.customerEmail}.
        </p>

        <div className="flex gap-3">
          <Link to="/" className="flex-1 py-3 rounded-xl border-2 border-border text-foreground font-semibold text-sm hover:border-foreground transition-colors text-center">
            Voltar ao início
          </Link>
          <Link to={status === 'cancelled' ? `/excursao/${booking.excursion.slug}` : '/excursoes'} className="flex-1 py-3 rounded-xl bg-[#F97316] text-white font-semibold text-sm hover:bg-[#EA580C] transition-colors text-center">
            {status === 'cancelled' ? 'Reservar novamente' : 'Ver mais excursões'}
          </Link>
        </div>
      </div>
    </div>
  );
}
