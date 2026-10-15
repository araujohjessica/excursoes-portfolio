import { IS_DEMO } from '../../services/demo';
import { useState } from 'react';
import FieldError from '../../components/FieldError';
import { useNavigate, Link } from 'react-router';
import { useSettings } from '../../store/SettingsContext';
import { useApp } from '../../store/AppContext';

export default function AdminLogin() {
  const { adminLogin } = useApp();
  const navigate = useNavigate();
  const { brand } = useSettings().settings;
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await adminLogin(form.email, form.password);
      if (ok) navigate('/admin');
      else setError('Usuário ou senha incorretos. Confira e tente de novo.');
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-card flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-[#F97316] flex items-center justify-center text-white font-black text-2xl font-['Outfit'] mx-auto mb-4">
            E
          </div>
          <h1 className="font-['Outfit'] font-black text-2xl text-foreground">Painel Admin</h1>
          <p className="text-foreground/40 text-sm mt-1">{[brand.name, brand.tagline].filter(Boolean).join(' ')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-foreground/5 border border-foreground/10 rounded-2xl p-8 space-y-4">
          <div>
            <label className="text-foreground/60 text-xs font-semibold uppercase tracking-wide block mb-1.5">Usuário ou e-mail</label>
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={form.email}
              onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setError(''); }}
              placeholder="admin ou seu@email.com"
              className="w-full px-4 py-3 rounded-xl bg-foreground/10 border border-foreground/20 text-foreground placeholder-foreground/30 text-sm outline-none focus:border-[#F97316] transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-foreground/60 text-xs font-semibold uppercase tracking-wide block mb-1.5">Senha</label>
            <input
              type="password"
              value={form.password}
              autoComplete="current-password"
              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError(''); }}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-foreground/10 border border-foreground/20 text-foreground placeholder-foreground/30 text-sm outline-none focus:border-[#F97316] transition-colors"
              required
            />
          </div>

          {IS_DEMO && (
            <p className="text-[#F97316] text-xs text-center bg-[#F97316]/10 rounded-lg px-3 py-2">
              Demonstração: entre com qualquer e-mail e senha.
            </p>
          )}
          <FieldError message={error} />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-foreground/30 border-t-white rounded-full animate-spin" /> Entrando...</>
            ) : 'Entrar'}
          </button>

        </form>

        {/* Voltar para o site */}
        <div className="flex items-center gap-3 my-5" aria-hidden="true">
          <span className="flex-1 h-px bg-foreground/10" />
          <span className="text-foreground/25 text-xs">ou</span>
          <span className="flex-1 h-px bg-foreground/10" />
        </div>
        <Link
          to="/"
          className="group flex items-center gap-4 p-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] hover:border-[#F97316]/50 hover:bg-[#F97316]/[0.06] transition-all"
        >
          <span className="w-11 h-11 rounded-xl bg-foreground/5 group-hover:bg-[#F97316] flex items-center justify-center flex-shrink-0 transition-colors">
            <svg className="w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-foreground font-semibold text-sm">Voltar para o site</span>
            <span className="block text-foreground/40 text-xs truncate">Ver as excursões de {brand.name}</span>
          </span>
          <span className="text-foreground/30 group-hover:text-[#F97316] group-hover:translate-x-1 transition-all text-lg" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
