export type Category = 'festival' | 'carnaval' | 'reveillon' | 'show' | 'esportes' | 'teatro';

export interface Excursion {
  id: string;
  title: string;
  slug: string;
  description: string;
  fullDescription: string;
  category: Category;
  eventName: string;
  artists?: string[];
  image: string;
  /** Parte da foto que fica visível quando ela é recortada. */
  imagePosition?: 'top' | 'center' | 'bottom';
  gallery: string[];
  price: number;
  originalPrice?: number;
  duration: string;
  departureCity: string;
  eventCity: string;
  eventVenue: string;
  departureDate: string;
  returnDate: string;
  eventDate: string;
  maxSpots: number;
  bookedSpots: number;
  hasTickets: boolean;
  ticketType?: string;
  included: string[];
  notIncluded: string[];
  itinerary: { time: string; description: string }[];
  meetingPoint: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  active: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  excursionId: string;
  excursionTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf: string;
  seats: number;
  totalAmount: number;
  paymentMethod: 'pix' | 'credit' | 'debit' | 'boleto';
  paymentStatus: 'pending' | 'paid' | 'cancelled' | 'refunded';
  installments: number;
  bookingDate: string;
  dueDate?: string;
  expiresAt?: string;
  paidAt?: string;
  ticketCode?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  asaasPaymentId?: string;
  asaasStatus?: string;
  publicToken?: string;
}

/** Reserva vista pelo cliente na página de pagamento. */
export interface PublicBooking {
  id: string;
  token: string;
  excursion: {
    title: string;
    slug: string;
    image: string;
    eventDate: string;
    departureDate: string;
    meetingPoint: string;
  };
  customerName: string;
  customerEmail: string;
  seats: number;
  totalAmount: number;
  paymentMethod: Booking['paymentMethod'];
  paymentStatus: Booking['paymentStatus'];
  installments: number;
  bookingDate: string;
  dueDate?: string;
  expiresAt?: string;
  paidAt?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixPayload?: string;
  pixQrImage?: string;
  ticketCode?: string;
}

export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  stats: { bookings: number; paid: number; pending: number; unreadMessages: number };
}

export interface CustomerBooking {
  id: string;
  paymentToken: string;
  seats: number;
  totalAmount: number;
  paymentMethod: Booking['paymentMethod'];
  paymentStatus: Booking['paymentStatus'];
  installments: number;
  bookingDate: string;
  dueDate?: string;
  expiresAt?: string;
  paidAt?: string;
  ticketCode?: string;
  excursion: {
    title: string;
    slug: string;
    image: string;
    eventName: string;
    eventCity: string;
    eventVenue: string;
    departureCity: string;
    eventDate: string;
    departureDate: string;
    returnDate: string;
    duration: string;
    meetingPoint: string;
    ticketType?: string;
    itinerary: { time: string; description: string }[];
    included: string[];
    notIncluded: string[];
  };
  review: { status: Review['status']; rating: number } | null;
  canReview: boolean;
}

export interface Message {
  id: number;
  sender: 'customer' | 'admin';
  body: string;
  bookingId?: string;
  readAt?: string;
  createdAt: string;
}

export interface MessageThread {
  email: string;
  name: string;
  phone?: string;
  unread: number;
  online?: boolean;
  lastSeenAt?: string;
  lastMessage: Message;
}

export interface Review {
  id: number;
  customerName: string;
  customerCity?: string;
  rating: number;
  comment: string;
  excursionTitle: string;
  eventName: string;
  excursionSlug: string;
  featured: boolean;
  createdAt: string;
  // Campos presentes só para o próprio cliente e para o admin
  status?: 'pending' | 'approved' | 'rejected';
  customerEmail?: string;
  bookingId?: string;
  excursionId?: string;
}

export interface ReviewStats {
  reviews: number;
  averageRating: number | null;
  recommendPercent: number | null;
  travelers: number;
  trips: number;
}

export interface AsaasFees {
  fetchedAt: string;
  environment: 'sandbox' | 'production';
  pix: {
    type: string;
    fee: number;
    defaultFee: number;
    percentageFee: number | null;
    minimumFee: number | null;
    maximumFee: number | null;
    discountUntil: string | null;
    monthlyFree: number;
    usedThisMonth: number;
    daysToReceive: number;
  };
  creditCard: {
    operationFee: number;
    daysToReceive: number;
    discountUntil: string | null;
    tiers: { label: string; minInstallments: number; maxInstallments: number; percentage: number; defaultPercentage: number }[];
  };
  anticipation: { creditCardSingleMonthlyPercentage: number | null; creditCardInstallmentMonthlyPercentage: number | null };
  transfer: { monthlyFree: number; pixFee: number | null; pixCountsInFree: boolean; tedFee: number | null; tedCountsInFree: boolean };
  notifications: { sms: number | null; whatsApp: number | null; voice: number | null; messaging: number | null; postal: number | null };
  other: { invoice: number | null; dunning: number | null };
}

export interface FinanceSummary {
  paidBookings: number;
  gross: number;
  fees: number;
  net: number;
  estimatedCount: number;
  pixDiscountGiven: number;
  byMethod: Record<string, { count: number; gross: number; fees: number }>;
  balance: number | null;
}

export interface ExcursionRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  eventName: string;
  eventCity?: string;
  eventDate?: string;
  departureCity?: string;
  people: number;
  message?: string;
  status: 'new' | 'contacted' | 'planned' | 'archived';
  adminNotes?: string;
  updatedAt?: string;
  createdAt: string;
}

export interface DemandItem {
  eventName: string;
  requests: number;
  people: number;
  departureCities: string[];
}

export interface SiteLink {
  label: string;
  url: string;
}

export interface SiteSettings {
  brand: { name: string; tagline: string; description: string };
  contact: { phone: string; hours: string; whatsapp: string; email: string; address: string };
  social: { instagram: string; facebook: string; youtube: string; tiktok: string };
  footer: {
    eventsTitle: string;
    eventsMode: 'auto' | 'manual';
    eventsLinks: SiteLink[];
    companyTitle: string;
    companyLinks: SiteLink[];
    legalName: string;
    cnpj: string;
    showPaymentMethods: boolean;
    showAdminLink: boolean;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: { icon: string; title: string; description: string }[];
    faq: { question: string; answer: string }[];
    ctaTitle: string;
    ctaText: string;
  };
  updatedAt?: string | null;
}

export interface NotificationSettings {
  recipients: string[];
  events: Record<string, boolean>;
  smtp: { host: string; port: number; user: string; pass: string; from: string; hasPassword?: boolean; clearPassword?: boolean };
  smtpSource?: 'painel' | 'env' | 'none';
  eventLabels?: Record<string, string>;
}
