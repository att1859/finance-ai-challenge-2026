import { nonNegative } from '../shared/numbers.js';
import { buildLoanDisbursementSchedule } from './disbursement-schedule.js';
import {
  getLoanCompositionComponents,
  getLoanCompositionPrincipal,
} from './loan-composition.js';

export function calculateIncomeContingentLoan(
  profile,
  loanComposition,
  funding,
  stress,
  policy,
) {
  const components = getLoanCompositionComponents(
    loanComposition,
    { product: 'income-contingent' },
  );
  const annualRate = policy?.annualRate;
  const schedule = buildLoanDisbursementSchedule(
    components,
    funding.studyMonths,
    annualRate,
  );
  const monthlyRate = nonNegative(annualRate) / 100 / 12;
  const existingAtGraduation = nonNegative(profile.existingLoanBalance)
    * ((1 + monthlyRate) ** funding.studyMonths);
  const compositionBalanceAtGraduation = schedule.reduce(
    (sum, item) => sum + item.balanceAtGraduation,
    0,
  );
  const compositionPrincipal = getLoanCompositionPrincipal(
    loanComposition,
    { product: 'income-contingent' },
  );
  const principal = compositionPrincipal + nonNegative(profile.existingLoanBalance);
  const balanceAtGraduation = existingAtGraduation
    + compositionBalanceAtGraduation;
  const balanceAtEmployment = balanceAtGraduation
    * ((1 + monthlyRate) ** stress.employmentDelayMonths);
  const adjustedMonthlyIncome = nonNegative(profile.salary)
    * (1 - stress.salaryReductionRate);
  const annualGrossIncome = adjustedMonthlyIncome * 12;
  const hasPolicy = Number.isFinite(annualRate)
    && Number.isFinite(policy?.annualGrossIncomeThreshold)
    && Number.isFinite(policy?.repaymentRate)
    && Number.isFinite(policy?.minimumAnnualMandatoryRepayment);

  if (!hasPolicy) {
    return {
      type: 'income-contingent',
      repaymentType: 'annual-mandatory',
      principal,
      annualRate: Number.isFinite(annualRate) ? annualRate : null,
      disbursementSchedule: schedule,
      balanceAtGraduation,
      duringStudyPayment: 0,
      duringStudyMonthlyPayment: 0,
      firstYearRepayment: null,
      firstMonthPayment: null,
      monthlyPayment: null,
      monthlyAverageEquivalent: null,
      annualMandatoryRepayment: null,
      projectedBalance: null,
      totalInterest: null,
      totalRepayment: null,
      calculationPossible: false,
      reason: '정책 정보 부족으로 계산할 수 없습니다.',
      assumptions: [],
    };
  }

  const balanceBeforeFirstYearPayment = balanceAtEmployment * ((1 + monthlyRate) ** 12);
  const incomeBasedRepayment = Math.max(
    0,
    annualGrossIncome - policy.annualGrossIncomeThreshold,
  ) * policy.repaymentRate;
  const annualMandatoryRepayment = Math.min(
    balanceBeforeFirstYearPayment,
    incomeBasedRepayment > 0
      ? Math.max(incomeBasedRepayment, policy.minimumAnnualMandatoryRepayment)
      : 0,
  );
  const projectedBalance = Math.max(
    0,
    balanceBeforeFirstYearPayment - annualMandatoryRepayment,
  );

  return {
    type: 'income-contingent',
    repaymentType: 'annual-mandatory',
    principal,
    annualRate,
    disbursementSchedule: schedule,
    balanceAtGraduation,
    balanceAtEmployment,
    duringStudyPayment: 0,
    duringStudyMonthlyPayment: 0,
    firstYearRepayment: annualMandatoryRepayment,
    annualMandatoryRepayment,
    firstMonthPayment: null,
    monthlyPayment: null,
    monthlyAverageEquivalent: annualMandatoryRepayment / 12,
    projectedBalance,
    totalInterest: null,
    totalRepayment: null,
    calculationPossible: true,
    repaymentRate: policy.repaymentRate,
    annualGrossIncomeThreshold: policy.annualGrossIncomeThreshold,
    annualGrossIncomeThresholdKind: policy.annualGrossIncomeThresholdKind,
    minimumAnnualMandatoryRepayment: policy.minimumAnnualMandatoryRepayment,
    policy,
    assumptions: [
      '등록금·생활비 대출은 용도별로 나눠 남은 학기마다 같은 금액으로 실행한다고 가정했습니다.',
      {
        type: 'income-contingent-formula',
        annualGrossIncome,
        annualGrossIncomeThreshold: policy.annualGrossIncomeThreshold,
        annualGrossIncomeThresholdKind: policy.annualGrossIncomeThresholdKind,
        repaymentRate: policy.repaymentRate,
      },
      '총급여 환산 기준으로 만든 계획용 예상액이며 실제 연간소득금액을 사용한 확정 의무상환액이 아닙니다.',
      '월평균 환산액은 연간 예상 의무상환액을 12로 나눈 참고값이며 고정 월납입액이 아닙니다.',
    ],
  };
}
