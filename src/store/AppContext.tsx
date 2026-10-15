import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Excursion, Booking, PublicBooking } from '../types';
import { api, tokenStorage, ApiError, type ExcursionInput, type BookingInput } from '../services/api';

interface AppContextType {
  excursions: Excursion[];
  bookings: Booking[];
  isAdminLoggedIn: boolean;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  addExcursion: (e: ExcursionInput) => Promise<Excursion>;
  updateExcursion: (id: string, e: Partial<ExcursionInput>) => Promise<Excursion>;
  deleteExcursion: (id: string) => Promise<void>;
  addBooking: (b: BookingInput) => Promise<PublicBooking>;
  updateBookingStatus: (id: string, status: Booking['paymentStatus']) => Promise<Booking | null>;
  syncBooking: (id: string) => Promise<Booking | null>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(Boolean(tokenStorage.get()));
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');

  const adminLogout = useCallback(() => {
    tokenStorage.clear();
    setIsAdminLoggedIn(false);
    setBookings([]);
    api.listExcursions().then(setExcursions).catch(() => {});
  }, []);

  const loadData = useCallback(async (asAdmin: boolean) => {
    if (asAdmin) {
      try {
        const [all, bks] = await Promise.all([api.listAllExcursions(), api.listBookings()]);
        setExcursions(all);
        setBookings(bks);
        return;
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 401)) throw err;
        tokenStorage.clear();
        setIsAdminLoggedIn(false);
      }
    }
    setExcursions(await api.listExcursions());
  }, []);

  useEffect(() => {
    loadData(Boolean(tokenStorage.get()))
      .catch(() => setLoadError('Não foi possível conectar ao servidor.'))
      .finally(() => setReady(true));
  }, [loadData]);

  const adminLogin = async (email: string, password: string) => {
    try {
      const { token } = await api.login(email, password);
      tokenStorage.set(token);
      setIsAdminLoggedIn(true);
      await loadData(true);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return false;
      throw err;
    }
  };

  const addExcursion = async (data: ExcursionInput) => {
    const created = await api.createExcursion(data);
    setExcursions(prev => [created, ...prev]);
    return created;
  };

  const updateExcursion = async (id: string, data: Partial<ExcursionInput>) => {
    const updated = await api.updateExcursion(id, data);
    setExcursions(prev => prev.map(x => (x.id === id ? updated : x)));
    return updated;
  };

  const deleteExcursion = async (id: string) => {
    await api.deleteExcursion(id);
    setExcursions(prev => prev.filter(x => x.id !== id));
    setBookings(prev => prev.filter(b => b.excursionId !== id));
  };

  const refreshExcursions = () =>
    (isAdminLoggedIn ? api.listAllExcursions() : api.listExcursions()).then(setExcursions).catch(() => {});

  const addBooking = async (data: BookingInput) => {
    const created = await api.createBooking(data);
    if (isAdminLoggedIn) api.listBookings().then(setBookings).catch(() => {});
    refreshExcursions();
    return created;
  };

  const updateBookingStatus = async (id: string, status: Booking['paymentStatus']) => {
    try {
      const updated = await api.updateBookingStatus(id, status);
      setBookings(prev => prev.map(b => (b.id === id ? updated : b)));
      refreshExcursions();
      return updated;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar reserva');
      return null;
    }
  };

  const syncBooking = async (id: string) => {
    try {
      const updated = await api.syncBooking(id);
      setBookings(prev => prev.map(b => (b.id === id ? updated : b)));
      refreshExcursions();
      return updated;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao consultar o Asaas');
      return null;
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-foreground/10 border-t-[#F97316] animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center px-4">
        <div>
          <p className="text-foreground font-bold text-xl mb-2">{loadError}</p>
          <button onClick={() => location.reload()} className="text-[#F97316] hover:underline">Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      excursions, bookings, isAdminLoggedIn,
      adminLogin, adminLogout,
      addExcursion, updateExcursion, deleteExcursion,
      addBooking, updateBookingStatus, syncBooking,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
