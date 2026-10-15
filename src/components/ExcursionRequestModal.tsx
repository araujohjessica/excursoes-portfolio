import { useEffect, useState } from 'react';
import FieldError from './FieldError';
import { customerApi } from '../services/customerApi';
import { useCustomer } from '../store/CustomerContext';

function formatPhone(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialEvent?: string;
}

export default function ExcursionRequestModal({ open, onClose, initialEvent = '' }: Props) {
  const { customer } = useCustomer();
  const blank = {
    name: '', email: '', phone: '', eventName: '', eventCity: '', eventDate: '',
    departureCity: '', people: '1', message: '', website: '',
  };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setDone(false);
    setError('');
    setErrors({});
    setForm(f => ({
      ...f,
      eventName: initialEvent || f.eventName,
      name: f.name || (customer?.name ?? ''),
      email: f.email || (customer?.email ?? ''),
      phone: f.phone || (customer?.phone ?? ''),
    }));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const set = (k: keyof typeof blank, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.eventName.trim().length < 2) errs.eventName = 'Qual evento você quer ir?';
    if (form.name.trim().length < 2) errs.name = 'Informe seu nome';
    if (!form.email.includes('@')) errs.email = 'E-mail inválido';
    if (form.phone.replace(/\D/g, '').length < 10) errs.phone = 'WhatsApp inválido';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    setError('');
    try {
      await customerApi.requestExcursion({ ...form, people: Number(form.people) || 1 });
      setDone(true);
      setForm(f => ({ ...blank, name: f.name, email: f.email, phone: f.phone }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar pedido');
    } finally {
      setSending(false);
    }
  };

  const input = (k: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm outline-none bg-foreground/5 text-foreground placeholder-foreground/25 transition-colors ${errors[k] ? 'border-red-400' : 'border-foreground/10 focus:border-[#F97316]'}`;
  const label = 'text-xs font-semibold text-foreground/40 block mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto bg-card border border-foreground/10 sm:rounded-2xl rounded-t-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-foreground/10 px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div>
            <h2 className="font-['Outfit'] font-black text-xl text-foreground">Monte sua excursão com a gente</h2>
            <p className="text-foreground/40 text-sm mt-0.5">Conte qual evento você quer ir. Se juntar gente, a gente organiza!</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-lg text-foreground/40 hover:bg-foreground/10 flex items-center justify-center flex-shrink-0">✕</button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
            <h3 className="font-['Outfit'] font-bold text-xl text-foreground">Pedido recebido!</h3>
            <p className="text-foreground/50 text-sm mt-2 max-w-sm mx-auto">
              Vamos avaliar e falar com você pelo WhatsApp ou e-mail. Quanto mais gente pedir o mesmo evento, mais rápido a excursão sai.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <button onClick={() => setDone(false)} className="px-5 py-2.5 rounded-xl border border-foreground/15 text-foreground/70 text-sm hover:bg-foreground/5">Pedir outro evento</button>
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm">Fechar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4" noValidate>
            {/* honeypot anti-spam, invisível para pessoas */}
            <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={e => set('website', e.target.value)}
              className="absolute -left-[9999px] w-px h-px opacity-0" aria-hidden="true" />

            <div>
              <label className={label}>Evento ou show *</label>
              <input autoFocus value={form.eventName} onChange={e => set('eventName', e.target.value)} placeholder="Ex.: Show do Coldplay, Oktoberfest, Réveillon em Floripa…" className={input('eventName')} />
              <FieldError message={errors.eventName} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Cidade do evento</label>
                <input value={form.eventCity} onChange={e => set('eventCity', e.target.value)} placeholder="Ex.: São Paulo, SP" className={input('eventCity')} />
              </div>
              <div>
                <label className={label}>Data (se souber)</label>
                <input value={form.eventDate} onChange={e => set('eventDate', e.target.value)} placeholder="Ex.: março/2027" className={input('eventDate')} />
              </div>
              <div>
                <label className={label}>Saindo de</label>
                <input value={form.departureCity} onChange={e => set('departureCity', e.target.value)} placeholder="Sua cidade" className={input('departureCity')} />
              </div>
              <div>
                <label className={label}>Quantas pessoas?</label>
                <select value={form.people} onChange={e => set('people', e.target.value)} className={`${input('people')} bg-surface`}>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} pessoa{n > 1 ? 's' : ''}</option>)}
                  <option value="30">Grupo grande (20+)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-foreground/5 grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={label}>Seu nome *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome completo" className={input('name')} />
                <FieldError message={errors.name} />
              </div>
              <div>
                <label className={label}>E-mail *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="seu@email.com" className={input('email')} />
                <FieldError message={errors.email} />
              </div>
              <div>
                <label className={label}>WhatsApp *</label>
                <input value={form.phone} onChange={e => set('phone', formatPhone(e.target.value))} placeholder="(11) 99999-0000" className={input('phone')} />
                <FieldError message={errors.phone} />
              </div>
            </div>

            <div>
              <label className={label}>Algo mais? (opcional)</label>
              <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={3} maxLength={1000}
                placeholder="Tipo de hospedagem, se precisa de ingresso, orçamento…" className={`${input('message')} resize-none`} />
            </div>

            <FieldError message={error} />

            <button disabled={sending} className="w-full py-3.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-60 text-white font-bold transition-colors">
              {sending ? 'Enviando…' : 'Enviar pedido'}
            </button>
            <p className="text-foreground/30 text-xs text-center">Sem compromisso. Usamos seus dados só para falar sobre esse pedido.</p>
          </form>
        )}
      </div>
    </div>
  );
}
