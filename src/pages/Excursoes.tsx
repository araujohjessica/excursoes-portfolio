import { useState, useMemo } from 'react';
import ExcursionRequestModal from '../components/ExcursionRequestModal';
import { useSearchParams } from 'react-router';
import { useApp } from '../store/AppContext';
import ExcursionCard from '../components/ExcursionCard';

const CATEGORY_LABELS: Record<string, string> = {
  festival: 'Festivais', carnaval: 'Carnaval', reveillon: 'Réveillon',
  show: 'Shows', esportes: 'Esportes', teatro: 'Teatro & Arte',
};

const CATEGORY_ICONS: Record<string, string> = {
  festival: '🎪', carnaval: '🎭', reveillon: '🎆', show: '🎸', esportes: '⚽', teatro: '🎭',
};

export default function Excursoes() {
  const { excursions } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState('featured');
  const [priceMax, setPriceMax] = useState(10000);
  const [showSoldOut, setShowSoldOut] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);

  const q = searchParams.get('q') || '';
  const categoria = searchParams.get('categoria') || '';

  const filtered = useMemo(() => {
    let list = excursions.filter(e => e.active);
    if (!showSoldOut) list = list.filter(e => e.bookedSpots < e.maxSpots);
    if (q) {
      const lq = q.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(lq) ||
        e.eventName.toLowerCase().includes(lq) ||
        e.eventCity.toLowerCase().includes(lq) ||
        e.departureCity.toLowerCase().includes(lq) ||
        e.category.toLowerCase().includes(lq) ||
        (e.artists || []).some(a => a.toLowerCase().includes(lq))
      );
    }
    if (categoria) list = list.filter(e => e.category === categoria);
    list = list.filter(e => e.price <= priceMax);

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sort === 'date') list = [...list].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    else list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    return list;
  }, [excursions, q, categoria, priceMax, sort, showSoldOut]);

  const setCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams);
    if (cat === categoria) params.delete('categoria');
    else params.set('categoria', cat);
    setSearchParams(params);
  };

  const clearSearch = () => setSearchParams(new URLSearchParams());

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="bg-card border-b border-foreground/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#F97316] text-xs font-bold tracking-widest uppercase mb-2">
            {excursions.filter(e => e.active).length} pacotes disponíveis
          </p>
          <h1 className="font-['Outfit'] font-black text-4xl text-foreground mb-6">
            {q ? `"${q}"` : categoria ? `${CATEGORY_ICONS[categoria]} ${CATEGORY_LABELS[categoria]}` : 'Todos os Pacotes'}
          </h1>
          <form
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const v = fd.get('q') as string;
              const params = new URLSearchParams(searchParams);
              if (v) params.set('q', v); else params.delete('q');
              setSearchParams(params);
            }}
            className="flex gap-2 max-w-lg"
          >
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar evento, artista, cidade…"
              className="flex-1 px-4 py-2.5 rounded-xl bg-foreground/10 border border-foreground/20 text-foreground placeholder-foreground/30 text-sm outline-none focus:border-[#F97316] transition-colors"
            />
            <button type="submit" className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] rounded-xl text-white text-sm font-bold transition-colors">
              Buscar
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-60 flex-shrink-0 space-y-5">
            {/* Category */}
            <div className="bg-card rounded-2xl p-5 border border-foreground/10">
              <h3 className="font-['Outfit'] font-bold text-sm text-foreground/50 uppercase tracking-wide mb-4">Categoria</h3>
              <div className="space-y-1">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                      categoria === key ? 'bg-[#F97316] text-white' : 'text-foreground/50 hover:bg-foreground/10 hover:text-white'
                    }`}
                  >
                    <span>{CATEGORY_ICONS[key]}</span>
                    <span className="flex-1">{label}</span>
                    <span className={`text-xs ${categoria === key ? 'text-foreground/70' : 'text-foreground/20'}`}>
                      {excursions.filter(e => e.active && e.category === key).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="bg-card rounded-2xl p-5 border border-foreground/10">
              <h3 className="font-['Outfit'] font-bold text-sm text-foreground/50 uppercase tracking-wide mb-4">Preço máximo</h3>
              <input type="range" min={200} max={10000} step={100} value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} className="w-full accent-[#F97316]" />
              <div className="flex justify-between text-xs text-foreground/30 mt-2">
                <span>R$ 200</span>
                <span className="text-[#F97316] font-semibold">{priceMax >= 10000 ? 'Qualquer' : `R$ ${priceMax.toLocaleString('pt-BR')}`}</span>
              </div>
            </div>

            {/* Show sold out toggle */}
            <div className="bg-card rounded-2xl p-5 border border-foreground/10">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground/50 text-sm">Mostrar esgotados</span>
                <button
                  onClick={() => setShowSoldOut(v => !v)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${showSoldOut ? 'bg-[#F97316]' : 'bg-foreground/20'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-foreground rounded-full transition-all ${showSoldOut ? 'left-5' : 'left-1'}`} />
                </button>
              </label>
            </div>

            {(q || categoria) && (
              <button onClick={clearSearch} className="w-full py-2.5 rounded-xl border border-dashed border-foreground/20 text-foreground/30 text-sm hover:border-[#F97316]/50 hover:text-[#F97316] transition-colors">
                Limpar filtros
              </button>
            )}
          </aside>

          {/* Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-foreground/40 text-sm">
                <span className="font-semibold text-foreground">{filtered.length}</span> pacotes encontrados
              </p>
              <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-foreground/20 rounded-lg px-3 py-2 text-foreground/70 bg-card outline-none focus:border-[#F97316]">
                <option value="featured">Destaques</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="rating">Mais bem avaliados</option>
                <option value="date">Data mais próxima</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-6xl block mb-4">🎟️</span>
                <h3 className="font-['Outfit'] font-bold text-xl text-foreground mb-2">Nenhum pacote encontrado</h3>
                <p className="text-foreground/30 text-sm mb-6">
                  {q ? <>Ainda não temos excursão para “{q}”. Peça pra gente: juntando o grupo, a gente organiza!</> : 'Tente outros filtros ou veja todos os eventos.'}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => setRequestOpen(true)} className="px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl font-bold text-sm">
                    🚌 Pedir essa excursão
                  </button>
                  <button onClick={clearSearch} className="px-6 py-3 border border-foreground/15 text-foreground/70 hover:bg-foreground/5 rounded-xl font-semibold text-sm">
                    Ver todos
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map(exc => <ExcursionCard key={exc.id} excursion={exc} />)}
                </div>
                <p className="text-center text-foreground/40 text-sm mt-10">
                  Não achou o evento que queria?{' '}
                  <button onClick={() => setRequestOpen(true)} className="text-[#F97316] font-semibold hover:underline">Peça uma excursão →</button>
                </p>
              </>
            )}
            <ExcursionRequestModal open={requestOpen} onClose={() => setRequestOpen(false)} initialEvent={q} />
          </div>
        </div>
      </div>
    </div>
  );
}
