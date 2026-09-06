import { LOAN_POLICY_SNAPSHOT } from '../../policies/loans/2026.js';
import { calculateFundingSummary } from '../funding/calculate-funding.js';
import { calculateMonthlyWorkIncome } from '../funding/work-income.js';
import { calculateLoan } from '../loans/calculate-loan.js';
import { evaluateLoanCompositionEligibility } from '../loans/eligibility.js';
import { createLoanComposition } from '../loans/loan-composition.js';
import { buildCalculationPolicyReferences } from '../loans/policy-references.js';
import { nonNegative } from '../shared/numbers.js';
import { SCENARIO_DEFINITIONS } from './definitions.js';
import { buildCalculationTrace } from './calculation-trace.js';
import { normalizeStress } from './normalize-stress.js';

const HOURS_STEP = 0.5;
const MONTHS_PER_SEMESTER = 6;

function roundToHoursStep(value) {
  return Math.round(nonNegative(value) / HOURS_STEP) * HOURS_STEP;
}

function ceilToUnit(value, unit) {
  if (!unit) return value;
  return Math.ceil(value / unit) * unit;
}

function getLivingCumulativeLimit(profile, policySnapshot) {
  const limits = policySnapshot.purposes.living.cumulativePrincipalLimits;
  const requestedKey = profile.livingCumulativeLimitKey;

  if (requestedKey && Number.isFinite(limits[requestedKey])) {
    return limits[requestedKey];
  }

  return profile.academicLevel === 'graduate'
    ? limits.generalGraduateMaster
    : limits.undergraduateFourYearOrCollege;
}

function getSemesterMonthCounts(studyMonths, semesters) {
  return Array.from({ length: semesters }, (_, index) => (
    Math.max(0, Math.min(MONTHS_PER_SEMESTER, studyMonths - index * MONTHS_PER_SEMESTER))
  ));
}

function calculateLivingFundingAtHours({
  profile,
  funding,
  workHours,
  policySnapshot,
}) {
  const livingPolicy = policySnapshot.purposes.living;
  const workIncomeBreakdown = calculateMonthlyWorkIncome({
    weeklyHours: workHours,
    hourlyWage: profile.hourlyWage,
    taxPreset: profile.workTaxPreset,
  });
  const cumulativeLimit = getLivingCumulativeLimit(profile, policySnapshot);
  let remainingCumulativeLimit = cumulativeLimit;
  const semesterMonthCounts = getSemesterMonthCounts(
    funding.studyMonths,
    funding.semesters,
  );
  const semesters = semesterMonthCounts.map((monthCount, index) => {
    const livingNeed = nonNegative(profile.desiredCollegeSpend) * monthCount;
    const workIncome = workIncomeBreakdown.netMonthly * monthCount;
    const rawRequired = Math.max(0, livingNeed - workIncome);
    const applicationAdjusted = rawRequired === 0
      ? 0
      : Math.max(
        livingPolicy.minimumPerDisbursement,
        ceilToUnit(rawRequired, livingPolicy.applicationUnit),
      );
    const availableLimit = Math.max(
      0,
      Math.min(livingPolicy.semesterLimit, remainingCumulativeLimit),
    );
    const principal = Math.min(applicationAdjusted, availableLimit);
    const unmetLivingGap = Math.max(0, rawRequired - principal);
    remainingCumulativeLimit -= principal;

    return Object.freeze({
      semester: index + 1,
      monthCount,
      livingNeed,
      workIncome,
      rawRequired,
      applicationAdjusted,
      roundingAdjustment: applicationAdjusted - rawRequired,
      semesterLimit: livingPolicy.semesterLimit,
      cumulativeLimitRemainingBefore: remainingCumulativeLimit + principal,
      principal,
      unmetLivingGap,
    });
  });

  return Object.freeze({
    workHours,
    workIncomeBreakdown,
    workMonthly: workIncomeBreakdown.netMonthly,
    workTotal: workIncomeBreakdown.netMonthly * funding.studyMonths,
    cumulativeLimit,
    semesters: Object.freeze(semesters),
    principal: semesters.reduce((sum, semester) => sum + semester.principal, 0),
    rawRequired: semesters.reduce((sum, semester) => sum + semester.rawRequired, 0),
    unmetLivingGap: semesters.reduce((sum, semester) => sum + semester.unmetLivingGap, 0),
  });
}

function findMaximumUseLivingFunding(profile, funding, policySnapshot) {
  const currentWorkHours = roundToHoursStep(profile.currentWorkHours);
  const candidateCount = Math.round(currentWorkHours / HOURS_STEP);

  for (let index = 0; index <= candidateCount; index += 1) {
    const candidate = calculateLivingFundingAtHours({
      profile,
      funding,
      workHours: index * HOURS_STEP,
      policySnapshot,
    });
    if (candidate.unmetLivingGap === 0) return candidate;
  }

  return calculateLivingFundingAtHours({
    profile,
    funding,
    workHours: currentWorkHours,
    policySnapshot,
  });
}

function selectScenarioLivingFunding({
  profile,
  definition,
  funding,
  policySnapshot,
}) {
  const currentWorkHours = roundToHoursStep(profile.currentWorkHours);
  const maximumUse = findMaximumUseLivingFunding(
    profile,
    funding,
    policySnapshot,
  );
  let workHours = currentWorkHours;

  if (definition.strategy === 'maximum-use') {
    workHours = maximumUse.workHours;
  } else if (definition.strategy === 'balance-v1') {
    const maximumReduction = currentWorkHours - maximumUse.workHours;
    workHours = roundToHoursStep(currentWorkHours - maximumReduction * 0.5);
  }

  return calculateLivingFundingAtHours({
    profile,
    funding,
    workHours,
    policySnapshot,
  });
}

function excludeLivingLoan(profile, funding, policySnapshot) {
  const currentWorkHours = roundToHoursStep(profile.currentWorkHours);
  const calculated = calculateLivingFundingAtHours({
    profile,
    funding,
    workHours: currentWorkHours,
    policySnapshot,
  });
  const semesters = calculated.semesters.map((semester) => Object.freeze({
    ...semester,
    principal: 0,
    unmetLivingGap: semester.rawRequired,
  }));

  return Object.freeze({
    ...calculated,
    semesters: Object.freeze(semesters),
    principal: 0,
    unmetLivingGap: calculated.rawRequired,
  });
}

function calculateTuitionFunding(profile, funding) {
  const billedPerSemester = nonNegative(profile.tuitionPerSemester);
  const contributionPerSemester = Math.min(
    billedPerSemester,
    nonNegative(profile.tuitionContributionPerSemester),
  );
  const loanPerSemester = Math.max(0, billedPerSemester - contributionPerSemester);

  return Object.freeze({
    billedPerSemester,
    contributionPerSemester,
    loanPerSemester,
    principal: loanPerSemester * funding.semesters,
    semesters: funding.semesters,
  });
}

export function calculateScenario(
  profile,
  definition,
  stress = {},
  policySnapshot = LOAN_POLICY_SNAPSHOT,
) {
  const normalizedStress = normalizeStress(stress);
  const funding = calculateFundingSummary(profile, normalizedStress);
  const currentWorkHours = roundToHoursStep(profile.currentWorkHours);
  const resultSelection = profile.resultSelections?.[definition.id] ?? {};
  const livingLoan = resultSelection.includeLiving === false
    ? excludeLivingLoan(profile, funding, policySnapshot)
    : selectScenarioLivingFunding({
    profile,
    definition,
    funding,
    policySnapshot,
    });
  const workHours = livingLoan.workHours;
  const tuitionFunding = calculateTuitionFunding(profile, funding);
  const [selectedTuitionProduct, selectedLivingProduct] = String(
    resultSelection.candidateId ?? `${profile.loanType ?? 'general'}:${profile.loanType ?? 'general'}`,
  ).split(':');
  const tuitionProduct = selectedTuitionProduct === 'income-contingent'
    ? 'income-contingent'
    : 'general';
  const livingProduct = selectedLivingProduct === 'income-contingent'
    ? 'income-contingent'
    : 'general';
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
  const availableForLiving = livingLoan.workTotal
    + livingLoan.principal
    - loan.duringStudyPayment;
  const possibleCollegeSpend = funding.studyMonths > 0
    ? availableForLiving / funding.studyMonths
    : null;
  const fundingGap = livingLoan.unmetLivingGap;
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

  const scenario = {
    ...definition,
    workHours,
    funding,
    workMonthly: livingLoan.workMonthly,
    workTotal: livingLoan.workTotal,
    workHoursReduced: Math.max(currentWorkHours - workHours, 0),
    workIncomeBreakdown: livingLoan.workIncomeBreakdown,
    tuitionFunding,
    livingLoan,
    unmetLivingGap: livingLoan.unmetLivingGap,
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

function scenarioSignature(scenario) {
  return [
    scenario.workHours,
    scenario.loanComposition.totals.tuition,
    scenario.loanComposition.totals.living,
  ].join(':');
}

export function calculateAllScenarios(profile, stress = {}, policy) {
  const scenarios = SCENARIO_DEFINITIONS.map(
    (definition) => calculateScenario(profile, definition, stress, policy),
  );
  const policySnapshot = policy ?? LOAN_POLICY_SNAPSHOT;
  const funding = calculateFundingSummary(profile, normalizeStress(stress));
  const naturalMaximumUse = findMaximumUseLivingFunding(
    profile,
    funding,
    policySnapshot,
  );
  const shouldRemoveDuplicates = roundToHoursStep(profile.currentWorkHours)
    - naturalMaximumUse.workHours === 0;
  if (!shouldRemoveDuplicates) return scenarios;
  const seen = new Set();

  return scenarios.filter((scenario) => {
    const signature = scenarioSignature(scenario);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

export function calculateFullLoanCapView(
  profile,
  stress = {},
  policySnapshot = LOAN_POLICY_SNAPSHOT,
) {
  const funding = calculateFundingSummary(profile, normalizeStress(stress));
  const livingPolicy = policySnapshot.purposes.living;
  const cumulativeLimit = getLivingCumulativeLimit(profile, policySnapshot);
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
