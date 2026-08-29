import { numberOrZero } from '../shared/numbers.js';

export const EMPTY_STRESS = Object.freeze({
  employmentDelayMonths: 0,
  salaryReductionRate: 0,
  graduationDelayMonths: 0,
});

export function normalizeStress(stress = {}) {
  return {
    employmentDelayMonths: Math.max(0, Math.round(numberOrZero(stress.employmentDelayMonths))),
    salaryReductionRate: Math.min(1, Math.max(0, numberOrZero(stress.salaryReductionRate))),
    graduationDelayMonths: Math.max(0, Math.round(numberOrZero(stress.graduationDelayMonths))),
  };
}
