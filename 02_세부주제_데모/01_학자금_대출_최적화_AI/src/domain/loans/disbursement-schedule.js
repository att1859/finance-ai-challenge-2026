import { nonNegative } from '../shared/numbers.js';

export function buildLoanDisbursementSchedule(principal, semesters, annualRate) {
  const safePrincipal = nonNegative(principal);
  const safeSemesters = Math.max(1, Math.round(nonNegative(semesters)));
  const monthlyRate = nonNegative(annualRate) / 100 / 12;
  const equalAmount = safePrincipal / safeSemesters;
  const totalStudyMonths = safeSemesters * 6;

  return Array.from({ length: safeSemesters }, (_, index) => {
    const monthsToGraduation = Math.max(0, totalStudyMonths - index * 6);
    const balanceAtGraduation = equalAmount * ((1 + monthlyRate) ** monthsToGraduation);

    return {
      semester: index + 1,
      amount: equalAmount,
      month: index * 6,
      monthsToGraduation,
      balanceAtGraduation,
      accruedInterest: Math.max(0, balanceAtGraduation - equalAmount),
    };
  });
}
