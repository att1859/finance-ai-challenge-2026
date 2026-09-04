import { LOAN_POLICY_SNAPSHOT } from '../../policies/loans/2026.js';
import { calculateFundingSummary } from '../funding/calculate-funding.js';
import { calculateMonthlyWorkIncome } from '../funding/work-income.js';
import { calculateLoan } from '../loans/calculate-loan.js';
import { evaluateLoanCompositionEligibility } from '../loans/eligibility.js';
import { createLoanComposition } from '../loans/loan-composition.js';
import { nonNegative } from '../shared/numbers.js';
import { SCENARIO_DEFINITIONS } from './definitions.js';
import { normalizeStress } from './normalize-stress.js';

export function calculateScenario(
  profile,
  definition,
  stress = {},
  policySnapshot = LOAN_POLICY_SNAPSHOT,
) {
  const normalizedStress = normalizeStress(stress);
  const funding = calculateFundingSummary(profile, normalizedStress);
  const currentWorkHours = nonNegative(profile.currentWorkHours);
  const workHours = Math.round(
    currentWorkHours * nonNegative(definition.workRatio) * 2,
  ) / 2;
  const workIncomeBreakdown = calculateMonthlyWorkIncome({
    weeklyHours: workHours,
    hourlyWage: profile.hourlyWage,
    taxPreset: profile.workTaxPreset,
  });
  const workMonthly = workIncomeBreakdown.netMonthly;
  const workTotal = workMonthly * funding.studyMonths;
  const needAfterWork = Math.max(
    0,
    funding.totalNeed - workTotal,
  );
  const plannedPrincipal = Math.min(
    nonNegative(profile.loanCap) * definition.loanShare,
    needAfterWork,
  );
  const tuitionPrincipal = Math.min(plannedPrincipal, funding.educationNeed);
  const livingPrincipal = Math.max(0, plannedPrincipal - tuitionPrincipal);
  const selectedProduct = profile.loanType === 'income-contingent'
    ? 'income-contingent'
    : 'general';
  const draftLoanComposition = createLoanComposition({
    policySnapshot,
    principalByPurpose: {
      tuition: tuitionPrincipal,
      living: livingPrincipal,
    },
    productByPurpose: {
      tuition: selectedProduct,
      living: selectedProduct,
    },
    semesters: funding.semesters,
  });
  const loanComposition = evaluateLoanCompositionEligibility({
    applicant: profile,
    composition: draftLoanComposition,
    policySnapshot,
  });
  const loan = calculateLoan(
    profile,
    loanComposition,
    funding,
    normalizedStress,
    policySnapshot,
  );
  const compositionPrincipal = loanComposition.totals.combined;
  const availableForLiving = workTotal
    + compositionPrincipal
    - funding.educationNeed
    - loan.duringStudyPayment;
  const possibleCollegeSpend = funding.studyMonths > 0
    ? availableForLiving / funding.studyMonths
    : null;
  const fundingGap = Math.max(
    0,
    funding.totalNeed
      + loan.duringStudyPayment
      - workTotal
      - compositionPrincipal,
  );
  const adjustedSalary = nonNegative(profile.salary)
    * (1 - normalizedStress.salaryReductionRate);
  const possibleCareerSpend = loan.monthlyBurdenForComparison == null
    ? null
    : adjustedSalary - loan.monthlyBurdenForComparison;
  const transitionGap = normalizedStress.employmentDelayMonths
    * nonNegative(profile.desiredCareerSpend);
  const minimumLivingLine = Math.min(
    180,
    nonNegative(profile.desiredCareerSpend) * 0.72,
  );
  const calculationPossible = loan.calculationPossible
    && Number.isFinite(possibleCollegeSpend)
    && Number.isFinite(possibleCareerSpend);
  const safety = !calculationPossible
    ? 'calculation-impossible'
    : possibleCareerSpend < 0
      ? 'deficit'
      : possibleCareerSpend < minimumLivingLine
        ? 'at-risk'
        : possibleCareerSpend < nonNegative(profile.desiredCareerSpend)
          ? 'watch'
          : 'safe';

  return {
    ...definition,
    workHours,
    funding,
    workMonthly,
    workTotal,
    workHoursReduced: Math.max(
      currentWorkHours - workHours,
      0,
    ),
    workIncomeBreakdown,
    loanComposition,
    possibleCollegeSpend,
    collegeSpendGap: possibleCollegeSpend == null
      ? null
      : possibleCollegeSpend - nonNegative(profile.desiredCollegeSpend),
    fundingGap,
    loan,
    adjustedSalary,
    possibleCareerSpend,
    careerSpendGap: possibleCareerSpend == null
      ? null
      : possibleCareerSpend - nonNegative(profile.desiredCareerSpend),
    transitionGap,
    safety,
    calculationPossible,
    stress: normalizedStress,
  };
}

export function calculateAllScenarios(profile, stress = {}, policy) {
  return SCENARIO_DEFINITIONS.map(
    (definition) => calculateScenario(profile, definition, stress, policy),
  );
}
