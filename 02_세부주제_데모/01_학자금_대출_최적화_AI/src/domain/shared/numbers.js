export const numberOrZero = (value) => (
  Number.isFinite(Number(value)) ? Number(value) : 0
);

export const nonNegative = (value) => Math.max(0, numberOrZero(value));
