import { nonNegative } from '../shared/numbers.js';
import { amortizedLoan } from './amortized-loan.js';
import { buildLoanDisbursementSchedule } from './disbursement-schedule.js';
import {
  getLoanCompositionComponents,
  getLoanCompositionPrincipal,
} from './loan-composition.js';

export function calculateGeneralLoan(profile, loanComposition, funding, policy) {
  const components = getLoanCompositionComponents(
    loanComposition,
    { product: 'general' },
  );
  const annualRate = policy?.annualRate;
  const repaymentMethod = policy?.repaymentMethod;
  const hasPolicy = Number.isFinite(annualRate)
    && repaymentMethod === 'equal-payment';
  const schedule = buildLoanDisbursementSchedule(
    components,
    funding.studyMonths,
    annualRate,
  );
  const existingLoan = nonNegative(profile.existingLoanBalance);
  const compositionPrincipal = getLoanCompositionPrincipal(
    loanComposition,
    { product: 'general' },
  );
  const principal = compositionPrincipal + existingLoan;
  const monthlyRate = nonNegative(annualRate) / 100 / 12;
  const studyInterest = schedule.reduce(
    (sum, item) => sum + item.accruedInterest,
    0,
  ) + (existingLoan * monthlyRate * funding.studyMonths);
  const graceMonths = Math.max(0, Math.round(nonNegative(profile.graceYears) * 12));
  const graceInterest = principal * monthlyRate * graceMonths;
  const repaymentYears = Math.max(0.5, nonNegative(profile.repaymentYears));
  const paymentMonths = Math.max(1, Math.round(repaymentYears * 12));

  if (!hasPolicy) {
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
      paymentMonths,
      repaymentMethod: null,
      calculationPossible: false,
      reason: '일반 상환 정책 정보가 부족해 계산할 수 없습니다.',
      assumptions: [],
    };
  }

  const amortized = amortizedLoan(principal, annualRate, repaymentYears);
  const monthlyPayment = amortized.monthlyPayment;
  const repaymentInterest = amortized.totalInterest;
  const firstYearPrincipalReduction = Math.min(
    principal,
    Math.max(0, monthlyPayment * 12 - principal * monthlyRate * 12),
  );
  const projectedBalance = Math.max(0, principal - firstYearPrincipalReduction);
  const totalInterest = studyInterest + graceInterest + repaymentInterest;

  return {
    type: 'general',
    repaymentType: 'fixed-monthly',
    principal,
    annualRate,
    disbursementSchedule: schedule,
    balanceAtGraduation: principal,
    duringStudyPayment: studyInterest,
    duringStudyMonthlyPayment: funding.studyMonths
      ? studyInterest / funding.studyMonths
      : 0,
    firstYearRepayment: monthlyPayment * 12,
    firstMonthPayment: monthlyPayment,
    monthlyPayment,
    projectedBalance,
    totalInterest,
    totalRepayment: principal + totalInterest,
    graceInterest,
    repaymentInterest,
    paymentMonths,
    repaymentMethod,
    calculationPossible: true,
    assumptions: [
      '등록금·생활비 대출은 용도별로 나눠 남은 학기마다 같은 금액으로 실행한다고 가정했습니다.',
      '재학·거치 중 이자는 원금에 더하지 않고 납부하는 것으로 계산했습니다.',
      repaymentYears + '년 동안 원리금균등 방식으로 상환합니다.',
    ],
  };
}
