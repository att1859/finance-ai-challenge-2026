import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAMPLE_INPUTS,
  SCENARIO_DEFINITIONS,
  amortizedLoan,
  calculateAllScenarios,
  calculateScenario,
  monthlyWorkIncome,
} from '../src/lib/calculations.js';
import {
  PROGRAM_STATUSES,
  evaluateScholarships,
  summarizeScholarships,
} from '../src/data/scholarships.js';

test('주 20시간·시급 12,000원의 월 근로소득은 96만원이다', () => {
  assert.equal(monthlyWorkIncome(20, 12000), 96);
});

test('5,000만원을 연 1.5%로 5년 상환하면 월 상환액은 약 86.5만원이다', () => {
  const loan = amortizedLoan(5000, 1.5, 5);
  assert.ok(loan.monthlyPayment > 86 && loan.monthlyPayment < 87);
  assert.ok(loan.totalInterest > 180 && loan.totalInterest < 200);
});

test('샘플 장학금 후보는 매 학기 285만원, 8학기 2,280만원을 먼저 적용한다', () => {
  const programs = evaluateScholarships(SAMPLE_INPUTS);
  const summary = summarizeScholarships(programs, 8);
  assert.equal(summary.estimatedTotal, 2280);
  assert.equal(summary.appliedPrograms[0].id, 'national-i');
});

test('샘플 시나리오는 근로와 대출의 교환관계를 계산식으로 만든다', () => {
  const scenarios = calculateAllScenarios(SAMPLE_INPUTS, 2280);
  const focus = scenarios.find((scenario) => scenario.id === 'focus');
  const balance = scenarios.find((scenario) => scenario.id === 'balance');
  const debtMin = scenarios.find((scenario) => scenario.id === 'debt-min');

  assert.equal(focus.newLoan, 5000);
  assert.equal(balance.newLoan, 3500);
  assert.equal(debtMin.newLoan, 0);
  assert.ok(balance.possibleCollegeSpend > focus.possibleCollegeSpend);
  assert.ok(focus.possibleCareerSpend < balance.possibleCareerSpend);
  assert.ok(balance.possibleCareerSpend < debtMin.possibleCareerSpend);
});

test('장학금 미선정은 학업시간 확보형의 대학 월 생활소비를 47.5만원 낮춘다', () => {
  const definition = SCENARIO_DEFINITIONS.find((scenario) => scenario.id === 'focus');
  const baseline = calculateScenario(SAMPLE_INPUTS, 2280, definition);
  const stressed = calculateScenario(SAMPLE_INPUTS, 2280, definition, { scholarshipMiss: true });
  assert.equal(Math.round((stressed.possibleCollegeSpend - baseline.possibleCollegeSpend) * 10) / 10, -47.5);
});

test('취업 12개월 지연은 이자와 전환 공백자금을 함께 늘린다', () => {
  const definition = SCENARIO_DEFINITIONS.find((scenario) => scenario.id === 'balance');
  const baseline = calculateScenario(SAMPLE_INPUTS, 2280, definition);
  const delayed = calculateScenario(SAMPLE_INPUTS, 2280, definition, { employmentDelayMonths: 12 });
  assert.ok(delayed.loan.monthlyPayment > baseline.loan.monthlyPayment);
  assert.equal(delayed.transitionGap, 3000);
});

test('대표 지원사업 목록은 다섯 상태를 모두 노출한다', () => {
  const programs = evaluateScholarships(SAMPLE_INPUTS);
  const statuses = new Set(programs.map((item) => item.status));
  PROGRAM_STATUSES.forEach((status) => assert.ok(statuses.has(status), `${status} 상태가 필요합니다.`));
});

