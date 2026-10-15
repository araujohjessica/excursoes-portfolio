import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { CustomerProfile } from '../types';
import { customerApi, customerToken } from '../services/customerApi';
import { ApiError } from '../services/api';
import { useRealtime } from '../services/realtime';

interface CustomerContextType {
  customer: CustomerProfile | null;
  isCustomerLoggedIn: boolean;
  loading: boolean;
  login: (token: string, profile: CustomerProfile) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(customerToken.get()));

  const logout = useCallback(() => {
    customerToken.clear();
    setCustomer(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!customerToken.get()) return;
    try {
      setCustomer(await customerApi.me());
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) logout();
    }
  }, [logout]);

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  // Contador de mensagens não lidas atualizado em tempo real
  useRealtime(customer ? customerToken.get() : null, e => {
    if (e.type === 'unread' && typeof e.count === 'number') {
      setCustomer(c => (c ? { ...c, stats: { ...c.stats, unreadMessages: e.count as number } } : c));
    }
  });

  const login = (token: string, profile: CustomerProfile) => {
    customerToken.set(token);
    setCustomer(profile);
  };

  return (
    <CustomerContext.Provider value={{ customer, isCustomerLoggedIn: Boolean(customer), loading, login, logout, refreshProfile }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
}
