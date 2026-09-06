import test from 'node:test';
import assert from 'node:assert/strict';

import { calculatePlan } from '../../src/application/calculate-plan.js';
import { SAMPLE_PROFILE } from '../../src/data/sample-profile.js';

test('전체 계획 계산은 기준안과 위험 조건 적용안을 같은 세 시나리오로 반환한다', () => {
  const result = calculatePlan(SAMPLE_PROFILE, { graduationDelayMonths: 12 });

  assert.deepEqual(result.baselineScenarios.map(({ id }) => id), ['minimum-loan', 'balance', 'maximum-use']);
  assert.deepEqual(result.currentScenarios.map(({ id }) => id), ['minimum-loan', 'balance', 'maximum-use']);
  assert.equal(result.baselineScenarios[1].funding.studyMonths, 48);
  assert.equal(result.currentScenarios[1].funding.studyMonths, 60);
  assert.equal('supportPrograms' in result, false);
  assert.equal('supportSummary' in result, false);
  assert.deepEqual(result.policySnapshotIds, ['kosaf-2026-2']);
  const composition = result.baselineScenarios[1].loanComposition;
  const components = [
    ...composition.tuitionComponents,
    ...composition.livingComponents,
  ];
  assert.equal('newLoan' in result.baselineScenarios[1], false);
  assert.ok(components.length > 0);
  assert.ok(components.every(({ product, purpose, principal, semester, policyReference }) => (
    product === 'general'
    && ['tuition', 'living'].includes(purpose)
    && principal > 0
    && semester >= 1
    && policyReference.snapshotId === 'kosaf-2026-2'
  )));
  assert.ok(components.every(({ eligibility }) => (
    eligibility.status === 'unknown'
    && !eligibility.reasonCodes.includes('ELIGIBILITY_NOT_EVALUATED')
  )));
  assert.ok(components.every(({ eligibilityOverrides, interestExemptions, repaymentDeferrals }) => (
    Array.isArray(eligibilityOverrides)
    && Array.isArray(interestExemptions)
    && Array.isArray(repaymentDeferrals)
  )));
  const general = result.baselineScenarios[1].loan.repayments.general;
  assert.equal(general.repaymentTerms.requestedGraduationPreparationYears, 1);
  assert.equal(general.repaymentTerms.repaymentYears, 10);
  assert.ok(general.componentRepaymentSchedules.every(({ disbursementDate, repaymentStartDate }) => (
    disbursementDate < repaymentStartDate
  )));
  assert.ok(general.monthlyRepaymentSchedule.some(({ repaymentComponentCount }) => (
    repaymentComponentCount > 1
  )));
  assert.equal(result.baselineScenarios[1].loan.repaymentStartDate, general.repaymentStartDate);
  assert.equal(result.loanEligibilityCombinations.length, 4);
  assert.ok(result.loanEligibilityCombinations.every(({ status }) => status === 'unknown'));
  assert.equal(result.baselineFullLoanCapView.name, '풀대출 상한 보기');
  assert.equal(result.baselineFullLoanCapView.isRecommendation, false);
});

test('과거 지원금 값은 전체 계획의 시나리오에 영향을 주지 않는다', () => {
  const baseline = calculatePlan(SAMPLE_PROFILE);
  const legacy = calculatePlan({ ...SAMPLE_PROFILE, confirmedLivingGrantTotal: 600 });

  assert.deepEqual(legacy.baselineScenarios, baseline.baselineScenarios);
  assert.deepEqual(legacy.currentScenarios, baseline.currentScenarios);
});

test('간편 차감률이 높아지면 실수령 근로소득이 줄고 필요한 대출액이 늘어난다', () => {
  const simple = calculatePlan({
    ...SAMPLE_PROFILE,
    desiredCollegeSpend: 130,
    workTaxPreset: 'simple-3.3',
  });
  const social = calculatePlan({
    ...SAMPLE_PROFILE,
    desiredCollegeSpend: 130,
    workTaxPreset: 'social-9.5',
  });
  const simpleBalance = simple.currentScenarios.find(({ id }) => id === 'minimum-loan');
  const socialBalance = social.currentScenarios.find(({ id }) => id === 'minimum-loan');

  assert.ok(socialBalance.workMonthly < simpleBalance.workMonthly);
  assert.ok(
    socialBalance.loanComposition.totals.combined
      > simpleBalance.loanComposition.totals.combined,
  );
  assert.equal(socialBalance.workIncomeBreakdown.taxRate, 0.095);
});

test('전체 계획은 선택 상품에 맞는 상환 단위와 정책 방식을 반환한다', () => {
  const general = calculatePlan(SAMPLE_PROFILE).currentScenarios[1].loan;
  const incomeContingent = calculatePlan({
    ...SAMPLE_PROFILE,
    loanType: 'income-contingent',
  }).currentScenarios[1].loan;

  assert.equal(general.type, 'general');
  assert.equal(general.repayments.general.repaymentMethod, 'equal-payment');
  assert.equal(general.repayments.incomeContingent, null);
  assert.equal(general.monthlyBurdenForComparison, general.monthlyScheduledPayment);

  assert.equal(incomeContingent.type, 'income-contingent');
  assert.equal(incomeContingent.repayments.general, null);
  assert.equal(incomeContingent.repayments.incomeContingent.monthlyPayment, null);
  assert.equal(
    incomeContingent.monthlyBurdenForComparison,
    incomeContingent.monthlyAverageMandatoryRepayment,
  );
});

test('결과 선택은 상품·생활비 포함·상환기간을 같은 계산 결과에 즉시 반영한다', () => {
  const selected = calculatePlan({
    ...SAMPLE_PROFILE,
    desiredCollegeSpend: 130,
    repaymentYears: 5,
    resultSelections: {
      balance: {
        candidateId: 'general:income-contingent',
        includeLiving: true,
      },
    },
  }).currentScenarios.find(({ id }) => id === 'balance');
  const withoutLiving = calculatePlan({
    ...SAMPLE_PROFILE,
    desiredCollegeSpend: 130,
    resultSelections: {
      balance: {
        candidateId: 'general:income-contingent',
        includeLiving: false,
      },
    },
  }).currentScenarios.find(({ id }) => id === 'balance');

  assert.equal(selected.loan.type, 'mixed');
  assert.equal(selected.loan.repayments.general.repaymentTerms.repaymentYears, 5);
  assert.ok(selected.loan.repayments.incomeContingent.principal > 0);
  assert.equal(withoutLiving.workHours, SAMPLE_PROFILE.currentWorkHours);
  assert.equal(withoutLiving.loanComposition.totals.living, 0);
  assert.ok(withoutLiving.unmetLivingGap > 0);
});
