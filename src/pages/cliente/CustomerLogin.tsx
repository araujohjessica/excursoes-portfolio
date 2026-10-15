import { useState } from 'react';
import FieldError from '../../components/FieldError';
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router';
import { customerApi } from '../../services/customerApi';
import { useCustomer } from '../../store/CustomerContext';
import { ApiError } from '../../services/api';

export default function CustomerLogin() {
  const { login, isCustomerLoggedIn } = useCustomer();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('voltar') || '/minha-conta';

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isCustomerLoggedIn) return <Navigate to={redirect} replace />;

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setNotFound(false);
    if (!email.includes('@')) return setError('Informe um e-mail válido.');
    setLoading(true);
    try {
      const res = await customerApi.requestCode(email.trim());
      setInfo(`${res.message.replace(/\.$/, '')}: ${email.trim()}.`);
      setDevCode(res.devCode || '');
      setStep('code');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
        setStep('email');
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao enviar código');
      }
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await customerApi.verifyCode(email.trim(), code);
      login(res.token, res.customer);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3.5 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-foreground/5 text-foreground placeholder-foreground/20';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-20 pb-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#F97316]/15 flex items-center justify-center text-2xl mx-auto mb-4">🎟️</div>
          <h1 className="font-['Outfit'] font-black text-3xl text-foreground">Minha conta</h1>
          <p className="text-foreground/40 text-sm mt-2">Acompanhe suas excursões, fale com a gente e avalie sua viagem.</p>
        </div>

        <div className="bg-card border border-foreground/10 rounded-2xl p-6">
          {step === 'email' ? (
            <form onSubmit={requestCode} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground/30 block mb-1.5 uppercase tracking-wide">E-mail usado na reserva</label>
                <input type="email" autoFocus value={email} onChange={e => { setEmail(e.target.value); setNotFound(false); }} placeholder="seu@email.com"
                  className={`${inputClass} ${notFound ? '!border-red-500/60' : ''}`} aria-invalid={notFound} />
              </div>
              {notFound && (
                <div role="alert" className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm font-semibold">Sem acesso para este e-mail</p>
                  <p className="text-red-300/80 text-xs mt-1 leading-relaxed">
                    Não encontramos nenhuma reserva com <strong className="text-red-300">{email.trim()}</strong>. Confira se é o mesmo e-mail usado na reserva.
                  </p>
                  <Link to="/excursoes" className="inline-block text-xs text-foreground/70 hover:text-foreground font-semibold mt-2">Ainda não reservou? Ver excursões →</Link>
                </div>
              )}
              <FieldError message={error} />
              <button disabled={loading} className="w-full py-3.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-60 text-white font-bold text-sm transition-colors">
                {loading ? 'Enviando…' : 'Receber código de acesso'}
              </button>
              <p className="text-foreground/30 text-xs text-center">Sem senha: enviamos um código de 6 dígitos para o seu e-mail.</p>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <p className="text-foreground/50 text-sm">{info}</p>
              {devCode && (
                <p className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg px-3 py-2">
                  Modo de teste (SMTP não configurado): seu código é <strong className="font-mono">{devCode}</strong>
                </p>
              )}
              <div>
                <label className="text-xs font-semibold text-foreground/30 block mb-1.5 uppercase tracking-wide">Código</label>
                <input autoFocus inputMode="numeric" autoComplete="one-time-code" value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" className={`${inputClass} text-center font-mono text-2xl tracking-[0.5em]`} />
              </div>
              <FieldError message={error} />
              <button disabled={loading || code.length !== 6} className="w-full py-3.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-60 text-white font-bold text-sm transition-colors">
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
              <div className="flex justify-between text-xs">
                <button type="button" onClick={() => { setStep('email'); setCode(''); setError(''); }} className="text-foreground/40 hover:text-foreground">← Trocar e-mail</button>
                <button type="button" onClick={() => requestCode()} disabled={loading} className="text-[#F97316] hover:underline">Reenviar código</button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-foreground/30 text-xs mt-6">
          Ainda não tem reserva? <Link to="/excursoes" className="text-[#F97316] hover:underline">Veja as excursões</Link>
        </p>
      </div>
    </div>
  );
}
