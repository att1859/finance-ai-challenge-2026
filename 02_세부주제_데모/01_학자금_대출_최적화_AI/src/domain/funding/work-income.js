import { nonNegative } from '../shared/numbers.js';

export const MONTHLY_WEEKS = 365 / 7 / 12;

export const WORK_TAX_PRESETS = Object.freeze({
  'simple-3.3': Object.freeze({
    label: '3.3% 간편 차감',
    rate: 0.033,
  }),
  'social-9.5': Object.freeze({
    label: '4대보험 9.5% 간편 차감',
    rate: 0.095,
  }),
  'daily-0': Object.freeze({
    label: '일용근로 0% 간편 차감',
    rate: 0,
  }),
});

const DEFAULT_TAX_PRESET = 'simple-3.3';

export function calculateMonthlyWorkIncome({
  weeklyHours,
  hourlyWage,
  taxPreset = DEFAULT_TAX_PRESET,
}) {
  const safeWeeklyHours = nonNegative(weeklyHours);
  const safeHourlyWage = nonNegative(hourlyWage);
  const resolvedTaxPreset = WORK_TAX_PRESETS[taxPreset]
    ? taxPreset
    : DEFAULT_TAX_PRESET;
  const taxRate = WORK_TAX_PRESETS[resolvedTaxPreset].rate;
  const weeklyHolidayEligible = safeWeeklyHours >= 15;
  const weeklyHolidayHours = weeklyHolidayEligible
    ? Math.min(safeWeeklyHours / 5, 8)
    : 0;
  const baseMonthly = safeWeeklyHours * safeHourlyWage * MONTHLY_WEEKS / 10000;
  const holidayMonthly = weeklyHolidayHours * safeHourlyWage * MONTHLY_WEEKS / 10000;
  const grossMonthly = baseMonthly + holidayMonthly;
  const deductionMonthly = grossMonthly * taxRate;

  return {
    monthlyWeeks: MONTHLY_WEEKS,
    weeklyHolidayEligible,
    weeklyHolidayHours,
    baseMonthly,
    holidayMonthly,
    grossMonthly,
    deductionMonthly,
    netMonthly: grossMonthly - deductionMonthly,
    taxPreset: resolvedTaxPreset,
    taxRate,
  };
}
