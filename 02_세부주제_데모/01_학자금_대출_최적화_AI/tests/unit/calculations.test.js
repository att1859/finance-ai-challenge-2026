import test from 'node:test';
import assert from 'node:assert/strict';
import { assessSupportPrograms } from '../../src/application/assess-support-programs.js';
import { calculateFundingSummary } from '../../src/domain/funding/calculate-funding.js';
import { monthlyWorkIncome } from '../../src/domain/funding/work-income.js';
import { amortizedLoan } from '../../src/domain/loans/amortized-loan.js';
import { calculateLoan } from '../../src/domain/loans/calculate-loan.js';
import { buildLoanDisbursementSchedule } from '../../src/domain/loans/disbursement-schedule.js';
import {
  calculateAllScenarios,
  calculateScenario,
} from '../../src/domain/scenarios/calculate-scenario.js';
import { SCENARIO_DEFINITIONS } from '../../src/domain/scenarios/definitions.js';
import { PROGRAM_STATUSES } from '../../src/domain/support-programs/statuses.js';
import { SAMPLE_PROFILE } from '../../src/data/sample-profile.js';

const balance = SCENARIO_DEFINITIONS.find((item) => item.id === 'balance');

test('주 20시간·시급 12,000원의 월 근로소득은 96만 원이다', () => assert.equal(monthlyWorkIncome(20, 12000), 96));

test('원리금균등은 금리 0%와 1.5%를 각각 계산한다', () => {
  assert.equal(amortizedLoan(5000, 0, 5).monthlyPayment, 5000 / 60);
  const loan = amortizedLoan(5000, 1.5, 5);
  assert.ok(loan.monthlyPayment > 86 && loan.monthlyPayment < 87);
});

test('잔여기간 0.5·1·4년은 학기와 생활개월에 공통 반영된다', () => {
  [[0.5, 1, 6], [1, 2, 12], [4, 8, 48]].forEach(([years, semesters, months]) => {
    const result = calculateFundingSummary({ ...SAMPLE_PROFILE, graduationYears: years });
    assert.equal(result.semesters, semesters);
    assert.equal(result.studyMonths, months);
    assert.equal(result.educationNeed, SAMPLE_PROFILE.tuitionPerSemester * semesters);
  });
});

test('학기별 실행액 합계는 신규 대출원금과 일치한다', () => {
  [1, 2, 8].forEach((semesters) => {
    const sum = buildLoanDisbursementSchedule(5000, semesters, 1.5).reduce((total, item) => total + item.amount, 0);
    assert.ok(Math.abs(sum - 5000) < 1e-8);
  });
});

test('확정 지원금만 계산하며 0원일 때 지원사업 후보는 차감되지 않는다', () => {
  const noSupport = calculateScenario({ ...SAMPLE_PROFILE, confirmedLivingGrantTotal: 0 }, balance);
  const withSupport = calculateScenario({ ...SAMPLE_PROFILE, confirmedLivingGrantTotal: 600 }, balance);
  assert.equal(withSupport.funding.totalNeed, noSupport.funding.totalNeed);
  assert.equal(withSupport.funding.confirmedLivingGrantTotal, 600);
  assert.ok(withSupport.possibleCollegeSpend > noSupport.possibleCollegeSpend);
});

test('일반 상환의 원금균등과 원리금균등을 구분한다', () => {
  const funding = calculateFundingSummary(SAMPLE_PROFILE);
  const equalPayment = calculateLoan({ ...SAMPLE_PROFILE, repaymentMethod: 'equal-payment' }, 3000, funding);
  const equalPrincipal = calculateLoan({ ...SAMPLE_PROFILE, repaymentMethod: 'equal-principal' }, 3000, funding);
  assert.equal(equalPayment.repaymentMethod, 'equal-payment');
  assert.equal(equalPrincipal.repaymentMethod, 'equal-principal');
  assert.ok(equalPrincipal.firstMonthPayment > equalPrincipal.monthlyEquivalent);
});

test('취업 후 상환은 기준소득 이하·경계·초과에서 예상 의무상환액을 계산한다', () => {
  const funding = calculateFundingSummary(SAMPLE_PROFILE);
  const policy = { annualIncomeThreshold: 3037, repaymentRate: 0.2 };
  const at = (annualIncome) => calculateLoan({ ...SAMPLE_PROFILE, loanType: 'income-contingent', salary: annualIncome / 12 }, 3000, funding, {}, policy);
  assert.equal(at(3000).annualMandatoryRepayment, 0);
  assert.equal(at(3037).annualMandatoryRepayment, 0);
  assert.ok(Math.abs(at(3600).annualMandatoryRepayment - 112.6) < 1e-8);
});

test('정책값이 없으면 취업 후 상환액을 임의 계산하지 않는다', () => {
  const result = calculateLoan({ ...SAMPLE_PROFILE, loanType: 'income-contingent' }, 3000, calculateFundingSummary(SAMPLE_PROFILE), {}, {});
  assert.equal(result.calculationPossible, false);
  assert.equal(result.monthlyEquivalent, null);
});

test('졸업 지연은 재학기간에, 취업 지연은 졸업 후에만 반영된다', () => {
  const baseline = calculateScenario(SAMPLE_PROFILE, balance);
  const gradDelay = calculateScenario(SAMPLE_PROFILE, balance, { graduationDelayMonths: 12 });
  const jobDelay = calculateScenario(SAMPLE_PROFILE, balance, { employmentDelayMonths: 12 });
  assert.equal(gradDelay.funding.studyMonths, baseline.funding.studyMonths + 12);
  assert.equal(jobDelay.funding.studyMonths, baseline.funding.studyMonths);
  assert.equal(jobDelay.transitionGap, SAMPLE_PROFILE.desiredCareerSpend * 12);
  assert.ok(jobDelay.loan.totalInterest > baseline.loan.totalInterest);
});

test('대출상한과 음수 생활비 여력을 0으로 위장하지 않는다', () => {
  const scenarios = calculateAllScenarios({ ...SAMPLE_PROFILE, loanCap: 100, tuitionPerSemester: 2000 });
  assert.ok(scenarios.every((item) => item.newLoan <= 100));
  assert.ok(scenarios.some((item) => item.possibleCollegeSpend < 0));
});

test('대표 지원사업 목록은 다섯 상태를 모두 노출한다', () => {
  const statuses = new Set(assessSupportPrograms(SAMPLE_PROFILE).programs.map((item) => item.status));
  PROGRAM_STATUSES.forEach((status) => assert.ok(statuses.has(status), `${status} 상태가 필요합니다.`));
});
