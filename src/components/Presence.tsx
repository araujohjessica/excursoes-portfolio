/** Bolinha de status online/offline. */
export function PresenceDot({ online, className = '' }: { online: boolean; className?: string }) {
  return (
    <span className={`relative inline-flex w-2.5 h-2.5 ${className}`} title={online ? 'Online' : 'Offline'}>
      {online && <span className="absolute inset-0 rounded-full bg-green-400 opacity-60 animate-ping" />}
      <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ring-2 ring-card ${online ? 'bg-green-400' : 'bg-foreground/20'}`} />
    </span>
  );
}

/** "online", "visto há 5 min", "visto ontem às 14:32"… */
export function formatLastSeen(online: boolean, lastSeenAt?: string) {
  if (online) return 'online';
  if (!lastSeenAt) return 'offline';
  const d = new Date(lastSeenAt);
  const diff = Math.max(0, Date.now() - d.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'visto agora há pouco';
  if (min < 60) return `visto há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24 && d.getDate() === new Date().getDate()) return `visto hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return `visto ontem às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  return `visto em ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

/** Três pontinhos animados de "digitando". */
export function TypingBubble({ label }: { label: string }) {
  return (
    <div className="flex justify-start">
      <div className="bg-foreground/10 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
        <span className="flex gap-1">
          {[0, 150, 300].map(d => (
            <span key={d} className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </span>
        <span className="text-foreground/40 text-xs">{label}</span>
      </div>
    </div>
  );
}

/** Aviso discreto quando a conexão em tempo real cai. */
export function ConnectionBanner({ connected }: { connected: boolean }) {
  if (connected) return null;
  return (
    <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
      <span className="w-3 h-3 rounded-full border-2 border-amber-300/40 border-t-amber-300 animate-spin" />
      Reconectando…
    </div>
  );
}
