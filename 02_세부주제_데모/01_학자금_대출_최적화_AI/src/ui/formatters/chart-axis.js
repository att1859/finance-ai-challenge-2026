// Include every finite value and zero; use readable, evenly spaced ticks.
export function chartAxis(values) {
  const finite = values.filter(Number.isFinite);
  const minimum = Math.min(0, ...finite);
  const maximum = Math.max(1, ...finite);
  const rough = (maximum - minimum) / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].find(n => n * magnitude >= rough) * magnitude;
  const low = Math.floor(minimum / step) * step;
  const high = Math.ceil((maximum + (maximum - minimum) * .06) / step) * step;
  return { low, high, ticks: Array.from({ length: Math.round((high - low) / step) + 1 }, (_, i) => low + i * step) };
}
