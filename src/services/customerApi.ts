import type { ExcursionRequest, DemandItem, AsaasFees, FinanceSummary, CustomerProfile, CustomerBooking, Message, MessageThread, Review, ReviewStats } from '../types';
import { request } from './api';

const TOKEN_KEY = 'excursoes_customer_token';

export const customerToken = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const asCustomer = <T>(path: string, options: RequestInit = {}) => request<T>(path, options, customerToken.get());

export interface ReviewInput {
  bookingId: string;
  rating: number;
  comment: string;
  displayName?: string;
  city?: string;
}

export const customerApi = {
  requestCode: (email: string) =>
    request<{ message: string; devCode?: string }>('/customer/auth/request-code', { method: 'POST', body: JSON.stringify({ email }) }, null),
  verifyCode: (email: string, code: string) =>
    request<{ token: string; customer: CustomerProfile }>('/customer/auth/verify', { method: 'POST', body: JSON.stringify({ email, code }) }, null),

  me: () => asCustomer<CustomerProfile>('/customer/me'),
  bookings: () => asCustomer<CustomerBooking[]>('/customer/bookings'),
  messages: () => asCustomer<Message[]>('/customer/messages'),
  sendMessage: (body: string, bookingId?: string) =>
    asCustomer<Message>('/customer/messages', { method: 'POST', body: JSON.stringify({ body, bookingId }) }),
  reviews: () => asCustomer<Review[]>('/customer/reviews'),
  createReview: (data: ReviewInput) => asCustomer<Review>('/customer/reviews', { method: 'POST', body: JSON.stringify(data) }),

  requestExcursion: (data: Record<string, string | number>) =>
    request<{ ok: boolean }>('/requests', { method: 'POST', body: JSON.stringify(data) }, null),

  publicReviews: () => request<{ reviews: Review[]; stats: ReviewStats }>('/reviews', {}, null),
};

// Rotas do admin para mensagens e avaliações (usam o token de admin)
export const adminCommsApi = {
  summary: () => request<{ unreadMessages: number; pendingReviews: number; newRequests: number }>('/admin/summary'),
  threads: () => request<MessageThread[]>('/admin/messages'),
  thread: (email: string) => request<Message[]>(`/admin/messages/${encodeURIComponent(email)}`),
  reply: (email: string, body: string) =>
    request<Message>(`/admin/messages/${encodeURIComponent(email)}`, { method: 'POST', body: JSON.stringify({ body }) }),
  reviews: (status?: string) => request<Review[]>(`/admin/reviews${status ? `?status=${status}` : ''}`),
  moderate: (id: number, data: { status?: Review['status']; featured?: boolean }) =>
    request<Review>(`/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteReview: (id: number) => request<void>(`/admin/reviews/${id}`, { method: 'DELETE' }),
  fees: (refresh = false) => request<AsaasFees>(`/admin/finance/fees${refresh ? '?refresh=1' : ''}`),
  requests: (status?: string) =>
    request<{ requests: ExcursionRequest[]; ranking: DemandItem[] }>(`/admin/requests${status ? `?status=${status}` : ''}`),
  updateRequest: (id: number, data: { status?: ExcursionRequest['status']; adminNotes?: string }) =>
    request<ExcursionRequest>(`/admin/requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRequest: (id: number) => request<void>(`/admin/requests/${id}`, { method: 'DELETE' }),
  financeSummary: () => request<FinanceSummary>('/admin/finance/summary'),
};
