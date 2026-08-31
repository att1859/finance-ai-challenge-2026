import test from 'node:test';
import assert from 'node:assert/strict';

import { calculatePlan } from '../../src/application/calculate-plan.js';
import { SAMPLE_PROFILE } from '../../src/data/sample-profile.js';

test('전체 계획 계산은 기준안과 위험 조건 적용안을 같은 세 시나리오로 반환한다', () => {
  const result = calculatePlan(SAMPLE_PROFILE, { graduationDelayMonths: 12 });

  assert.deepEqual(result.baselineScenarios.map(({ id }) => id), ['focus', 'balance', 'debt-min']);
  assert.deepEqual(result.currentScenarios.map(({ id }) => id), ['focus', 'balance', 'debt-min']);
  assert.equal(result.baselineScenarios[1].funding.studyMonths, 48);
  assert.equal(result.currentScenarios[1].funding.studyMonths, 60);
  assert.equal('supportPrograms' in result, false);
  assert.equal('supportSummary' in result, false);
  assert.deepEqual(result.policySnapshotIds, ['korea-icl-2026', 'korea-general-student-loan']);
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
    loanCap: 10000,
    workTaxPreset: 'simple-3.3',
  });
  const social = calculatePlan({
    ...SAMPLE_PROFILE,
    loanCap: 10000,
    workTaxPreset: 'social-9.5',
  });
  const simpleBalance = simple.currentScenarios.find(({ id }) => id === 'balance');
  const socialBalance = social.currentScenarios.find(({ id }) => id === 'balance');

  assert.ok(socialBalance.workMonthly < simpleBalance.workMonthly);
  assert.ok(socialBalance.newLoan > simpleBalance.newLoan);
  assert.equal(socialBalance.workIncomeBreakdown.taxRate, 0.095);
});
