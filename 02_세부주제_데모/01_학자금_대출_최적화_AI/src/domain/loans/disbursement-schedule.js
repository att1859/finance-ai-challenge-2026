import { nonNegative } from '../shared/numbers.js';

export function buildLoanDisbursementSchedule(
  components,
  studyMonths,
  annualRate,
) {
  const monthlyRate = nonNegative(annualRate) / 100 / 12;
  const safeStudyMonths = nonNegative(studyMonths);

  return components.map((component) => {
    const month = Math.max(0, (component.semester - 1) * 6);
    const monthsToGraduation = Math.max(0, safeStudyMonths - month);
    const principal = nonNegative(component.principal);
    const balanceAtGraduation = principal * ((1 + monthlyRate) ** monthsToGraduation);

    return {
      ...component,
      principal,
      month,
      monthsToGraduation,
      balanceAtGraduation,
      accruedInterest: Math.max(0, balanceAtGraduation - principal),
    };
  });
}
