export const DEFAULT_INPUTS = Object.freeze({
  school: '',
  academicYear: '2',
  tuitionPerSemester: 420,
  supportBracket: '',
  region: '부산광역시',
  specialQualifications: [],
  desiredCollegeSpend: 130,
  desiredCareerSpend: 250,
  currentWorkHours: 20,
  desiredWorkHours: 10,
  hourlyWage: 12000,
  graduationYears: 4,
  salary: 300,
  loanCap: 5000,
  annualRate: 1.5,
  repaymentYears: 5,
  existingLoanBalance: 0,
});

export const SAMPLE_INPUTS = Object.freeze({
  ...DEFAULT_INPUTS,
  school: '한빛대학교',
  supportBracket: '3',
  region: '부산광역시',
  specialQualifications: ['비수도권 인재'],
  existingLoanBalance: 0,
});

export const SCENARIO_DEFINITIONS = Object.freeze([
  {
    id: 'focus',
    name: '학업시간 확보형',
    summary: '근로를 멈추고 학업시간을 확보합니다.',
    workHours: 0,
    loanShare: 1,
  },
  {
    id: 'balance',
    name: '균형형',
    summary: '근로와 공적 대출을 함께 줄여 격차를 나눕니다.',
    workHours: 10,
    loanShare: 0.7,
    recommended: true,
  },
  {
    id: 'debt-min',
    name: '부채 최소형',
    summary: '현재 근로를 유지하고 신규 대출을 최소화합니다.',
    workHours: 20,
    loanShare: 0,
  },
]);

export function monthlyWorkIncome(workHours, hourlyWage) {
  const hours = Number(workHours) || 0;
  const wage = Number(hourlyWage) || 0;
  return (hours * wage * 4) / 10000;
}

export function amortizedLoan(principal, annualRate, years, defermentMonths = 0) {
  const originalPrincipal = Math.max(0, Number(principal) || 0);
  const monthlyRate = Math.max(0, Number(annualRate) || 0) / 100 / 12;
  const paymentMonths = Math.max(1, Math.round((Number(years) || 0) * 12));
  const delayedPrincipal = monthlyRate > 0
    ? originalPrincipal * ((1 + monthlyRate) ** Math.max(0, defermentMonths))
    : originalPrincipal;

  if (delayedPrincipal === 0) {
    return {
      principal: 0,
      delayedPrincipal: 0,
      monthlyPayment: 0,
      totalInterest: 0,
      totalRepayment: 0,
    };
  }

  const monthlyPayment = monthlyRate === 0
    ? delayedPrincipal / paymentMonths
    : delayedPrincipal * (monthlyRate / (1 - ((1 + monthlyRate) ** -paymentMonths)));
  const totalRepayment = monthlyPayment * paymentMonths;

  return {
    principal: originalPrincipal,
    delayedPrincipal,
    monthlyPayment,
    totalInterest: Math.max(0, totalRepayment - originalPrincipal),
    totalRepayment,
  };
}

function normalizeStress(stress = {}) {
  return {
    scholarshipMiss: Boolean(stress.scholarshipMiss),
    employmentDelayMonths: Math.max(0, Number(stress.employmentDelayMonths) || 0),
    salaryReductionRate: Math.min(1, Math.max(0, Number(stress.salaryReductionRate) || 0)),
    graduationDelayMonths: Math.max(0, Number(stress.graduationDelayMonths) || 0),
  };
}

export function calculateFundingSummary(profile, scholarshipTotal, stress = {}) {
  const normalizedStress = normalizeStress(stress);
  const baseYears = Math.max(0.5, Number(profile.graduationYears) || 0);
  const baseMonths = Math.round(baseYears * 12);
  const additionalStudyMonths = normalizedStress.graduationDelayMonths;
  const studyMonths = baseMonths + additionalStudyMonths;
  const semesters = Math.round(baseYears * 2) + Math.ceil(additionalStudyMonths / 6);
  const educationNeed = Math.max(0, Number(profile.tuitionPerSemester) || 0) * semesters;
  const livingNeed = Math.max(0, Number(profile.desiredCollegeSpend) || 0) * studyMonths;
  const appliedScholarship = normalizedStress.scholarshipMiss ? 0 : Math.min(educationNeed, scholarshipTotal);

  return {
    studyMonths,
    semesters,
    educationNeed,
    livingNeed,
    totalNeed: educationNeed + livingNeed,
    scholarshipTotal: appliedScholarship,
    remainingAfterScholarship: Math.max(0, educationNeed + livingNeed - appliedScholarship),
  };
}

export function calculateScenario(profile, scholarshipTotal, definition, stress = {}) {
  const normalizedStress = normalizeStress(stress);
  const funding = calculateFundingSummary(profile, scholarshipTotal, normalizedStress);
  const workMonthly = monthlyWorkIncome(definition.workHours, profile.hourlyWage);
  const workTotal = workMonthly * funding.studyMonths;
  const newLoan = Math.min(
    Math.max(0, Number(profile.loanCap) || 0) * definition.loanShare,
    funding.remainingAfterScholarship,
  );
  const totalLoanPrincipal = newLoan + Math.max(0, Number(profile.existingLoanBalance) || 0);
  const educationGap = Math.max(0, funding.educationNeed - funding.scholarshipTotal);
  const availableForLiving = Math.max(0, workTotal + newLoan - educationGap);
  const possibleCollegeSpend = funding.studyMonths > 0 ? availableForLiving / funding.studyMonths : 0;
  const fundingGap = Math.max(0, funding.totalNeed - funding.scholarshipTotal - workTotal - newLoan);
  const loan = amortizedLoan(
    totalLoanPrincipal,
    profile.annualRate,
    profile.repaymentYears,
    normalizedStress.employmentDelayMonths,
  );
  const adjustedSalary = Math.max(0, Number(profile.salary) || 0) * (1 - normalizedStress.salaryReductionRate);
  const possibleCareerSpend = adjustedSalary - loan.monthlyPayment;
  const transitionGap = normalizedStress.employmentDelayMonths * Math.max(0, Number(profile.desiredCareerSpend) || 0);
  const minimumLivingLine = Math.min(180, Math.max(0, Number(profile.desiredCareerSpend) || 0) * 0.72);
  const calculationPossible = Number.isFinite(possibleCareerSpend) && possibleCareerSpend >= 0;
  const safety = !calculationPossible
    ? 'calculation-impossible'
    : possibleCareerSpend < minimumLivingLine
      ? 'at-risk'
      : possibleCareerSpend < Number(profile.desiredCareerSpend)
        ? 'watch'
        : 'safe';

  return {
    ...definition,
    funding,
    workMonthly,
    workTotal,
    newLoan,
    totalLoanPrincipal,
    possibleCollegeSpend,
    collegeSpendGap: possibleCollegeSpend - Number(profile.desiredCollegeSpend),
    fundingGap,
    loan,
    adjustedSalary,
    possibleCareerSpend,
    careerSpendGap: possibleCareerSpend - Number(profile.desiredCareerSpend),
    transitionGap,
    safety,
    calculationPossible,
    stress: normalizedStress,
  };
}

export function calculateAllScenarios(profile, scholarshipTotal, stress = {}) {
  return SCENARIO_DEFINITIONS.map((definition) => (
    calculateScenario(profile, scholarshipTotal, definition, stress)
  ));
}

export function calculateStressPreview(profile, scholarshipTotal, definition) {
  const baseline = calculateScenario(profile, scholarshipTotal, definition);
  const noScholarship = calculateScenario(profile, scholarshipTotal, definition, { scholarshipMiss: true });
  const delayed = calculateScenario(profile, scholarshipTotal, definition, { employmentDelayMonths: 12 });

  return {
    scholarshipCollegeDelta: noScholarship.possibleCollegeSpend - baseline.possibleCollegeSpend,
    delayedPaymentDelta: delayed.loan.monthlyPayment - baseline.loan.monthlyPayment,
    delayedTransitionGap: delayed.transitionGap,
  };
}

export function roundMoney(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

export function formatMoney(value, options = {}) {
  const { digits = 0, unit = '만원' } = options;
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${safeValue.toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}${unit}`;
}

