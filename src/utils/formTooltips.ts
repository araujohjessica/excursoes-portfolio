// Substitui os balões padrão do navegador ("Preencha este campo", "Inclua um @…")
// por um tooltip com o visual do site, em português, em todos os formulários.

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

let current: { cleanup: () => void } | null = null;
let lastShownAt = 0;

function messageFor(el: Field): string {
  const v = el.validity;
  const input = el as HTMLInputElement;
  if (v.valueMissing) {
    if (input.type === 'checkbox') return 'Marque esta opção para continuar';
    if (input.type === 'file') return 'Escolha um arquivo';
    if (el instanceof HTMLSelectElement) return 'Escolha uma opção';
    return 'Preencha este campo';
  }
  if (v.typeMismatch) {
    if (input.type === 'email') return 'Digite um e-mail válido (ex.: nome@email.com)';
    if (input.type === 'url') return 'Digite um endereço válido começando com https://';
    return 'Formato inválido';
  }
  if (v.tooShort) return `Use pelo menos ${input.minLength} caracteres`;
  if (v.tooLong) return `Use no máximo ${input.maxLength} caracteres`;
  if (v.rangeUnderflow) return `O valor mínimo é ${input.min}`;
  if (v.rangeOverflow) return `O valor máximo é ${input.max}`;
  if (v.stepMismatch) return 'Valor inválido para este campo';
  if (v.badInput) return input.type === 'number' ? 'Digite apenas números' : 'Valor inválido';
  if (v.patternMismatch) return input.title || 'Formato inválido';
  return 'Verifique este campo';
}

export function hideFieldTooltip() {
  current?.cleanup();
  current = null;
}

/** Mostra o tooltip do site apontando para um campo. */
export function showFieldTooltip(el: Field, message: string) {
  hideFieldTooltip();

  const tip = document.createElement('div');
  tip.setAttribute('role', 'alert');
  tip.className = 'field-tooltip';
  const icon = document.createElement('span');
  icon.className = 'field-tooltip__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '!';
  const text = document.createElement('span');
  text.textContent = message;
  tip.append(icon, text);
  document.body.appendChild(tip);

  const place = () => {
    const r = el.getBoundingClientRect();
    tip.style.maxWidth = `${Math.min(Math.max(r.width, 240), 380, window.innerWidth - 24)}px`;
    const left = Math.min(Math.max(12, r.left), window.innerWidth - tip.offsetWidth - 12);
    tip.style.left = `${left}px`;
    tip.style.top = `${r.bottom + 10}px`;
    tip.style.setProperty('--arrow-left', `${Math.max(14, Math.min(r.left - left + 22, tip.offsetWidth - 22))}px`);
  };
  place();
  requestAnimationFrame(() => tip.classList.add('field-tooltip--visible'));

  el.setAttribute('aria-invalid', 'true');
  el.classList.add('field-invalid');

  const hide = () => hideFieldTooltip();
  const timer = window.setTimeout(hide, 6000);
  el.addEventListener('input', hide);
  el.addEventListener('change', hide);
  window.addEventListener('scroll', place, true);
  window.addEventListener('resize', place);

  current = {
    cleanup: () => {
      window.clearTimeout(timer);
      el.removeEventListener('input', hide);
      el.removeEventListener('change', hide);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      el.removeAttribute('aria-invalid');
      el.classList.remove('field-invalid');
      tip.remove();
    },
  };
}

/** Liga a troca dos balões do navegador pelo tooltip do site (chamar uma vez). */
export function installFormTooltips() {
  document.addEventListener(
    'invalid',
    e => {
      e.preventDefault();
      // No envio, o navegador dispara "invalid" para cada campo: mostra só o primeiro
      const now = Date.now();
      if (now - lastShownAt < 150) return;
      lastShownAt = now;
      const el = e.target as Field;
      el.focus();
      showFieldTooltip(el, messageFor(el));
    },
    true,
  );
}
