import { nonNegative } from '../shared/numbers.js';
import { buildLoanDisbursementSchedule } from './disbursement-schedule.js';

export function calculateIncomeContingentLoan(
  profile,
  newLoanPrincipal,
  funding,
  stress,
  policy,
) {
  const schedule = buildLoanDisbursementSchedule(
    newLoanPrincipal,
    funding.semesters,
    profile.annualRate,
  );
  const monthlyRate = nonNegative(profile.annualRate) / 100 / 12;
  const existingAtGraduation = nonNegative(profile.existingLoanBalance)
    * ((1 + monthlyRate) ** funding.studyMonths);
  const newLoanAtGraduation = schedule.reduce(
    (sum, item) => sum + item.balanceAtGraduation,
    0,
  );
  const principal = newLoanPrincipal + nonNegative(profile.existingLoanBalance);
  const balanceAtGraduation = existingAtGraduation + newLoanAtGraduation;
  const balanceAtEmployment = balanceAtGraduation
    * ((1 + monthlyRate) ** stress.employmentDelayMonths);
  const adjustedMonthlyIncome = nonNegative(profile.salary)
    * (1 - stress.salaryReductionRate);
  const annualIncome = adjustedMonthlyIncome * 12;
  const hasPolicy = Number.isFinite(policy?.annualIncomeThreshold)
    && Number.isFinite(policy?.repaymentRate);

  if (!hasPolicy) {
    return {
      type: 'income-contingent',
      principal,
      newLoanPrincipal,
      disbursementSchedule: schedule,
      balanceAtGraduation,
      duringStudyPayment: 0,
      duringStudyMonthlyPayment: 0,
      firstYearRepayment: null,
      firstMonthPayment: null,
      monthlyEquivalent: null,
      projectedBalance: null,
      totalInterest: null,
      totalRepayment: null,
      calculationPossible: false,
      reason: '정책 정보 부족으로 계산할 수 없습니다.',
      assumptions: [],
    };
  }

  const annualMandatoryRepayment = Math.min(
    balanceAtEmployment,
    Math.max(0, annualIncome - policy.annualIncomeThreshold) * policy.repaymentRate,
  );
  const balanceBeforeFirstYearPayment = balanceAtEmployment * ((1 + monthlyRate) ** 12);
  const projectedBalance = Math.max(
    0,
    balanceBeforeFirstYearPayment - annualMandatoryRepayment,
  );

  return {
    type: 'income-contingent',
    principal,
    newLoanPrincipal,
    disbursementSchedule: schedule,
    balanceAtGraduation,
    balanceAtEmployment,
    duringStudyPayment: 0,
    duringStudyMonthlyPayment: 0,
    firstYearRepayment: annualMandatoryRepayment,
    annualMandatoryRepayment,
    firstMonthPayment: null,
    monthlyEquivalent: annualMandatoryRepayment / 12,
    projectedBalance,
    totalInterest: null,
    totalRepayment: null,
    calculationPossible: true,
    policy,
    assumptions: [
      '신규 대출은 남은 학기마다 같은 금액으로 실행한다고 가정했습니다.',
      {
        type: 'income-contingent-formula',
        annualIncome,
        annualIncomeThreshold: policy.annualIncomeThreshold,
        repaymentRate: policy.repaymentRate,
      },
      '월 환산액은 연간 예상 의무상환액을 12로 나눈 참고값이며 고정 월납입액이 아닙니다.',
    ],
  };
}
