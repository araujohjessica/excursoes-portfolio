import { useState, useEffect } from 'react';
import { useSettings, whatsappUrl } from '../store/SettingsContext';
import { useCustomer } from '../store/CustomerContext';
import { customerApi } from '../services/customerApi';
import ReviewForm from '../components/ReviewForm';
import ExcursionRequestModal from '../components/ExcursionRequestModal';
import type { Review, ReviewStats, CustomerBooking } from '../types';
import { Link, useNavigate } from 'react-router';
import { useApp } from '../store/AppContext';
import ExcursionCard from '../components/ExcursionCard';

const CATEGORIES = [
  { key: 'festival', label: 'Festivais', icon: '🎪', desc: 'Rock in Rio, The Town, Lolla…' },
  { key: 'carnaval', label: 'Carnaval', icon: '🎭', desc: 'Salvador, Rio, Recife, Olinda' },
  { key: 'reveillon', label: 'Réveillon', icon: '🎆', desc: 'Viradas pelo Brasil' },
  { key: 'show', label: 'Shows', icon: '🎸', desc: 'Coldplay, Taylor Swift e mais' },
  { key: 'esportes', label: 'Esportes', icon: '⚽', desc: 'Jogos e competições' },
  { key: 'teatro', label: 'Teatro & Arte', icon: '🎭', desc: 'Musicais e exposições' },
];

export default function Home() {
  const { excursions } = useApp();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [search, setSearch] = useState('');

  const { customer, isCustomerLoggedIn } = useCustomer();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [myBookings, setMyBookings] = useState<CustomerBooking[]>([]);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    customerApi.publicReviews().then(r => { setReviews(r.reviews); setStats(r.stats); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isCustomerLoggedIn) customerApi.bookings().then(setMyBookings).catch(() => {});
    else setMyBookings([]);
  }, [isCustomerLoggedIn]);

  const statItems = [
    stats?.travelers ? { value: stats.travelers.toLocaleString('pt-BR'), label: 'Viajantes' } : null,
    stats?.trips ? { value: String(stats.trips), label: 'Excursões realizadas' } : null,
    stats?.recommendPercent != null ? { value: `${stats.recommendPercent}%`, label: 'Recomendam' } : null,
    stats?.averageRating != null ? { value: `${stats.averageRating.toFixed(1)} ★`, label: `Média de ${stats.reviews} ${stats.reviews > 1 ? 'avaliações' : 'avaliação'}` } : null,
  ].filter((x): x is { value: string; label: string } => Boolean(x));

  const featured = excursions.filter(e => e.featured && e.active);
  const totalEvents = excursions.filter(e => e.active).length;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = excursions
    .filter(e => e.active && (e.eventDate || e.departureDate) >= today)
    .sort((a, b) => (a.eventDate || a.departureDate).localeCompare(b.eventDate || b.departureDate))
    .slice(0, 8)
    .map(e => {
      const [y, m] = (e.eventDate || e.departureDate).split('-');
      const month = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][Number(m) - 1];
      return { slug: e.slug, date: `${month} ${y}`, event: e.eventName || e.title, spots: e.maxSpots - e.bookedSpots };
    });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/excursoes?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="theme-dark relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
        {/* Background concert image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1800&h=1000"
            alt="Festival de música"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />
          {/* Orange vignette on sides */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F97316]/10 via-transparent to-[#F97316]/10" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-28 pb-40">
          <div className="inline-flex items-center gap-2 bg-[#F97316]/20 border border-[#F97316]/40 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
            <span className="text-[#F97316] text-xs font-semibold tracking-widest uppercase">
              Rock in Rio · The Town · Carnaval · Réveillon
            </span>
          </div>

          <h1 className="font-['Outfit'] font-black text-6xl sm:text-7xl lg:text-9xl text-foreground leading-none mb-6 tracking-tight">
            Vá no<br />
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: '2px #F97316' }}
            >
              evento.
            </span>
          </h1>

          <p className="text-foreground/60 text-lg sm:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            Excursões para festivais, shows e Carnaval: transporte confortável e grupo organizado, saindo da sua cidade.
          </p>
          <p className="text-foreground/40 text-sm mb-12">
            Você faz a reserva. A gente cuida do resto.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex gap-2 bg-foreground/10 backdrop-blur-md border border-foreground/20 rounded-2xl p-2">
              <div className="flex-1 flex items-center gap-3 px-4">
                <svg className="w-5 h-5 text-foreground/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rock in Rio, Carnaval, Coldplay…"
                  className="flex-1 bg-transparent text-foreground placeholder-foreground/40 text-sm outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {['Rock in Rio', 'The Town', 'Lollapalooza', 'Carnaval', 'Réveillon'].map(evt => (
              <button
                key={evt}
                onClick={() => navigate(`/excursoes?q=${evt}`)}
                className="px-3 py-1.5 rounded-full bg-foreground/10 hover:bg-foreground/20 border border-foreground/20 text-foreground/70 hover:text-foreground text-xs transition-colors"
              >
                {evt}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming events ticker */}
        {upcoming.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-foreground/5 backdrop-blur-md border-t border-foreground/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-[#F97316] text-xs font-bold tracking-widest uppercase whitespace-nowrap flex-shrink-0 pr-3 border-r border-foreground/20">
                Próximos
              </span>
              {upcoming.map((u, i) => (
                <div key={u.slug} className="flex items-center gap-3 flex-shrink-0">
                  <Link to={`/excursao/${u.slug}`} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/10 hover:bg-foreground/20 border border-foreground/10 transition-colors">
                    <span className="text-[#F97316] text-xs font-semibold">{u.date}</span>
                    <span className="text-foreground/70 text-xs">{u.event}</span>
                    <span className={`text-xs font-bold ${u.spots <= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {u.spots <= 0 ? '● ESGOTADO' : `● ${u.spots} ${u.spots === 1 ? 'vaga' : 'vagas'}`}
                    </span>
                  </Link>
                  {i < upcoming.length - 1 && <span className="text-foreground/20">·</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[#F97316] text-xs font-bold tracking-widest uppercase mb-1">Categorias</p>
              <h2 className="font-['Outfit'] font-black text-3xl text-foreground">Que tipo de evento?</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => navigate(`/excursoes?categoria=${cat.key}`)}
                className="group p-5 rounded-2xl border border-foreground/10 hover:border-[#F97316]/60 bg-foreground/5 hover:bg-[#F97316]/10 text-center transition-all duration-200"
              >
                <span className="text-3xl block mb-2">{cat.icon}</span>
                <p className="font-['Outfit'] font-bold text-sm text-foreground group-hover:text-[#F97316] transition-colors">{cat.label}</p>
                <p className="text-foreground/30 text-[10px] mt-0.5 leading-tight">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PACKAGES ── */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#F97316] text-xs font-bold tracking-widest uppercase mb-1">Pacotes em destaque</p>
              <h2 className="font-['Outfit'] font-black text-4xl lg:text-5xl text-foreground">Os mais procurados</h2>
            </div>
            <Link
              to="/excursoes"
              className="hidden md:flex items-center gap-2 text-[#F97316] font-semibold text-sm hover:gap-3 transition-all"
            >
              Ver todos <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.slice(0, 6).map(exc => (
              <ExcursionCard key={exc.id} excursion={exc} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/excursoes"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold transition-colors shadow-lg shadow-orange-900/40"
            >
              Ver todos os pacotes → {totalEvents} disponíveis
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#F97316] text-xs font-bold tracking-widest uppercase mb-2">Simples assim</p>
            <h2 className="font-['Outfit'] font-black text-4xl lg:text-5xl text-foreground">Como funciona</h2>
            <p className="text-foreground/40 mt-3 max-w-lg mx-auto text-sm">
              Do sofá até o festival em 3 passos · <Link to="/como-funciona" className="text-[#F97316] hover:underline">ver todos os detalhes e dúvidas →</Link>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
            {[
              {
                step: '01',
                icon: '🎟️',
                title: 'Escolha o pacote',
                desc: 'Encontre o evento que você quer e veja na página do pacote tudo o que está incluso: transporte, roteiro, horários e ponto de encontro.',
              },
              {
                step: '02',
                icon: '💳',
                title: 'Reserve e pague seguro',
                desc: 'Pix com 5% de desconto ou cartão de crédito em até 12x sem juros. A confirmação chega no seu e-mail e fica na sua área “Minha conta”.',
              },
              {
                step: '03',
                icon: '🚌',
                title: 'Apareça e curta',
                desc: 'No dia, é só embarcar no ponto combinado. A gente cuida da ida e da volta enquanto você curte o evento.',
              },
            ].map(item => (
              <div key={item.step} className="relative group">
                <div className="font-['Outfit'] font-black text-8xl text-foreground/[0.03] absolute -top-6 -left-3 select-none pointer-events-none">{item.step}</div>
                <div className="relative border border-foreground/10 rounded-2xl p-8 hover:border-[#F97316]/30 transition-colors">
                  <div className="text-4xl mb-5">{item.icon}</div>
                  <h3 className="font-['Outfit'] font-bold text-xl text-foreground mb-3">{item.title}</h3>
                  <p className="text-foreground/40 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* What's included banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🚌', label: 'Transporte confortável', sub: 'Ida e volta garantidas' },
              { icon: '👥', label: 'Grupo organizado', sub: 'Viaje com quem curte o mesmo' },
              { icon: '💳', label: 'Pagamento seguro', sub: 'Pix ou cartão em até 12x' },
              { icon: '💬', label: 'Suporte direto', sub: 'Fale com a gente pelo site' },
            ].map(item => (
              <div key={item.label} className="bg-foreground/5 border border-foreground/10 rounded-2xl p-5 text-center">
                <span className="text-3xl block mb-2">{item.icon}</span>
                <p className="text-foreground text-sm font-semibold">{item.label}</p>
                <p className="text-foreground/30 text-xs mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PEDIDO DE EXCURSÃO ── */}
      <section className="relative overflow-hidden bg-[#F97316]">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-foreground/10" aria-hidden="true" />
        <div className="absolute right-40 -bottom-24 w-48 h-48 rounded-full bg-foreground/5" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-foreground text-center md:text-left">
            <span className="hidden sm:flex w-14 h-14 rounded-2xl bg-foreground/15 items-center justify-center text-3xl flex-shrink-0">🚌</span>
            <div>
              <p className="font-['Outfit'] font-black text-xl sm:text-2xl leading-tight">Quer viajar com a gente para outro evento?</p>
              <p className="text-foreground/85 text-sm mt-1">Não achou o show ou festival que queria? Conte pra gente: juntando o grupo, a gente monta a excursão.</p>
            </div>
          </div>
          <button
            onClick={() => setRequestOpen(true)}
            className="px-6 py-3 bg-foreground text-[#F97316] font-bold rounded-xl hover:bg-orange-50 transition-colors whitespace-nowrap flex-shrink-0 text-sm shadow-lg shadow-orange-900/20"
          >
            Pedir uma excursão →
          </button>
        </div>
      </section>
      <ExcursionRequestModal open={requestOpen} onClose={() => setRequestOpen(false)} />

      {/* ── TESTIMONIALS ── */}
      <section id="opiniao" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#F97316] text-xs font-bold tracking-widest uppercase mb-2">Quem foi, aprovou</p>
            <h2 className="font-['Outfit'] font-black text-4xl lg:text-5xl text-foreground">O que falam de nós</h2>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {reviews.slice(0, 6).map(t => (
                <div key={t.id} className={`bg-foreground/5 border rounded-2xl p-7 hover:border-[#F97316]/30 transition-colors ${t.featured ? 'border-[#F97316]/30' : 'border-foreground/10'}`}>
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < t.rating ? 'text-amber-400' : 'text-foreground/15'}>★</span>
                    ))}
                  </div>
                  <p className="text-foreground/60 text-sm leading-relaxed mb-6">"{t.comment}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {t.customerName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{t.customerName}</p>
                      {t.customerCity && <p className="text-foreground/30 text-xs">{t.customerCity}</p>}
                      <Link to={`/excursao/${t.excursionSlug}`} className="text-[#F97316] text-xs font-medium hover:underline">{t.eventName}</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-foreground/40">Ainda não temos avaliações publicadas. Já viajou com a gente? Seja o primeiro a contar como foi!</p>
          )}

          {/* Deixe sua opinião */}
          <div className="mt-12 max-w-2xl mx-auto bg-foreground/5 border border-foreground/10 rounded-2xl p-7">
            <div className="text-center mb-5">
              <h3 className="font-['Outfit'] font-bold text-2xl text-foreground">Deixe sua opinião</h3>
              <p className="text-foreground/40 text-sm mt-1">Viajou com a gente? Conte como foi. Sua avaliação ajuda outros viajantes.</p>
            </div>
            {isCustomerLoggedIn && customer ? (
              <ReviewForm key={myBookings.length} bookings={myBookings} customerName={customer.name} />
            ) : (
              <div className="text-center">
                <Link to="/minha-conta/entrar?voltar=/minha-conta?aba=avaliacoes"
                  className="inline-block px-6 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm transition-colors">
                  Entrar para avaliar
                </Link>
                <p className="text-foreground/30 text-xs mt-3">Use o e-mail da sua reserva. Só quem viajou com a gente pode avaliar.</p>
              </div>
            )}
          </div>

          {/* Stats */}
          {statItems.length > 0 && (
            <div className={`mt-14 pt-10 border-t border-foreground/10 grid grid-cols-2 gap-6 text-center ${['', 'md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4'][statItems.length]}`}>
              {statItems.map((s, i) => (
                <div key={i}>
                  <p className="font-['Outfit'] font-black text-3xl text-[#F97316]">{s.value}</p>
                  <p className="text-foreground/40 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&h=600"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-['Outfit'] font-black text-5xl lg:text-7xl text-foreground mb-6 leading-none">
            Qual o próximo<br />
            <span className="text-[#F97316]">show?</span>
          </h2>
          <p className="text-foreground/40 text-lg mb-10 max-w-2xl mx-auto">
            Garanta seu lugar na excursão com transporte de ida e volta. Reserve antes que esgote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/excursoes"
              className="px-10 py-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-lg transition-colors shadow-2xl shadow-orange-900/50"
            >
              Ver todos os pacotes →
            </Link>
            <a
              href={whatsappUrl(settings.contact.whatsapp, 'Olá! Quero saber mais sobre as excursões.') || '#contato'}
              target="_blank"
              rel="noreferrer"
              className="px-10 py-4 rounded-xl border-2 border-foreground/20 text-foreground font-bold text-base hover:border-foreground/60 hover:bg-foreground/5 transition-colors"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
