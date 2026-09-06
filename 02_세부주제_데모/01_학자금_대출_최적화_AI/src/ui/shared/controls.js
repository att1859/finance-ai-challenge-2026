import { escapeHtml as safe } from './escape-html.js';
export const quietButton = 'button button-secondary';
export const primaryButton = 'button button-primary';
export function applyControls() {}
export function segmented(name, label, options, value) {
  const index = Math.max(0, options.findIndex(([id]) => String(id) === String(value)));
  return `<div role="radiogroup" aria-label="${safe(label)}" class="choice-control" style="--segment-count:${options.length};--segment-index:${index}"><span class="choice-indicator" aria-hidden="true"></span>${options.map(([id, text]) => `<button type="button" role="radio" name="${name}" value="${id}" aria-checked="${String(id) === String(value)}" tabindex="${String(id) === String(value) ? 0 : -1}" class="choice-item" ${String(id) === String(value) ? 'data-checked' : ''}>${safe(text)}</button>`).join('')}</div>`;
}
