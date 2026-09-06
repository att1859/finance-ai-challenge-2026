import { LOAN_POLICY_SNAPSHOT } from '../../policies/loans/2026.js';
import { normalizeStress } from '../scenarios/normalize-stress.js';
import { nonNegative } from '../shared/numbers.js';
import { calculateGeneralLoan } from './general-loan.js';
import { calculateIncomeContingentLoan } from './income-contingent-loan.js';
import { getLoanCompositionComponents } from './loan-composition.js';
import { calculateGeneralCurrentValueComparison } from './current-value-comparison.js';

function generalRepaymentPolicy(policySnapshot) {
  const product = policySnapshot?.products?.general;
  return {
    annualRate: product?.interest?.annualRate,
    repaymentMethod: product?.repayment?.serviceComparisonMethod,
    maximumGraceYears: product?.repayment?.maximumGraceYears,
    maximumRepaymentYears: product?.repayment?.maximumRepaymentYears,
    scheduleAnchorDate: policySnapshot?.effectiveFrom,
  };
}

function incomeContingentRepaymentPolicy(policySnapshot, academicLevel) {
  const product = policySnapshot?.products?.incomeContingent;
  const repayment = product?.repayment;
  const rateBasis = academicLevel === 'graduate'
    ? 'graduate'
    : 'undergraduate';

  return {
    annualRate: product?.interest?.annualRate,
    annualGrossIncomeThreshold: repayment?.annualGrossIncomeThreshold,
    annualGrossIncomeThresholdKind: repayment?.annualGrossIncomeThresholdKind,
    repaymentRate: rateBasis === 'graduate'
      ? repayment?.graduateRate
      : repayment?.undergraduateRate,
    repaymentRateBasis: rateBasis,
    minimumAnnualMandatoryRepayment: repayment?.minimumAnnualMandatoryRepayment,
  };
}

function profileForProduct(profile, product, selectedProduct) {
  return {
    ...profile,
    existingLoanBalance: product === selectedProduct
      ? nonNegative(profile.existingLoanBalance)
      : 0,
  };
}

function sumResults(results, key) {
  return results.reduce((sum, result) => sum + nonNegative(result[key]), 0);
}

function sumKnownResults(results, key) {
  return results.every((result) => Number.isFinite(result[key]))
    ? results.reduce((sum, result) => sum + result[key], 0)
    : null;
}

function activeProducts(profile, loanComposition) {
  const selectedProduct = (profile.existingLoanProduct ?? profile.loanType) === 'income-contingent'
    ? 'income-contingent'
    : 'general';
  const products = new Set(
    getLoanCompositionComponents(loanComposition).map(({ product }) => product),
  );

  if (nonNegative(profile.existingLoanBalance) > 0 || products.size === 0) {
    products.add(selectedProduct);
  }

  return { products, selectedProduct };
}

export function calculateLoan(
  profile,
  loanComposition,
  funding,
  stress = {},
  policySnapshot = LOAN_POLICY_SNAPSHOT,
) {
  const normalizedStress = normalizeStress(stress);
  const { products, selectedProduct } = activeProducts(profile, loanComposition);
  const general = products.has('general')
    ? calculateGeneralLoan(
      profileForProduct(profile, 'general', selectedProduct),
      loanComposition,
      funding,
      generalRepaymentPolicy(policySnapshot),
    )
    : null;
  const incomeContingent = products.has('income-contingent')
    ? calculateIncomeContingentLoan(
      profileForProduct(profile, 'income-contingent', selectedProduct),
      loanComposition,
      funding,
      normalizedStress,
      incomeContingentRepaymentPolicy(policySnapshot, profile.academicLevel),
    )
    : null;
  const results = [general, incomeContingent].filter(Boolean);
  const calculationPossible = results.every(({ calculationPossible: possible }) => possible);
  const monthlyScheduledPayment = general
    ? general.monthlyPayment
    : 0;
  const firstYearScheduledRepayment = general
    ? general.firstYearRepayment
    : 0;
  const annualMandatoryRepayment = incomeContingent
    ? incomeContingent.annualMandatoryRepayment
    : 0;
  const monthlyAverageMandatoryRepayment = incomeContingent
    ? incomeContingent.monthlyAverageEquivalent
    : 0;
  const monthlyBurdenForComparison = calculationPossible
    ? monthlyScheduledPayment + monthlyAverageMandatoryRepayment
    : null;
  const type = results.length > 1
    ? 'mixed'
    : results[0]?.type ?? selectedProduct;
  const generalCurrentValueComparison = calculationPossible
    ? calculateGeneralCurrentValueComparison({
      general,
      funding,
      stress: normalizedStress,
    })
    : null;
  const incomeContingentCurrentValueComparison = calculationPossible
    ? incomeContingent?.currentValueComparison ?? null
    : null;
  const comparisonParts = [
    generalCurrentValueComparison,
    incomeContingentCurrentValueComparison,
  ].filter(Boolean);
  const adjustedMonthlyIncome = nonNegative(profile.salary)
    * (1 - normalizedStress.salaryReductionRate);
  const currentValueComparison = calculationPossible
    ? {
      label: '현재 기준 10년 단순 비교',
      periodMonths: 120,
      monthlyIncome: adjustedMonthlyIncome,
      monthlyLivingCost: nonNegative(profile.desiredCareerSpend),
      general: generalCurrentValueComparison,
      incomeContingent: incomeContingentCurrentValueComparison,
      totalPayment: sumResults(comparisonParts, 'totalPayment'),
      totalInterest: sumResults(comparisonParts, 'totalInterest'),
      endingBalance: sumResults(comparisonParts, 'endingBalance'),
      assumptions: {
        incomeGrowthRate: 0,
        livingCostGrowthRate: 0,
        thresholdGrowthRate: 0,
        interestRateChange: 0,
      },
    }
    : null;

  return {
    type,
    principal: sumResults(results, 'principal'),
    repayments: {
      general,
      incomeContingent,
    },
    disbursementSchedule: results.flatMap(({ disbursementSchedule }) => (
      disbursementSchedule
    )),
    componentRepaymentSchedules: general?.componentRepaymentSchedules ?? [],
    monthlyRepaymentSchedule: general?.monthlyRepaymentSchedule ?? [],
    repaymentStartDate: general?.repaymentStartDate ?? null,
    repaymentEndDate: general?.repaymentEndDate ?? null,
    balanceAtGraduation: sumResults(results, 'balanceAtGraduation'),
    duringStudyPayment: sumResults(results, 'duringStudyPayment'),
    duringStudyMonthlyPayment: sumResults(results, 'duringStudyMonthlyPayment'),
    firstYearRepayment: calculationPossible
      ? firstYearScheduledRepayment + annualMandatoryRepayment
      : null,
    firstMonthPayment: general?.firstMonthPayment ?? null,
    monthlyScheduledPayment,
    annualMandatoryRepayment,
    monthlyAverageMandatoryRepayment,
    monthlyBurdenForComparison,
    currentValueComparison,
    projectedBalance: sumKnownResults(results, 'projectedBalance'),
    totalInterest: incomeContingent
      ? null
      : general?.totalInterest ?? 0,
    totalRepayment: incomeContingent
      ? null
      : general?.totalRepayment ?? 0,
    graceInterest: general?.graceInterest ?? 0,
    repaymentInterest: general?.repaymentInterest ?? 0,
    paymentMonths: general?.paymentMonths ?? null,
    repaymentMethod: general?.repaymentMethod ?? null,
    calculationPossible,
    reason: results.find(({ calculationPossible: possible }) => !possible)?.reason,
    assumptions: [
      ...new Set(results.flatMap(({ assumptions }) => assumptions)),
    ],
  };
}
