import { calculateFundingSummary } from '../funding/calculate-funding.js';
import { monthlyWorkIncome } from '../funding/work-income.js';
import { calculateLoan } from '../loans/calculate-loan.js';
import { nonNegative } from '../shared/numbers.js';
import { SCENARIO_DEFINITIONS } from './definitions.js';
import { normalizeStress } from './normalize-stress.js';

export function calculateScenario(profile, definition, stress = {}, policy) {
  const normalizedStress = normalizeStress(stress);
  const funding = calculateFundingSummary(profile, normalizedStress);
  const workMonthly = monthlyWorkIncome(definition.workHours, profile.hourlyWage);
  const workTotal = workMonthly * funding.studyMonths;
  const needAfterSupportAndWork = Math.max(
    0,
    funding.totalNeed - funding.confirmedLivingGrantTotal - workTotal,
  );
  const newLoan = Math.min(
    nonNegative(profile.loanCap) * definition.loanShare,
    needAfterSupportAndWork,
  );
  const loan = calculateLoan(
    profile,
    newLoan,
    funding,
    normalizedStress,
    policy,
  );
  const availableForLiving = funding.confirmedLivingGrantTotal
    + workTotal
    + newLoan
    - funding.educationNeed
    - loan.duringStudyPayment;
  const possibleCollegeSpend = funding.studyMonths > 0
    ? availableForLiving / funding.studyMonths
    : null;
  const fundingGap = Math.max(
    0,
    funding.totalNeed
      + loan.duringStudyPayment
      - funding.confirmedLivingGrantTotal
      - workTotal
      - newLoan,
  );
  const adjustedSalary = nonNegative(profile.salary)
    * (1 - normalizedStress.salaryReductionRate);
  const possibleCareerSpend = loan.monthlyEquivalent == null
    ? null
    : adjustedSalary - loan.monthlyEquivalent;
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
    funding,
    workMonthly,
    workTotal,
    newLoan,
    totalLoanPrincipal: loan.principal,
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
