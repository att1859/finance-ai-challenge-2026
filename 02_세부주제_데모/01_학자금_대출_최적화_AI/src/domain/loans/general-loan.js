import { nonNegative } from '../shared/numbers.js';
import {
  buildGeneralRepaymentSchedule,
  buildLoanDisbursementSchedule,
  resolveGeneralRepaymentTerms,
} from './disbursement-schedule.js';
import {
  getLoanCompositionComponents,
  getLoanCompositionPrincipal,
} from './loan-composition.js';

function existingLoanComponent(profile, policy) {
  const principal = nonNegative(profile.existingLoanBalance);
  if (principal === 0 || !policy.scheduleAnchorDate) return [];

  return [{
    id: 'existing:general:approximation',
    product: 'general',
    purpose: 'existing',
    principal,
    semester: 1,
    disbursementDate: policy.scheduleAnchorDate,
    scheduleKind: 'existing-loan-approximation',
    disbursementDateIsEstimate: true,
  }];
}

export function calculateGeneralLoan(profile, loanComposition, funding, policy) {
  const components = getLoanCompositionComponents(
    loanComposition,
    { product: 'general' },
  );
  const annualRate = policy?.annualRate;
  const repaymentMethod = policy?.repaymentMethod;
  const hasPolicy = Number.isFinite(annualRate)
    && repaymentMethod === 'equal-payment'
    && Number.isFinite(policy?.maximumGraceYears)
    && Number.isFinite(policy?.maximumRepaymentYears);
  const existingLoan = nonNegative(profile.existingLoanBalance);
  const compositionPrincipal = getLoanCompositionPrincipal(
    loanComposition,
    { product: 'general' },
  );
  const principal = compositionPrincipal + existingLoan;
  const terms = resolveGeneralRepaymentTerms(profile, policy);

  if (!hasPolicy) {
    const schedule = buildLoanDisbursementSchedule(
      components,
      funding.studyMonths,
      annualRate,
    );
    return {
      type: 'general',
      repaymentType: 'fixed-monthly',
      principal,
      annualRate: Number.isFinite(annualRate) ? annualRate : null,
      disbursementSchedule: schedule,
      balanceAtGraduation: principal,
      duringStudyPayment: studyInterest,
      duringStudyMonthlyPayment: funding.studyMonths
        ? studyInterest / funding.studyMonths
        : 0,
      firstYearRepayment: null,
      firstMonthPayment: null,
      monthlyPayment: null,
      projectedBalance: null,
      totalInterest: null,
      totalRepayment: null,
      graceInterest: null,
      repaymentInterest: null,
      paymentMonths: terms.paymentMonths,
      repaymentTerms: terms,
      componentRepaymentSchedules: [],
      monthlyRepaymentSchedule: [],
      repaymentStartDate: null,
      repaymentEndDate: null,
      repaymentMethod: null,
      calculationPossible: false,
      reason: '일반 상환 정책 정보가 부족해 계산할 수 없습니다.',
      assumptions: [],
    };
  }

  const schedule = buildGeneralRepaymentSchedule({
    components: [
      ...components,
      ...existingLoanComponent(profile, policy),
    ],
    funding,
    annualRate,
    terms,
  });
  const duringStudyPayment = schedule.duringStudyPayment;

  return {
    type: 'general',
    repaymentType: 'fixed-monthly',
    principal,
    annualRate,
    disbursementSchedule: schedule.componentSchedules,
    componentRepaymentSchedules: schedule.componentSchedules,
    monthlyRepaymentSchedule: schedule.monthlySchedule,
    repaymentStartDate: schedule.firstRepaymentStartDate,
    repaymentEndDate: schedule.lastRepaymentEndDate,
    balanceAtGraduation: schedule.balanceAtGraduation,
    duringStudyPayment,
    duringStudyMonthlyPayment: funding.studyMonths
      ? duringStudyPayment / funding.studyMonths
      : 0,
    firstYearRepayment: schedule.firstYearPayment,
    firstMonthPayment: schedule.firstMonthPayment,
    monthlyPayment: schedule.maximumMonthlyPayment,
    projectedBalance: schedule.balanceAfterFirstRepaymentYear,
    totalInterest: schedule.totalInterest,
    totalRepayment: schedule.totalRepayment,
    graceInterest: schedule.graceInterest,
    repaymentInterest: schedule.repaymentInterest,
    paymentMonths: terms.paymentMonths,
    repaymentTerms: terms,
    repaymentMethod,
    calculationPossible: true,
    assumptions: [
      '등록금·생활비 대출은 용도별로 나눠 남은 학기마다 같은 금액으로 실행한다고 가정했습니다.',
      '각 학기 실행분은 실행일부터 거치이자를 내고 약정 시작일부터 원리금균등으로 따로 상환합니다.',
      terms.repaymentYears + '년 동안 원리금균등 방식으로 상환합니다.',
    ],
  };
}
