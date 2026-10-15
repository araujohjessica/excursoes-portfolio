import type { Excursion } from '../types';

// Itens de destaque derivados do que foi cadastrado em "Incluso" (e do campo "Emite ingressos")
const RULES: { tag: string; icon: string; pattern: RegExp }[] = [
  { tag: 'Transporte', icon: '🚌', pattern: /[ôo]nibus|\bvan\b|transporte|transfer|passagem|a[ée]re[oa]|\bvoo\b|micro/i },
  { tag: 'Hotel', icon: '🏨', pattern: /hotel|hosped|pousada|hostel|pernoite|resort/i },
  { tag: 'Ingresso', icon: '🎟️', pattern: /ingresso|entrada|camarote|abad[áa]/i },
  { tag: 'Alimentação', icon: '🍽️', pattern: /caf[ée] da manh[ãa]|alimenta|refei[çc]|almo[çc]o|jantar|lanche|open bar/i },
  { tag: 'Guia', icon: '🧭', pattern: /guia|coordenador|monitor|acompanhante/i },
  { tag: 'Seguro', icon: '🛡️', pattern: /seguro/i },
];

export function includedHighlights(e: Pick<Excursion, 'included' | 'hasTickets'>) {
  const text = e.included.join(' | ');
  return RULES.filter(r => r.pattern.test(text) || (r.tag === 'Ingresso' && e.hasTickets)).map(({ tag, icon }) => ({ tag, icon }));
}
