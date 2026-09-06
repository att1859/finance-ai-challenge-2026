import { MINIMUM_WAGE } from '../funding/no-loan-comparison.js';
import { LOAN_POLICY_SNAPSHOT } from '../../policies/loans/2026.js';
import { calculateFundingSummary } from '../funding/calculate-funding.js';
import { calculateLoan } from '../loans/calculate-loan.js';
import { evaluateLoanCompositionEligibility } from '../loans/eligibility.js';
import { createLoanComposition } from '../loans/loan-composition.js';
import { buildCalculationPolicyReferences } from '../loans/policy-references.js';
import { nonNegative } from '../shared/numbers.js';
import { SCENARIO_DEFINITIONS } from './definitions.js';
import { buildCalculationTrace } from './calculation-trace.js';
import { normalizeStress } from './normalize-stress.js';
import { livingCumulativeLimit, requestedLivingAmounts, validateLivingAmount } from './custom-scenario.js';

function calculateTuitionFunding(profile, definition) {
  const billedPerSemester = nonNegative(profile.tuitionPerSemester);
  const availableContribution = Math.min(billedPerSemester, nonNegative(profile.tuitionContributionPerSemester));
  const minimumLoan = billedPerSemester - availableContribution;
  const strategy = definition.custom?.tuitionStrategy ?? (definition.custom ? 'balance-v1' : definition.strategy);
  const loanPerSemester = strategy === 'maximum-use' ? billedPerSemester
    : strategy === 'balance-v1' ? (minimumLoan + billedPerSemester) / 2 : minimumLoan;
  const contributionPerSemester = billedPerSemester - loanPerSemester;
  return { billedPerSemester, availableContribution, minimumLoan, contributionPerSemester,
    retainedContribution: availableContribution - contributionPerSemester,
    loanPerSemester, principal: loanPerSemester, semesters: 1 };
}

function calculateLivingFunding(profile, definition, funding, policySnapshot, selection) {
  const policy = policySnapshot.purposes.living;
  const currentMonthlyIncome = nonNegative(profile.currentMonthlyIncome);
  const monthCount = funding.fundingMonths;
  const livingNeed = nonNegative(profile.desiredCollegeSpend) * monthCount;
  const resources = currentMonthlyIncome * monthCount;
  const rawRequired = Math.max(0, livingNeed - resources);
  const cumulativeLimit = livingCumulativeLimit(profile, policySnapshot);
  const limit = Math.min(policy.semesterLimit, cumulativeLimit);
  // Living borrowing targets only the monthly spending gap; interest stays separate.
  let requested = definition.strategy === 'maximum-use' ? limit
    : definition.strategy === 'balance-v1' ? (rawRequired > 0 ? Math.max(policy.minimumPerDisbursement, Math.ceil(rawRequired / policy.applicationUnit) * policy.applicationUnit) : 0)
    : 0;
  if (definition.custom) {
    requested = requestedLivingAmounts(definition.custom, 1)[0];
    const error = validateLivingAmount(requested, policySnapshot);
    if (error) throw new RangeError(error);
  }
  if (selection.includeLiving === false) requested = 0;
  const principal = Math.min(requested, limit);
  const unmetLivingGap = Math.max(0, rawRequired - principal);
  const row = { semester: 1, monthCount, livingNeed, currentIncome: resources, rawRequired, applicationAdjusted: requested,
    requestedPrincipal: requested, roundingAdjustment: definition.custom ? 0 : Math.max(0, requested - rawRequired),
    semesterLimit: policy.semesterLimit, cumulativeLimitRemainingBefore: cumulativeLimit, principal, unmetLivingGap, limitedByPolicy: principal < requested };
  return { currentMonthlyIncome, currentIncomeTotal: resources, cumulativeLimit, semesters: [row], principal, rawRequired, unmetLivingGap, manual: Boolean(definition.custom) };
}

export function calculateScenario(
  profile,
  definition,
  stress = {},
  policySnapshot = LOAN_POLICY_SNAPSHOT,
) {
  if (definition.custom) profile = { ...profile, graceYears: definition.custom.graceYears, repaymentYears: definition.custom.repaymentYears };
  const normalizedStress = normalizeStress(stress);
  const funding = calculateFundingSummary(profile, normalizedStress);
  const resultSelection = profile.resultSelections?.[definition.id] ?? {};
  const tuitionFunding = calculateTuitionFunding(profile, definition);
  const [selectedTuitionProduct, selectedLivingProduct] = String(resultSelection.candidateId ?? definition.custom?.candidateId ?? `${profile.loanType ?? 'general'}:${profile.loanType ?? 'general'}`).split(':');
  const tuitionProduct = selectedTuitionProduct === 'income-contingent' ? 'income-contingent' : 'general';
  const livingProduct = selectedLivingProduct === 'income-contingent' ? 'income-contingent' : 'general';
  const livingLoan = calculateLivingFunding(profile, definition, funding, policySnapshot, resultSelection);
  const draftLoanComposition = createLoanComposition({
    policySnapshot,
    principalByPurpose: {
      tuition: tuitionFunding.principal,
      living: livingLoan.principal,
    },
    principalByPurposeSemester: {
      tuition: Array.from(
        { length: funding.semesters },
        () => tuitionFunding.loanPerSemester,
      ),
      living: livingLoan.semesters.map(({ principal }) => principal),
    },
    productByPurpose: {
      tuition: tuitionProduct,
      living: livingProduct,
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
  const currentSemesterPayment = (loan.monthlyRepaymentSchedule ?? []).filter(row => row.globalMonth < funding.fundingMonths).reduce((sum, row) => sum + row.totalPayment, 0);
  const possibleCollegeSpend = (livingLoan.currentIncomeTotal + livingLoan.principal) / funding.fundingMonths;
  const fundingGap = Math.max(0, nonNegative(profile.desiredCollegeSpend) - possibleCollegeSpend) * funding.fundingMonths;
  const adjustedSalary = nonNegative(profile.salary) * (1 - normalizedStress.salaryReductionRate);
  const possibleCareerSpend = loan.monthlyBurdenForComparison == null ? null : adjustedSalary - loan.monthlyBurdenForComparison;
  const calculationPossible = loan.calculationPossible && Number.isFinite(possibleCollegeSpend) && Number.isFinite(possibleCareerSpend);
  const safety = !calculationPossible ? 'calculation-impossible' : possibleCareerSpend < 0 ? 'deficit' : 'safe';
  const scenario = {
    ...definition,
    funding,
    currentMonthlyIncome: livingLoan.currentMonthlyIncome,
    currentIncomeTotal: livingLoan.currentIncomeTotal,
    currentSemesterPayment,
    tuitionFunding,
    livingLoan,
    unmetLivingGap: fundingGap,
    loanComposition,
    possibleCollegeSpend,
    collegeSpendGap: possibleCollegeSpend == null
      ? null
      : possibleCollegeSpend - nonNegative(profile.desiredCollegeSpend),
    fundingGap,
    monthlyLivingGap: fundingGap / funding.fundingMonths,
    monthlyWorkHours: fundingGap / funding.fundingMonths * 10000 / MINIMUM_WAGE.hourly,
    collegeAfterRepayment: possibleCollegeSpend - currentSemesterPayment / funding.fundingMonths,
    loan,
    adjustedSalary,
    possibleCareerSpend,
    safety,
    calculationPossible,
    stress: normalizedStress,
  };
  const policyReferences = buildCalculationPolicyReferences({
    scenario,
    loanComposition,
    loan,
    policySnapshot,
  });

  return {
    ...scenario,
    policyReferences,
    calculationTrace: buildCalculationTrace({
      profile,
      scenario,
      loanComposition,
      loan,
      policyReferences,
    }),
  };
}

export function calculateAllScenarios(profile, stress = {}, policy) {
  return [...SCENARIO_DEFINITIONS, ...(profile.customScenarios ?? []).map(custom => ({
    id: custom.id, name: custom.name, summary: '직접 정한 이번 학기 생활비 대출로 계산합니다.', strategy: 'custom', custom,
  }))].map(definition => calculateScenario(profile, definition, stress, policy));
}

export function calculateFullLoanCapView(
  profile,
  stress = {},
  policySnapshot = LOAN_POLICY_SNAPSHOT,
) {
  const funding = calculateFundingSummary(profile, normalizeStress(stress));
  const livingPolicy = policySnapshot.purposes.living;
  const cumulativeLimit = livingCumulativeLimit(profile, policySnapshot);
  const livingPrincipal = Math.min(
    livingPolicy.semesterLimit * funding.semesters,
    cumulativeLimit,
  );

  return Object.freeze({
    id: 'full-loan-cap',
    name: '풀대출 상한 보기',
    isRecommendation: false,
    semesters: funding.semesters,
    livingPrincipal,
    livingPerSemester: Math.min(livingPolicy.semesterLimit, cumulativeLimit),
    semesterLimit: livingPolicy.semesterLimit,
    cumulativeLimit,
    policyReference: Object.freeze({
      snapshotId: policySnapshot.snapshotId,
      academicTerm: policySnapshot.academicTerm,
      checkedAt: policySnapshot.checkedAt,
      sourceIds: Object.freeze(['kosaf-overview', 'kosaf-living']),
    }),
  });
}
