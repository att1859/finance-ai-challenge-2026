import { buildExemptedBalances } from './interest-exemption.js';
import { nonNegative } from '../shared/numbers.js';
import { calculateIncomeContingentCurrentValueComparison } from './current-value-comparison.js';
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
  let schedule = buildLoanDisbursementSchedule(
    components,
    funding.studyMonths,
    annualRate,
  );
  const exemptionResult=buildExemptedBalances(profile,schedule,funding,stress,policy);
  schedule=exemptionResult.schedule;
  const principal=getLoanCompositionPrincipal(loanComposition,{product:'income-contingent'})+nonNegative(profile.existingLoanBalance);
  const balanceAtGraduation=exemptionResult.preEmploymentBalances[funding.studyMonths];
  const balanceAtEmployment=exemptionResult.preEmploymentBalances.at(-1);
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

  const currentValueComparison = calculateIncomeContingentCurrentValueComparison({
    balanceAtEmployment,
    interestExemptBalance: exemptionResult.exemptBalanceAtEmployment,
    annualRate,
    annualGrossIncome,
    annualGrossIncomeThreshold: policy.annualGrossIncomeThreshold,
    repaymentRate: policy.repaymentRate,
    minimumAnnualMandatoryRepayment: policy.minimumAnnualMandatoryRepayment,
  });
  const firstYear = currentValueComparison.annualSchedule[0];
  const annualMandatoryRepayment = firstYear.mandatoryRepayment;
  const projectedBalance = firstYear.closingBalance;

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
    totalInterest: currentValueComparison.totalInterest,
    totalRepayment: currentValueComparison.totalPayment,
    currentValueComparison,
    preEmploymentBalances:exemptionResult.preEmploymentBalances,
    interestExemptBalance:exemptionResult.exemptBalanceAtEmployment,
    interestExemption:{...exemptionResult.exemption,exemptedInterest:exemptionResult.exemption.exemptedInterest+currentValueComparison.totalExemptedInterest},
    calculationPossible: true,
    repaymentRate: policy.repaymentRate,
    annualGrossIncomeThreshold: policy.annualGrossIncomeThreshold,
    annualGrossIncomeThresholdKind: policy.annualGrossIncomeThresholdKind,
    minimumAnnualMandatoryRepayment: policy.minimumAnnualMandatoryRepayment,
    policy,
    assumptions: [
      '등록금·생활비 대출은 이번 학기에만 실행하며 남은 학기는 졸업과 이자·거치기간 계산에 사용합니다.',
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
