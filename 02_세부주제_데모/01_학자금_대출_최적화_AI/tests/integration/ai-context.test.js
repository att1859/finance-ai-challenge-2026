import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../../src/app/store.js';
import { applyPlan } from '../../src/app/actions.js';
import { calculatePlan } from '../../src/application/calculate-plan.js';
import { buildAiContext } from '../../src/app/ai-context.js';
import { validateRequest } from '../../server/index.js';

test('AI 맥락은 현재 계산 결과와 단위를 쓰고 프로필 전체와 원장은 제외한다', () => {
  const state = createInitialState();
  assert.equal(buildAiContext(state), null);
  applyPlan(state, calculatePlan(state.profile, state.stress));
  state.ui.calculated = true;
  const context = buildAiContext(state);
  assert.equal(context.selected.id, state.selectedScenarioId);
  const value = label => context.selected.facts.find(item => item.label === label).value;
  assert.equal(value('이번 학기 생활비 대출'), '180만 원');
  assert.equal(value('이번 학기 월 생활비 · 이자/상환 차감 전'), '80만 원');
  assert.equal(context.comparison.length, 2);
  assert.equal(context.profile, undefined);
  assert.ok(JSON.stringify(context).length < 10_000);
  state.ui.loading = true;
  assert.equal(buildAiContext(state), null);
});

test('FAQ 설명용 자기자금과 한도 부족분은 재계산된 시나리오와 일치한다', () => {
  const state = createInitialState();
  Object.assign(state.profile, { tuitionPerSemester: 400, tuitionContributionPerSemester: 200, currentMonthlyIncome: 50, desiredCollegeSpend: 120 });
  applyPlan(state, calculatePlan(state.profile, state.stress));
  state.ui.calculated = true;
  const context = buildAiContext(state);
  const value = label => context.selected.facts.find(item => item.label === label).value;
  assert.equal(value('이번 학기 등록금 대출'), '300만 원');
  assert.equal(value('최소 등록금 대출'), '200만 원');
  assert.equal(value('실제 사용하는 등록금 자기자금'), '100만 원');
  assert.equal(value('생활비 희망 부족분 · 대출 전 / 학기'), '420만 원');
  assert.equal(value('이번 학기 생활비 대출'), '200만 원');
  assert.equal(value('생활비 대출 한도 적용'), '요청액보다 적게 실행됨');
  assert.notEqual(value('생활비 보완 추가 알바 / 월'), '약 0시간');
  assert.deepEqual(validateRequest({ mode: 'summary', contextVersion: 1, context, messages: [] }).context, context);
});
