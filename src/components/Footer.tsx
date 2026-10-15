import { Link } from 'react-router';
import type { SiteLink, SiteSettings } from '../types';
import { useSettings, whatsappUrl } from '../store/SettingsContext';
import { useApp } from '../store/AppContext';

const SOCIAL: { key: keyof SiteSettings['social']; label: string; path: string }[] = [
  { key: 'instagram', label: 'Instagram', path: 'M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.4a6.4 6.4 0 100 12.8 6.4 6.4 0 000-12.8zm0 10.5a4.1 4.1 0 110-8.2 4.1 4.1 0 010 8.2zm6.6-10.8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' },
  { key: 'facebook', label: 'Facebook', path: 'M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0022 12z' },
  { key: 'youtube', label: 'YouTube', path: 'M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z' },
  { key: 'tiktok', label: 'TikTok', path: 'M19.6 6.7a4.8 4.8 0 01-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 11-2.9-2.9c.3 0 .6 0 .9.1V9.4a6.3 6.3 0 105.4 6.3V8.8a8.2 8.2 0 004.8 1.5V6.9l-1-.2z' },
];
const WA_PATH = 'M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8 8 0 01-2.4-1.5 9 9 0 01-1.6-2.1c-.2-.3 0-.5.1-.6l.5-.5.3-.5a.5.5 0 000-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 00-.8.4 3.4 3.4 0 00-1 2.5 5.9 5.9 0 001.2 3.1 13.4 13.4 0 005.2 4.6c.7.3 1.3.5 1.7.6a4.2 4.2 0 001.9.1 3.2 3.2 0 002.1-1.5 2.6 2.6 0 00.2-1.5c-.1-.1-.3-.2-.6-.3zM12 21.8a9.8 9.8 0 01-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1112 21.8zM20.5 3.5A11.8 11.8 0 001.9 17.7L.2 24l6.4-1.7a11.8 11.8 0 0017.7-10.2 11.7 11.7 0 00-3.8-8.6z';

function SmartLink({ link, className }: { link: SiteLink; className: string }) {
  const internal = link.url.startsWith('/') && !link.url.startsWith('//');
  if (internal && !link.url.includes('#')) return <Link to={link.url} className={className}>{link.label}</Link>;
  const external = /^https?:/.test(link.url);
  return <a href={link.url} className={className} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{link.label}</a>;
}

/** Rodapé do site. `preview` permite mostrar configurações ainda não salvas (tela de Configurações). */
export default function Footer({ preview }: { preview?: SiteSettings }) {
  const { settings: saved } = useSettings();
  const { excursions } = useApp();
  const s = preview || saved;
  const { brand, contact, social, footer } = s;

  const today = new Date().toISOString().slice(0, 10);
  const eventLinks: SiteLink[] = footer.eventsMode === 'manual'
    ? footer.eventsLinks
    : excursions
      .filter(e => e.active && (e.departureDate || e.eventDate || '') >= today)
      .sort((a, b) => (a.departureDate || a.eventDate).localeCompare(b.departureDate || b.eventDate))
      .slice(0, 6)
      .map(e => ({ label: e.eventName || e.title, url: `/excursao/${e.slug}` }));

  const wa = whatsappUrl(contact.whatsapp);
  const socials = SOCIAL.filter(x => social[x.key]);
  const contacts = [
    contact.phone && { icon: '📞', line1: contact.phone, line2: contact.hours, href: `tel:${contact.phone.replace(/\D/g, '')}` },
    wa && { icon: '💬', line1: 'WhatsApp', line2: contact.whatsapp, href: wa },
    contact.email && { icon: '✉️', line1: contact.email, href: `mailto:${contact.email}` },
    contact.address && { icon: '📍', line1: contact.address },
  ].filter(Boolean) as { icon: string; line1: string; line2?: string; href?: string }[];

  const linkClass = 'text-white/40 hover:text-white text-sm transition-colors';
  const heading = "font-['Outfit'] font-bold text-xs tracking-widest uppercase text-white/20 mb-5";

  return (
    <footer id="contato" className="theme-dark bg-[#080808] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center text-white font-black text-lg font-['Outfit']">
                {brand.name.charAt(0).toUpperCase() || 'E'}
              </div>
              <div>
                <span className="text-white font-['Outfit'] font-black text-lg leading-none block">{brand.name}</span>
                {brand.tagline && <span className="text-[#F97316] text-xs font-['Outfit'] font-bold tracking-widest uppercase">{brand.tagline}</span>}
              </div>
            </div>
            {brand.description && <p className="text-white/30 text-sm leading-relaxed mb-6">{brand.description}</p>}
            {(socials.length > 0 || wa) && (
              <div className="flex gap-3">
                {socials.map(x => (
                  <a key={x.key} href={social[x.key]} target="_blank" rel="noreferrer" aria-label={x.label} title={x.label}
                    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#F97316]/20 border border-white/10 hover:border-[#F97316]/30 flex items-center justify-center text-white/40 hover:text-[#F97316] transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d={x.path} /></svg>
                  </a>
                ))}
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp" title="WhatsApp"
                    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 flex items-center justify-center text-white/40 hover:text-green-400 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d={WA_PATH} /></svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {eventLinks.length > 0 && (
            <div>
              <h4 className={heading}>{footer.eventsTitle || 'Eventos'}</h4>
              <ul className="space-y-3">
                {eventLinks.map((l, i) => <li key={i}><SmartLink link={l} className={linkClass} /></li>)}
              </ul>
            </div>
          )}

          {footer.companyLinks.length > 0 && (
            <div>
              <h4 className={heading}>{footer.companyTitle || 'Empresa'}</h4>
              <ul className="space-y-3">
                {footer.companyLinks.map((l, i) => <li key={i}><SmartLink link={l} className={linkClass} /></li>)}
              </ul>
            </div>
          )}

          {contacts.length > 0 && (
            <div>
              <h4 className={heading}>Contato</h4>
              <ul className="space-y-4">
                {contacts.map((c, i) => {
                  const body = (
                    <>
                      <span className="text-[#F97316] mt-0.5 flex-shrink-0">{c.icon}</span>
                      <div>
                        <p className="text-white/60 text-sm">{c.line1}</p>
                        {c.line2 && <p className="text-white/20 text-xs">{c.line2}</p>}
                      </div>
                    </>
                  );
                  return (
                    <li key={i}>
                      {c.href ? (
                        <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="flex items-start gap-3 hover:opacity-80">{body}</a>
                      ) : (
                        <div className="flex items-start gap-3">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs text-center md:text-left">
            © {new Date().getFullYear()} {footer.legalName || brand.name}
            {footer.cnpj && <> · CNPJ {footer.cnpj}</>}
            {footer.showAdminLink && <> · <Link to="/admin/login" className="hover:text-[#F97316] transition-colors">Área administrativa</Link></>}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {footer.showPaymentMethods && (
              <div className="flex items-center gap-3 text-white/20 text-xs">
                <span className="font-semibold text-[#32BCAD]">Pix</span>
                <span>·</span>
                <span>Cartão de crédito</span>
              </div>
            )}
            <a
              href="https://github.com/seuusuario"
              target="_blank"
              rel="noreferrer"
              title="JA Developers"
              className="group flex items-center gap-2 text-white/25 hover:text-white text-xs transition-colors"
            >
              <span>Desenvolvido por</span>
              <img
                src="/ja-developers.jpg"
                alt="JA Developers"
                width={24}
                height={24}
                className="w-6 h-6 rounded-full ring-1 ring-white/10 group-hover:ring-[#FFE600] opacity-70 group-hover:opacity-100 transition"
              />
              <span className="font-semibold tracking-wide group-hover:text-[#FFE600] transition-colors">JA Developers</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
