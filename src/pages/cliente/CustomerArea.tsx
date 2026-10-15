import { useEffect, useRef, useState, useCallback } from 'react';
import FieldError from '../../components/FieldError';
import { Link, Navigate, useSearchParams, useNavigate } from 'react-router';
import type { CustomerBooking, Message, Review } from '../../types';
import { customerApi } from '../../services/customerApi';
import { imageUrl } from '../../services/api';
import { useCustomer } from '../../store/CustomerContext';
import ReviewForm from '../../components/ReviewForm';
import { customerToken } from '../../services/customerApi';
import { useRealtime, useTypingIndicator, useThrottle } from '../../services/realtime';
import { PresenceDot, TypingBubble, ConnectionBanner } from '../../components/Presence';
import { formatExpiry } from '../../components/Countdown';

type Tab = 'reservas' | 'mensagens' | 'avaliacoes';

const STATUS: Record<CustomerBooking['paymentStatus'], { label: string; cls: string }> = {
  paid: { label: 'Confirmada', cls: 'bg-green-500/15 text-green-400 border-green-500/20' },
  pending: { label: 'Aguardando pagamento', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  cancelled: { label: 'Cancelada', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
  refunded: { label: 'Reembolsada', cls: 'bg-foreground/10 text-foreground/50 border-foreground/10' },
};

const REVIEW_STATUS: Record<NonNullable<Review['status']>, { label: string; cls: string }> = {
  pending: { label: 'Em análise', cls: 'text-amber-400' },
  approved: { label: 'Publicada', cls: 'text-green-400' },
  rejected: { label: 'Não publicada', cls: 'text-foreground/40' },
};

const METHOD: Record<CustomerBooking['paymentMethod'], string> = { pix: 'Pix', credit: 'Cartão de crédito', debit: 'Débito', boleto: 'Boleto' };

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (d?: string) => (d ? new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'A definir');
const formatDateTime = (d: string) => new Date(d.replace(' ', 'T') + (d.includes('Z') ? '' : 'Z')).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function daysUntil(date?: string) {
  if (!date) return null;
  const diff = new Date(date.slice(0, 10) + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(diff / 86_400_000);
}

export default function CustomerArea() {
  const { customer, isCustomerLoggedIn, loading, logout, refreshProfile } = useCustomer();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('aba') as Tab) || 'reservas';
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [messageBooking, setMessageBooking] = useState<string | undefined>();
  const navigate = useNavigate();

  const loadBookings = useCallback(() => {
    customerApi.bookings().then(setBookings).catch(() => {}).finally(() => setLoadingBookings(false));
  }, []);

  useEffect(() => {
    if (isCustomerLoggedIn) loadBookings();
  }, [isCustomerLoggedIn, loadBookings]);

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!isCustomerLoggedIn || !customer) return <Navigate to="/minha-conta/entrar" replace />;

  const setTab = (t: Tab) => setParams(t === 'reservas' ? {} : { aba: t });
  const firstName = customer.name.split(' ')[0].toLowerCase().replace(/^./, c => c.toUpperCase());

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'reservas', label: 'Minhas excursões', badge: customer.stats.bookings },
    { key: 'mensagens', label: 'Mensagens', badge: customer.stats.unreadMessages || undefined },
    { key: 'avaliacoes', label: 'Avaliações' },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[#F97316] text-xs font-bold tracking-widest uppercase mb-1">Minha conta</p>
            <h1 className="font-['Outfit'] font-black text-3xl sm:text-4xl text-foreground">Olá, {firstName}! 👋</h1>
            <p className="text-foreground/40 text-sm mt-1">{customer.email}</p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="self-start sm:self-auto px-4 py-2 rounded-lg border border-foreground/15 text-foreground/60 text-sm hover:bg-foreground/10">Sair</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Reservas', value: customer.stats.bookings },
            { label: 'Confirmadas', value: customer.stats.paid },
            { label: 'Aguardando pagamento', value: customer.stats.pending },
          ].map(s => (
            <div key={s.label} className="bg-card border border-foreground/10 rounded-2xl p-4">
              <p className="font-['Outfit'] font-black text-2xl text-foreground">{s.value}</p>
              <p className="text-foreground/40 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 border-b border-foreground/10 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors flex items-center gap-2 ${tab === t.key ? 'border-[#F97316] text-foreground' : 'border-transparent text-foreground/40 hover:text-foreground/70'}`}>
              {t.label}
              {t.badge ? <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.key === 'mensagens' ? 'bg-[#F97316] text-white' : 'bg-foreground/10 text-foreground/60'}`}>{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {tab === 'reservas' && (
          <BookingsTab
            bookings={bookings}
            loading={loadingBookings}
            onMessage={id => { setMessageBooking(id); setTab('mensagens'); }}
            onReview={() => setTab('avaliacoes')}
          />
        )}
        {tab === 'mensagens' && (
          <MessagesTab bookings={bookings} initialBooking={messageBooking} onRead={refreshProfile} />
        )}
        {tab === 'avaliacoes' && (
          <ReviewsTab bookings={bookings} customerName={customer.name} onSubmitted={loadBookings} />
        )}
      </div>
    </div>
  );
}

function BookingsTab({ bookings, loading, onMessage, onReview }: {
  bookings: CustomerBooking[]; loading: boolean; onMessage: (id: string) => void; onReview: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const next = bookings.find(b => b.paymentStatus !== 'cancelled' && (daysUntil(b.excursion.departureDate) ?? -1) >= 0);
    setOpen(o => o ?? next?.id ?? bookings[0]?.id ?? null);
  }, [bookings]);

  if (loading) return <div className="py-16 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-foreground/10 border-t-[#F97316] animate-spin" /></div>;
  if (!bookings.length) return <p className="text-foreground/40 text-center py-16">Nenhuma reserva encontrada.</p>;

  return (
    <div className="space-y-4">
      {bookings.map(b => {
        const days = daysUntil(b.excursion.departureDate);
        const isOpen = open === b.id;
        const st = STATUS[b.paymentStatus];
        return (
          <div key={b.id} className="bg-card border border-foreground/10 rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : b.id)} className="w-full flex gap-4 p-4 text-left hover:bg-foreground/[0.02]">
              <div className="w-24 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-foreground/5">
                <img src={imageUrl(b.excursion.image, 300, 220)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${st.cls}`}>{st.label}</span>
                  {b.paymentStatus === 'paid' && days !== null && days >= 0 && (
                    <span className="text-[11px] text-[#F97316] font-semibold">{days === 0 ? 'É hoje! 🎉' : `Faltam ${days} dia${days > 1 ? 's' : ''}`}</span>
                  )}
                </div>
                <p className="font-['Outfit'] font-bold text-foreground leading-snug truncate">{b.excursion.title}</p>
                <p className="text-foreground/40 text-xs mt-1">Saída {formatDate(b.excursion.departureDate)} · {b.seats} pessoa{b.seats > 1 ? 's' : ''} · <span className="font-mono">{b.id}</span></p>
              </div>
              <span className={`text-foreground/30 self-center transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {isOpen && (
              <div className="border-t border-foreground/10 p-5 space-y-6">
                {b.paymentStatus === 'pending' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-amber-200 text-sm">
                      {b.expiresAt ? <>Pague até <strong>{formatExpiry(b.expiresAt)}</strong> ou a reserva será cancelada e a vaga liberada.</> : 'Pagamento pendente.'}
                    </p>
                    <Link to={`/pagamento/${b.paymentToken}`} className="px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold text-center">Pagar agora →</Link>
                  </div>
                )}

                {b.paymentStatus === 'paid' && b.ticketCode && (
                  <div className="bg-[#F97316]/10 border border-[#F97316]/20 rounded-xl p-4">
                    <p className="text-foreground/40 text-xs mb-1">Código do ingresso{b.excursion.ticketType ? ` · ${b.excursion.ticketType}` : ''}</p>
                    <p className="font-mono font-bold text-xl text-[#F97316] tracking-widest">{b.ticketCode}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {[
                    ['🚌 Saída', `${formatDate(b.excursion.departureDate)}${b.excursion.departureCity ? ` · ${b.excursion.departureCity}` : ''}`],
                    ['🎤 Evento', formatDate(b.excursion.eventDate)],
                    ['🏠 Retorno', formatDate(b.excursion.returnDate)],
                    ['📍 Local', [b.excursion.eventVenue, b.excursion.eventCity].filter(Boolean).join(' · ') || '—'],
                    ['⏱ Duração', b.excursion.duration || '—'],
                    ['💳 Pagamento', `${METHOD[b.paymentMethod]}${b.installments > 1 ? ` ${b.installments}x` : ''} · ${formatCurrency(b.totalAmount)}`],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-foreground/[0.03] rounded-xl p-3">
                      <p className="text-foreground/30 text-xs">{label}</p>
                      <p className="text-foreground font-semibold mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {b.excursion.meetingPoint && (
                  <div>
                    <p className="text-foreground/30 text-xs uppercase tracking-wide font-semibold mb-1">Ponto de encontro</p>
                    <p className="text-foreground text-sm">{b.excursion.meetingPoint}</p>
                  </div>
                )}

                {b.excursion.itinerary.length > 0 && (
                  <div>
                    <p className="text-foreground/30 text-xs uppercase tracking-wide font-semibold mb-2">Roteiro</p>
                    <ol className="space-y-2">
                      {b.excursion.itinerary.map((it, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="font-mono text-[#F97316] w-12 flex-shrink-0">{it.time}</span>
                          <span className="text-foreground/70">{it.description}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {(b.excursion.included.length > 0 || b.excursion.notIncluded.length > 0) && (
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    {b.excursion.included.length > 0 && (
                      <div>
                        <p className="text-foreground/30 text-xs uppercase tracking-wide font-semibold mb-2">Incluso</p>
                        <ul className="space-y-1">{b.excursion.included.map((x, i) => <li key={i} className="text-foreground/70">✓ {x}</li>)}</ul>
                      </div>
                    )}
                    {b.excursion.notIncluded.length > 0 && (
                      <div>
                        <p className="text-foreground/30 text-xs uppercase tracking-wide font-semibold mb-2">Não incluso</p>
                        <ul className="space-y-1">{b.excursion.notIncluded.map((x, i) => <li key={i} className="text-foreground/40">✕ {x}</li>)}</ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-foreground/5">
                  <button onClick={() => onMessage(b.id)} className="px-4 py-2 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-foreground text-sm">💬 Enviar mensagem sobre esta reserva</button>
                  {b.canReview && <button onClick={onReview} className="px-4 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-sm">★ Avaliar excursão</button>}
                  {b.review && <span className="px-4 py-2 text-sm text-foreground/40">Sua avaliação: {'★'.repeat(b.review.rating)} · {REVIEW_STATUS[b.review.status!].label}</span>}
                  <Link to={`/excursao/${b.excursion.slug}`} className="px-4 py-2 rounded-lg text-foreground/50 hover:text-foreground text-sm">Ver página do pacote ↗</Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MessagesTab({ bookings, initialBooking, onRead }: { bookings: CustomerBooking[]; initialBooking?: string; onRead: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState('');
  const [bookingId, setBookingId] = useState(initialBooking || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [teamOnline, setTeamOnline] = useState(false);
  const typing = useTypingIndicator();
  const throttle = useThrottle();
  const endRef = useRef<HTMLDivElement>(null);

  // Buscar a conversa também marca como lidas as respostas da equipe
  const load = useCallback(() => customerApi.messages().then(m => { setMessages(m); setLoaded(true); onRead(); }).catch(() => {}), [onRead]);
  useEffect(() => { load(); }, [load]);

  const { connected, send: sendEvent } = useRealtime(customerToken.get(), e => {
    if (e.type === 'reconnected') load();
    if (e.type === 'team:presence') setTeamOnline(Boolean(e.online));
    if (e.type === 'typing' && e.from === 'admin') typing.ping();
    if (e.type === 'message:new') {
      const msg = e.message as Message;
      if (msg.sender === 'admin') {
        typing.stop();
        load();
      } else {
        setMessages(m => (m.some(x => x.id === msg.id) ? m : [...m, msg]));
      }
    }
    if (e.type === 'message:read' && e.reader === 'admin') {
      setMessages(m => m.map(x => (x.sender === 'customer' && !x.readAt ? { ...x, readAt: new Date().toISOString() } : x)));
    }
  });

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [messages.length, typing.typing]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError('');
    try {
      const msg = await customerApi.sendMessage(body.trim(), bookingId || undefined);
      setMessages(m => (m.some(x => x.id === msg.id) ? m : [...m, msg]));
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-card border border-foreground/10 rounded-2xl flex flex-col h-[560px] overflow-hidden">
      <div className="px-5 py-4 border-b border-foreground/10 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white font-black font-['Outfit']">E</div>
          <PresenceDot online={teamOnline} className="absolute -bottom-0.5 -right-0.5" />
        </div>
        <div>
          <p className="text-foreground font-semibold">Equipe Excursões</p>
          <p className={`text-xs ${typing.typing ? 'text-[#F97316]' : teamOnline ? 'text-green-400' : 'text-foreground/40'}`}>
            {typing.typing ? 'digitando…' : teamOnline ? 'Online agora' : 'Offline · respondemos em breve e avisamos por e-mail'}
          </p>
        </div>
      </div>
      <ConnectionBanner connected={connected || !loaded} />

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {loaded && !messages.length && (
          <p className="text-foreground/30 text-sm text-center py-10">Nenhuma mensagem ainda. Tire suas dúvidas sobre horários, bagagem, ingressos…</p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.sender === 'customer' ? 'bg-[#F97316] text-white rounded-br-sm' : 'bg-foreground/10 text-white rounded-bl-sm'}`}>
              {m.sender === 'admin' && <p className="text-[10px] font-bold text-[#F97316] mb-0.5">Equipe Excursões</p>}
              {m.bookingId && <p className={`text-[10px] font-mono mb-1 ${m.sender === 'customer' ? 'text-foreground/70' : 'text-foreground/40'}`}>Sobre {m.bookingId}</p>}
              <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
              <p className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${m.sender === 'customer' ? 'text-foreground/60' : 'text-foreground/30'}`}>
                {formatDateTime(m.createdAt)}
                {m.sender === 'customer' && <span className={m.readAt ? 'text-foreground' : ''} title={m.readAt ? 'Lida' : 'Enviada'}>{m.readAt ? '✓✓' : '✓'}</span>}
              </p>
            </div>
          </div>
        ))}
        {typing.typing && <TypingBubble label="Equipe digitando" />}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="border-t border-foreground/10 p-4 space-y-2">
        {bookings.length > 0 && (
          <select value={bookingId} onChange={e => setBookingId(e.target.value)}
            className="w-full text-xs border border-foreground/10 rounded-lg px-3 py-2 text-foreground/60 bg-surface outline-none focus:border-[#F97316]">
            <option value="">Assunto geral</option>
            {bookings.map(b => <option key={b.id} value={b.id}>{b.id} · {b.excursion.title}</option>)}
          </select>
        )}
        <div className="flex gap-2">
          <textarea value={body} rows={2} maxLength={2000} placeholder="Escreva sua mensagem… (Enter envia, Shift+Enter quebra linha)"
            onChange={e => { setBody(e.target.value); if (e.target.value) throttle(() => sendEvent({ type: 'typing' })); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
            className="flex-1 px-4 py-2.5 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-foreground/5 text-foreground placeholder-foreground/20 resize-none" />
          <button disabled={sending || !body.trim()} className="px-5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 text-white font-bold text-sm">
            {sending ? '…' : 'Enviar'}
          </button>
        </div>
        <FieldError message={error} />
      </form>
    </div>
  );
}

function ReviewsTab({ bookings, customerName, onSubmitted }: { bookings: CustomerBooking[]; customerName: string; onSubmitted: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const load = useCallback(() => { customerApi.reviews().then(setReviews).catch(() => {}); }, []);
  useEffect(load, [load]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card border border-foreground/10 rounded-2xl p-6">
        <h2 className="font-['Outfit'] font-bold text-lg text-foreground mb-1">Deixe sua opinião</h2>
        <p className="text-foreground/40 text-sm mb-5">As avaliações aprovadas aparecem em “O que falam de nós”.</p>
        <ReviewForm key={bookings.filter(b => b.canReview).length} bookings={bookings} customerName={customerName} onSubmitted={() => { load(); onSubmitted(); }} />
      </div>
      <div>
        <h2 className="font-['Outfit'] font-bold text-lg text-foreground mb-4">Suas avaliações</h2>
        {!reviews.length && <p className="text-foreground/30 text-sm">Você ainda não avaliou nenhuma excursão.</p>}
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-card border border-foreground/10 rounded-2xl p-5">
              <div className="flex justify-between items-start gap-3 mb-2">
                <p className="text-foreground font-semibold text-sm">{r.excursionTitle}</p>
                <span className={`text-xs font-semibold ${REVIEW_STATUS[r.status!].cls}`}>{REVIEW_STATUS[r.status!].label}</span>
              </div>
              <p className="text-amber-400 text-sm mb-2">{'★'.repeat(r.rating)}<span className="text-foreground/15">{'★'.repeat(5 - r.rating)}</span></p>
              <p className="text-foreground/60 text-sm">“{r.comment}”</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
