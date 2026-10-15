import type { Excursion, Booking, PublicBooking, SiteSettings, NotificationSettings } from '../types';
import { IS_DEMO, demoRequest, DemoError } from './demo';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const TOKEN_KEY = 'excursoes_admin_token';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function request<T>(path: string, options: RequestInit = {}, token: string | null = tokenStorage.get()): Promise<T> {
  if (IS_DEMO) {
    try {
      return await demoRequest<T>(path, options);
    } catch (err) {
      if (err instanceof DemoError) throw new ApiError(err.message, err.status);
      throw err;
    }
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = Array.isArray(data.details) && data.details.length ? `: ${data.details.join('; ')}` : '';
    throw new ApiError((data.message || 'Erro ao comunicar com o servidor') + details, res.status);
  }
  return data as T;
}

export type ExcursionInput = Omit<Excursion, 'id' | 'slug' | 'createdAt' | 'bookedSpots'>;

export interface BookingInput {
  excursionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf: string;
  seats: number;
  paymentMethod: Extract<Booking['paymentMethod'], 'pix' | 'credit'>;
  installments: number;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: number; name: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ id: number; name: string; email: string }>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  getSettings: () => request<SiteSettings>('/settings', {}, null),
  getNotifications: () => request<NotificationSettings>('/settings/notifications'),
  saveNotifications: (data: NotificationSettings) =>
    request<NotificationSettings>('/settings/notifications', { method: 'PUT', body: JSON.stringify(data) }),
  testNotifications: () => request<{ message: string }>('/settings/notifications/test', { method: 'POST' }),
  saveSettings: (data: SiteSettings) => request<SiteSettings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  listExcursions: () => request<Excursion[]>('/excursions'),
  listAllExcursions: () => request<Excursion[]>('/excursions/admin/all'),
  createExcursion: (data: ExcursionInput) =>
    request<Excursion>('/excursions', { method: 'POST', body: JSON.stringify(data) }),
  updateExcursion: (id: string, data: Partial<ExcursionInput>) =>
    request<Excursion>(`/excursions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExcursion: (id: string) => request<void>(`/excursions/${id}`, { method: 'DELETE' }),

  createBooking: (data: BookingInput) =>
    request<PublicBooking>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getPublicBooking: (token: string) => request<PublicBooking>(`/bookings/public/${encodeURIComponent(token)}`),
  syncBooking: (id: string) => request<Booking>(`/bookings/${id}/sync`, { method: 'POST' }),
  listBookings: () => request<Booking[]>('/bookings'),
  updateBookingStatus: (id: string, paymentStatus: Booking['paymentStatus']) =>
    request<Booking>(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ paymentStatus }) }),
};

const API_ORIGIN = new URL(BASE_URL).origin;

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f1f1f"/><stop offset="1" stop-color="#3a1d08"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><text x="400" y="270" font-size="72" text-anchor="middle">🎟️</text></svg>'
  );

/** Resolve a URL de imagem (upload local ou externa) e aplica redimensionamento quando é Unsplash. */
export function imageUrl(src: string | undefined, w?: number, h?: number) {
  if (!src) return PLACEHOLDER_IMAGE;
  const url = src.startsWith('/uploads/') ? `${API_ORIGIN}${src}` : src;
  if (w && h && url.includes('images.unsplash.com')) {
    return `${url}${url.includes('?') ? '&' : '?'}w=${w}&h=${h}&fit=crop`;
  }
  return url;
}

export async function uploadImages(files: File[]): Promise<string[]> {
  if (IS_DEMO) {
    // Sem servidor: a imagem fica como data URL no navegador
    return Promise.all(files.map(f => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new ApiError('Erro ao ler a imagem', 400));
      reader.readAsDataURL(f);
    })));
  }
  const body = new FormData();
  files.forEach(f => body.append('images', f));
  const token = tokenStorage.get();
  const res = await fetch(`${BASE_URL}/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || 'Erro ao enviar imagem', res.status);
  return data.urls;
}

/** Classe Tailwind de enquadramento da foto (ponto de foco escolhido no cadastro). */
export function imageFocus(position?: string) {
  return position === 'top' ? 'object-top' : position === 'bottom' ? 'object-bottom' : 'object-center';
}
