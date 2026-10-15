import { useState } from 'react';
import { Link } from 'react-router';
import { useSettings, whatsappUrl } from '../store/SettingsContext';

export default function ComoFunciona() {
  const { settings } = useSettings();
  const { howItWorks: h, contact } = settings;
  const [open, setOpen] = useState<number | null>(0);
  const wa = whatsappUrl(contact.whatsapp, 'Olá! Tenho uma dúvida sobre as excursões.');

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Cabeçalho */}
      <section className="relative overflow-hidden border-b border-foreground/10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#F97316]/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          <p className="text-[#F97316] text-xs font-bold tracking-widest uppercase mb-3">Passo a passo</p>
          <h1 className="font-['Outfit'] font-black text-4xl sm:text-5xl text-foreground">{h.title}</h1>
          {h.subtitle && <p className="text-foreground/50 text-base sm:text-lg mt-4 leading-relaxed">{h.subtitle}</p>}
        </div>
      </section>

      {/* Passos */}
      {h.steps.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 py-16">
          <ol className="relative">
            {h.steps.map((step, i) => (
              <li key={i} className="relative flex gap-5 pb-10 last:pb-0">
                {i < h.steps.length - 1 && (
                  <span className="absolute left-6 top-14 bottom-0 w-px bg-gradient-to-b from-[#F97316]/50 to-white/5" aria-hidden="true" />
                )}
                <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/30 flex items-center justify-center text-2xl">
                  {step.icon || '•'}
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#F97316] text-white text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                </div>
                <div className="pt-1.5">
                  <h2 className="font-['Outfit'] font-bold text-xl text-foreground">{step.title}</h2>
                  {step.description && <p className="text-foreground/50 text-sm leading-relaxed mt-1.5 whitespace-pre-line">{step.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Perguntas frequentes */}
      {h.faq.length > 0 && (
        <section className="bg-card border-y border-foreground/10">
          <div className="max-w-3xl mx-auto px-4 py-16">
            <h2 className="font-['Outfit'] font-black text-3xl text-foreground text-center mb-8">Perguntas frequentes</h2>
            <div className="space-y-2">
              {h.faq.map((item, i) => {
                const isOpen = open === i;
                return (
                  <div key={i} className={`rounded-2xl border transition-colors ${isOpen ? 'border-[#F97316]/30 bg-foreground/[0.03]' : 'border-foreground/10'}`}>
                    <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                      <span className="text-foreground font-semibold text-sm sm:text-base">{item.question}</span>
                      <span className={`text-[#F97316] text-xl leading-none transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    {isOpen && <p className="px-5 pb-5 -mt-1 text-foreground/55 text-sm leading-relaxed whitespace-pre-line">{item.answer}</p>}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-foreground/40 text-sm mt-8">
              Ainda com dúvida?{' '}
              {wa ? (
                <a href={wa} target="_blank" rel="noreferrer" className="text-green-400 font-semibold hover:underline">Fale com a gente no WhatsApp</a>
              ) : (
                <Link to="/minha-conta?aba=mensagens" className="text-[#F97316] font-semibold hover:underline">Fale com a gente</Link>
              )}
            </p>
          </div>
        </section>
      )}

      {/* Chamada final */}
      {(h.ctaTitle || h.ctaText) && (
        <section className="max-w-3xl mx-auto px-4 py-16 text-center">
          {h.ctaTitle && <h2 className="font-['Outfit'] font-black text-3xl text-foreground">{h.ctaTitle}</h2>}
          {h.ctaText && <p className="text-foreground/50 mt-2">{h.ctaText}</p>}
          <Link to="/excursoes" className="inline-block mt-6 px-8 py-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold transition-colors shadow-lg shadow-orange-500/25">
            Ver excursões →
          </Link>
        </section>
      )}
    </div>
  );
}
