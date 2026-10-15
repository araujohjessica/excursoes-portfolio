import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useApp } from '../store/AppContext';
import { useCustomer } from '../store/CustomerContext';
import { useSettings } from '../store/SettingsContext';
import { adminCommsApi } from '../services/customerApi';
import { tokenStorage } from '../services/api';
import { useRealtime } from '../services/realtime';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdminLoggedIn, adminLogout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { customer, isCustomerLoggedIn } = useCustomer();
  const { brand } = useSettings().settings;
  const [pending, setPending] = useState({ unreadMessages: 0, pendingReviews: 0, newRequests: 0 });

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate('/');
  };

  const isAdmin = location.pathname.startsWith('/admin');

  const loadSummary = () => adminCommsApi.summary().then(setPending).catch(() => {});

  useEffect(() => {
    if (isAdmin && isAdminLoggedIn) loadSummary();
  }, [isAdmin, isAdminLoggedIn, location.pathname]);

  // Contadores de mensagens e avaliações pendentes atualizados na hora
  useRealtime(isAdmin && isAdminLoggedIn ? tokenStorage.get() : null, e => {
    if (e.type === 'summary') setPending(p => ({ ...p, ...(e as unknown as Partial<typeof p>) }));
    if (e.type === 'reconnected') loadSummary();
  });

  const badge = (n: number) =>
    n > 0 ? <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[#F97316] text-white font-bold">{n}</span> : null;

  const accountLabel = isCustomerLoggedIn && customer
    ? `Olá, ${customer.name.split(' ')[0].toLowerCase().replace(/^./, c => c.toUpperCase())}`
    : 'Minha conta';

  return (
    <header      className={`theme-dark fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHome || isAdmin
          ? 'bg-[#111111]/98 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#F97316] flex items-center justify-center text-white font-bold text-lg font-['Outfit'] group-hover:scale-105 transition-transform">
              {brand.name.charAt(0).toUpperCase() || 'E'}
            </div>
            <div>
              <span className="text-white font-['Outfit'] font-700 text-lg leading-none block">
                {brand.name}
              </span>
              {brand.tagline && (
                <span className="text-[#F97316] text-xs font-['Outfit'] font-500 tracking-widest uppercase">
                  {brand.tagline}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {!isAdmin ? (
              <>
                <Link to="/" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                  Início
                </Link>
                <Link to="/excursoes" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                  Excursões
                </Link>
                <Link to="/como-funciona" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                  Como Funciona
                </Link>
                <a href="#contato" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                  Contato
                </a>
              </>
            ) : (
              <>
                <Link to="/admin" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                  Dashboard
                </Link>
                <Link to="/admin/eventos" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                  Eventos
                </Link>
                <Link to="/admin/reservas" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                  Reservas
                </Link>
                <Link to="/admin/mensagens" className="text-white/80 hover:text-white text-sm font-medium transition-colors flex items-center">
                  Mensagens{badge(pending.unreadMessages)}
                </Link>
                <Link to="/admin/avaliacoes" className="text-white/80 hover:text-white text-sm font-medium transition-colors flex items-center">
                  Avaliações{badge(pending.pendingReviews)}
                </Link>
                <Link to="/admin/pedidos" className="text-white/80 hover:text-white text-sm font-medium transition-colors flex items-center">
                  Pedidos{badge(pending.newRequests)}
                </Link>
                <Link to="/admin/financeiro" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                  Financeiro
                </Link>
              </>
            )}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            {isAdmin && isAdminLoggedIn ? (
              <>
              <Link to="/" title="Voltar para o site"
                className="px-3 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/10 transition-colors whitespace-nowrap">
                Ver site ↗
              </Link>
              <Link to="/admin/configuracoes" title="Configurações" aria-label="Configurações"
                className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${location.pathname.startsWith('/admin/configuracoes') ? 'border-[#F97316] text-[#F97316]' : 'border-white/20 text-white/70 hover:bg-white/10'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.3 4.3c.4-1.8 3-1.8 3.4 0a1.7 1.7 0 002.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 001 2.5c1.8.5 1.8 3 0 3.4a1.7 1.7 0 00-1 2.6c.9 1.5-.9 3.3-2.4 2.4a1.7 1.7 0 00-2.6 1c-.4 1.8-3 1.8-3.4 0a1.7 1.7 0 00-2.5-1c-1.6.9-3.3-.9-2.4-2.4a1.7 1.7 0 00-1.1-2.6c-1.8-.4-1.8-3 0-3.4a1.7 1.7 0 001.1-2.5c-.9-1.6.8-3.3 2.4-2.4a1.7 1.7 0 002.5-1.1z" /><circle cx="12" cy="12" r="3" /></svg>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/80 text-sm hover:bg-white/10 transition-colors"
              >
                Sair
              </button>
              </>
            ) : !isAdmin ? (
              <>
                <Link
                  to="/minha-conta"
                  className="px-4 py-2 rounded-lg border border-white/20 text-white/80 text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <span>👤</span>{accountLabel}{isCustomerLoggedIn && badge(customer?.stats.unreadMessages || 0)}
                </Link>
                {isAdminLoggedIn && (
                  <Link to="/admin" title="Voltar ao painel administrativo"
                    className="px-4 py-2 rounded-lg border border-[#F97316]/40 text-[#F97316] text-sm hover:bg-[#F97316]/10 transition-colors">
                    Painel
                  </Link>
                )}
                <Link
                  to="/excursoes"
                  className="px-5 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold transition-colors shadow-lg shadow-orange-500/25"
                >
                  Ver Excursões
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center gap-1">
          <ThemeToggle className="border-transparent" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 py-4 space-y-1">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">Início</Link>
            <Link to="/excursoes" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">Excursões</Link>
            {isAdmin ? (
              <>
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">Dashboard</Link>
                <Link to="/admin/eventos" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">Eventos</Link>
                <Link to="/admin/reservas" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">Reservas</Link>
                <Link to="/admin/mensagens" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">Mensagens{badge(pending.unreadMessages)}</Link>
                <Link to="/admin/avaliacoes" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">Avaliações{badge(pending.pendingReviews)}</Link>
                <Link to="/admin/pedidos" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">Pedidos{badge(pending.newRequests)}</Link>
                <Link to="/admin/financeiro" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">Financeiro</Link>
                <Link to="/admin/configuracoes" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">⚙️ Configurações</Link>
                <Link to="/" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">← Voltar para o site</Link>
                {isAdminLoggedIn && <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="block w-full text-left px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">Sair</button>}
              </>
            ) : (
              <>
                <Link to="/como-funciona" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">Como Funciona</Link>
                <Link to="/minha-conta" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm">👤 {accountLabel}</Link>
              </>
            )}
            <div className="pt-2 px-4">
              <Link
                to="/excursoes"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-5 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold transition-colors"
              >
                Ver Excursões
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
