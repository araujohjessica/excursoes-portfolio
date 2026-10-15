import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../../store/AppContext';
import type { Category } from '../../types';
import { imageUrl, imageFocus, uploadImages, type ExcursionInput } from '../../services/api';

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'festival', label: 'Festival', icon: '🎪' },
  { key: 'carnaval', label: 'Carnaval', icon: '🎭' },
  { key: 'reveillon', label: 'Réveillon', icon: '🎆' },
  { key: 'show', label: 'Show', icon: '🎸' },
  { key: 'esportes', label: 'Esportes', icon: '⚽' },
  { key: 'teatro', label: 'Teatro & Arte', icon: '🎭' },
];

export default function AdminCreateEvent() {
  const { id } = useParams();
  const { excursions, addExcursion, updateExcursion } = useApp();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const existing = id ? excursions.find(e => e.id === id) : null;

  const blankForm = {
    id: '', slug: '', createdAt: '',
    title: '', eventName: '', description: '', fullDescription: '',
    category: 'festival' as Category,
    artists: [] as string[], artistsRaw: '',
    image: '', imagePosition: 'center' as 'top' | 'center' | 'bottom', gallery: [] as string[],
    price: 0, originalPrice: undefined as number | undefined,
    duration: '', departureCity: '', eventCity: '', eventVenue: '',
    departureDate: '', returnDate: '', eventDate: '',
    maxSpots: 40, bookedSpots: 0,
    hasTickets: false, ticketType: '',
    included: [''] as string[], notIncluded: [''] as string[],
    itinerary: [{ time: '', description: '' }],
    meetingPoint: '', rating: 5.0, reviewCount: 0,
    featured: false, active: true,
  };

  const [form, setForm] = useState(
    existing
      ? { ...existing, artistsRaw: (existing.artists || []).join(', ') }
      : blankForm
  );
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const [uploading, setUploading] = useState<'image' | 'gallery' | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);

  // Lê a resolução da foto principal para avisar se estiver pequena
  useEffect(() => {
    setImageSize(null);
    if (!form.image) return;
    const img = new Image();
    img.onload = () => setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl(form.image);
  }, [form.image]);
  const [uploadError, setUploadError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'image' | 'gallery') => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setUploadError('');
    setUploading(target);
    try {
      const urls = await uploadImages(files);
      if (target === 'image') set('image', urls[0]);
      else setForm(f => ({ ...f, gallery: [...f.gallery, ...urls] }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao enviar imagem');
    } finally {
      setUploading(null);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const artists = form.artistsRaw ? form.artistsRaw.split(',').map(a => a.trim()).filter(Boolean) : [];
    const { id: _id, slug: _slug, createdAt: _createdAt, bookedSpots: _booked, artistsRaw: _raw, ...fields } = form;
    const payload: ExcursionInput = {
      ...fields,
      originalPrice: fields.originalPrice || undefined,
      artists,
      gallery: form.gallery.filter(Boolean),
      included: form.included.filter(Boolean),
      notIncluded: form.notIncluded.filter(Boolean),
      itinerary: form.itinerary.filter(i => i.time || i.description),
    };

    try {
      if (isEdit && existing) await updateExcursion(existing.id, payload);
      else await addExcursion(payload);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao salvar');
      return;
    }
    setSaved(true);
    setTimeout(() => navigate('/admin/eventos'), 1000);
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-foreground/5 text-foreground placeholder-foreground/20 transition-colors';
  const labelClass = 'text-xs font-semibold text-foreground/30 block mb-1.5 uppercase tracking-wide';

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button onClick={() => navigate('/admin/eventos')} className="text-foreground/30 text-sm hover:text-[#F97316] flex items-center gap-1 mb-3 transition-colors">
            ← Voltar
          </button>
          <h1 className="font-['Outfit'] font-black text-3xl text-foreground">
            {isEdit ? 'Editar pacote' : 'Novo pacote de evento'}
          </h1>
        </div>

        {saved && (
          <div className="mb-6 bg-green-500/15 border border-green-500/30 rounded-xl px-5 py-3 flex items-center gap-2 text-green-400">
            <span>✅</span>
            <span className="text-sm font-semibold">Pacote {isEdit ? 'atualizado' : 'criado'}! Redirecionando…</span>
          </div>
        )}

        {submitError && (
          <div className="mb-6 bg-red-500/15 border border-red-500/30 rounded-xl px-5 py-3 text-red-400 text-sm font-semibold">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic info */}
          <div className="bg-card rounded-2xl p-7 border border-foreground/10">
            <h2 className="font-['Outfit'] font-bold text-lg text-foreground mb-6">Informações do evento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nome do evento *</label>
                <input required value={form.eventName} onChange={e => set('eventName', e.target.value)} placeholder="Ex: Rock in Rio 2026" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Título do pacote *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Rock in Rio 2026 — Pacote Completo SP" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Categoria *</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      type="button"
                      key={c.key}
                      onClick={() => set('category', c.key)}
                      className={`p-3 rounded-xl border text-center text-sm transition-colors ${form.category === c.key ? 'border-[#F97316] bg-[#F97316]/15 text-[#F97316]' : 'border-foreground/10 text-foreground/40 hover:border-foreground/20'}`}
                    >
                      <span className="block text-xl mb-1">{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Artistas / Atrações (separados por vírgula)</label>
                <textarea value={form.artistsRaw} onChange={e => set('artistsRaw', e.target.value)} rows={3} placeholder="Coldplay, Foo Fighters, Post Malone, Ivete Sangalo" className={`${inputClass} resize-none`} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Descrição curta *</label>
                <textarea required value={form.description} onChange={e => set('description', e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Uma linha de impacto sobre o pacote" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Descrição completa *</label>
                <textarea required value={form.fullDescription} onChange={e => set('fullDescription', e.target.value)} rows={4} className={`${inputClass} resize-none`} placeholder="Descreva o pacote em detalhes…" />
              </div>
            </div>
          </div>

          {/* Local e datas */}
          <div className="bg-card rounded-2xl p-7 border border-foreground/10">
            <h2 className="font-['Outfit'] font-bold text-lg text-foreground mb-6">Local e datas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Cidade de saída *</label>
                <input required value={form.departureCity} onChange={e => set('departureCity', e.target.value)} placeholder="São Paulo, SP" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Cidade do evento *</label>
                <input required value={form.eventCity} onChange={e => set('eventCity', e.target.value)} placeholder="Rio de Janeiro, RJ" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Local / Venue *</label>
                <input required value={form.eventVenue} onChange={e => set('eventVenue', e.target.value)} placeholder="Parque Olímpico — Barra da Tijuca" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Data do evento *</label>
                <input required type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Duração *</label>
                <input required value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="3 dias / 2 noites" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Data de saída *</label>
                <input required type="date" value={form.departureDate} onChange={e => set('departureDate', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Data de retorno *</label>
                <input required type="date" value={form.returnDate} onChange={e => set('returnDate', e.target.value)} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Ponto de saída *</label>
                <input required value={form.meetingPoint} onChange={e => set('meetingPoint', e.target.value)} placeholder="Terminal Tietê — Portão 15" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Preço e vagas */}
          <div className="bg-card rounded-2xl p-7 border border-foreground/10">
            <h2 className="font-['Outfit'] font-bold text-lg text-foreground mb-6">Preço e vagas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Preço (R$) *</label>
                <input required type="number" min="0" step="0.01" value={form.price || ''} onChange={e => set('price', Number(e.target.value))} placeholder="1290" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Preço original (R$)</label>
                <input type="number" min="0" step="0.01" value={form.originalPrice || ''} onChange={e => set('originalPrice', e.target.value ? Number(e.target.value) : undefined)} placeholder="Opcional" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Total de vagas *</label>
                <input required type="number" min="1" value={form.maxSpots || ''} onChange={e => set('maxSpots', Number(e.target.value))} placeholder="40" className={inputClass} />
                {isEdit && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${form.bookedSpots >= form.maxSpots ? 'bg-red-500' : form.bookedSpots / form.maxSpots >= 0.8 ? 'bg-amber-400' : 'bg-[#F97316]'}`}
                        style={{ width: `${Math.min(100, (form.bookedSpots / (form.maxSpots || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${form.bookedSpots >= form.maxSpots ? 'text-red-400' : 'text-foreground/40'}`}>
                      {form.bookedSpots >= form.maxSpots ? '🔴 Esgotado' : `${form.bookedSpots}/${form.maxSpots} reservados`}
                    </span>
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Tipo de ingresso</label>
                <input value={form.ticketType || ''} onChange={e => set('ticketType', e.target.value)} placeholder="Ex: Pista Premium, Camarote VIP, 3 dias" className={inputClass} />
              </div>
            </div>

            {/* Toggles */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { key: 'hasTickets', label: 'Emite ingressos', desc: 'Código QR digital' },
                { key: 'featured', label: 'Destaque na home', desc: 'Aparece nos destaques' },
                { key: 'active', label: 'Ativo', desc: 'Visível ao público' },
              ].map(opt => (
                <label key={opt.key} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${form[opt.key as keyof typeof form] ? 'border-[#F97316]/40 bg-[#F97316]/10' : 'border-foreground/10 hover:border-foreground/20'}`}>
                  <input type="checkbox" checked={Boolean(form[opt.key as keyof typeof form])} onChange={e => set(opt.key, e.target.checked)} className="mt-0.5 accent-[#F97316]" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-foreground/30">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Imagens */}
          <div className="bg-card rounded-2xl p-7 border border-foreground/10">
            <h2 className="font-['Outfit'] font-bold text-lg text-foreground mb-1">Imagens</h2>
            <p className="text-foreground/30 text-xs mb-5">Opcional. JPG, PNG ou WEBP até 8 MB.</p>

            <div className="flex gap-3 items-start bg-[#F97316]/[0.07] border border-[#F97316]/20 rounded-xl p-4 mb-5">
              <span className="text-xl">📐</span>
              <div className="text-xs leading-relaxed">
                <p className="text-foreground font-semibold text-sm mb-1">Tamanho ideal: 1920 × 1080 px (horizontal, 16:9)</p>
                <p className="text-foreground/50">
                  A foto é recortada de formas diferentes no card, no computador e no celular, e o que sempre aparece é a <strong className="text-foreground/80">faixa do meio</strong>.
                  Evite textos ou rostos nas bordas e use o <strong className="text-foreground/80">ponto de foco</strong> abaixo se o mais importante estiver no alto ou embaixo.
                  Mínimo recomendado: 1200 px de largura.
                </p>
              </div>
            </div>

            <label className={labelClass}>Imagem principal</label>
            {form.image ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-foreground/5 group">
                <img src={imageUrl(form.image)} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="px-4 py-2 rounded-lg bg-foreground/15 hover:bg-foreground/25 text-foreground text-xs font-semibold cursor-pointer">
                    Trocar
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'image')} />
                  </label>
                  <button type="button" onClick={() => set('image', '')} className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold">Remover</button>
                </div>
                {imageSize && (
                  <span className={`absolute bottom-2 right-2 text-[11px] font-semibold px-2 py-1 rounded-md backdrop-blur ${imageSize.w >= 1200 ? 'bg-black/60 text-foreground/80' : 'bg-amber-500/90 text-black'}`}>
                    {imageSize.w} × {imageSize.h} px
                  </span>
                )}
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-foreground/10 hover:border-[#F97316] bg-foreground/5 cursor-pointer transition-colors ${uploading === 'image' ? 'opacity-60 pointer-events-none' : ''}`}>
                <span className="text-3xl mb-2">📷</span>
                <span className="text-foreground/60 text-sm font-semibold">{uploading === 'image' ? 'Enviando…' : 'Clique para enviar a foto'}</span>
                <span className="text-foreground/30 text-xs mt-1">1920 × 1080 px recomendado</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'image')} />
              </label>
            )}

            {imageSize && imageSize.w < 1200 && (
              <p className="mt-2 text-xs text-amber-300">⚠️ Foto pequena ({imageSize.w} px de largura): pode ficar borrada no computador. Prefira uma com pelo menos 1200 px.</p>
            )}
            {imageSize && imageSize.h > imageSize.w && (
              <p className="mt-2 text-xs text-amber-300">⚠️ Foto na vertical: boa parte dela será cortada. Prefira uma foto na horizontal.</p>
            )}

            {form.image && (
              <div className="mt-5 space-y-4">
                <div>
                  <label className={labelClass}>Ponto de foco</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([['top', '⬆ Topo', 'O mais importante está no alto'], ['center', '⬤ Centro', 'Padrão'], ['bottom', '⬇ Base', 'O mais importante está embaixo']] as const).map(([k, l, d]) => (
                      <button key={k} type="button" onClick={() => set('imagePosition', k)} title={d}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${form.imagePosition === k ? 'border-[#F97316] bg-[#F97316]/10 text-white' : 'border-foreground/10 text-foreground/50 hover:bg-foreground/5'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Como vai aparecer</label>
                  <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-3">
                    <div className="space-y-3">
                      <div>
                        <div className="aspect-[3.7/1] rounded-lg overflow-hidden bg-foreground/5 ring-1 ring-foreground/10">
                          <img src={imageUrl(form.image)} alt="" className={`w-full h-full object-cover ${imageFocus(form.imagePosition)}`} />
                        </div>
                        <p className="text-foreground/30 text-[11px] mt-1">Página do pacote · computador</p>
                      </div>
                      <div>
                        <div className="aspect-[1.9/1] rounded-lg overflow-hidden bg-foreground/5 ring-1 ring-foreground/10">
                          <img src={imageUrl(form.image)} alt="" className={`w-full h-full object-cover ${imageFocus(form.imagePosition)}`} />
                        </div>
                        <p className="text-foreground/30 text-[11px] mt-1">Card na Home e em Excursões</p>
                      </div>
                    </div>
                    <div>
                      <div className="aspect-[1.35/1] rounded-lg overflow-hidden bg-foreground/5 ring-1 ring-foreground/10 max-w-[240px]">
                        <img src={imageUrl(form.image)} alt="" className={`w-full h-full object-cover ${imageFocus(form.imagePosition)}`} />
                      </div>
                      <p className="text-foreground/30 text-[11px] mt-1">Página do pacote · celular</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <label className={`${labelClass} mt-6`}>Galeria</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {form.gallery.map((g, i) => (
                <div key={g + i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-foreground/5 group">
                  <img src={imageUrl(g, 300, 225)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => set('gallery', form.gallery.filter((_, j) => j !== i))}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                </div>
              ))}
              <label className={`flex flex-col items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed border-foreground/10 hover:border-[#F97316] bg-foreground/5 cursor-pointer transition-colors ${uploading === 'gallery' ? 'opacity-60 pointer-events-none' : ''}`}>
                <span className="text-xl">＋</span>
                <span className="text-foreground/40 text-xs">{uploading === 'gallery' ? 'Enviando…' : 'Adicionar'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e, 'gallery')} />
              </label>
            </div>

            {uploadError && <p className="mt-3 text-sm text-red-400">{uploadError}</p>}
          </div>

          {/* Inclusos / Não inclusos */}
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { key: 'included', label: 'Incluso no pacote', icon: '✓', color: 'text-green-400', placeholder: 'Ex: Ônibus executivo leito' },
              { key: 'notIncluded', label: 'Não incluso', icon: '✗', color: 'text-red-400', placeholder: 'Ex: Alimentação no festival' },
            ].map(section => (
              <div key={section.key} className="bg-card rounded-2xl p-6 border border-foreground/10">
                <h2 className="font-['Outfit'] font-bold text-base text-foreground mb-4 flex items-center gap-2">
                  <span className={section.color}>{section.icon}</span> {section.label}
                </h2>
                <div className="space-y-2">
                  {(form[section.key as 'included' | 'notIncluded']).map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={item} onChange={e => { const arr = [...form[section.key as 'included' | 'notIncluded']]; arr[i] = e.target.value; set(section.key, arr); }} placeholder={section.placeholder} className={`${inputClass} flex-1`} />
                      <button type="button" onClick={() => { const arr = (form[section.key as 'included' | 'notIncluded']).filter((_, j) => j !== i); set(section.key, arr.length ? arr : ['']); }} className="w-8 h-8 mt-1.5 flex-shrink-0 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => set(section.key, [...form[section.key as 'included' | 'notIncluded'], ''])} className="w-full py-2 rounded-lg border border-dashed border-foreground/10 text-foreground/30 text-sm hover:border-[#F97316]/40 hover:text-[#F97316] transition-colors">
                    + Adicionar item
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Roteiro */}
          <div className="bg-card rounded-2xl p-7 border border-foreground/10">
            <h2 className="font-['Outfit'] font-bold text-lg text-foreground mb-5">Roteiro</h2>
            <div className="space-y-3">
              {form.itinerary.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <input value={item.time} onChange={e => { const arr = [...form.itinerary]; arr[i] = { ...arr[i], time: e.target.value }; set('itinerary', arr); }} placeholder="20:00" className={`${inputClass} w-24 flex-shrink-0`} />
                  <input value={item.description} onChange={e => { const arr = [...form.itinerary]; arr[i] = { ...arr[i], description: e.target.value }; set('itinerary', arr); }} placeholder="Descrição" className={`${inputClass} flex-1`} />
                  <button type="button" onClick={() => { const arr = form.itinerary.filter((_, j) => j !== i); set('itinerary', arr.length ? arr : [{ time: '', description: '' }]); }} className="w-8 h-8 mt-1.5 flex-shrink-0 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors flex items-center justify-center">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => set('itinerary', [...form.itinerary, { time: '', description: '' }])} className="w-full py-2 rounded-lg border border-dashed border-foreground/10 text-foreground/30 text-sm hover:border-[#F97316]/40 hover:text-[#F97316] transition-colors">
                + Adicionar etapa
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 justify-end pt-2">
            <button type="button" onClick={() => navigate('/admin/eventos')} className="px-6 py-3 rounded-xl border border-foreground/10 text-foreground/40 font-semibold hover:border-foreground/30 hover:text-foreground transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-8 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black transition-colors shadow-lg shadow-orange-900/40">
              {isEdit ? 'Salvar alterações' : 'Criar pacote'} →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
