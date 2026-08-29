import { nonNegative } from '../shared/numbers.js';
import { amortizedLoan } from './amortized-loan.js';
import { buildLoanDisbursementSchedule } from './disbursement-schedule.js';

export function calculateGeneralLoan(profile, newLoanPrincipal, funding, stress) {
  const schedule = buildLoanDisbursementSchedule(
    newLoanPrincipal,
    funding.semesters,
    profile.annualRate,
  );
  const existingLoan = nonNegative(profile.existingLoanBalance);
  const principal = newLoanPrincipal + existingLoan;
  const monthlyRate = nonNegative(profile.annualRate) / 100 / 12;
  const studyInterest = schedule.reduce(
    (sum, item) => sum + item.accruedInterest,
    0,
  ) + (existingLoan * monthlyRate * funding.studyMonths);
  const graceMonths = Math.max(0, Math.round(nonNegative(profile.graceYears) * 12));
  const postGraduationWaitMonths = graceMonths + stress.employmentDelayMonths;
  const graceInterest = principal * monthlyRate * postGraduationWaitMonths;
  const repaymentYears = Math.max(0.5, nonNegative(profile.repaymentYears));
  const paymentMonths = Math.max(1, Math.round(repaymentYears * 12));
  const repaymentMethod = profile.repaymentMethod === 'equal-principal'
    ? 'equal-principal'
    : 'equal-payment';

  let firstMonthPayment = 0;
  let monthlyEquivalent = 0;
  let repaymentInterest = 0;
  let totalRepayment = 0;

  if (principal > 0 && repaymentMethod === 'equal-principal') {
    const monthlyPrincipal = principal / paymentMonths;
    firstMonthPayment = monthlyPrincipal + principal * monthlyRate;
    repaymentInterest = monthlyRate === 0
      ? 0
      : monthlyRate * monthlyPrincipal * (paymentMonths * (paymentMonths + 1) / 2);
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
    : Math.min(
      principal,
      Math.max(0, monthlyEquivalent * 12 - principal * monthlyRate * 12),
    );
  const projectedBalance = Math.max(0, principal - firstYearPrincipalReduction);
  const totalInterest = studyInterest + graceInterest + repaymentInterest;

  return {
    type: 'general',
    principal,
    newLoanPrincipal,
    disbursementSchedule: schedule,
    balanceAtGraduation: principal,
    duringStudyPayment: studyInterest,
    duringStudyMonthlyPayment: funding.studyMonths
      ? studyInterest / funding.studyMonths
      : 0,
    firstYearRepayment: firstMonthPayment * 12,
    firstMonthPayment,
    monthlyEquivalent,
    projectedBalance,
    totalInterest,
    totalRepayment: principal + totalInterest,
    graceInterest,
    repaymentInterest,
    paymentMonths,
    repaymentMethod,
    calculationPossible: true,
    assumptions: [
      '신규 대출은 남은 학기마다 같은 금액으로 실행한다고 가정했습니다.',
      '재학·거치 중 이자는 원금에 더하지 않고 납부하는 것으로 계산했습니다.',
      repaymentYears + '년 동안 '
        + (repaymentMethod === 'equal-principal' ? '원금균등' : '원리금균등')
        + ' 방식으로 상환합니다.',
    ],
  };
}
