import { useState } from 'react';
import FieldError from './FieldError';
import type { CustomerBooking } from '../types';
import { customerApi } from '../services/customerApi';

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onMouseEnter={() => setHover(n)} onClick={() => onChange(n)}
          aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
          className={`text-3xl leading-none transition-transform hover:scale-110 ${(hover || value) >= n ? 'text-amber-400' : 'text-foreground/15'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS = ['', 'Ruim', 'Regular', 'Boa', 'Muito boa', 'Incrível!'];

interface Props {
  bookings: CustomerBooking[];
  customerName: string;
  onSubmitted?: () => void;
}

/** Formulário de avaliação: só lista reservas pagas que ainda não foram avaliadas. */
export default function ReviewForm({ bookings, customerName, onSubmitted }: Props) {
  const reviewable = bookings.filter(b => b.canReview);
  const [bookingId, setBookingId] = useState(reviewable[0]?.id || '');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [city, setCity] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="text-center py-6">
        <p className="text-4xl mb-3">💛</p>
        <p className="text-foreground font-bold text-lg">Obrigado pela sua avaliação!</p>
        <p className="text-foreground/40 text-sm mt-1">Ela aparece aqui no site assim que for aprovada pela nossa equipe.</p>
      </div>
    );
  }

  if (!reviewable.length) {
    return (
      <p className="text-foreground/40 text-sm text-center py-4">
        {bookings.some(b => b.review)
          ? 'Você já avaliou todas as suas excursões. Obrigado! 💛'
          : 'Assim que o pagamento de uma excursão for confirmado, você poderá avaliá-la aqui.'}
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!rating) return setError('Escolha de 1 a 5 estrelas.');
    if (comment.trim().length < 10) return setError('Conte um pouco mais (mínimo de 10 caracteres).');
    setSending(true);
    try {
      await customerApi.createReview({ bookingId, rating, comment: comment.trim(), city: city.trim() });
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar avaliação');
    } finally {
      setSending(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-foreground/5 text-foreground placeholder-foreground/20';

  return (
    <form onSubmit={submit} className="space-y-4">
      {reviewable.length > 1 ? (
        <div>
          <label className="text-xs font-semibold text-foreground/30 block mb-1.5 uppercase tracking-wide">Qual excursão?</label>
          <select value={bookingId} onChange={e => setBookingId(e.target.value)} className={`${inputClass} bg-surface`}>
            {reviewable.map(b => <option key={b.id} value={b.id}>{b.excursion.title}</option>)}
          </select>
        </div>
      ) : (
        <p className="text-foreground/50 text-sm">Avaliando: <strong className="text-foreground">{reviewable[0].excursion.title}</strong></p>
      )}

      <div className="flex items-center gap-4">
        <StarInput value={rating} onChange={setRating} />
        {rating > 0 && <span className="text-amber-400 text-sm font-semibold">{RATING_LABELS[rating]}</span>}
      </div>

      <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} maxLength={1000}
        placeholder="Como foi a experiência? Conte sobre a organização, o transporte, o evento…" className={`${inputClass} resize-none`} />

      <div className="grid sm:grid-cols-2 gap-3">
        <input value={city} onChange={e => setCity(e.target.value)} maxLength={60} placeholder="Sua cidade (opcional)" className={inputClass} />
        <p className="text-foreground/30 text-xs self-center">Seu nome aparecerá como <strong className="text-foreground/60">{shortName(customerName)}</strong></p>
      </div>

      <FieldError message={error} />

      <button type="submit" disabled={sending}
        className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-60 text-white font-bold text-sm transition-colors">
        {sending ? 'Enviando…' : 'Enviar avaliação'}
      </button>
    </form>
  );
}

export function shortName(full: string) {
  const parts = full.trim().toLowerCase().split(/\s+/).map(p => p.charAt(0).toUpperCase() + p.slice(1));
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.` : parts[0] || '';
}
