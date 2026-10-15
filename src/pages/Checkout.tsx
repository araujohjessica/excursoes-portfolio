import { useState } from 'react';
import FieldError from '../components/FieldError';
import { useSettings, whatsappUrl } from '../store/SettingsContext';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router';
import { useApp } from '../store/AppContext';
import { imageUrl } from '../services/api';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCpf(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
}

function isValidCpf(value: string) {
  const cpf = value.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function formatPhone(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
}

type Step = 'dados' | 'pagamento' | 'confirmacao';
type PayMethod = 'pix' | 'credit';

const MAX_INSTALLMENTS = 12;
const MIN_INSTALLMENT = 5;

export default function Checkout() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { excursions, addBooking } = useApp();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const exc = excursions.find(e => e.slug === slug);
  const seats = Number(searchParams.get('seats') || '1');

  const [step, setStep] = useState<Step>('dados');
  const [payMethod, setPayMethod] = useState<PayMethod>('pix');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', phone: '', cpf: '',
    installments: '1',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const spotsLeft = exc ? exc.maxSpots - exc.bookedSpots : 0;

  if (!exc) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="text-center">
        <p className="text-6xl mb-4">🗺️</p>
        <h2 className="font-['Outfit'] font-bold text-2xl mb-2">Excursão não encontrada</h2>
        <Link to="/excursoes" className="text-[#F97316] hover:underline">Ver todas</Link>
      </div>
    </div>
  );

  if (spotsLeft <= 0) return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-20 px-4">
      <div className="text-center max-w-sm">
        <p className="text-6xl mb-4">🔴</p>
        <h2 className="font-['Outfit'] font-black text-2xl text-foreground mb-2">Evento esgotado</h2>
        <p className="text-foreground/40 text-sm mb-6">Todas as vagas para <strong className="text-foreground">{exc.title}</strong> foram preenchidas.</p>
        <div className="flex flex-col gap-3">
          <a href={whatsappUrl(settings.contact.whatsapp, `Olá! Quero entrar na lista de espera de: ${exc.title}`) || '/minha-conta?aba=mensagens'} target="_blank" rel="noreferrer" className="px-6 py-3 rounded-xl bg-green-500 text-foreground font-bold text-sm hover:bg-green-600 transition-colors">💬 Entrar na lista de espera</a>
          <Link to="/excursoes" className="px-6 py-3 rounded-xl border border-foreground/10 text-foreground/50 text-sm hover:border-foreground/30 transition-colors">Ver outros eventos disponíveis</Link>
        </div>
      </div>
    </div>
  );

  if (seats > spotsLeft) navigate(`/excursao/${exc.slug}`);

  const baseTotal = exc.price * seats;
  const total = payMethod === 'pix' ? baseTotal * 0.95 : baseTotal;
  const pixDiscount = baseTotal - total;
  const maxInstallments = Math.max(1, Math.min(MAX_INSTALLMENTS, Math.floor(total / MIN_INSTALLMENT)));

  const validateDados = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nome obrigatório';
    if (!form.email.includes('@')) e.email = 'E-mail inválido';
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Telefone inválido';
    if (!isValidCpf(form.cpf)) e.cpf = 'CPF inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    setLoading(true);
    setSubmitError('');
    try {
      const created = await addBooking({
        excursionId: exc.id,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        customerCpf: form.cpf,
        seats,
        paymentMethod: payMethod,
        installments: payMethod === 'credit' ? Number(form.installments) : 1,
      });
      navigate(`/pagamento/${created.token}`, { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao confirmar reserva');
    } finally {
      setLoading(false);
    }
  };

  const setField = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${
      errors[field]
        ? 'border-red-400 bg-red-50'
        : 'border-border focus:border-[#F97316] bg-card'
    }`;

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <Link to={`/excursao/${slug}`} className="text-muted-foreground text-sm hover:text-[#F97316] transition-colors flex items-center gap-1">
            ← Voltar
          </Link>
          <h1 className="font-['Outfit'] font-black text-3xl text-foreground mt-3">Finalizar reserva</h1>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-10">
          {(['dados', 'pagamento', 'confirmacao'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                step === s ? 'bg-[#F97316] text-white' :
                (i < ['dados', 'pagamento', 'confirmacao'].indexOf(step)) ? 'bg-green-500 text-white' :
                'bg-[#E5E5E0] text-[#A0A0A0]'
              }`}>{i + 1}</div>
              <span className={`text-xs font-medium hidden sm:block ${step === s ? 'text-[#F97316]' : 'text-[#A0A0A0]'}`}>
                {s === 'dados' ? 'Seus dados' : s === 'pagamento' ? 'Pagamento' : 'Confirmação'}
              </span>
              {i < 2 && <div className={`flex-1 h-0.5 ${i < ['dados', 'pagamento', 'confirmacao'].indexOf(step) ? 'bg-[#F97316]' : 'bg-[#E5E5E0]'}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === 'dados' && (
              <div className="bg-card rounded-2xl p-7 border border-border">
                <h2 className="font-['Outfit'] font-700 text-xl text-foreground mb-6">Dados do viajante</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wide">Nome completo *</label>
                    <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Seu nome completo" className={inputClass('name')} />
                    <FieldError message={errors.name} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wide">E-mail *</label>
                    <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="seu@email.com" className={inputClass('email')} />
                    <FieldError message={errors.email} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wide">Telefone / WhatsApp *</label>
                    <input value={form.phone} onChange={e => setField('phone', formatPhone(e.target.value))} placeholder="(11) 99999-0000" className={inputClass('phone')} />
                    <FieldError message={errors.phone} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wide">CPF *</label>
                    <input value={form.cpf} onChange={e => setField('cpf', formatCpf(e.target.value))} placeholder="000.000.000-00" className={inputClass('cpf')} />
                    <FieldError message={errors.cpf} />
                  </div>
                </div>
                <button
                  onClick={() => validateDados() && setStep('pagamento')}
                  className="w-full mt-6 py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl transition-colors"
                >
                  Continuar para pagamento →
                </button>
              </div>
            )}

            {step === 'pagamento' && (
              <div className="bg-card rounded-2xl p-7 border border-border">
                <h2 className="font-['Outfit'] font-700 text-xl text-foreground mb-6">Forma de pagamento</h2>

                {/* Payment method tabs */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {([
                    { key: 'pix', label: 'Pix', badge: '−5%', color: 'text-[#32BCAD]' },
                    { key: 'credit', label: 'Cartão de crédito', badge: `até ${maxInstallments}x`, color: 'text-blue-600' },
                  ] as const).map(m => (
                    <button
                      key={m.key}
                      onClick={() => setPayMethod(m.key)}
                      className={`p-3 rounded-xl border-2 text-center transition-colors ${payMethod === m.key ? 'border-[#F97316] bg-orange-50' : 'border-border hover:border-gray-300'}`}
                    >
                      <p className={`text-sm font-semibold ${m.color}`}>{m.label}</p>
                      {m.badge && <p className="text-[10px] text-[#F97316] font-bold">{m.badge}</p>}
                    </button>
                  ))}
                </div>

                {payMethod === 'pix' && (
                  <div className="bg-[#F4FDF6] border border-green-200 rounded-xl p-5 text-center">
                    <p className="text-green-800 font-semibold mb-1">Pague com Pix e ganhe 5% de desconto!</p>
                    <p className="text-green-600 text-sm">O QR Code aparece na próxima tela e também vai para o seu e-mail. Pagamento na hora.</p>
                    <div className="mt-4 py-3 bg-green-100 rounded-lg">
                      <p className="text-green-700 font-bold text-lg">{formatCurrency(total)}</p>
                      <p className="text-green-600 text-xs">Você economiza {formatCurrency(pixDiscount)}</p>
                    </div>
                  </div>
                )}


                {payMethod === 'credit' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                      <p className="text-blue-800 font-semibold mb-1">Pagamento seguro pelo Asaas</p>
                      <p className="text-blue-700/80 text-sm">Os dados do cartão são digitados na página segura do Asaas. Nós não vemos nem guardamos o número do seu cartão. O link também vai para <strong>{form.email}</strong>.</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wide">Parcelamento</label>
                      <select value={form.installments} onChange={e => setField('installments', e.target.value)} className={inputClass('installments')}>
                        {Array.from({ length: maxInstallments }, (_, i) => i + 1).map(n => (
                          <option key={n} value={String(n)}>
                            {n}x de {formatCurrency(total / n)}{n === 1 ? ' (à vista)' : ' sem juros'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <p className="mt-4 text-xs text-muted-foreground bg-background border border-border rounded-lg px-3 py-2">
                  ⏳ Sua vaga fica reservada por <strong>24 horas</strong> após gerar o pagamento. Sem pagamento nesse prazo, a reserva é cancelada automaticamente.
                </p>

                <FieldError message={submitError} />

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep('dados')} className="px-5 py-3 rounded-xl border-2 border-border text-foreground/70 font-semibold text-sm hover:border-foreground transition-colors">
                    ← Voltar
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 py-3 bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processando...</>
                    ) : (
                      `Gerar pagamento de ${formatCurrency(total)} →`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div>
            <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
              <h3 className="font-['Outfit'] font-700 text-base text-foreground mb-4">Resumo da reserva</h3>
              <div className="flex gap-3 mb-4">
                <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-orange-100">
                  <img src={imageUrl(exc.image, 160, 120)} alt={exc.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2">{exc.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">⏱ {exc.duration}</p>
                </div>
              </div>
              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{seats} pessoa{seats > 1 ? 's' : ''}</span>
                  <span>{formatCurrency(baseTotal)}</span>
                </div>
                {payMethod === 'pix' && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto Pix (5%)</span>
                    <span>−{formatCurrency(pixDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-['Outfit'] font-bold text-base">
                  <span>Total</span>
                  <span className="text-[#F97316]">{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[#A0A0A0] text-xs">
                <span>🔒</span>
                <span>Pagamento processado pelo Asaas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
