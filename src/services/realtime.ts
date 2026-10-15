import { useEffect, useRef, useState } from 'react';
import { IS_DEMO } from './demo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const WS_URL = new URL(API_URL).origin.replace(/^http/, 'ws') + '/ws';

export type RealtimeEvent = { type: string; [key: string]: unknown };
type Listener = (event: RealtimeEvent) => void;

/** Uma conexão por token, compartilhada por todos os componentes; reconecta sozinha. */
class RealtimeConnection {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private retry = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private closed = false;
  private hadConnection = false;
  connected = false;

  constructor(private token: string) {
    this.open();
  }

  private open() {
    if (this.closed) return;
    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(this.token)}`);
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      this.connected = true;
      // Depois de uma queda, avisa para os componentes buscarem o que perderam
      this.emit({ type: this.hadConnection ? 'reconnected' : 'connected' });
      this.hadConnection = true;
    };
    ws.onmessage = e => {
      try {
        this.emit(JSON.parse(e.data));
      } catch {
        /* ignora */
      }
    };
    ws.onclose = e => {
      this.connected = false;
      this.emit({ type: 'disconnected' });
      if (e.code === 4401 || this.closed) return; // token inválido: não insiste
      const delay = Math.min(30000, 1000 * 2 ** this.retry++);
      this.timer = setTimeout(() => this.open(), delay);
    };
  }

  private emit(event: RealtimeEvent) {
    this.listeners.forEach(l => l(event));
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  get listenerCount() {
    return this.listeners.size;
  }

  send(event: RealtimeEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(event));
  }

  close() {
    this.closed = true;
    clearTimeout(this.timer);
    this.ws?.close();
  }
}

const connections = new Map<string, RealtimeConnection>();

function acquire(token: string) {
  let conn = connections.get(token);
  if (!conn) {
    conn = new RealtimeConnection(token);
    connections.set(token, conn);
  }
  return conn;
}

function release(token: string) {
  const conn = connections.get(token);
  if (conn && conn.listenerCount === 0) {
    conn.close();
    connections.delete(token);
  }
}

/** Assina os eventos em tempo real para `token` (null = desligado). */
export function useRealtime(token: string | null, onEvent: Listener) {
  const handler = useRef(onEvent);
  handler.current = onEvent;
  const [connected, setConnected] = useState(false);
  const connRef = useRef<RealtimeConnection | null>(null);

  useEffect(() => {
    if (!token || IS_DEMO) return; // a demonstração não tem servidor de tempo real
    const conn = acquire(token);
    connRef.current = conn;
    setConnected(conn.connected);
    const unsubscribe = conn.subscribe(e => {
      if (e.type === 'connected' || e.type === 'reconnected') setConnected(true);
      if (e.type === 'disconnected') setConnected(false);
      handler.current(e);
    });
    return () => {
      unsubscribe();
      connRef.current = null;
      // Pequeno atraso evita derrubar a conexão ao trocar de página
      setTimeout(() => release(token), 1000);
    };
  }, [token]);

  return {
    connected,
    send: (event: RealtimeEvent) => connRef.current?.send(event),
  };
}

/** Controla o aviso "digitando…": mostra por alguns segundos a cada evento. */
export function useTypingIndicator(ms = 3000) {
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ping = () => {
    setTyping(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTyping(false), ms);
  };
  const stop = () => {
    clearTimeout(timer.current);
    setTyping(false);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return { typing, ping, stop };
}

/** Limita o envio de "digitando" a no máximo 1 a cada `ms`. */
export function useThrottle(ms = 2000) {
  const last = useRef(0);
  return (fn: () => void) => {
    const now = Date.now();
    if (now - last.current > ms) {
      last.current = now;
      fn();
    }
  };
}
