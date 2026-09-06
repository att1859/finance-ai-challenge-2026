import { actionButton } from '@seed-design/css/recipes/action-button';
import { segmentedControl } from '@seed-design/css/recipes/segmented-control';
import { escapeHtml as safe } from './escape-html.js';

export const quietButton = actionButton({ variant: 'neutralWeak', size: 'small' });
export const primaryButton = actionButton({ variant: 'neutralSolid', size: 'medium' });
const segment = segmentedControl();
export function segmented(name, label, options, value) {
  const index = Math.max(0, options.findIndex(([id]) => String(id) === String(value)));
  return `<div role="radiogroup" aria-label="${safe(label)}" class="${segment.root} seed-choice" style="--segment-count:${options.length};--segment-index:${index}"><span class="${segment.indicator}" aria-hidden="true"></span>${options.map(([id, text]) => `<button type="button" role="radio" name="${name}" value="${id}" aria-checked="${String(id) === String(value)}" tabindex="${String(id) === String(value) ? 0 : -1}" class="${segment.item}" ${String(id) === String(value) ? 'data-checked' : ''}>${safe(text)}</button>`).join('')}</div>`;
}
