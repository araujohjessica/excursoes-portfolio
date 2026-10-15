import { IS_DEMO } from '../../services/demo';
import type { SiteSettings } from '../../types';

type HowItWorks = SiteSettings['howItWorks'];

const input = 'w-full px-4 py-3 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-foreground/5 text-foreground placeholder-foreground/20 transition-colors';
const label = 'text-xs font-semibold text-foreground/30 block mb-1.5 uppercase tracking-wide';
const card = 'bg-card rounded-2xl p-6 border border-foreground/10';

function move<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function ItemControls({ index, total, onMove, onRemove }: { index: number; total: number; onMove: (d: -1 | 1) => void; onRemove: () => void }) {
  const btn = 'w-8 h-8 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/10 disabled:opacity-20 disabled:hover:bg-transparent';
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(-1)} aria-label="Subir">▲</button>
      <button type="button" className={btn} disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Descer">▼</button>
      <button type="button" className="w-8 h-8 rounded-lg text-foreground/30 hover:text-red-400 hover:bg-red-500/10" onClick={onRemove} aria-label="Remover">✕</button>
    </div>
  );
}

export default function HowItWorksEditor({ value, onChange }: { value: HowItWorks; onChange: (v: HowItWorks) => void }) {
  const set = (patch: Partial<HowItWorks>) => onChange({ ...value, ...patch });
  const setStep = (i: number, patch: Partial<HowItWorks['steps'][number]>) =>
    set({ steps: value.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const setFaq = (i: number, patch: Partial<HowItWorks['faq'][number]>) =>
    set({ faq: value.faq.map((f, j) => (j === i ? { ...f, ...patch } : f)) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-foreground/30 text-sm">Conteúdo da página <span className="font-mono text-foreground/50">/como-funciona</span>.</p>
        <a href={IS_DEMO ? '#/como-funciona' : '/como-funciona'} target="_blank" rel="noreferrer" className="text-[#F97316] text-sm font-semibold hover:underline whitespace-nowrap">Abrir página ↗</a>
      </div>

      <div className={`${card} space-y-4`}>
        <h2 className="font-['Outfit'] font-bold text-foreground">Cabeçalho</h2>
        <div>
          <label className={label}>Título</label>
          <input value={value.title} maxLength={80} onChange={e => set({ title: e.target.value })} className={input} />
        </div>
        <div>
          <label className={label}>Subtítulo</label>
          <textarea value={value.subtitle} maxLength={300} rows={2} onChange={e => set({ subtitle: e.target.value })} className={`${input} resize-none`} />
        </div>
      </div>

      <div className={`${card} space-y-4`}>
        <div className="flex items-center justify-between">
          <h2 className="font-['Outfit'] font-bold text-foreground">Passos <span className="text-foreground/30 font-normal text-sm">({value.steps.length}/10)</span></h2>
        </div>
        {value.steps.map((step, i) => (
          <div key={i} className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#F97316] text-xs font-bold uppercase tracking-wide">Passo {i + 1}</span>
              <ItemControls index={i} total={value.steps.length}
                onMove={d => set({ steps: move(value.steps, i, d) })}
                onRemove={() => set({ steps: value.steps.filter((_, j) => j !== i) })} />
            </div>
            <div className="grid grid-cols-[72px_1fr] gap-3">
              <div>
                <label className={label}>Ícone</label>
                <input value={step.icon} maxLength={8} onChange={e => setStep(i, { icon: e.target.value })} className={`${input} text-center text-xl !px-2`} placeholder="🚌" />
              </div>
              <div>
                <label className={label}>Título</label>
                <input value={step.title} maxLength={80} onChange={e => setStep(i, { title: e.target.value })} className={input} />
              </div>
            </div>
            <div>
              <label className={label}>Descrição</label>
              <textarea value={step.description} maxLength={500} rows={2} onChange={e => setStep(i, { description: e.target.value })} className={`${input} resize-y`} />
            </div>
          </div>
        ))}
        {value.steps.length < 10 && (
          <button type="button" onClick={() => set({ steps: [...value.steps, { icon: '✨', title: '', description: '' }] })}
            className="w-full py-3 rounded-xl border-2 border-dashed border-foreground/10 hover:border-[#F97316] text-foreground/40 hover:text-[#F97316] text-sm font-semibold">
            + Adicionar passo
          </button>
        )}
        <p className="text-foreground/25 text-xs">Dica: no ícone, cole um emoji (no Mac, Ctrl+Cmd+Espaço abre o seletor).</p>
      </div>

      <div className={`${card} space-y-4`}>
        <h2 className="font-['Outfit'] font-bold text-foreground">Perguntas frequentes <span className="text-foreground/30 font-normal text-sm">({value.faq.length}/30)</span></h2>
        {value.faq.map((item, i) => (
          <div key={i} className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <label className={label}>Pergunta</label>
                <input value={item.question} maxLength={200} onChange={e => setFaq(i, { question: e.target.value })} className={input} />
              </div>
              <div className="pt-6">
                <ItemControls index={i} total={value.faq.length}
                  onMove={d => set({ faq: move(value.faq, i, d) })}
                  onRemove={() => set({ faq: value.faq.filter((_, j) => j !== i) })} />
              </div>
            </div>
            <div>
              <label className={label}>Resposta</label>
              <textarea value={item.answer} maxLength={1500} rows={3} onChange={e => setFaq(i, { answer: e.target.value })} className={`${input} resize-y`} />
            </div>
          </div>
        ))}
        {value.faq.length < 30 && (
          <button type="button" onClick={() => set({ faq: [...value.faq, { question: '', answer: '' }] })}
            className="w-full py-3 rounded-xl border-2 border-dashed border-foreground/10 hover:border-[#F97316] text-foreground/40 hover:text-[#F97316] text-sm font-semibold">
            + Adicionar pergunta
          </button>
        )}
      </div>

      <div className={`${card} space-y-4`}>
        <h2 className="font-['Outfit'] font-bold text-foreground">Chamada final</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Título</label>
            <input value={value.ctaTitle} maxLength={100} onChange={e => set({ ctaTitle: e.target.value })} className={input} />
          </div>
          <div>
            <label className={label}>Texto</label>
            <input value={value.ctaText} maxLength={200} onChange={e => set({ ctaText: e.target.value })} className={input} />
          </div>
        </div>
        <p className="text-foreground/25 text-xs">Aparece no fim da página com o botão “Ver excursões”. Deixe os dois vazios para esconder.</p>
      </div>
    </div>
  );
}
