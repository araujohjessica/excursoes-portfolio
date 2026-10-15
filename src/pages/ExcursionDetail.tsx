import { useState } from 'react';
import { useSettings, whatsappUrl } from '../store/SettingsContext';
import { includedHighlights } from '../utils/includedTags';
import { useParams, Link, useNavigate } from 'react-router';
import { useApp } from '../store/AppContext';
import { imageUrl, imageFocus } from '../services/api';

function formatDate(d: string) {
  if (!d) return 'A definir';
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ExcursionDetail() {
  const { slug } = useParams();
  const { excursions } = useApp();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [seats, setSeats] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);

  const exc = excursions.find(e => e.slug === slug);
  if (!exc) return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-20 text-center px-4">
      <div>
        <p className="text-6xl mb-4">🎟️</p>
        <h2 className="font-['Outfit'] font-bold text-2xl text-foreground mb-2">Pacote não encontrado</h2>
        <Link to="/excursoes" className="text-[#F97316] hover:underline">Ver todos os pacotes</Link>
      </div>
    </div>
  );

  const spotsLeft = exc.maxSpots - exc.bookedSpots;
  const highlights = includedHighlights(exc);
  const isFull = spotsLeft <= 0;
  const total = exc.price * seats;
  const pixTotal = total * 0.95;

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero image */}
      <div className="relative h-72 sm:h-96 bg-[#111] overflow-hidden">
        <img
          src={imageUrl(exc.gallery[imgIndex] || exc.image, 1400, 600)}
          alt={exc.title}
          className={`w-full h-full object-cover opacity-70 ${!exc.gallery[imgIndex] || exc.gallery[imgIndex] === exc.image ? imageFocus(exc.imagePosition) : 'object-center'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        {exc.gallery.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {exc.gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${imgIndex === i ? 'bg-[#F97316]' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
        {exc.gallery.length > 1 && (
          <>
            <button onClick={() => setImgIndex(i => Math.max(0, i - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">←</button>
            <button onClick={() => setImgIndex(i => Math.min(exc.gallery.length - 1, i + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">→</button>
          </>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-foreground/30 mb-6 relative z-10">
          <Link to="/" className="hover:text-[#F97316]">Início</Link>
          <span>/</span>
          <Link to="/excursoes" className="hover:text-[#F97316]">Pacotes</Link>
          <span>/</span>
          <span className="text-foreground/60 truncate">{exc.eventName}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title block */}
            <div className="bg-card rounded-2xl p-7 border border-foreground/10">
              <p className="text-[#F97316] text-xs font-bold tracking-widest uppercase mb-2">{exc.eventName}</p>
              <h1 className="font-['Outfit'] font-black text-3xl sm:text-4xl text-foreground mb-4 leading-tight">
                {exc.title}
              </h1>

              {/* Artists */}
              {exc.artists && exc.artists.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {exc.artists.map(a => (
                    <span key={a} className="bg-foreground/10 text-foreground/70 text-xs px-3 py-1 rounded-full border border-foreground/10">
                      🎵 {a}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/40">
                <span>📍 {exc.departureCity} → {exc.eventCity}</span>
                {exc.duration && <span>⏱ {exc.duration}</span>}
                {exc.reviewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-amber-400">★</span>
                    <strong className="text-foreground">{exc.rating.toFixed(1)}</strong>
                    <span>({exc.reviewCount} {exc.reviewCount === 1 ? 'avaliação' : 'avaliações'})</span>
                  </span>
                )}
              </div>
            </div>

            {/* Event info grid */}
            <div className="bg-card rounded-2xl p-7 border border-foreground/10">
              <h2 className="font-['Outfit'] font-bold text-lg text-foreground mb-5">Detalhes do evento</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Data do evento', value: formatDate(exc.eventDate), icon: '🎪' },
                  { label: 'Local', value: exc.eventVenue, icon: '📍' },
                  { label: 'Cidade', value: exc.eventCity, icon: '🏙️' },
                  { label: 'Saída em', value: formatDate(exc.departureDate), icon: '🚌' },
                  { label: 'Retorno', value: formatDate(exc.returnDate), icon: '🏠' },
                  { label: 'Duração', value: exc.duration, icon: '⏱' },
                ].map(info => (
                  <div key={info.label} className="bg-foreground/5 rounded-xl p-4">
                    <p className="text-foreground/30 text-xs mb-1">{info.icon} {info.label}</p>
                    <p className="font-semibold text-sm text-foreground">{info.value}</p>
                  </div>
                ))}
              </div>

              {exc.ticketType && (
                <div className="mt-4 flex items-center gap-3 bg-[#F97316]/10 border border-[#F97316]/20 rounded-xl p-4">
                  <span className="text-2xl">🎟️</span>
                  <div>
                    <p className="text-[#F97316] text-xs font-bold uppercase tracking-wide">Tipo de ingresso incluso</p>
                    <p className="text-foreground font-semibold text-sm mt-0.5">{exc.ticketType}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-card rounded-2xl p-7 border border-foreground/10">
              <h2 className="font-['Outfit'] font-bold text-lg text-foreground mb-4">Sobre o pacote</h2>
              <p className="text-foreground/50 leading-relaxed text-sm">{exc.fullDescription}</p>
            </div>

            {/* Itinerary */}
            <div className="bg-card rounded-2xl p-7 border border-foreground/10">
              <h2 className="font-['Outfit'] font-bold text-lg text-foreground mb-5">Roteiro</h2>
              <div className="space-y-4">
                {exc.itinerary.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-9 rounded-lg bg-[#F97316]/20 text-[#F97316] flex items-center justify-center text-xs font-black flex-shrink-0 border border-[#F97316]/30">
                        {item.time}
                      </div>
                      {i < exc.itinerary.length - 1 && <div className="w-px h-6 bg-foreground/10 mt-2" />}
                    </div>
                    <div className="pt-1.5">
                      <p className="text-foreground/60 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Included / Not Included */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-card rounded-2xl p-7 border border-foreground/10">
                <h2 className="font-['Outfit'] font-bold text-base text-foreground mb-4 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Incluso no pacote
                </h2>
                <ul className="space-y-2.5">
                  {exc.included.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/50">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card rounded-2xl p-7 border border-foreground/10">
                <h2 className="font-['Outfit'] font-bold text-base text-foreground mb-4 flex items-center gap-2">
                  <span className="text-red-400">✗</span> Não incluso
                </h2>
                <ul className="space-y-2.5">
                  {exc.notIncluded.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/30">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Meeting point */}
            <div className="bg-[#F97316]/10 border border-[#F97316]/20 rounded-2xl p-6">
              <h2 className="font-['Outfit'] font-bold text-base text-foreground mb-2">📍 Ponto de saída</h2>
              <p className="text-foreground/60 text-sm">{exc.meetingPoint}</p>
            </div>
          </div>

          {/* RIGHT — Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card rounded-2xl p-7 border border-foreground/10 shadow-2xl shadow-black/50">
                <div className="mb-5">
                  {exc.originalPrice && !isFull && (
                    <p className="text-foreground/30 text-sm line-through">{formatCurrency(exc.originalPrice)}</p>
                  )}
                  <p className={`font-['Outfit'] font-black text-4xl ${isFull ? 'text-foreground/30' : 'text-foreground'}`}>
                    {formatCurrency(exc.price)}
                  </p>
                  <p className="text-foreground/40 text-sm">por pessoa · tudo incluso</p>
                </div>

                {/* Spots */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={isFull ? 'text-red-400 font-bold' : spotsLeft <= 8 ? 'text-amber-400 font-semibold' : 'text-foreground/40'}>
                      {isFull ? '🔴 Esgotado' : spotsLeft <= 8 ? `🔥 ${spotsLeft} vagas restantes` : `${spotsLeft} vagas disponíveis`}
                    </span>
                    <span className="text-foreground/20">{exc.bookedSpots}/{exc.maxSpots}</span>
                  </div>
                  <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-[#F97316]'}`}
                      style={{ width: `${Math.min(100, (exc.bookedSpots / exc.maxSpots) * 100)}%` }}
                    />
                  </div>
                </div>

                {!isFull && (
                  <>
                    {/* Seat selector */}
                    <div className="mb-5">
                      <label className="text-xs font-semibold text-foreground/40 block mb-2 uppercase tracking-wide">Pessoas</label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setSeats(s => Math.max(1, s - 1))} className="w-10 h-10 rounded-lg bg-foreground/10 text-white font-bold hover:bg-[#F97316] transition-colors flex items-center justify-center">−</button>
                        <span className="flex-1 text-center font-['Outfit'] font-black text-2xl text-foreground">{seats}</span>
                        <button onClick={() => setSeats(s => Math.min(spotsLeft, s + 1))} className="w-10 h-10 rounded-lg bg-foreground/10 text-white font-bold hover:bg-[#F97316] transition-colors flex items-center justify-center">+</button>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4 mb-5 space-y-2">
                      <div className="flex justify-between text-sm text-foreground/40">
                        <span>{formatCurrency(exc.price)} × {seats}</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-400">
                        <span>Pix (−5%)</span>
                        <span>{formatCurrency(pixTotal)}</span>
                      </div>
                      <div className="border-t border-foreground/10 pt-2 flex justify-between font-['Outfit'] font-black text-foreground">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/checkout/${exc.slug}?seats=${seats}`)}
                      className="w-full py-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-base transition-colors shadow-xl shadow-orange-900/40"
                    >
                      Garantir vaga →
                    </button>

                    <p className="text-center text-foreground/20 text-xs mt-3">🔒 Pagamento seguro{exc.hasTickets ? ' · Ingresso digital por e-mail' : ' · Confirmação por e-mail'}</p>
                  </>
                )}

                {isFull && (
                  <div className="text-center py-4">
                    <p className="text-red-400 font-bold mb-3">Este pacote está esgotado</p>
                    <a href={whatsappUrl(settings.contact.whatsapp, `Olá! Quero entrar na lista de espera de: ${exc.title}`) || '/minha-conta?aba=mensagens'} target="_blank" rel="noreferrer" className="block w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors">
                      💬 Entrar na lista de espera
                    </a>
                  </div>
                )}
              </div>

              {/* What's included summary */}
              {highlights.length > 0 && (
                <div className="bg-card rounded-2xl p-5 border border-foreground/10">
                  <p className="text-foreground/40 text-xs font-semibold uppercase tracking-wide mb-3">Incluso neste pacote</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {highlights.map(i => (
                      <div key={i.tag} className="bg-foreground/5 rounded-xl p-3">
                        <span className="text-xl block mb-1">{i.icon}</span>
                        <p className="text-foreground/50 text-xs">{i.tag}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <a href={whatsappUrl(settings.contact.whatsapp, `Olá! Tenho uma dúvida sobre: ${exc.title}`) || '/minha-conta?aba=mensagens'} target="_blank" rel="noreferrer" className="block text-center p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-colors">
                💬 Dúvidas? Fale no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
