import { nonNegative } from '../shared/numbers.js';

export const CURRENT_VALUE_COMPARISON_MONTHS = 120;

function componentBalanceAtMonth(component, globalMonth) {
  if (globalMonth <= component.disbursementMonth) {
    return globalMonth === component.disbursementMonth
      ? nonNegative(component.principal)
      : 0;
  }

  const previous = component.monthlySchedule.findLast(
    (row) => row.globalMonth < globalMonth,
  );
  return previous?.closingPrincipal ?? 0;
}

export function calculateGeneralCurrentValueComparison({
  general,
  funding,
  stress,
}) {
  if (!general) return null;

  const startMonth = nonNegative(funding?.studyMonths)
    + nonNegative(stress?.employmentDelayMonths);
  const rowsByMonth = new Map(
    general.monthlyRepaymentSchedule.map((row) => [row.globalMonth, row]),
  );
  const monthlySchedule = Array.from(
    { length: CURRENT_VALUE_COMPARISON_MONTHS },
    (_, index) => {
      const globalMonth = startMonth + index;
      const source = rowsByMonth.get(globalMonth);
      return {
        comparisonMonth: index + 1,
        globalMonth,
        annualRate: general.annualRate,
        openingBalance: general.componentRepaymentSchedules.reduce(
          (sum, component) => sum + componentBalanceAtMonth(component, globalMonth),
          0,
        ),
        graceInterestPayment: source?.graceInterestPayment ?? 0,
        repaymentInterestPayment: source?.repaymentInterestPayment ?? 0,
        principalPayment: source?.principalPayment ?? 0,
        totalPayment: source?.totalPayment ?? 0,
        closingBalance: general.componentRepaymentSchedules.reduce(
          (sum, component) => sum + componentBalanceAtMonth(component, globalMonth + 1),
          0,
        ),
      };
    },
  );

  return {
    periodMonths: CURRENT_VALUE_COMPARISON_MONTHS,
    startMonth,
    annualRate: general.annualRate,
    monthlySchedule,
    totalPayment: monthlySchedule.reduce((sum, row) => sum + row.totalPayment, 0),
    totalInterest: monthlySchedule.reduce(
      (sum, row) => sum + row.graceInterestPayment + row.repaymentInterestPayment,
      0,
    ),
    endingBalance: monthlySchedule.at(-1)?.closingBalance ?? 0,
  };
}

export function calculateIncomeContingentCurrentValueComparison({
  balanceAtEmployment,
  annualRate,
  annualGrossIncome,
  annualGrossIncomeThreshold,
  repaymentRate,
  minimumAnnualMandatoryRepayment,
}) {
  const incomeBasedRepayment = Math.max(
    0,
    nonNegative(annualGrossIncome) - nonNegative(annualGrossIncomeThreshold),
  ) * nonNegative(repaymentRate);
  const plannedAnnualRepayment = incomeBasedRepayment > 0
    ? Math.max(incomeBasedRepayment, nonNegative(minimumAnnualMandatoryRepayment))
    : 0;
  const rate = nonNegative(annualRate) / 100;
  let balance = nonNegative(balanceAtEmployment);
  const annualSchedule = Array.from({ length: 10 }, (_, index) => {
    const openingBalance = balance;
    const interest = openingBalance * rate;
    const balanceBeforePayment = openingBalance + interest;
    const mandatoryRepayment = Math.min(balanceBeforePayment, plannedAnnualRepayment);
    balance = Math.max(0, balanceBeforePayment - mandatoryRepayment);

    return {
      comparisonYear: index + 1,
      annualRate,
      annualGrossIncome,
      annualGrossIncomeThreshold,
      repaymentRate,
      openingBalance,
      interest,
      balanceBeforePayment,
      mandatoryRepayment,
      closingBalance: balance,
    };
  });

  return {
    periodMonths: CURRENT_VALUE_COMPARISON_MONTHS,
    annualRate,
    annualGrossIncome,
    annualGrossIncomeThreshold,
    repaymentRate,
    plannedAnnualRepayment,
    annualSchedule,
    totalPayment: annualSchedule.reduce(
      (sum, row) => sum + row.mandatoryRepayment,
      0,
    ),
    totalInterest: annualSchedule.reduce((sum, row) => sum + row.interest, 0),
    endingBalance: balance,
  };
}
