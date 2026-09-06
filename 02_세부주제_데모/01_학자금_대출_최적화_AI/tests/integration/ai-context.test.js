import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../../src/app/store.js';
import { applyPlan } from '../../src/app/actions.js';
import { calculatePlan } from '../../src/application/calculate-plan.js';
import { buildAiContext } from '../../src/app/ai-context.js';

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
