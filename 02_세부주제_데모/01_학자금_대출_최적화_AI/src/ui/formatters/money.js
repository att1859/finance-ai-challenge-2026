export function roundMoney(value, digits = 1) {
  if (!Number.isFinite(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

export function formatMoney(value, options = {}) {
  const { digits = 0, unit = '만 원' } = options;
  if (!Number.isFinite(Number(value))) return '계산 불가';
  const formatted = Number(value).toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return formatted + (unit ? ' ' + unit : '');
}

export function moneyHtml(value, digits = 0) {
  return '<span class="nowrap">' + formatMoney(value, { digits }) + '</span>';
}

export function signedMoney(value) {
  if (!Number.isFinite(value)) return '계산 불가';
  return (value >= 0 ? '+' : '') + formatMoney(value, { digits: 1 });
}
