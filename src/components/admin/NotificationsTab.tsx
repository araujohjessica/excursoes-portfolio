import { useEffect, useState } from 'react';
import type { NotificationSettings } from '../../types';
import { api } from '../../services/api';

const input = 'w-full px-4 py-3 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-foreground/5 text-foreground placeholder-foreground/20 transition-colors';
const label = 'text-xs font-semibold text-foreground/30 block mb-1.5 uppercase tracking-wide';
const card = 'bg-card rounded-2xl p-6 border border-foreground/10';

const PRESETS = [
  { name: 'Gmail', host: 'smtp.gmail.com', port: 587, hint: 'Use uma “senha de app” do Google (Conta Google → Segurança → Senhas de app). A senha normal não funciona.' },
  { name: 'Outlook / Hotmail', host: 'smtp-mail.outlook.com', port: 587, hint: 'A Microsoft pode bloquear envio por aplicativos. Se o teste falhar, prefira Gmail ou Brevo.' },
  { name: 'Brevo', host: 'smtp-relay.brevo.com', port: 587, hint: 'Usuário e chave SMTP ficam em Brevo → SMTP & API. Grátis até 300 e-mails por dia.' },
  { name: 'Resend', host: 'smtp.resend.com', port: 465, hint: 'Usuário: resend · Senha: sua API key. Precisa de domínio verificado para o remetente.' },
];

const EVENT_ICONS: Record<string, string> = {
  newRequest: '🚌', newMessage: '💬', newBooking: '🧾', bookingPaid: '💰', bookingExpired: '⌛', newReview: '⭐',
};

export default function NotificationsTab() {
  const [data, setData] = useState<NotificationSettings | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api.getNotifications().then(setData).catch(err => setMsg({ ok: false, text: err.message }));
  }, []);

  if (!data) {
    return <div className="py-16 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-foreground/10 border-t-[#F97316] animate-spin" /></div>;
  }

  const update = (patch: Partial<NotificationSettings>) => { setData(d => ({ ...d!, ...patch })); setDirty(true); setMsg(null); };
  const updateSmtp = (patch: Partial<NotificationSettings['smtp']>) => update({ smtp: { ...data.smtp, ...patch } });

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ ok: false, text: 'E-mail inválido' });
    if (data.recipients.includes(email)) return setNewEmail('');
    if (data.recipients.length >= 5) return setMsg({ ok: false, text: 'Máximo de 5 e-mails' });
    update({ recipients: [...data.recipients, email] });
    setNewEmail('');
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const saved = await api.saveNotifications(data);
      setData(saved);
      setDirty(false);
      setMsg({ ok: true, text: 'Notificações salvas.' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setMsg(null);
    try {
      if (dirty) {
        setData(await api.saveNotifications(data));
        setDirty(false);
      }
      const res = await api.testNotifications();
      setMsg({ ok: true, text: `${res.message}. Confira a caixa de entrada (e o spam).` });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro no teste' });
    } finally {
      setTesting(false);
    }
  };

  const preset = PRESETS.find(p => p.host === data.smtp.host);
  const configured = data.smtpSource !== 'none';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Status */}
      <div className={`rounded-2xl p-4 border flex items-start gap-3 ${configured && data.recipients.length ? 'bg-green-500/10 border-green-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
        <span className="text-xl">{configured && data.recipients.length ? '✅' : '⚠️'}</span>
        <div className="text-sm">
          {configured && data.recipients.length ? (
            <p className="text-green-300">Alertas ativos. Enviando para <strong>{data.recipients.join(', ')}</strong>.</p>
          ) : !data.recipients.length ? (
            <p className="text-amber-200">Cadastre um e-mail abaixo para receber os alertas.</p>
          ) : (
            <p className="text-amber-200">Falta configurar o envio (SMTP) abaixo. Enquanto isso, os avisos aparecem só aqui no painel.</p>
          )}
          {data.smtpSource === 'env' && <p className="text-foreground/40 text-xs mt-1">Usando o SMTP do arquivo .env do servidor.</p>}
        </div>
      </div>

      {/* Destinatários */}
      <div className={`${card} space-y-4`}>
        <div>
          <h2 className="font-['Outfit'] font-bold text-foreground">E-mail para receber as notificações</h2>
          <p className="text-foreground/30 text-sm">Até 5 endereços. Não precisa ser o mesmo e-mail de login.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.recipients.map(r => (
            <span key={r} className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-foreground/10 text-foreground text-sm">
              {r}
              <button onClick={() => update({ recipients: data.recipients.filter(x => x !== r) })} aria-label={`Remover ${r}`}
                className="w-5 h-5 rounded-full hover:bg-red-500/30 text-foreground/50 hover:text-white text-xs">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="nome@email.com"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }} className={input} />
          <button onClick={addEmail} className="px-5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground text-sm font-semibold whitespace-nowrap">+ Adicionar</button>
        </div>
      </div>

      {/* Eventos */}
      <div className={`${card} space-y-3`}>
        <div>
          <h2 className="font-['Outfit'] font-bold text-foreground">Quais avisos receber</h2>
          <p className="text-foreground/30 text-sm">Cada e-mail vem com um botão “Ver no site” que abre a tela certa do admin.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {Object.entries(data.eventLabels || {}).map(([key, text]) => {
            const on = Boolean(data.events[key]);
            return (
              <button key={key} type="button" onClick={() => update({ events: { ...data.events, [key]: !on } })}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${on ? 'border-[#F97316]/40 bg-[#F97316]/10' : 'border-foreground/10 hover:bg-foreground/5'}`}>
                <span className="text-lg">{EVENT_ICONS[key]}</span>
                <span className={`flex-1 text-sm ${on ? 'text-foreground' : 'text-foreground/50'}`}>{text}</span>
                <span className={`w-9 h-5 rounded-full relative flex-shrink-0 ${on ? 'bg-[#F97316]' : 'bg-foreground/15'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SMTP */}
      <div className={`${card} space-y-4`}>
        <div>
          <h2 className="font-['Outfit'] font-bold text-foreground">Envio de e-mails (SMTP)</h2>
          <p className="text-foreground/30 text-sm">Conta usada para disparar os e-mails do site: alertas, código de acesso dos clientes e respostas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.name} type="button" onClick={() => updateSmtp({ host: p.host, port: p.port, ...(p.name === 'Resend' ? { user: 'resend' } : {}) })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${data.smtp.host === p.host ? 'border-[#F97316] text-white bg-[#F97316]/10' : 'border-foreground/10 text-foreground/50 hover:bg-foreground/5'}`}>
              {p.name}
            </button>
          ))}
        </div>
        {preset && <p className="text-xs text-foreground/50 bg-foreground/[0.03] rounded-lg px-3 py-2">💡 {preset.hint}</p>}
        <div className="grid sm:grid-cols-[1fr_120px] gap-4">
          <div><label className={label}>Servidor</label><input value={data.smtp.host} onChange={e => updateSmtp({ host: e.target.value })} placeholder="smtp.gmail.com" className={input} /></div>
          <div><label className={label}>Porta</label><input type="number" value={data.smtp.port} onChange={e => updateSmtp({ port: Number(e.target.value) || 587 })} className={input} /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={label}>Usuário</label><input value={data.smtp.user} onChange={e => updateSmtp({ user: e.target.value })} placeholder="seuemail@gmail.com" autoComplete="off" className={input} /></div>
          <div>
            <label className={label}>Senha</label>
            <input type="password" value={data.smtp.pass} onChange={e => updateSmtp({ pass: e.target.value, clearPassword: false })}
              placeholder={data.smtp.hasPassword ? '•••••••• (salva, deixe vazio para manter)' : 'Senha ou chave SMTP'} autoComplete="new-password" className={input} />
            {data.smtp.hasPassword && (
              <button type="button" onClick={() => updateSmtp({ pass: '', clearPassword: true, hasPassword: false })} className="text-red-400/70 hover:text-red-400 text-xs mt-1">Apagar senha salva</button>
            )}
          </div>
        </div>
        <div>
          <label className={label}>Remetente (opcional)</label>
          <input value={data.smtp.from} onChange={e => updateSmtp({ from: e.target.value })} placeholder='Excursões <seuemail@gmail.com>' className={input} />
          <p className="text-foreground/25 text-xs mt-1">Nome e e-mail que aparecem para quem recebe. Vazio = usa o usuário.</p>
        </div>
        <p className="text-foreground/25 text-xs">🔒 A senha fica guardada só no servidor e nunca é exibida de volta.</p>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={saving || !dirty} className="px-6 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-40 text-white font-bold text-sm">
          {saving ? 'Salvando…' : 'Salvar notificações'}
        </button>
        <button onClick={test} disabled={testing} className="px-5 py-3 rounded-xl border border-foreground/15 text-foreground/70 hover:bg-foreground/5 disabled:opacity-50 text-sm font-semibold">
          {testing ? 'Enviando…' : '✉️ Enviar e-mail de teste'}
        </button>
        {msg && <p className={`text-sm ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
