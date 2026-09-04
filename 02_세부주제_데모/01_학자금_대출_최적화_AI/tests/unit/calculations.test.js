import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFundingSummary } from '../../src/domain/funding/calculate-funding.js';
import { calculateMonthlyWorkIncome } from '../../src/domain/funding/work-income.js';
import { amortizedLoan } from '../../src/domain/loans/amortized-loan.js';
import { calculateLoan } from '../../src/domain/loans/calculate-loan.js';
import { buildLoanDisbursementSchedule } from '../../src/domain/loans/disbursement-schedule.js';
import {
  createLoanComposition,
  getLoanCompositionComponents,
} from '../../src/domain/loans/loan-composition.js';
import {
  calculateAllScenarios,
  calculateScenario,
} from '../../src/domain/scenarios/calculate-scenario.js';
import { SCENARIO_DEFINITIONS } from '../../src/domain/scenarios/definitions.js';
import { DEFAULT_PROFILE, SAMPLE_PROFILE } from '../../src/data/sample-profile.js';
import { LOAN_POLICY_SNAPSHOT } from '../../src/policies/loans/2026.js';

const balance = SCENARIO_DEFINITIONS.find((item) => item.id === 'balance');
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8);
const compositionFor = (principal, funding, product = 'general') => (
  createLoanComposition({
    policySnapshot: LOAN_POLICY_SNAPSHOT,
    principalByPurpose: { tuition: principal, living: 0 },
    productByPurpose: { tuition: product, living: product },
    semesters: funding.semesters,
  })
);
const snapshotWithIncomeRepayment = ({ threshold, rate }) => ({
  ...LOAN_POLICY_SNAPSHOT,
  products: {
    ...LOAN_POLICY_SNAPSHOT.products,
    incomeContingent: {
      ...LOAN_POLICY_SNAPSHOT.products.incomeContingent,
      repayment: {
        ...LOAN_POLICY_SNAPSHOT.products.incomeContingent.repayment,
        annualGrossIncomeThreshold: threshold,
        undergraduateRate: rate,
      },
    },
  },
});

test('최초 프로필은 월 희망 생활비 80만 원을 사용하고 금리는 입력받지 않는다', () => {
  assert.equal(DEFAULT_PROFILE.desiredCollegeSpend, 80);
  assert.equal(SAMPLE_PROFILE.desiredCollegeSpend, 80);
  assert.equal('annualRate' in DEFAULT_PROFILE, false);
  assert.equal('repaymentMethod' in DEFAULT_PROFILE, false);
});

test('입력 프로필은 현재 근로시간만 보관한다', () => {
  assert.equal(DEFAULT_PROFILE.currentWorkHours, 20);
  assert.equal(DEFAULT_PROFILE.workTaxPreset, 'simple-3.3');
  assert.equal('desiredWorkHours' in DEFAULT_PROFILE, false);
});

test('주 20시간·시급 12,000원은 주휴와 3.3% 차감을 반영해 월 약 121만 원이다', () => {
  const income = calculateMonthlyWorkIncome({
    weeklyHours: 20,
    hourlyWage: 12000,
    taxPreset: 'simple-3.3',
  });

  closeTo(income.monthlyWeeks, 365 / 7 / 12);
  assert.equal(income.weeklyHolidayEligible, true);
  assert.equal(income.weeklyHolidayHours, 4);
  closeTo(income.baseMonthly, 104.28571428571428);
  closeTo(income.holidayMonthly, 20.857142857142854);
  closeTo(income.grossMonthly, 125.14285714285714);
  closeTo(income.deductionMonthly, 4.129714285714285);
  closeTo(income.netMonthly, 121.01314285714285);
  assert.equal(income.taxRate, 0.033);
});

test('주휴수당은 주 15시간 경계부터 비례 적용된다', () => {
  const below = calculateMonthlyWorkIncome({ weeklyHours: 14, hourlyWage: 12000 });
  const boundary = calculateMonthlyWorkIncome({ weeklyHours: 15, hourlyWage: 12000 });
  const capped = calculateMonthlyWorkIncome({ weeklyHours: 50, hourlyWage: 12000 });

  assert.equal(below.weeklyHolidayEligible, false);
  assert.equal(below.weeklyHolidayHours, 0);
  assert.equal(boundary.weeklyHolidayEligible, true);
  assert.equal(boundary.weeklyHolidayHours, 3);
  assert.equal(capped.weeklyHolidayHours, 8);
});

test('간편 차감 선택은 같은 총소득에 3.3%·9.5%·0%를 각각 적용한다', () => {
  const calculate = (taxPreset) => calculateMonthlyWorkIncome({
    weeklyHours: 20,
    hourlyWage: 12000,
    taxPreset,
  });
  const simple = calculate('simple-3.3');
  const social = calculate('social-9.5');
  const daily = calculate('daily-0');

  closeTo(simple.grossMonthly, social.grossMonthly);
  closeTo(simple.grossMonthly, daily.grossMonthly);
  closeTo(social.deductionMonthly, social.grossMonthly * 0.095);
  assert.ok(social.netMonthly < simple.netMonthly);
  assert.equal(daily.deductionMonthly, 0);
  closeTo(daily.netMonthly, daily.grossMonthly);
});

test('세 시나리오는 현재 근로시간의 0%·50%·100%와 감소량을 반환한다', () => {
  const scenarios = calculateAllScenarios({ ...SAMPLE_PROFILE, currentWorkHours: 13 });

  assert.deepEqual(scenarios.map(({ workHours }) => workHours), [0, 6.5, 13]);
  assert.deepEqual(scenarios.map(({ workHoursReduced }) => workHoursReduced), [13, 6.5, 0]);
  assert.ok(scenarios.every(({ workIncomeBreakdown }) => workIncomeBreakdown));
});

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

test('학기별 실행분 원금 합계는 대출 구성 원금과 일치한다', () => {
  [1, 2, 8].forEach((semesters) => {
    const funding = { semesters, studyMonths: semesters * 6 };
    const composition = compositionFor(5000, funding);
    const schedule = buildLoanDisbursementSchedule(
      getLoanCompositionComponents(composition),
      funding.studyMonths,
      1.5,
    );
    const sum = schedule.reduce((total, item) => total + item.principal, 0);
    assert.ok(Math.abs(sum - 5000) < 1e-8);
  });
});

test('과거 프로필의 지원금 값은 시나리오 계산에 영향을 주지 않는다', () => {
  const withoutLegacyGrant = calculateScenario(SAMPLE_PROFILE, balance);
  const withLegacyGrant = calculateScenario({ ...SAMPLE_PROFILE, confirmedLivingGrantTotal: 600 }, balance);
  assert.deepEqual(withLegacyGrant.loanComposition, withoutLegacyGrant.loanComposition);
  assert.equal(withLegacyGrant.possibleCollegeSpend, withoutLegacyGrant.possibleCollegeSpend);
  assert.equal(withLegacyGrant.fundingGap, withoutLegacyGrant.fundingGap);
});

test('일반 상환은 입력의 과거 상환방식 값과 무관하게 원리금균등을 사용한다', () => {
  const funding = calculateFundingSummary(SAMPLE_PROFILE);
  const composition = compositionFor(3000, funding);
  const equalPayment = calculateLoan({ ...SAMPLE_PROFILE, repaymentMethod: 'equal-payment' }, composition, funding);
  const equalPrincipal = calculateLoan({ ...SAMPLE_PROFILE, repaymentMethod: 'equal-principal' }, composition, funding);
  assert.equal(equalPayment.repayments.general.repaymentMethod, 'equal-payment');
  assert.equal(equalPrincipal.repayments.general.repaymentMethod, 'equal-payment');
  assert.equal(equalPrincipal.monthlyScheduledPayment, equalPayment.monthlyScheduledPayment);
});

test('취업 후 상환은 기준소득 이하·경계·초과에서 예상 의무상환액을 계산한다', () => {
  const funding = calculateFundingSummary(SAMPLE_PROFILE);
  const composition = compositionFor(3000, funding, 'income-contingent');
  const policy = snapshotWithIncomeRepayment({ threshold: 3037, rate: 0.2 });
  const at = (annualIncome) => calculateLoan({ ...SAMPLE_PROFILE, loanType: 'income-contingent', salary: annualIncome / 12 }, composition, funding, {}, policy);
  assert.equal(at(3000).annualMandatoryRepayment, 0);
  assert.equal(at(3037).annualMandatoryRepayment, 0);
  assert.ok(Math.abs(at(3600).annualMandatoryRepayment - 112.6) < 1e-8);
});

test('정책값이 없으면 취업 후 상환액을 임의 계산하지 않는다', () => {
  const funding = calculateFundingSummary(SAMPLE_PROFILE);
  const composition = compositionFor(3000, funding, 'income-contingent');
  const policy = snapshotWithIncomeRepayment({ threshold: undefined, rate: undefined });
  const result = calculateLoan({ ...SAMPLE_PROFILE, loanType: 'income-contingent' }, composition, funding, {}, policy);
  assert.equal(result.calculationPossible, false);
  assert.equal(result.annualMandatoryRepayment, null);
  assert.equal(result.monthlyAverageMandatoryRepayment, null);
});

test('졸업 지연은 재학기간에 반영하고 취업 지연은 일반 상환 약정을 옮기지 않는다', () => {
  const baseline = calculateScenario(SAMPLE_PROFILE, balance);
  const gradDelay = calculateScenario(SAMPLE_PROFILE, balance, { graduationDelayMonths: 12 });
  const jobDelay = calculateScenario(SAMPLE_PROFILE, balance, { employmentDelayMonths: 12 });
  assert.equal(gradDelay.funding.studyMonths, baseline.funding.studyMonths + 12);
  assert.equal(jobDelay.funding.studyMonths, baseline.funding.studyMonths);
  assert.equal(jobDelay.transitionGap, SAMPLE_PROFILE.desiredCareerSpend * 12);
  assert.equal(jobDelay.loan.totalInterest, baseline.loan.totalInterest);
});

test('대출상한과 음수 생활비 여력을 0으로 위장하지 않는다', () => {
  const scenarios = calculateAllScenarios({ ...SAMPLE_PROFILE, loanCap: 100, tuitionPerSemester: 2000 });
  assert.ok(scenarios.every((item) => item.loanComposition.totals.combined <= 100));
  assert.ok(scenarios.some((item) => item.possibleCollegeSpend < 0));
});
