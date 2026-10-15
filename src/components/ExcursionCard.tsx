import { Link } from 'react-router';
import type { Excursion } from '../types';
import { imageUrl, imageFocus } from '../services/api';
import { includedHighlights } from '../utils/includedTags';

function formatDate(dateStr: string) {
  if (!dateStr) return 'A definir';
  return new Date(dateStr.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Cor de destaque de cada categoria (pontinho no selo)
const categoryColors: Record<string, string> = {
  festival: 'bg-purple-400',
  carnaval: 'bg-pink-400',
  reveillon: 'bg-sky-400',
  show: 'bg-orange-400',
  esportes: 'bg-green-400',
  teatro: 'bg-amber-400',
};

const categoryLabels: Record<string, string> = {
  festival: 'Festival',
  carnaval: 'Carnaval',
  reveillon: 'Réveillon',
  show: 'Show',
  esportes: 'Esportes',
  teatro: 'Teatro',
};

const categoryIcons: Record<string, string> = {
  festival: '🎪', carnaval: '🎭', reveillon: '🎆', show: '🎸', esportes: '⚽', teatro: '🎭',
};

export default function ExcursionCard({ excursion }: { excursion: Excursion }) {
  const spotsLeft = excursion.maxSpots - excursion.bookedSpots;
  const isFull = spotsLeft <= 0;
  const isAlmostFull = !isFull && spotsLeft <= 8;

  return (
    <Link
      to={`/excursao/${excursion.slug}`}
      className="group bg-surface rounded-2xl overflow-hidden border border-foreground/10 hover:border-[#F97316]/40 transition-all duration-300 flex flex-col hover:shadow-xl hover:shadow-orange-900/20"
    >
      {/* Image */}
      <div className="relative overflow-hidden h-52 bg-[#222]">
        <img
          src={imageUrl(excursion.image, 600, 400)}
          alt={excursion.title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imageFocus(excursion.imagePosition)}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent" />
        {/* Leve sombra no topo para os selos ficarem legíveis em qualquer foto */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="inline-flex items-center gap-1.5 bg-black/70 backdrop-blur-md text-white text-xs font-semibold pl-2 pr-3 py-1.5 rounded-full border border-foreground/10 shadow-lg shadow-black/30">
            <span className={`w-1.5 h-1.5 rounded-full ${categoryColors[excursion.category] || 'bg-foreground'}`} />
            <span aria-hidden="true">{categoryIcons[excursion.category]}</span>
            {categoryLabels[excursion.category]}
          </span>
        </div>

        {/* Sold out / discount */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {isFull && (
            <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full tracking-wide">
              ESGOTADO
            </span>
          )}
          {!isFull && excursion.originalPrice && (
            <span className="bg-[#F97316] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              −{Math.round((1 - excursion.price / excursion.originalPrice) * 100)}%
            </span>
          )}
          {!isFull && isAlmostFull && (
            <span className="bg-amber-500 text-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              🔥 Últimas vagas
            </span>
          )}
        </div>

        {/* Event date pill */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium border border-foreground/10 shadow-lg shadow-black/30">
            📅 {formatDate(excursion.eventDate)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Event name */}
        <p className="text-[#F97316] text-xs font-bold tracking-wide uppercase mb-1">{excursion.eventName}</p>

        <h3 className="font-['Outfit'] font-bold text-base text-foreground leading-snug group-hover:text-[#F97316] transition-colors mb-2 line-clamp-2">
          {excursion.title}
        </h3>

        {/* Artists */}
        {excursion.artists && excursion.artists.length > 0 && (
          <p className="text-foreground/40 text-xs mb-3 line-clamp-1">
            {excursion.artists.slice(0, 4).join(' · ')}{excursion.artists.length > 4 ? ` +${excursion.artists.length - 4}` : ''}
          </p>
        )}

        {/* Location */}
        <p className="text-foreground/40 text-xs mb-3 flex items-center gap-1">
          📍 {excursion.departureCity} → {excursion.eventCity}
        </p>

        {/* Descrição longa (cai para a curta se não houver) */}
        {(excursion.fullDescription || excursion.description) && (
          <p className="text-foreground/55 text-xs leading-relaxed mb-3 whitespace-pre-line line-clamp-4">
            {(excursion.fullDescription || excursion.description).trim()}
          </p>
        )}

        {/* Ticket type */}
        {excursion.ticketType && (
          <div className="inline-flex items-center gap-1.5 bg-foreground/5 border border-foreground/10 rounded-lg px-2.5 py-1.5 mb-4 w-fit">
            <span className="text-xs text-foreground/60">🎟️</span>
            <span className="text-xs text-foreground/60 font-medium">{excursion.ticketType}</span>
          </div>
        )}

        {/* What's included pills */}
        <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
          {includedHighlights(excursion).map(({ tag }) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F97316]/15 text-[#F97316] font-semibold border border-[#F97316]/20">
              ✓ {tag}
            </span>
          ))}
        </div>

        {/* Spots bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className={isFull ? 'text-red-400 font-bold' : isAlmostFull ? 'text-amber-400 font-semibold' : 'text-foreground/40'}>
              {isFull ? 'Esgotado' : isAlmostFull ? `⚠ ${spotsLeft} vagas restantes` : `${spotsLeft} vagas disponíveis`}
            </span>
            <span className="text-foreground/30">{excursion.bookedSpots}/{excursion.maxSpots}</span>
          </div>
          <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : isAlmostFull ? 'bg-amber-400' : 'bg-[#F97316]'}`}
              style={{ width: `${Math.min(100, (excursion.bookedSpots / excursion.maxSpots) * 100)}%` }}
            />
          </div>
        </div>

        {/* Price + rating */}
        <div className="flex items-end justify-between pt-4 border-t border-foreground/10">
          <div>
            {excursion.originalPrice && !isFull && (
              <p className="text-foreground/30 text-xs line-through">{formatCurrency(excursion.originalPrice)}</p>
            )}
            <p className={`font-['Outfit'] font-black text-xl ${isFull ? 'text-foreground/30' : 'text-foreground'}`}>
              {formatCurrency(excursion.price)}
            </p>
            <p className="text-foreground/30 text-xs">por pessoa</p>
          </div>
          {excursion.reviewCount > 0 ? (
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <span className="text-amber-400 text-sm">★</span>
                <span className="font-semibold text-sm text-foreground">{excursion.rating.toFixed(1)}</span>
              </div>
              <p className="text-foreground/30 text-xs">{excursion.reviewCount} {excursion.reviewCount === 1 ? 'avaliação' : 'avaliações'}</p>
            </div>
          ) : (
            <span className="text-[10px] px-2 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-foreground/40 font-semibold">Novo</span>
          )}
        </div>
      </div>
    </Link>
  );
}
