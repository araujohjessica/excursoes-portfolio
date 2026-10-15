import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import type { Message, MessageThread } from '../../types';
import { adminCommsApi } from '../../services/customerApi';
import { useApp } from '../../store/AppContext';
import { tokenStorage } from '../../services/api';
import { useRealtime, useTypingIndicator, useThrottle } from '../../services/realtime';
import { PresenceDot, TypingBubble, ConnectionBanner, formatLastSeen } from '../../components/Presence';

const formatDateTime = (d: string) =>
  new Date(d.replace(' ', 'T') + (d.includes('Z') ? '' : 'Z')).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function AdminMensagens() {
  const { bookings } = useApp();
  const [params, setParams] = useSearchParams();
  const selected = params.get('cliente');
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});
  const [typingEmail, setTypingEmail] = useState<string | null>(null);
  const typing = useTypingIndicator();
  const throttle = useThrottle();
  const endRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const loadThreads = useCallback(() => adminCommsApi.threads().then(list => {
    setThreads(list);
    setOnline(new Set(list.filter(t => t.online).map(t => t.email)));
  }).catch(() => {}), []);
  const loadThread = useCallback((email: string) => adminCommsApi.thread(email).then(m => {
    if (selectedRef.current === email) setMessages(m);
  }).catch(() => {}), []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  useEffect(() => {
    setMessages([]);
    typing.stop();
    if (selected) loadThread(selected).then(loadThreads);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const { connected, send: sendEvent } = useRealtime(tokenStorage.get(), e => {
    const email = e.email as string | undefined;
    switch (e.type) {
      case 'reconnected':
        loadThreads();
        if (selectedRef.current) loadThread(selectedRef.current);
        break;
      case 'presence:list':
        setOnline(new Set(e.online as string[]));
        break;
      case 'presence':
        setOnline(prev => {
          const next = new Set(prev);
          if (e.online) next.add(email!); else next.delete(email!);
          return next;
        });
        if (!e.online && e.lastSeenAt) setLastSeen(prev => ({ ...prev, [email!]: e.lastSeenAt as string }));
        break;
      case 'typing':
        if (e.from === 'customer' && email) {
          setTypingEmail(email);
          if (email === selectedRef.current) typing.ping();
          setTimeout(() => setTypingEmail(t => (t === email ? null : t)), 3000);
        }
        break;
      case 'message:new': {
        const msg = e.message as Message;
        if (email === selectedRef.current) {
          if (msg.sender === 'customer') {
            typing.stop();
            loadThread(email); // buscar marca como lida
          } else {
            setMessages(m => (m.some(x => x.id === msg.id) ? m : [...m, msg]));
          }
        }
        loadThreads();
        break;
      }
      case 'message:read':
        if (e.reader === 'customer' && email === selectedRef.current) {
          setMessages(m => m.map(x => (x.sender === 'admin' && !x.readAt ? { ...x, readAt: new Date().toISOString() } : x)));
        }
        break;
    }
  });

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [messages.length, selected, typing.typing]);

  const isOnline = (email: string) => online.has(email);
  const seenLabel = (t?: MessageThread, email?: string) =>
    formatLastSeen(isOnline(email || ''), (email && lastSeen[email]) || t?.lastSeenAt);

  const thread = threads.find(t => t.email === selected);
  const customerBookings = bookings.filter(b => b.customerEmail === selected);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !body.trim()) return;
    setSending(true);
    try {
      const msg = await adminCommsApi.reply(selected, body.trim());
      setMessages(m => (m.some(x => x.id === msg.id) ? m : [...m, msg]));
      setBody('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  const filtered = threads
    .filter(t => !search || `${t.name} ${t.email}`.toLowerCase().includes(search.toLowerCase()));
  const onlineCount = threads.filter(t => isOnline(t.email)).length;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-['Outfit'] font-black text-3xl text-foreground mb-1">Mensagens</h1>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <p className="text-foreground/30 text-sm">Conversas com os clientes da área “Minha conta”.</p>
          <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${connected ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-300'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-amber-300 animate-pulse'}`} />
            {connected ? 'Tempo real ativo' : 'Reconectando…'}
          </span>
          {onlineCount > 0 && <span className="text-xs text-foreground/40">{onlineCount} cliente{onlineCount > 1 ? 's' : ''} online</span>}
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[520px]">
          {/* Threads */}
          <div className={`bg-card border border-foreground/10 rounded-2xl flex flex-col overflow-hidden ${selected ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-3 border-b border-foreground/10">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente…"
                className="w-full px-3 py-2 rounded-lg border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-foreground/5 text-foreground placeholder-foreground/20" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {!filtered.length && <p className="text-foreground/30 text-sm text-center py-10">Nenhuma conversa ainda.</p>}
              {filtered.map(t => (
                <button key={t.email} onClick={() => setParams({ cliente: t.email })}
                  className={`w-full text-left px-4 py-3 border-b border-foreground/5 hover:bg-foreground/5 ${selected === t.email ? 'bg-foreground/5' : ''}`}>
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/70 text-xs font-bold">
                        {t.name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <PresenceDot online={isOnline(t.email)} className="absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-sm truncate ${t.unread ? 'text-foreground font-bold' : 'text-foreground/70 font-semibold'}`}>{t.name}</p>
                        <span className="text-foreground/20 text-[10px] flex-shrink-0">{formatDateTime(t.lastMessage.createdAt)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2 mt-0.5">
                        {typingEmail === t.email ? (
                          <p className="text-[#F97316] text-xs">digitando…</p>
                        ) : (
                          <p className="text-foreground/30 text-xs truncate">{t.lastMessage.sender === 'admin' ? 'Você: ' : ''}{t.lastMessage.body}</p>
                        )}
                        {t.unread > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F97316] text-white font-bold flex-shrink-0">{t.unread}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className={`bg-card border border-foreground/10 rounded-2xl flex-col overflow-hidden ${selected ? 'flex' : 'hidden lg:flex'}`}>
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-foreground/30 text-sm">Selecione uma conversa</div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-foreground/10 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <button onClick={() => setParams({})} className="lg:hidden text-foreground/40 text-xs mb-1">← Conversas</button>
                    <div className="flex items-center gap-2">
                      <PresenceDot online={isOnline(selected)} />
                      <p className="text-foreground font-semibold truncate">{thread?.name || selected}</p>
                    </div>
                    <p className="text-xs truncate">
                      <span className={typing.typing ? 'text-[#F97316]' : isOnline(selected) ? 'text-green-400' : 'text-foreground/30'}>
                        {typing.typing ? 'digitando…' : seenLabel(thread, selected)}
                      </span>
                      <span className="text-foreground/30"> · {selected}{thread?.phone ? ` · ${thread.phone}` : ''}</span>
                    </p>
                  </div>
                  {thread?.phone && (
                    <a href={`https://wa.me/55${thread.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/30 whitespace-nowrap">💬 WhatsApp</a>
                  )}
                </div>
                {customerBookings.length > 0 && (
                  <div className="px-5 py-2 border-b border-foreground/5 flex gap-2 overflow-x-auto">
                    {customerBookings.map(b => (
                      <span key={b.id} className="text-[11px] whitespace-nowrap px-2 py-1 rounded-md bg-foreground/5 text-foreground/50">
                        <span className="font-mono text-[#F97316]">{b.id}</span> · {b.excursionTitle} · {b.paymentStatus === 'paid' ? 'Pago' : b.paymentStatus === 'pending' ? 'Pendente' : b.paymentStatus === 'cancelled' ? 'Cancelado' : 'Reembolsado'}
                      </span>
                    ))}
                  </div>
                )}
                <ConnectionBanner connected={connected} />
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.sender === 'admin' ? 'bg-[#F97316] text-white rounded-br-sm' : 'bg-foreground/10 text-white rounded-bl-sm'}`}>
                        {m.bookingId && <p className="text-[10px] font-mono mb-1 opacity-70">Sobre {m.bookingId}</p>}
                        <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                        <p className="text-[10px] mt-1 text-right opacity-60 flex items-center justify-end gap-1">
                          {formatDateTime(m.createdAt)}
                          {m.sender === 'admin' && <span className={m.readAt ? 'opacity-100 font-bold' : ''} title={m.readAt ? 'Lida' : 'Enviada'}>{m.readAt ? '✓✓' : '✓'}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                  {typing.typing && <TypingBubble label={`${(thread?.name || 'Cliente').split(' ')[0]} está digitando`} />}
                  <div ref={endRef} />
                </div>
                <form onSubmit={send} className="border-t border-foreground/10 p-4 flex gap-2">
                  <textarea value={body} rows={2} maxLength={2000}
                    placeholder={isOnline(selected) ? 'Responder… (cliente online, vê na hora)' : 'Responder… (cliente offline, será avisado por e-mail)'}
                    onChange={e => { setBody(e.target.value); if (e.target.value && selected) throttle(() => sendEvent({ type: 'typing', email: selected })); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-foreground/5 text-foreground placeholder-foreground/20 resize-none" />
                  <button disabled={sending || !body.trim()} className="px-5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 text-white font-bold text-sm">
                    {sending ? '…' : 'Enviar'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
