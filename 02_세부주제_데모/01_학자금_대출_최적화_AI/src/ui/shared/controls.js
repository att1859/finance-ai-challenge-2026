import { escapeHtml as safe } from './escape-html.js';
export const quietButton = 'button button-secondary';
export const primaryButton = 'button button-primary';
export const requiredMark = '<span class="required-mark" aria-hidden="true">*</span><span class="sr-only">필수</span>';

// Reuse the eligibility menu for every dropdown; the native select remains
// the form value and change-event boundary, not a second application state.
export function bindChoiceMenu(menu, onChoose) {
  if (menu.dataset.bound) return;
  menu.dataset.bound = 'true';
  const trigger = menu.querySelector('summary');
  const options = () => [...menu.querySelectorAll('[role="option"]:not(:disabled)')];
  menu.addEventListener('click', event => {
    const option = event.target.closest('[data-choice-value]');
    if (!option || option.disabled) return;
    menu.open = false;
    onChoose(option.dataset.choiceValue);
    if (trigger.isConnected) trigger.focus({preventScroll:true});
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation(); menu.open = false; trigger.focus();
    }
    if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault(); menu.open = true;
      const items = options(), index = items.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : index < 0 ? (event.key === 'ArrowUp' ? items.length - 1 : 0) : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  });
  menu.addEventListener('focusout', () => requestAnimationFrame(() => {
    if (!menu.contains(document.activeElement)) menu.open = false;
  }));
  menu.addEventListener('toggle', () => {
    trigger.setAttribute('aria-expanded', String(menu.open));
    if (menu.open) menu.ownerDocument.querySelectorAll('.eligibility-select[open]').forEach(other => { if (other !== menu) other.open = false; });
  });
}

export function focusControl(control, options = {preventScroll:true}) {
  const target = control?.matches('select[data-enhanced]') ? control.nextElementSibling?.querySelector('summary') : control;
  target?.focus(options);
}

export function applyControls(root = document) {
  root.querySelectorAll('select:not([data-enhanced])').forEach(select => {
    const label = select.labels?.[0];
    const name = label?.querySelector('span')?.textContent || select.getAttribute('aria-label') || select.name;
    const menu = document.createElement('details');
    menu.className = 'eligibility-select';
    menu.innerHTML = `<summary aria-label="${safe(name)}" aria-haspopup="listbox" aria-expanded="false" ${select.disabled ? 'aria-disabled="true" tabindex="-1"' : ''}><span>${safe(select.selectedOptions[0]?.textContent || '')}</span><span aria-hidden="true">⌄</span></summary><div role="listbox" aria-label="${safe(name)}">${[...select.options].map(option => `<button type="button" role="option" tabindex="-1" data-choice-value="${safe(option.value)}" aria-selected="${option.selected}" ${option.disabled || select.disabled ? 'disabled' : ''}>${safe(option.textContent)}</button>`).join('')}</div>`;
    select.dataset.enhanced = 'true'; select.hidden = true;
    select.after(menu);
    if (select.disabled) menu.addEventListener('click', event => event.preventDefault());
    else bindChoiceMenu(menu, value => {
      select.value = value;
      menu.querySelector('summary > span').textContent = select.selectedOptions[0].textContent;
      menu.querySelectorAll('[role="option"]').forEach(option => option.setAttribute('aria-selected', String(option.dataset.choiceValue === value)));
      select.dispatchEvent(new Event('change', {bubbles:true}));
    });
  });
}
export function segmented(name, label, options, value) {
  const index = Math.max(0, options.findIndex(([id]) => String(id) === String(value)));
  return `<div role="radiogroup" aria-label="${safe(label)}" class="choice-control" style="--segment-count:${options.length};--segment-index:${index}"><span class="choice-indicator" aria-hidden="true"></span>${options.map(([id, text]) => `<button type="button" role="radio" name="${name}" value="${id}" aria-checked="${String(id) === String(value)}" tabindex="${String(id) === String(value) ? 0 : -1}" class="choice-item" ${String(id) === String(value) ? 'data-checked' : ''}>${safe(text)}</button>`).join('')}</div>`;
}
