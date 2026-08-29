import { INCOME_CONTINGENT_POLICY } from '../data/loanPolicies.js';

export const DEFAULT_INPUTS = Object.freeze({
  school: '', academicYear: '2', tuitionPerSemester: 420, confirmedLivingGrantTotal: 0,
  supportBracket: '', region: '부산광역시', specialQualifications: [],
  desiredCollegeSpend: 130, desiredCareerSpend: 250, currentWorkHours: 20,
  desiredWorkHours: 10, hourlyWage: 12000, graduationYears: 4, salary: 300,
  loanCap: 5000, annualRate: 1.5, repaymentYears: 5, graceYears: 0,
  repaymentMethod: 'equal-payment', loanType: 'general', existingLoanBalance: 0,
});

export const SAMPLE_INPUTS = Object.freeze({
  ...DEFAULT_INPUTS, school: '한빛대학교', supportBracket: '3',
  region: '부산광역시', specialQualifications: ['비수도권 인재'],
});

export const SCENARIO_DEFINITIONS = Object.freeze([
  { id: 'focus', name: '학업시간 확보형', summary: '근로를 줄여 학업시간을 확보합니다.', workHours: 0, loanShare: 1 },
  { id: 'balance', name: '균형형', summary: '근로와 대출을 함께 사용해 부담을 나눕니다.', workHours: 10, loanShare: 0.7, defaultView: true },
  { id: 'debt-min', name: '부채 최소형', summary: '현재 근로를 유지해 신규 대출을 줄입니다.', workHours: 20, loanShare: 0 },
]);

const numberOrZero = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const nonNegative = (value) => Math.max(0, numberOrZero(value));

export function monthlyWorkIncome(workHours, hourlyWage) {
  return (nonNegative(workHours) * nonNegative(hourlyWage) * 4) / 10000;
}

export function amortizedLoan(principal, annualRate, years) {
  const originalPrincipal = nonNegative(principal);
  const monthlyRate = nonNegative(annualRate) / 100 / 12;
  const paymentMonths = Math.max(1, Math.round(nonNegative(years) * 12));
  if (originalPrincipal === 0) return { principal: 0, monthlyPayment: 0, totalInterest: 0, totalRepayment: 0, paymentMonths };
  const monthlyPayment = monthlyRate === 0
    ? originalPrincipal / paymentMonths
    : originalPrincipal * (monthlyRate / (1 - ((1 + monthlyRate) ** -paymentMonths)));
  const totalRepayment = monthlyPayment * paymentMonths;
  return { principal: originalPrincipal, monthlyPayment, totalInterest: Math.max(0, totalRepayment - originalPrincipal), totalRepayment, paymentMonths };
}

export function normalizeStress(stress = {}) {
  return {
    employmentDelayMonths: Math.max(0, Math.round(numberOrZero(stress.employmentDelayMonths))),
    salaryReductionRate: Math.min(1, Math.max(0, numberOrZero(stress.salaryReductionRate))),
    graduationDelayMonths: Math.max(0, Math.round(numberOrZero(stress.graduationDelayMonths))),
  };
}

export function calculateFundingSummary(profile, stress = {}) {
  const normalizedStress = normalizeStress(stress);
  const baseStudyMonths = Math.max(6, Math.round(Math.max(0.5, numberOrZero(profile.graduationYears)) * 12));
  const studyMonths = baseStudyMonths + normalizedStress.graduationDelayMonths;
  const semesters = Math.ceil(studyMonths / 6);
  const educationNeed = nonNegative(profile.tuitionPerSemester) * semesters;
  const livingNeed = nonNegative(profile.desiredCollegeSpend) * studyMonths;
  const confirmedLivingGrantTotal = nonNegative(profile.confirmedLivingGrantTotal);
  const totalNeed = educationNeed + livingNeed;
  return { baseStudyMonths, studyMonths, semesters, educationNeed, livingNeed, totalNeed, confirmedLivingGrantTotal, remainingAfterConfirmedSupport: Math.max(0, totalNeed - confirmedLivingGrantTotal) };
}

export function buildLoanDisbursementSchedule(principal, semesters, annualRate) {
  const safePrincipal = nonNegative(principal);
  const safeSemesters = Math.max(1, Math.round(nonNegative(semesters)));
  const monthlyRate = nonNegative(annualRate) / 100 / 12;
  const equalAmount = safePrincipal / safeSemesters;
  const totalStudyMonths = safeSemesters * 6;
  return Array.from({ length: safeSemesters }, (_, index) => {
    const monthsToGraduation = Math.max(0, totalStudyMonths - index * 6);
    const balanceAtGraduation = equalAmount * ((1 + monthlyRate) ** monthsToGraduation);
    return { semester: index + 1, amount: equalAmount, month: index * 6, monthsToGraduation, balanceAtGraduation, accruedInterest: Math.max(0, balanceAtGraduation - equalAmount) };
  });
}

function calculateGeneralLoan(profile, newLoanPrincipal, funding, stress) {
  const schedule = buildLoanDisbursementSchedule(newLoanPrincipal, funding.semesters, profile.annualRate);
  const existingLoan = nonNegative(profile.existingLoanBalance);
  const principal = newLoanPrincipal + existingLoan;
  const monthlyRate = nonNegative(profile.annualRate) / 100 / 12;
  const studyInterest = schedule.reduce((sum, item) => sum + item.accruedInterest, 0) + (existingLoan * monthlyRate * funding.studyMonths);
  const graceMonths = Math.max(0, Math.round(nonNegative(profile.graceYears) * 12));
  const postGraduationWaitMonths = graceMonths + stress.employmentDelayMonths;
  const graceInterest = principal * monthlyRate * postGraduationWaitMonths;
  const repaymentYears = Math.max(0.5, nonNegative(profile.repaymentYears));
  const paymentMonths = Math.max(1, Math.round(repaymentYears * 12));
  const repaymentMethod = profile.repaymentMethod === 'equal-principal' ? 'equal-principal' : 'equal-payment';
  let firstMonthPayment = 0;
  let monthlyEquivalent = 0;
  let repaymentInterest = 0;
  let totalRepayment = 0;
  if (principal > 0 && repaymentMethod === 'equal-principal') {
    const monthlyPrincipal = principal / paymentMonths;
    firstMonthPayment = monthlyPrincipal + principal * monthlyRate;
    repaymentInterest = monthlyRate === 0 ? 0 : monthlyRate * monthlyPrincipal * (paymentMonths * (paymentMonths + 1) / 2);
    totalRepayment = principal + repaymentInterest;
    monthlyEquivalent = totalRepayment / paymentMonths;
  } else if (principal > 0) {
    const amortized = amortizedLoan(principal, profile.annualRate, repaymentYears);
    firstMonthPayment = amortized.monthlyPayment;
    monthlyEquivalent = amortized.monthlyPayment;
    repaymentInterest = amortized.totalInterest;
    totalRepayment = amortized.totalRepayment;
  }
  const firstYearPrincipalReduction = repaymentMethod === 'equal-principal'
    ? Math.min(principal, (principal / paymentMonths) * 12)
    : Math.min(principal, Math.max(0, monthlyEquivalent * 12 - principal * monthlyRate * 12));
  const projectedBalance = Math.max(0, principal - firstYearPrincipalReduction);
  const totalInterest = studyInterest + graceInterest + repaymentInterest;
  return {
    type: 'general', principal, newLoanPrincipal, disbursementSchedule: schedule,
    balanceAtGraduation: principal, duringStudyPayment: studyInterest,
    duringStudyMonthlyPayment: funding.studyMonths ? studyInterest / funding.studyMonths : 0,
    firstYearRepayment: firstMonthPayment * 12, firstMonthPayment, monthlyEquivalent,
    projectedBalance, totalInterest, totalRepayment: principal + totalInterest,
    graceInterest, repaymentInterest, paymentMonths, repaymentMethod, calculationPossible: true,
    assumptions: [
      '신규 대출은 남은 학기마다 같은 금액으로 실행한다고 가정했습니다.',
      '재학·거치 중 이자는 원금에 더하지 않고 납부하는 것으로 계산했습니다.',
      `${repaymentYears}년 동안 ${repaymentMethod === 'equal-principal' ? '원금균등' : '원리금균등'} 방식으로 상환합니다.`,
    ],
  };
}

function calculateIncomeContingentLoan(profile, newLoanPrincipal, funding, stress, policy) {
  const schedule = buildLoanDisbursementSchedule(newLoanPrincipal, funding.semesters, profile.annualRate);
  const monthlyRate = nonNegative(profile.annualRate) / 100 / 12;
  const existingAtGraduation = nonNegative(profile.existingLoanBalance) * ((1 + monthlyRate) ** funding.studyMonths);
  const newLoanAtGraduation = schedule.reduce((sum, item) => sum + item.balanceAtGraduation, 0);
  const principal = newLoanPrincipal + nonNegative(profile.existingLoanBalance);
  const balanceAtGraduation = existingAtGraduation + newLoanAtGraduation;
  const balanceAtEmployment = balanceAtGraduation * ((1 + monthlyRate) ** stress.employmentDelayMonths);
  const adjustedMonthlyIncome = nonNegative(profile.salary) * (1 - stress.salaryReductionRate);
  const annualIncome = adjustedMonthlyIncome * 12;
  const hasPolicy = Number.isFinite(policy?.annualIncomeThreshold) && Number.isFinite(policy?.repaymentRate);
  if (!hasPolicy) return {
    type: 'income-contingent', principal, newLoanPrincipal, disbursementSchedule: schedule,
    balanceAtGraduation, duringStudyPayment: 0, duringStudyMonthlyPayment: 0,
    firstYearRepayment: null, firstMonthPayment: null, monthlyEquivalent: null,
    projectedBalance: null, totalInterest: null, totalRepayment: null,
    calculationPossible: false, reason: '정책 정보 부족으로 계산할 수 없습니다.', assumptions: [],
  };
  const annualMandatoryRepayment = Math.min(balanceAtEmployment, Math.max(0, annualIncome - policy.annualIncomeThreshold) * policy.repaymentRate);
  const balanceBeforeFirstYearPayment = balanceAtEmployment * ((1 + monthlyRate) ** 12);
  const projectedBalance = Math.max(0, balanceBeforeFirstYearPayment - annualMandatoryRepayment);
  return {
    type: 'income-contingent', principal, newLoanPrincipal, disbursementSchedule: schedule,
    balanceAtGraduation, balanceAtEmployment, duringStudyPayment: 0, duringStudyMonthlyPayment: 0,
    firstYearRepayment: annualMandatoryRepayment, annualMandatoryRepayment,
    firstMonthPayment: null, monthlyEquivalent: annualMandatoryRepayment / 12,
    projectedBalance, totalInterest: null, totalRepayment: null, calculationPossible: true, policy,
    assumptions: [
      '신규 대출은 남은 학기마다 같은 금액으로 실행한다고 가정했습니다.',
      `연소득 ${formatMoney(annualIncome)}에서 상환기준소득 ${formatMoney(policy.annualIncomeThreshold)}을 뺀 금액에 ${Math.round(policy.repaymentRate * 100)}%를 적용했습니다.`,
      '월 환산액은 연간 예상 의무상환액을 12로 나눈 참고값이며 고정 월납입액이 아닙니다.',
    ],
  };
}

export function calculateLoan(profile, newLoanPrincipal, funding, stress = {}, policy = INCOME_CONTINGENT_POLICY) {
  const normalizedStress = normalizeStress(stress);
  return profile.loanType === 'income-contingent'
    ? calculateIncomeContingentLoan(profile, newLoanPrincipal, funding, normalizedStress, policy)
    : calculateGeneralLoan(profile, newLoanPrincipal, funding, normalizedStress);
}

export function calculateScenario(profile, definition, stress = {}, policy = INCOME_CONTINGENT_POLICY) {
  const normalizedStress = normalizeStress(stress);
  const funding = calculateFundingSummary(profile, normalizedStress);
  const workMonthly = monthlyWorkIncome(definition.workHours, profile.hourlyWage);
  const workTotal = workMonthly * funding.studyMonths;
  const needAfterSupportAndWork = Math.max(0, funding.totalNeed - funding.confirmedLivingGrantTotal - workTotal);
  const newLoan = Math.min(nonNegative(profile.loanCap) * definition.loanShare, needAfterSupportAndWork);
  const loan = calculateLoan(profile, newLoan, funding, normalizedStress, policy);
  const availableForLiving = funding.confirmedLivingGrantTotal + workTotal + newLoan - funding.educationNeed - loan.duringStudyPayment;
  const possibleCollegeSpend = funding.studyMonths > 0 ? availableForLiving / funding.studyMonths : null;
  const fundingGap = Math.max(0, funding.totalNeed + loan.duringStudyPayment - funding.confirmedLivingGrantTotal - workTotal - newLoan);
  const adjustedSalary = nonNegative(profile.salary) * (1 - normalizedStress.salaryReductionRate);
  const possibleCareerSpend = loan.monthlyEquivalent == null ? null : adjustedSalary - loan.monthlyEquivalent;
  const transitionGap = normalizedStress.employmentDelayMonths * nonNegative(profile.desiredCareerSpend);
  const minimumLivingLine = Math.min(180, nonNegative(profile.desiredCareerSpend) * 0.72);
  const calculationPossible = loan.calculationPossible && Number.isFinite(possibleCollegeSpend) && Number.isFinite(possibleCareerSpend);
  const safety = !calculationPossible ? 'calculation-impossible' : possibleCareerSpend < 0 ? 'deficit' : possibleCareerSpend < minimumLivingLine ? 'at-risk' : possibleCareerSpend < nonNegative(profile.desiredCareerSpend) ? 'watch' : 'safe';
  return {
    ...definition, funding, workMonthly, workTotal, newLoan, totalLoanPrincipal: loan.principal,
    possibleCollegeSpend, collegeSpendGap: possibleCollegeSpend == null ? null : possibleCollegeSpend - nonNegative(profile.desiredCollegeSpend),
    fundingGap, loan, adjustedSalary, possibleCareerSpend,
    careerSpendGap: possibleCareerSpend == null ? null : possibleCareerSpend - nonNegative(profile.desiredCareerSpend),
    transitionGap, safety, calculationPossible, stress: normalizedStress,
  };
}

export function calculateAllScenarios(profile, stress = {}, policy = INCOME_CONTINGENT_POLICY) {
  return SCENARIO_DEFINITIONS.map((definition) => calculateScenario(profile, definition, stress, policy));
}

export function buildScenarioComparison(scenarios, profile) {
  return [
    { id: 'college', label: '대학 시절 월 생활비 여력', unit: '만 원/월', referenceLabel: '희망', reference: nonNegative(profile.desiredCollegeSpend), values: scenarios.map((s) => ({ id: s.id, value: s.possibleCollegeSpend })) },
    { id: 'work', label: '주당 근로시간', unit: '시간/주', referenceLabel: '희망', reference: nonNegative(profile.desiredWorkHours), currentReference: nonNegative(profile.currentWorkHours), values: scenarios.map((s) => ({ id: s.id, value: s.workHours })) },
    { id: 'career', label: '상환 후 월 생활비 여력', unit: '만 원/월', referenceLabel: '희망', reference: nonNegative(profile.desiredCareerSpend), values: scenarios.map((s) => ({ id: s.id, value: s.possibleCareerSpend })) },
  ];
}

export function roundMoney(value, digits = 1) {
  if (!Number.isFinite(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

export function formatMoney(value, options = {}) {
  const { digits = 0, unit = '만 원' } = options;
  if (!Number.isFinite(Number(value))) return '계산 불가';
  return `${Number(value).toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}${unit ? ` ${unit}` : ''}`;
}
