import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateFundingSummary } from '../../src/domain/funding/calculate-funding.js';
import { amortizedLoan } from '../../src/domain/loans/amortized-loan.js';
import { calculateLoan } from '../../src/domain/loans/calculate-loan.js';
import { createLoanComposition } from '../../src/domain/loans/loan-composition.js';
import { calculateScenario } from '../../src/domain/scenarios/calculate-scenario.js';
import { SCENARIO_DEFINITIONS } from '../../src/domain/scenarios/definitions.js';
import { SAMPLE_PROFILE } from '../../src/data/sample-profile.js';
import { LOAN_POLICY_SNAPSHOT } from '../../src/policies/loans/2026.js';

const funding = calculateFundingSummary(SAMPLE_PROFILE);
const closeTo = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) < 1e-8);
};
const balanceDefinition = SCENARIO_DEFINITIONS.find(({ id }) => id === 'balance');

const compositionFor = ({
  tuition = 2000,
  living = 1000,
  tuitionProduct = 'general',
  livingProduct = tuitionProduct,
} = {}) => createLoanComposition({
  policySnapshot: LOAN_POLICY_SNAPSHOT,
  principalByPurpose: { tuition, living },
  productByPurpose: {
    tuition: tuitionProduct,
    living: livingProduct,
  },
  semesters: funding.semesters,
});

test('일반 상환은 프로필 선택과 무관하게 정책 금리의 원리금균등으로 계산한다', () => {
  const composition = compositionFor({ living: 0 });
  const result = calculateLoan({
    ...SAMPLE_PROFILE,
    annualRate: 9.9,
    repaymentMethod: 'equal-principal',
  }, composition, funding);
  const general = result.repayments.general;
  const expected = amortizedLoan(
    2000,
    LOAN_POLICY_SNAPSHOT.products.general.interest.annualRate,
    SAMPLE_PROFILE.repaymentYears,
  );

  assert.equal(result.type, 'general');
  assert.equal(general.repaymentType, 'fixed-monthly');
  assert.equal(general.repaymentMethod, 'equal-payment');
  assert.equal(general.annualRate, 1.7);
  assert.equal(general.monthlyPayment, expected.monthlyPayment);
  assert.equal(result.monthlyScheduledPayment, expected.monthlyPayment);
});

test('일반 상환은 졸업 후 준비 1년·상환 10년을 기본값으로 사용한다', () => {
  const { graceYears, repaymentYears, ...profileWithoutTerms } = SAMPLE_PROFILE;
  const general = calculateLoan(
    profileWithoutTerms,
    compositionFor({ living: 0 }),
    funding,
  ).repayments.general;

  assert.equal(general.repaymentTerms.requestedGraduationPreparationYears, 1);
  assert.equal(general.repaymentTerms.repaymentYears, 10);
  assert.equal(general.paymentMonths, 120);
  assert.ok(general.componentRepaymentSchedules.every((component) => (
    component.repaymentYears === 10
  )));
});

test('일반 상환은 졸업 후 준비기간 0·1·2년을 실행분별 시작일에 반영한다', () => {
  const funding = calculateFundingSummary(SAMPLE_PROFILE);
  const composition = compositionFor(3000, funding);
  const startDates = [0, 1, 2].map((graceYears) => calculateLoan(
    { ...SAMPLE_PROFILE, graceYears },
    composition,
    funding,
  ).repayments.general.repaymentStartDate);

  assert.deepEqual(startDates, ['2030-07-01', '2031-07-01', '2032-07-01']);
});

test('학기별 실행일에서 거치이자와 원리금균등 일정을 만들고 같은 달에 합산한다', () => {
  const shortFunding = {
    baseStudyMonths: 24,
    studyMonths: 24,
    semesters: 4,
  };
  const composition = createLoanComposition({
    policySnapshot: LOAN_POLICY_SNAPSHOT,
    principalByPurpose: { tuition: 400, living: 0 },
    productByPurpose: { tuition: 'general', living: 'general' },
    semesters: shortFunding.semesters,
  });
  const result = calculateLoan({
    ...SAMPLE_PROFILE,
    graceYears: 1,
    repaymentYears: 10,
  }, composition, shortFunding);
  const general = result.repayments.general;
  const first = general.componentRepaymentSchedules[0];
  const firstCombinedRepaymentMonth = general.monthlyRepaymentSchedule.find(
    ({ globalMonth }) => globalMonth === 36,
  );

  assert.equal(first.disbursementDate, '2026-07-01');
  assert.equal(first.scheduledGraduationDate, '2028-07-01');
  assert.equal(first.graceYears, 3);
  assert.equal(first.repaymentStartDate, '2029-07-01');
  assert.equal(first.repaymentEndDate, '2039-07-01');
  closeTo(first.monthlyGraceInterest, 100 * 0.017 / 12);
  closeTo(first.graceInterest, first.monthlyGraceInterest * 36);
  assert.equal(first.monthlySchedule.filter(({ phase }) => phase === 'grace').length, 36);
  assert.equal(first.monthlySchedule.filter(({ phase }) => phase === 'repayment').length, 120);
  closeTo(
    first.monthlySchedule.reduce((sum, row) => sum + row.principalPayment, 0),
    first.principal,
  );
  closeTo(first.monthlySchedule.at(-1).closingPrincipal, 0);
  assert.equal(firstCombinedRepaymentMonth.repaymentComponentCount, 2);
  assert.equal(firstCombinedRepaymentMonth.graceComponentCount, 2);
  assert.equal(general.repaymentStartDate, '2029-07-01');
  assert.equal(general.repaymentEndDate, '2040-01-01');
  closeTo(
    general.monthlyPayment,
    amortizedLoan(400, 1.7, 10).monthlyPayment,
  );
  closeTo(result.firstYearRepayment, general.firstYearRepayment);
  assert.ok(general.firstYearRepayment < general.monthlyPayment * 12);
  closeTo(general.balanceAtGraduation, 400);
  closeTo(general.totalInterest, general.graceInterest + general.repaymentInterest);
  closeTo(general.monthlyRepaymentSchedule.at(-1).closingPrincipal, 0);
});

test('일반 상환의 요청 기간은 공식 거치·상환 상한을 넘지 않는다', () => {
  const longFunding = {
    baseStudyMonths: 96,
    studyMonths: 96,
    semesters: 16,
  };
  const composition = createLoanComposition({
    policySnapshot: LOAN_POLICY_SNAPSHOT,
    principalByPurpose: { tuition: 1600, living: 0 },
    productByPurpose: { tuition: 'general', living: 'general' },
    semesters: longFunding.semesters,
  });
  const general = calculateLoan({
    ...SAMPLE_PROFILE,
    graceYears: 5,
    repaymentYears: 99,
  }, composition, longFunding).repayments.general;
  const first = general.componentRepaymentSchedules[0];

  assert.equal(general.repaymentTerms.maximumGraceYears, 10);
  assert.equal(general.repaymentTerms.maximumRepaymentYears, 10);
  assert.equal(general.repaymentTerms.repaymentYears, 10);
  assert.equal(general.repaymentTerms.repaymentYearsLimited, true);
  assert.equal(first.graceYears, 10);
  assert.equal(first.graceLimited, true);
  assert.equal(first.appliedGraduationPreparationYears, 2);
});

test('졸업 지연에도 기존 약정은 유지하며 추가 대출을 생성하지 않는다', () => {
  const profile = {
    ...SAMPLE_PROFILE,
    remainingSemesters: 4,
    graceYears: 0,
    repaymentYears: 10,
  };
  const baseline = calculateScenario(profile, balanceDefinition);
  const delayed = calculateScenario(
    profile,
    balanceDefinition,
    { graduationDelayMonths: 12 },
  );
  const baselineFirst = baseline.loan.componentRepaymentSchedules.find(
    ({ id }) => id === 'general:tuition:1',
  );
  const delayedFirst = delayed.loan.componentRepaymentSchedules.find(
    ({ id }) => id === 'general:tuition:1',
  );
  const delayedAdditional = delayed.loan.componentRepaymentSchedules.find(
    ({ id }) => id === 'general:tuition:5',
  );

  assert.equal(delayedFirst.repaymentStartDate, baselineFirst.repaymentStartDate);
  assert.equal(delayedFirst.scheduledGraduationMonth, 24);
  assert.equal(delayedAdditional, undefined);
  assert.ok(delayed.loan.duringStudyPayment > baseline.loan.duringStudyPayment);
  assert.ok(delayed.loan.balanceAtGraduation < delayed.loan.principal);
});

test('현재 기준 10년 일반 상환 비교는 120개월 동안 현재 금리를 유지한다', () => {
  const result = calculateLoan(
    SAMPLE_PROFILE,
    compositionFor({ living: 0 }),
    funding,
  );
  const comparison = result.currentValueComparison;

  assert.equal(comparison.label, '현재 기준 10년 단순 비교');
  assert.equal(comparison.periodMonths, 120);
  assert.equal(comparison.general.monthlySchedule.length, 120);
  assert.ok(comparison.general.monthlySchedule.every(({ annualRate }) => annualRate === 1.7));
  assert.equal(comparison.monthlyIncome, SAMPLE_PROFILE.salary);
  assert.equal(comparison.monthlyLivingCost, SAMPLE_PROFILE.desiredCareerSpend);
  assert.deepEqual(comparison.assumptions, {
    incomeGrowthRate: 0,
    thresholdGrowthRate: 0,
    interestRateChange: 0,
  });
});

test('현재 기준 10년 취업후상환 비교는 소득·기준소득·금리를 매년 같은 값으로 유지한다', () => {
  const composition = compositionFor({
    living: 0,
    tuitionProduct: 'income-contingent',
  });
  const result = calculateLoan({
    ...SAMPLE_PROFILE,
    loanType: 'income-contingent',
    salary: 300,
  }, composition, funding);
  const comparison = result.currentValueComparison.incomeContingent;

  assert.equal(comparison.annualSchedule.length, 10);
  assert.ok(comparison.annualSchedule.every((year) => (
    year.annualRate === 1.7
    && year.annualGrossIncome === 3600
    && year.annualGrossIncomeThreshold === 3037
    && year.repaymentRate === 0.2
  )));
  closeTo(comparison.totalPayment, comparison.annualSchedule.reduce(
    (sum, year) => sum + year.mandatoryRepayment,
    0,
  ));
  closeTo(comparison.endingBalance, comparison.annualSchedule.at(-1).closingBalance);
});

test('초봉 감소와 취업 지연은 현재 기준 비교의 시작값만 바꾸고 미래 증가율을 만들지 않는다', () => {
  const composition = compositionFor({
    living: 0,
    tuitionProduct: 'income-contingent',
  });
  const result = calculateLoan({
    ...SAMPLE_PROFILE,
    loanType: 'income-contingent',
    salary: 300,
  }, composition, funding, {
    salaryReductionRate: 0.2,
    employmentDelayMonths: 12,
  });
  const comparison = result.currentValueComparison;

  assert.equal(comparison.monthlyIncome, 240);
  assert.ok(comparison.incomeContingent.annualSchedule.every(({ annualGrossIncome }) => (
    annualGrossIncome === 2880
  )));
  assert.equal(comparison.assumptions.incomeGrowthRate, 0);
  assert.equal(comparison.assumptions.interestRateChange, 0);
});

test('취업 후 상환은 연소득 경계와 최소 의무상환액을 연간 단위로 계산한다', () => {
  const composition = compositionFor({
    living: 0,
    tuitionProduct: 'income-contingent',
  });
  const calculateAt = (annualGrossIncome) => calculateLoan({
    ...SAMPLE_PROFILE,
    loanType: 'income-contingent',
    salary: annualGrossIncome / 12,
  }, composition, funding).repayments.incomeContingent;

  assert.equal(calculateAt(3000).annualMandatoryRepayment, 0);
  assert.equal(calculateAt(3037).annualMandatoryRepayment, 0);
  assert.equal(calculateAt(3038).annualMandatoryRepayment, 36);
  closeTo(calculateAt(3600).annualMandatoryRepayment, 112.6);
  assert.equal(calculateAt(3600).repaymentType, 'annual-mandatory');
  assert.equal(calculateAt(3600).monthlyPayment, null);
  closeTo(calculateAt(3600).monthlyAverageEquivalent, 112.6 / 12);
});

test('취업 후 상환율은 학부와 대학원 정책값을 구분한다', () => {
  const composition = compositionFor({
    living: 0,
    tuitionProduct: 'income-contingent',
  });
  const calculateFor = (academicLevel) => calculateLoan({
    ...SAMPLE_PROFILE,
    academicLevel,
    loanType: 'income-contingent',
    salary: 300,
  }, composition, funding).repayments.incomeContingent;

  assert.equal(calculateFor('undergraduate').repaymentRate, 0.2);
  closeTo(calculateFor('undergraduate').annualMandatoryRepayment, 112.6);
  assert.equal(calculateFor('graduate').repaymentRate, 0.25);
  closeTo(calculateFor('graduate').annualMandatoryRepayment, 140.75);
});

test('혼합 구성은 일반 월 납입과 취업후 연간 의무상환을 별도로 계산한다', () => {
  const composition = compositionFor({
    tuitionProduct: 'general',
    livingProduct: 'income-contingent',
  });
  const result = calculateLoan({
    ...SAMPLE_PROFILE,
    salary: 300,
  }, composition, funding);

  assert.equal(result.type, 'mixed');
  assert.equal(result.repayments.general.principal, 2000);
  assert.equal(result.repayments.incomeContingent.principal, 1000);
  assert.ok(result.monthlyScheduledPayment > 0);
  closeTo(result.annualMandatoryRepayment, 112.6);
  assert.equal(
    result.monthlyBurdenForComparison,
    result.monthlyScheduledPayment
      + result.monthlyAverageMandatoryRepayment,
  );
});
