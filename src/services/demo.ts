// Backend simulado para a versão de demonstração (VITE_DEMO=true).
// Tudo fica em memória + localStorage do navegador: nenhum servidor, banco ou pagamento real.
import type {
  Excursion, Booking, PublicBooking, SiteSettings, NotificationSettings, Review, Message,
  MessageThread, ExcursionRequest, CustomerProfile, CustomerBooking, FinanceSummary, AsaasFees,
} from '../types';

export const IS_DEMO = import.meta.env.VITE_DEMO !== 'false';

const STORE_KEY = 'excursoes_demo_v1';

class DemoError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

interface DemoDb {
  excursions: Excursion[];
  bookings: Booking[];
  settings: SiteSettings;
  notifications: NotificationSettings;
  reviews: Review[];
  messages: (Message & { email: string; name: string })[];
  requests: ExcursionRequest[];
  seq: number;
}

const day = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString();
const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Capa gerada na hora (SVG), para não depender de fotos de terceiros. */
function cover(c1: string, c2: string, emoji: string) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>` +
    `<rect width="800" height="500" fill="url(#g)"/><text x="400" y="290" font-size="140" text-anchor="middle">${emoji}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function makeExcursion(i: number, p: Partial<Excursion> & Pick<Excursion, 'title' | 'category' | 'eventName' | 'price'>): Excursion {
  const eventOffset = 25 + i * 18;
  return {
    id: `demo-exc-${i}`,
    slug: slugify(p.title),
    description: 'Transporte de ida e volta, saída organizada e grupo com monitor.',
    fullDescription:
      'Viaje sem se preocupar com estacionamento, trânsito ou volta para casa. Saída com horário marcado, ônibus executivo com ar-condicionado, monitor durante todo o trajeto e parada para lanche.',
    artists: [],
    image: cover('#1f1f1f', '#7c2d12', '🎟️'),
    imagePosition: 'center',
    gallery: [],
    duration: '1 dia',
    departureCity: 'São Paulo',
    eventCity: 'Rio de Janeiro',
    eventVenue: 'Arena do Evento',
    departureDate: iso(eventOffset),
    returnDate: iso(eventOffset + 1),
    eventDate: iso(eventOffset),
    maxSpots: 46,
    bookedSpots: 12 + i * 5,
    hasTickets: false,
    included: ['Transporte de ida e volta', 'Ônibus com ar-condicionado', 'Monitor no grupo', 'Seguro viagem'],
    notIncluded: ['Ingresso do evento', 'Alimentação'],
    itinerary: [
      { time: '06:00', description: 'Concentração no ponto de encontro' },
      { time: '06:30', description: 'Saída do ônibus' },
      { time: '12:00', description: 'Chegada e tempo livre' },
      { time: '23:00', description: 'Saída para o retorno' },
    ],
    meetingPoint: 'Estação Barra Funda — Portão 3',
    rating: 4.8,
    reviewCount: 24,
    featured: i < 3,
    active: true,
    createdAt: iso(-30 + i),
    ...p,
  };
}

function seed(): DemoDb {
  const excursions: Excursion[] = [
    makeExcursion(0, {
      title: 'Festival Aurora 2026', category: 'festival', eventName: 'Festival Aurora', price: 189,
      originalPrice: 229, eventCity: 'Paulínia', eventVenue: 'Autódromo Aurora', duration: '2 dias',
      artists: ['Banda Horizonte', 'DJ Maré', 'Luna Vega'], hasTickets: true, ticketType: 'Pista',
      image: cover('#4c1d95', '#db2777', '🎪'),
    }),
    makeExcursion(1, {
      title: 'Carnaval Folia da Praia', category: 'carnaval', eventName: 'Folia da Praia', price: 320,
      eventCity: 'Salvador', departureCity: 'Belo Horizonte', duration: '4 dias',
      eventVenue: 'Circuito Barra-Ondina', image: cover('#065f46', '#f59e0b', '🥁'),
    }),
    makeExcursion(2, {
      title: 'Réveillon Praia Grande', category: 'reveillon', eventName: 'Réveillon Praia Grande', price: 150,
      eventCity: 'Praia Grande', eventVenue: 'Orla da Praia', image: cover('#1e3a8a', '#0ea5e9', '🎆'),
    }),
    makeExcursion(3, {
      title: 'Show Noites de Verão', category: 'show', eventName: 'Noites de Verão', price: 120,
      eventCity: 'Campinas', eventVenue: 'Estádio Municipal', artists: ['Cia do Ritmo'],
      image: cover('#7f1d1d', '#f97316', '🎤'),
    }),
    makeExcursion(4, {
      title: 'Clássico no Estádio', category: 'esportes', eventName: 'Clássico Regional', price: 95,
      eventCity: 'Santos', eventVenue: 'Estádio da Vila', image: cover('#14532d', '#84cc16', '⚽'),
    }),
    makeExcursion(5, {
      title: 'Musical Luzes da Cidade', category: 'teatro', eventName: 'Luzes da Cidade', price: 140,
      eventCity: 'São Paulo', departureCity: 'Sorocaba', eventVenue: 'Teatro Central',
      image: cover('#3b0764', '#a855f7', '🎭'),
    }),
  ];

  const paidAt = iso(-3);
  const bookings: Booking[] = [
    {
      id: 'demo-bk-1', excursionId: excursions[0].id, excursionTitle: excursions[0].title,
      customerName: 'Mariana Souza', customerEmail: 'mariana@exemplo.com', customerPhone: '(11) 91234-5678',
      customerCpf: '000.000.000-00', seats: 2, totalAmount: 378, paymentMethod: 'pix', paymentStatus: 'paid',
      installments: 1, bookingDate: iso(-5), paidAt, ticketCode: 'DEMO-AUR-0001', publicToken: 'demo-token-1',
    },
    {
      id: 'demo-bk-2', excursionId: excursions[1].id, excursionTitle: excursions[1].title,
      customerName: 'Rafael Lima', customerEmail: 'rafael@exemplo.com', customerPhone: '(31) 98888-7777',
      customerCpf: '000.000.000-00', seats: 1, totalAmount: 320, paymentMethod: 'credit', paymentStatus: 'pending',
      installments: 4, bookingDate: iso(-1), expiresAt: iso(1), publicToken: 'demo-token-2',
    },
    {
      id: 'demo-bk-3', excursionId: excursions[2].id, excursionTitle: excursions[2].title,
      customerName: 'Camila Rocha', customerEmail: 'camila@exemplo.com', customerPhone: '(13) 97777-6666',
      customerCpf: '000.000.000-00', seats: 3, totalAmount: 450, paymentMethod: 'pix', paymentStatus: 'paid',
      installments: 1, bookingDate: iso(-8), paidAt: iso(-8), ticketCode: 'DEMO-REV-0002', publicToken: 'demo-token-3',
    },
  ];

  const settings: SiteSettings = {
    brand: { name: 'Excursões Demo', tagline: 'Eventos', description: 'Vitrine de demonstração — dados fictícios.' },
    contact: { phone: '(11) 90000-0000', hours: 'Seg a sex, 9h às 18h', whatsapp: '(11) 90000-0000', email: 'contato@exemplo.com', address: 'São Paulo, SP' },
    social: { instagram: '', facebook: '', youtube: '', tiktok: '' },
    footer: {
      eventsTitle: 'Eventos', eventsMode: 'auto', eventsLinks: [],
      companyTitle: 'Empresa',
      companyLinks: [{ label: 'Como funciona', url: '/como-funciona' }],
      legalName: 'Excursões Demo Ltda.', cnpj: '00.000.000/0000-00', showPaymentMethods: true, showAdminLink: true,
    },
    howItWorks: {
      title: 'Como funciona',
      subtitle: 'Do clique ao embarque em quatro passos.',
      steps: [
        { icon: 'search', title: 'Escolha o evento', description: 'Veja as excursões disponíveis e a cidade de saída.' },
        { icon: 'ticket', title: 'Reserve sua vaga', description: 'Informe seus dados e a quantidade de lugares.' },
        { icon: 'credit-card', title: 'Pague com Pix ou cartão', description: 'Nesta demonstração o pagamento é simulado.' },
        { icon: 'bus', title: 'Embarque', description: 'Apresente o código da reserva no ponto de encontro.' },
      ],
      faq: [
        { question: 'Este site é real?', answer: 'Não. É uma demonstração com dados fictícios; nada é cobrado.' },
        { question: 'Posso testar o painel admin?', answer: 'Sim, em /admin com qualquer e-mail e senha.' },
      ],
      ctaTitle: 'Não achou seu evento?',
      ctaText: 'Peça uma excursão e a gente organiza.',
    },
    updatedAt: null,
  };

  const notifications: NotificationSettings = {
    recipients: ['contato@exemplo.com'],
    events: { newBooking: true, paid: true },
    smtp: { host: '', port: 587, user: '', pass: '', from: '', hasPassword: false },
    smtpSource: 'none',
    eventLabels: { newBooking: 'Nova reserva', paid: 'Pagamento confirmado' },
  };

  const reviews: Review[] = [
    {
      id: 1, customerName: 'Mariana S.', customerCity: 'São Paulo', rating: 5, featured: true, status: 'approved',
      comment: 'Tudo no horário, ônibus confortável e monitor atencioso. Voltaria com certeza!',
      excursionTitle: excursions[0].title, eventName: excursions[0].eventName, excursionSlug: excursions[0].slug, createdAt: iso(-6),
      customerEmail: 'mariana@exemplo.com', bookingId: 'demo-bk-1', excursionId: excursions[0].id,
    },
    {
      id: 2, customerName: 'Camila R.', customerCity: 'Santos', rating: 4, featured: false, status: 'approved',
      comment: 'Organização ótima. A volta demorou um pouco, mas valeu muito a pena.',
      excursionTitle: excursions[2].title, excursionSlug: excursions[2].slug, eventName: excursions[2].eventName, createdAt: iso(-9),
      customerEmail: 'camila@exemplo.com', bookingId: 'demo-bk-3', excursionId: excursions[2].id,
    },
    {
      id: 3, customerName: 'Rafael L.', rating: 5, featured: false, status: 'pending',
      comment: 'Primeira vez viajando em grupo e foi muito tranquilo.',
      excursionTitle: excursions[1].title, excursionSlug: excursions[1].slug, eventName: excursions[1].eventName, createdAt: iso(-1),
      customerEmail: 'rafael@exemplo.com', bookingId: 'demo-bk-2', excursionId: excursions[1].id,
    },
  ];

  const messages = [
    { id: 1, sender: 'customer' as const, body: 'Oi! Posso levar uma mala grande?', email: 'mariana@exemplo.com', name: 'Mariana Souza', bookingId: 'demo-bk-1', createdAt: iso(-2) },
    { id: 2, sender: 'admin' as const, body: 'Pode sim, uma mala por pessoa no bagageiro.', email: 'mariana@exemplo.com', name: 'Mariana Souza', readAt: iso(-2), createdAt: iso(-2) },
    { id: 3, sender: 'customer' as const, body: 'Qual o horário exato da saída?', email: 'rafael@exemplo.com', name: 'Rafael Lima', createdAt: iso(-1) },
  ];

  const requests: ExcursionRequest[] = [
    {
      id: 1, name: 'Bruno Alves', email: 'bruno@exemplo.com', phone: '(19) 95555-4444', eventName: 'Festival Aurora',
      eventCity: 'Paulínia', departureCity: 'Campinas', people: 8, message: 'Somos um grupo de amigos.', status: 'new', createdAt: iso(-2),
    },
  ];

  return { excursions, bookings, settings, notifications, reviews, messages, requests, seq: 100 };
}

function load(): DemoDb {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as DemoDb;
  } catch {
    /* sem storage: usa só memória */
  }
  return seed();
}

let db: DemoDb = load();

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(db));
  } catch {
    /* ignora */
  }
}

/** Volta a demonstração ao estado inicial. */
export function resetDemo() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* ignora */
  }
  db = seed();
}

const nextId = () => ++db.seq;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const delay = () => new Promise(r => setTimeout(r, 120));

function fakePix(token: string) {
  const payload = `00020126DEMO-NAO-E-UM-PIX-REAL-${token}`;
  const cells = Array.from({ length: 21 * 21 }, (_, i) => ((i * 7 + token.length * 13 + (i >> 2)) % 3 === 0 ? 1 : 0));
  const rects = cells.map((on, i) => (on ? `<rect x="${(i % 21) * 10}" y="${Math.floor(i / 21) * 10}" width="10" height="10"/>` : '')).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><rect width="210" height="210" fill="#fff"/>${rects}</svg>`;
  return { payload, svg };
}

function toPublic(b: Booking): PublicBooking {
  const exc = db.excursions.find(e => e.id === b.excursionId);
  const pix = b.paymentMethod === 'pix' && b.paymentStatus === 'pending' ? fakePix(b.publicToken || b.id) : null;
  return {
    id: b.id, token: b.publicToken || b.id,
    excursion: {
      title: b.excursionTitle, slug: exc?.slug ?? '', image: exc?.image ?? '',
      eventDate: exc?.eventDate ?? '', departureDate: exc?.departureDate ?? '', meetingPoint: exc?.meetingPoint ?? '',
    },
    customerName: b.customerName, customerEmail: b.customerEmail, seats: b.seats, totalAmount: b.totalAmount,
    paymentMethod: b.paymentMethod, paymentStatus: b.paymentStatus, installments: b.installments,
    bookingDate: b.bookingDate, dueDate: b.dueDate, expiresAt: b.expiresAt, paidAt: b.paidAt, ticketCode: b.ticketCode,
    pixPayload: pix?.payload,
    // a página espera um PNG em base64; aqui é um SVG, então vai como data URL já pronta pelo adaptador de imagem
    pixQrImage: pix ? btoa(pix.svg) : undefined,
  };
}

function markPaid(b: Booking) {
  b.paymentStatus = 'paid';
  b.paidAt = new Date().toISOString();
  b.ticketCode = b.ticketCode || `DEMO-${String(nextId()).padStart(4, '0')}`;
}

function recount() {
  for (const e of db.excursions) {
    e.bookedSpots = db.bookings
      .filter(b => b.excursionId === e.id && b.paymentStatus !== 'cancelled' && b.paymentStatus !== 'refunded')
      .reduce((n, b) => n + b.seats, 0) + (e.id.startsWith('demo-exc-') ? 10 : 0);
  }
}

function financeSummary(): FinanceSummary {
  const paid = db.bookings.filter(b => b.paymentStatus === 'paid');
  const byMethod: FinanceSummary['byMethod'] = {};
  let gross = 0;
  let fees = 0;
  for (const b of paid) {
    const fee = b.paymentMethod === 'pix' ? 1.99 : +(b.totalAmount * 0.0399 + 0.49).toFixed(2);
    gross += b.totalAmount;
    fees += fee;
    const m = (byMethod[b.paymentMethod] ??= { count: 0, gross: 0, fees: 0 });
    m.count++;
    m.gross += b.totalAmount;
    m.fees += fee;
  }
  return { paidBookings: paid.length, gross, fees, net: gross - fees, estimatedCount: 0, pixDiscountGiven: 0, byMethod, balance: gross - fees };
}

const demoFees: AsaasFees = {
  fetchedAt: new Date().toISOString(), environment: 'sandbox',
  pix: { type: 'FIXED', fee: 1.99, defaultFee: 1.99, percentageFee: null, minimumFee: null, maximumFee: null, discountUntil: null, monthlyFree: 30, usedThisMonth: 2, daysToReceive: 1 },
  creditCard: { operationFee: 0.49, daysToReceive: 30, discountUntil: null, tiers: [{ label: 'À vista', minInstallments: 1, maxInstallments: 1, percentage: 2.99, defaultPercentage: 2.99 }, { label: '2 a 6x', minInstallments: 2, maxInstallments: 6, percentage: 3.49, defaultPercentage: 3.49 }] },
  anticipation: { creditCardSingleMonthlyPercentage: 1.15, creditCardInstallmentMonthlyPercentage: 1.7 },
  transfer: { monthlyFree: 30, pixFee: 0, pixCountsInFree: true, tedFee: 3.49, tedCountsInFree: false },
  notifications: { sms: 0.99, whatsApp: null, voice: null, messaging: null, postal: null },
  other: { invoice: null, dunning: null },
};

type Handler = (m: RegExpMatchArray, body: any, query: URLSearchParams) => unknown;
const routes: { method: string; re: RegExp; run: Handler }[] = [];
const route = (method: string, pattern: string, run: Handler) =>
  routes.push({ method, re: new RegExp(`^${pattern}$`), run });

// ----- autenticação do admin -----
route('POST', '/auth/login', (_m, b) => {
  if (!b?.email || !b?.password) throw new DemoError('Informe e-mail e senha.', 401);
  return { token: 'demo-admin-token', user: { id: 1, name: 'Admin Demo', email: String(b.email) } };
});
route('GET', '/auth/me', () => ({ id: 1, name: 'Admin Demo', email: 'admin@demo.com' }));
route('POST', '/auth/change-password', () => ({ message: 'Senha alterada (demonstração).' }));

// ----- configurações -----
route('GET', '/settings', () => db.settings);
route('PUT', '/settings', (_m, b) => { db.settings = { ...b, updatedAt: new Date().toISOString() }; save(); return db.settings; });
route('GET', '/settings/notifications', () => db.notifications);
route('PUT', '/settings/notifications', (_m, b) => { db.notifications = { ...b, smtp: { ...b.smtp, pass: '', hasPassword: false } }; save(); return db.notifications; });
route('POST', '/settings/notifications/test', () => ({ message: 'Demonstração: nenhum e-mail foi enviado.' }));

// ----- excursões -----
route('GET', '/excursions', () => db.excursions.filter(e => e.active));
route('GET', '/excursions/admin/all', () => db.excursions);
route('POST', '/excursions', (_m, b) => {
  const n = nextId();
  const e: Excursion = { ...b, id: `demo-exc-${n}`, slug: `${slugify(b.title || 'excursao')}-${n}`, bookedSpots: 0, createdAt: new Date().toISOString() };
  db.excursions.unshift(e);
  save();
  return e;
});
route('PUT', '/excursions/([^/]+)', (m, b) => {
  const i = db.excursions.findIndex(e => e.id === m[1]);
  if (i < 0) throw new DemoError('Excursão não encontrada.', 404);
  db.excursions[i] = { ...db.excursions[i], ...b };
  save();
  return db.excursions[i];
});
route('DELETE', '/excursions/([^/]+)', m => {
  db.excursions = db.excursions.filter(e => e.id !== m[1]);
  db.bookings = db.bookings.filter(b => b.excursionId !== m[1]);
  save();
  return undefined;
});

// ----- reservas -----
route('GET', '/bookings', () => db.bookings);
route('POST', '/bookings', (_m, b) => {
  const exc = db.excursions.find(e => e.id === b.excursionId);
  if (!exc) throw new DemoError('Excursão não encontrada.', 404);
  if (exc.maxSpots - exc.bookedSpots < b.seats) throw new DemoError('Não há vagas suficientes.', 409);
  const n = nextId();
  const booking: Booking = {
    id: `demo-bk-${n}`, excursionId: exc.id, excursionTitle: exc.title,
    customerName: b.customerName, customerEmail: b.customerEmail, customerPhone: b.customerPhone, customerCpf: b.customerCpf,
    seats: b.seats, totalAmount: exc.price * b.seats * (b.paymentMethod === 'pix' ? 0.95 : 1),
    paymentMethod: b.paymentMethod, paymentStatus: b.paymentMethod === 'credit' ? 'paid' : 'pending',
    installments: b.installments, bookingDate: new Date().toISOString(), expiresAt: iso(1), publicToken: `demo-token-${n}`,
  };
  if (booking.paymentMethod === 'credit') markPaid(booking);
  db.bookings.unshift(booking);
  recount();
  save();
  return toPublic(booking);
});
route('GET', '/bookings/public/([^/]+)', m => {
  const b = db.bookings.find(x => x.publicToken === decodeURIComponent(m[1]));
  if (!b) throw new DemoError('Reserva não encontrada.', 404);
  // Na demonstração, o Pix "é confirmado" alguns segundos depois de aberto, para mostrar o fluxo completo.
  if (b.paymentMethod === 'pix' && b.paymentStatus === 'pending' && Date.now() - new Date(b.bookingDate).getTime() > 20_000) {
    markPaid(b);
    save();
  }
  return toPublic(b);
});
route('POST', '/bookings/([^/]+)/sync', m => {
  const b = db.bookings.find(x => x.id === m[1]);
  if (!b) throw new DemoError('Reserva não encontrada.', 404);
  return b;
});
route('PATCH', '/bookings/([^/]+)/status', (m, body) => {
  const b = db.bookings.find(x => x.id === m[1]);
  if (!b) throw new DemoError('Reserva não encontrada.', 404);
  if (body.paymentStatus === 'paid') markPaid(b);
  else b.paymentStatus = body.paymentStatus;
  recount();
  save();
  return b;
});

// ----- área do cliente -----
const customerEmail = () => localStorage.getItem('excursoes_demo_customer') || 'mariana@exemplo.com';
const customerName = () => db.bookings.find(b => b.customerEmail === customerEmail())?.customerName || 'Cliente Demo';

function profile(): CustomerProfile {
  const mine = db.bookings.filter(b => b.customerEmail === customerEmail());
  return {
    name: customerName(), email: customerEmail(), phone: mine[0]?.customerPhone || '',
    stats: {
      bookings: mine.length, paid: mine.filter(b => b.paymentStatus === 'paid').length,
      pending: mine.filter(b => b.paymentStatus === 'pending').length,
      unreadMessages: db.messages.filter(m => m.email === customerEmail() && m.sender === 'admin' && !m.readAt).length,
    },
  };
}

route('POST', '/customer/auth/request-code', (_m, b) => {
  try { localStorage.setItem('excursoes_demo_customer', String(b.email).toLowerCase()); } catch { /* ignora */ }
  return { message: 'Demonstração: use o código 123456.', devCode: '123456' };
});
route('POST', '/customer/auth/verify', () => ({ token: 'demo-customer-token', customer: profile() }));
route('GET', '/customer/me', () => profile());
route('GET', '/customer/bookings', () => {
  return db.bookings.filter(b => b.customerEmail === customerEmail()).map<CustomerBooking>(b => {
    const e = db.excursions.find(x => x.id === b.excursionId) ?? db.excursions[0];
    const r = db.reviews.find(x => x.bookingId === b.id);
    return {
      id: b.id, paymentToken: b.publicToken || b.id, seats: b.seats, totalAmount: b.totalAmount,
      paymentMethod: b.paymentMethod, paymentStatus: b.paymentStatus, installments: b.installments,
      bookingDate: b.bookingDate, dueDate: b.dueDate, expiresAt: b.expiresAt, paidAt: b.paidAt, ticketCode: b.ticketCode,
      excursion: {
        title: e.title, slug: e.slug, image: e.image, eventName: e.eventName, eventCity: e.eventCity,
        eventVenue: e.eventVenue, departureCity: e.departureCity, eventDate: e.eventDate, departureDate: e.departureDate,
        returnDate: e.returnDate, duration: e.duration, meetingPoint: e.meetingPoint, ticketType: e.ticketType,
        itinerary: e.itinerary, included: e.included, notIncluded: e.notIncluded,
      },
      review: r ? { status: r.status ?? 'pending', rating: r.rating } : null,
      canReview: b.paymentStatus === 'paid' && !r,
    };
  });
});
route('GET', '/customer/messages', () => {
  db.messages.forEach(m => { if (m.email === customerEmail() && m.sender === 'admin') m.readAt ??= new Date().toISOString(); });
  return db.messages.filter(m => m.email === customerEmail());
});
route('POST', '/customer/messages', (_m, b) => {
  const msg = { id: nextId(), sender: 'customer' as const, body: b.body, bookingId: b.bookingId, email: customerEmail(), name: customerName(), createdAt: new Date().toISOString() };
  db.messages.push(msg);
  save();
  return msg;
});
route('GET', '/customer/reviews', () => db.reviews.filter(r => r.customerEmail === customerEmail()));
route('POST', '/customer/reviews', (_m, b) => {
  const bk = db.bookings.find(x => x.id === b.bookingId);
  const e = db.excursions.find(x => x.id === bk?.excursionId);
  const r: Review = {
    id: nextId(), customerName: b.displayName || customerName(), customerCity: b.city, rating: b.rating, comment: b.comment,
    excursionTitle: e?.title ?? '', eventName: e?.eventName ?? '', excursionSlug: e?.slug ?? '', featured: false, status: 'pending',
    createdAt: new Date().toISOString(), customerEmail: customerEmail(), bookingId: b.bookingId, excursionId: e?.id,
  };
  db.reviews.unshift(r);
  save();
  return r;
});
route('POST', '/requests', (_m, b) => {
  db.requests.unshift({
    id: nextId(), name: String(b.name ?? ''), email: String(b.email ?? ''), phone: String(b.phone ?? ''),
    eventName: String(b.eventName ?? ''), eventCity: b.eventCity ? String(b.eventCity) : undefined,
    eventDate: b.eventDate ? String(b.eventDate) : undefined, departureCity: b.departureCity ? String(b.departureCity) : undefined,
    people: Number(b.people) || 1, message: b.message ? String(b.message) : undefined, status: 'new', createdAt: new Date().toISOString(),
  });
  save();
  return { ok: true };
});
route('GET', '/reviews', () => {
  const approved = db.reviews.filter(r => r.status === 'approved').map(({ customerEmail: _e, bookingId: _b, excursionId: _x, status: _s, ...rest }) => rest);
  const avg = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : null;
  return {
    reviews: approved,
    stats: { reviews: approved.length, averageRating: avg, recommendPercent: approved.length ? 96 : null, travelers: db.bookings.reduce((n, b) => n + b.seats, 0), trips: db.excursions.length },
  };
});

// ----- admin: mensagens, avaliações, pedidos, financeiro -----
route('GET', '/admin/summary', () => ({
  unreadMessages: db.messages.filter(m => m.sender === 'customer' && !m.readAt).length,
  pendingReviews: db.reviews.filter(r => r.status === 'pending').length,
  newRequests: db.requests.filter(r => r.status === 'new').length,
}));
route('GET', '/admin/messages', () => {
  const by = new Map<string, MessageThread>();
  for (const m of db.messages) {
    const t = by.get(m.email);
    by.set(m.email, {
      email: m.email, name: m.name, unread: (t?.unread ?? 0) + (m.sender === 'customer' && !m.readAt ? 1 : 0),
      lastMessage: m,
    });
  }
  return [...by.values()].sort((a, b) => b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt));
});
route('GET', '/admin/messages/([^/]+)', m => {
  const email = decodeURIComponent(m[1]);
  db.messages.forEach(x => { if (x.email === email && x.sender === 'customer') x.readAt ??= new Date().toISOString(); });
  save();
  return db.messages.filter(x => x.email === email);
});
route('POST', '/admin/messages/([^/]+)', (m, b) => {
  const email = decodeURIComponent(m[1]);
  const name = db.messages.find(x => x.email === email)?.name ?? email;
  const msg = { id: nextId(), sender: 'admin' as const, body: b.body, email, name, createdAt: new Date().toISOString() };
  db.messages.push(msg);
  save();
  return msg;
});
route('GET', '/admin/reviews', (_m, _b, q) => {
  const s = q.get('status');
  return s ? db.reviews.filter(r => r.status === s) : db.reviews;
});
route('PATCH', '/admin/reviews/(\\d+)', (m, b) => {
  const r = db.reviews.find(x => x.id === Number(m[1]));
  if (!r) throw new DemoError('Avaliação não encontrada.', 404);
  Object.assign(r, b);
  save();
  return r;
});
route('DELETE', '/admin/reviews/(\\d+)', m => { db.reviews = db.reviews.filter(r => r.id !== Number(m[1])); save(); return undefined; });
route('GET', '/admin/finance/fees', () => demoFees);
route('GET', '/admin/finance/summary', () => financeSummary());
route('GET', '/admin/requests', (_m, _b, q) => {
  const s = q.get('status');
  const list = s ? db.requests.filter(r => r.status === s) : db.requests;
  const rank = new Map<string, { eventName: string; requests: number; people: number; departureCities: string[] }>();
  for (const r of db.requests) {
    const k = rank.get(r.eventName) ?? { eventName: r.eventName, requests: 0, people: 0, departureCities: [] };
    k.requests++;
    k.people += r.people;
    if (r.departureCity && !k.departureCities.includes(r.departureCity)) k.departureCities.push(r.departureCity);
    rank.set(r.eventName, k);
  }
  return { requests: list, ranking: [...rank.values()].sort((a, b) => b.requests - a.requests) };
});
route('PATCH', '/admin/requests/(\\d+)', (m, b) => {
  const r = db.requests.find(x => x.id === Number(m[1]));
  if (!r) throw new DemoError('Pedido não encontrado.', 404);
  Object.assign(r, b, { updatedAt: new Date().toISOString() });
  save();
  return r;
});
route('DELETE', '/admin/requests/(\\d+)', m => { db.requests = db.requests.filter(r => r.id !== Number(m[1])); save(); return undefined; });

/** Responde uma chamada da API como se fosse o servidor. Lança `{status, message}` em caso de erro. */
export async function demoRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  await delay();
  const [pathname, search = ''] = path.split('?');
  const method = (options.method || 'GET').toUpperCase();
  let body: unknown;
  try { body = options.body ? JSON.parse(String(options.body)) : undefined; } catch { body = undefined; }
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = pathname.match(r.re);
    if (m) return clone(r.run(m, body, new URLSearchParams(search))) as T;
  }
  throw new DemoError(`Rota indisponível na demonstração: ${method} ${pathname}`, 404);
}

export { DemoError };
