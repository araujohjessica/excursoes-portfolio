import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { SiteLink, SiteSettings } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../store/SettingsContext';
import Footer from '../../components/Footer';
import NotificationsTab from '../../components/admin/NotificationsTab';
import HowItWorksEditor from '../../components/admin/HowItWorksEditor';

type Tab = 'marca' | 'rodape' | 'redes' | 'comofunciona' | 'notificacoes' | 'seguranca';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'marca', label: 'Marca e contato', icon: '🏷️' },
  { key: 'rodape', label: 'Rodapé', icon: '🧱' },
  { key: 'redes', label: 'Redes sociais', icon: '📱' },
  { key: 'comofunciona', label: 'Como funciona', icon: '📄' },
  { key: 'notificacoes', label: 'Notificações', icon: '🔔' },
  { key: 'seguranca', label: 'Segurança', icon: '🔒' },
];

const input = 'w-full px-4 py-3 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-foreground/5 text-foreground placeholder-foreground/20 transition-colors';
const label = 'text-xs font-semibold text-foreground/30 block mb-1.5 uppercase tracking-wide';
const card = 'bg-card rounded-2xl p-6 border border-foreground/10';

function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={label}>{title}</label>
      {children}
      {hint && <p className="text-foreground/25 text-xs mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-foreground/[0.03] border border-foreground/5 hover:border-foreground/10 text-left">
      <div>
        <p className="text-foreground text-sm font-semibold">{title}</p>
        <p className="text-foreground/30 text-xs">{desc}</p>
      </div>
      <span className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${checked ? 'bg-[#F97316]' : 'bg-foreground/15'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-foreground transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

function LinksEditor({ links, onChange, placeholder }: { links: SiteLink[]; onChange: (l: SiteLink[]) => void; placeholder: string }) {
  const update = (i: number, patch: Partial<SiteLink>) => onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={i} className="flex gap-2 items-center">
          <div className="flex flex-col">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-foreground/30 hover:text-foreground disabled:opacity-20 text-xs leading-none px-1">▲</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === links.length - 1} className="text-foreground/30 hover:text-foreground disabled:opacity-20 text-xs leading-none px-1">▼</button>
          </div>
          <input value={l.label} onChange={e => update(i, { label: e.target.value })} placeholder="Texto" className={`${input} !py-2.5 flex-1`} />
          <input value={l.url} onChange={e => update(i, { url: e.target.value })} placeholder={placeholder} className={`${input} !py-2.5 flex-[1.4] font-mono text-xs`} />
          <button type="button" onClick={() => onChange(links.filter((_, j) => j !== i))} aria-label="Remover"
            className="w-9 h-9 rounded-lg text-foreground/30 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0">✕</button>
        </div>
      ))}
      {links.length < 12 && (
        <button type="button" onClick={() => onChange([...links, { label: '', url: '' }])} className="text-[#F97316] text-sm font-semibold hover:underline">
          + Adicionar link
        </button>
      )}
    </div>
  );
}

const STRENGTH = [
  { label: 'Muito fraca', color: 'bg-red-500' },
  { label: 'Fraca', color: 'bg-red-400' },
  { label: 'Razoável', color: 'bg-amber-400' },
  { label: 'Boa', color: 'bg-lime-400' },
  { label: 'Forte', color: 'bg-green-400' },
  { label: 'Muito forte', color: 'bg-green-500' },
];

function passwordStrength(p: string) {
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return { score, ...STRENGTH[score] };
}

function SecurityTab() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const strength = passwordStrength(form.next);
  const rules = [
    { ok: form.next.length >= 8, text: 'Pelo menos 8 caracteres' },
    { ok: /[A-Za-z]/.test(form.next) && /\d/.test(form.next), text: 'Letras e números' },
    { ok: form.next.length > 0 && form.next === form.confirm, text: 'Confirmação igual à nova senha' },
    { ok: form.next.length > 0 && form.next !== form.current, text: 'Diferente da senha atual' },
  ];
  const valid = form.current && rules.every(r => r.ok);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.changePassword(form.current, form.next);
      setMsg({ ok: true, text: res.message });
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro ao alterar senha' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${card} max-w-lg space-y-4`}>
      <div>
        <h2 className="font-['Outfit'] font-bold text-lg text-foreground">Alterar senha</h2>
        <p className="text-foreground/30 text-sm">Senha usada para entrar na área administrativa.</p>
      </div>
      <Field title="Senha atual">
        <input type={show ? 'text' : 'password'} autoComplete="current-password" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} className={input} />
      </Field>
      <Field title="Nova senha">
        <input type={show ? 'text' : 'password'} autoComplete="new-password" value={form.next} onChange={e => setForm(f => ({ ...f, next: e.target.value }))} className={input} />
        {form.next && strength && (
          <div className="mt-2">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < strength.score ? strength.color : 'bg-foreground/10'}`} />
              ))}
            </div>
            <p className="text-foreground/40 text-xs mt-1">Força: {strength.label}</p>
          </div>
        )}
      </Field>
      <Field title="Confirmar nova senha">
        <input type={show ? 'text' : 'password'} autoComplete="new-password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} className={input} />
      </Field>
      <label className="flex items-center gap-2 text-foreground/40 text-xs cursor-pointer select-none">
        <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} className="accent-[#F97316]" /> Mostrar senhas
      </label>
      <ul className="space-y-1">
        {rules.map(r => (
          <li key={r.text} className={`text-xs flex items-center gap-2 ${r.ok ? 'text-green-400' : 'text-foreground/30'}`}>{r.ok ? '✓' : '○'} {r.text}</li>
        ))}
      </ul>
      {msg && <p className={`text-sm font-semibold ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>}
      <button disabled={!valid || saving} className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-40 text-white font-bold text-sm">
        {saving ? 'Salvando…' : 'Alterar senha'}
      </button>
    </form>
  );
}

export default function AdminConfiguracoes() {
  const { settings, setSettings } = useSettings();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('aba') as Tab) || 'marca';
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Recarrega do servidor ao abrir, para editar sempre a versão mais recente
  useEffect(() => {
    api.getSettings().then(s => { setSettings(s); setDraft(s); }).catch(() => {});
  }, [setSettings]);

  const dirty = useMemo(() => JSON.stringify({ ...draft, updatedAt: null }) !== JSON.stringify({ ...settings, updatedAt: null }), [draft, settings]);

  const set = <K extends keyof SiteSettings>(section: K, patch: Partial<SiteSettings[K]>) =>
    setDraft(d => ({ ...d, [section]: { ...(d[section] as object), ...patch } }));

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const clean: SiteSettings = {
        ...draft,
        footer: {
          ...draft.footer,
          eventsLinks: draft.footer.eventsLinks.filter(l => l.label.trim() && l.url.trim()),
          companyLinks: draft.footer.companyLinks.filter(l => l.label.trim() && l.url.trim()),
        },
        howItWorks: {
          ...draft.howItWorks,
          steps: draft.howItWorks.steps.filter(st => st.title.trim()),
          faq: draft.howItWorks.faq.filter(f => f.question.trim() && f.answer.trim()),
        },
      };
      const saved = await api.saveSettings(clean);
      setSettings(saved);
      setDraft(saved);
      setMsg({ ok: true, text: 'Configurações salvas. O site já está atualizado.' });
    } catch (err) {
      const e = err as Error & { details?: string[] };
      setMsg({ ok: false, text: e.message || 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  };

  const { brand, contact, social, footer } = draft;
  // Abas que usam o salvar geral; a pré-visualização do rodapé só nas abas do rodapé
  const usesSaveBar = tab !== 'seguranca' && tab !== 'notificacoes';
  const showPreview = tab === 'marca' || tab === 'rodape' || tab === 'redes';

  return (
    <div className="min-h-screen bg-background pt-20 pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-['Outfit'] font-black text-3xl text-foreground">Configurações</h1>
        <p className="text-foreground/30 text-sm mt-1 mb-6">
          Informações do site e da sua conta.
          {settings.updatedAt && usesSaveBar && <> Última alteração: {new Date(settings.updatedAt.replace(' ', 'T') + 'Z').toLocaleString('pt-BR')}.</>}
        </p>

        <div className="flex gap-1 border-b border-foreground/10 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setParams(t.key === 'marca' ? {} : { aba: t.key })}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-[#F97316] text-foreground' : 'border-transparent text-foreground/40 hover:text-foreground/70'}`}>
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {tab === 'marca' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className={`${card} space-y-4`}>
              <h2 className="font-['Outfit'] font-bold text-foreground">Marca</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field title="Nome"><input value={brand.name} maxLength={40} onChange={e => set('brand', { name: e.target.value })} className={input} /></Field>
                <Field title="Complemento"><input value={brand.tagline} maxLength={30} onChange={e => set('brand', { tagline: e.target.value })} placeholder="Ex.: Eventos" className={input} /></Field>
              </div>
              <Field title="Descrição" hint={`${brand.description.length}/300 · aparece no rodapé`}>
                <textarea value={brand.description} maxLength={300} rows={3} onChange={e => set('brand', { description: e.target.value })} className={`${input} resize-none`} />
              </Field>
            </div>
            <div className={`${card} space-y-4`}>
              <h2 className="font-['Outfit'] font-bold text-foreground">Contato</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field title="Telefone"><input value={contact.phone} onChange={e => set('contact', { phone: e.target.value })} placeholder="(35) 99999-0000" className={input} /></Field>
                <Field title="Horário"><input value={contact.hours} onChange={e => set('contact', { hours: e.target.value })} placeholder="Seg–Sex, 8h–18h" className={input} /></Field>
              </div>
              <Field title="WhatsApp" hint="Usado em todos os botões de WhatsApp do site">
                <input value={contact.whatsapp} onChange={e => set('contact', { whatsapp: e.target.value })} placeholder="(35) 99999-0000" className={input} />
              </Field>
              <Field title="E-mail"><input type="email" value={contact.email} onChange={e => set('contact', { email: e.target.value })} placeholder="contato@suaempresa.com.br" className={input} /></Field>
              <Field title="Endereço (opcional)"><input value={contact.address} onChange={e => set('contact', { address: e.target.value })} className={input} /></Field>
              <p className="text-foreground/25 text-xs">Campo vazio não aparece no site.</p>
            </div>
          </div>
        )}

        {tab === 'rodape' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className={`${card} space-y-4`}>
              <h2 className="font-['Outfit'] font-bold text-foreground">Coluna de eventos</h2>
              <Field title="Título"><input value={footer.eventsTitle} onChange={e => set('footer', { eventsTitle: e.target.value })} className={input} /></Field>
              <div className="grid grid-cols-2 gap-2">
                {([['auto', 'Automático', 'Próximas excursões ativas'], ['manual', 'Manual', 'Você escolhe os links']] as const).map(([k, t, d]) => (
                  <button key={k} type="button" onClick={() => set('footer', { eventsMode: k })}
                    className={`p-3 rounded-xl border text-left ${footer.eventsMode === k ? 'border-[#F97316] bg-[#F97316]/10' : 'border-foreground/10 hover:bg-foreground/5'}`}>
                    <p className="text-foreground text-sm font-semibold">{t}</p>
                    <p className="text-foreground/40 text-xs">{d}</p>
                  </button>
                ))}
              </div>
              {footer.eventsMode === 'manual' ? (
                <LinksEditor links={footer.eventsLinks} onChange={l => set('footer', { eventsLinks: l })} placeholder="/excursao/nome-do-pacote" />
              ) : (
                <p className="text-foreground/30 text-xs">Mostra até 6 excursões ativas com saída a partir de hoje. Sem excursões, a coluna some.</p>
              )}
            </div>
            <div className={`${card} space-y-4`}>
              <h2 className="font-['Outfit'] font-bold text-foreground">Coluna da empresa</h2>
              <Field title="Título"><input value={footer.companyTitle} onChange={e => set('footer', { companyTitle: e.target.value })} className={input} /></Field>
              <LinksEditor links={footer.companyLinks} onChange={l => set('footer', { companyLinks: l })} placeholder="/excursoes ou https://…" />
              <p className="text-foreground/25 text-xs">Links do próprio site começam com “/”. Externos com “https://”.</p>
            </div>
            <div className={`${card} space-y-4 lg:col-span-2`}>
              <h2 className="font-['Outfit'] font-bold text-foreground">Linha final</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field title="Razão social / nome"><input value={footer.legalName} onChange={e => set('footer', { legalName: e.target.value })} className={input} /></Field>
                <Field title="CNPJ"><input value={footer.cnpj} onChange={e => set('footer', { cnpj: e.target.value })} placeholder="00.000.000/0001-00" className={input} /></Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Toggle checked={footer.showPaymentMethods} onChange={v => set('footer', { showPaymentMethods: v })} title="Formas de pagamento" desc="Mostra “Pix · Cartão de crédito”" />
                <Toggle checked={footer.showAdminLink} onChange={v => set('footer', { showAdminLink: v })} title="Link da área administrativa" desc="Se desligar, acesse por /admin/login" />
              </div>
            </div>
          </div>
        )}

        {tab === 'redes' && (
          <div className={`${card} max-w-2xl space-y-4`}>
            <h2 className="font-['Outfit'] font-bold text-foreground">Redes sociais</h2>
            <p className="text-foreground/30 text-sm -mt-2">Cole o link completo do perfil. Os ícones só aparecem para as redes preenchidas. O WhatsApp usa o número da aba “Marca e contato”.</p>
            {([
              ['instagram', 'Instagram', 'https://instagram.com/seuperfil'],
              ['facebook', 'Facebook', 'https://facebook.com/suapagina'],
              ['youtube', 'YouTube', 'https://youtube.com/@seucanal'],
              ['tiktok', 'TikTok', 'https://tiktok.com/@seuperfil'],
            ] as const).map(([k, l, ph]) => (
              <Field key={k} title={l}>
                <input value={social[k]} onChange={e => set('social', { [k]: e.target.value })} placeholder={ph} className={input} />
              </Field>
            ))}
          </div>
        )}

        {tab === 'comofunciona' && (
          <HowItWorksEditor value={draft.howItWorks} onChange={v => setDraft(d => ({ ...d, howItWorks: v }))} />
        )}
        {tab === 'notificacoes' && <NotificationsTab />}
        {tab === 'seguranca' && <SecurityTab />}

        {showPreview && (
          <div className="mt-8">
            <p className="text-foreground/30 text-xs font-semibold uppercase tracking-wide mb-2">Pré-visualização do rodapé {dirty && <span className="text-[#F97316] normal-case">(alterações não salvas)</span>}</p>
            <div className="rounded-2xl overflow-hidden border border-foreground/10 pointer-events-none select-none">
              <Footer preview={draft} />
            </div>
          </div>
        )}
      </div>

      {/* Barra de salvar */}
      {usesSaveBar && (dirty || msg) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-foreground/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
            <p className={`text-sm ${msg ? (msg.ok ? 'text-green-400' : 'text-red-400') : 'text-foreground/60'}`}>
              {msg ? msg.text : 'Você tem alterações não salvas.'}
            </p>
            <div className="flex gap-2">
              {dirty && <button onClick={() => { setDraft(settings); setMsg(null); }} className="px-4 py-2.5 rounded-xl border border-foreground/15 text-foreground/60 text-sm hover:bg-foreground/5">Descartar</button>}
              {dirty ? (
                <button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-60 text-white font-bold text-sm">{saving ? 'Salvando…' : 'Salvar alterações'}</button>
              ) : (
                <button onClick={() => setMsg(null)} className="px-4 py-2.5 rounded-xl text-foreground/40 text-sm hover:text-foreground">OK</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
