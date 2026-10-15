import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { SiteSettings } from '../types';
import { api } from '../services/api';

// Usado enquanto a API não responde (mesmos valores padrão do backend)
export const FALLBACK_SETTINGS: SiteSettings = {
  brand: { name: 'Excursões', tagline: 'Eventos', description: '' },
  contact: { phone: '', hours: '', whatsapp: '', email: '', address: '' },
  social: { instagram: '', facebook: '', youtube: '', tiktok: '' },
  footer: {
    eventsTitle: 'Eventos', eventsMode: 'auto', eventsLinks: [],
    companyTitle: 'Empresa', companyLinks: [],
    legalName: '', cnpj: '', showPaymentMethods: true, showAdminLink: true,
  },
  howItWorks: { title: 'Como funciona', subtitle: '', steps: [], faq: [], ctaTitle: '', ctaText: '' },
};

interface SettingsContextType {
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK_SETTINGS);
  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);
  return <SettingsContext.Provider value={{ settings, setSettings }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

/** Link do WhatsApp a partir do número configurado (null se não houver). */
export function whatsappUrl(number: string, text?: string) {
  let digits = number.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
