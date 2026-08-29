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
  assert.ok(result.supportPrograms.length >= 1);
  assert.deepEqual(result.policySnapshotIds, ['korea-icl-2026', 'korea-general-student-loan', 'kosaf-support-programs-2026-2']);
});

test('지원사업 후보 금액은 전체 계획의 확정 지원금에 자동 합산되지 않는다', () => {
  const result = calculatePlan({ ...SAMPLE_PROFILE, confirmedLivingGrantTotal: 0 });
  const balance = result.currentScenarios.find(({ id }) => id === 'balance');

  assert.equal(balance.funding.confirmedLivingGrantTotal, 0);
  assert.ok(result.supportSummary.candidatePrograms.some(({ estimatedSemesterAmount }) => estimatedSemesterAmount > 0));
});
