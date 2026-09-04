import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateFundingSummary } from '../../src/domain/funding/calculate-funding.js';
import { amortizedLoan } from '../../src/domain/loans/amortized-loan.js';
import { calculateLoan } from '../../src/domain/loans/calculate-loan.js';
import { createLoanComposition } from '../../src/domain/loans/loan-composition.js';
import { SAMPLE_PROFILE } from '../../src/data/sample-profile.js';
import { LOAN_POLICY_SNAPSHOT } from '../../src/policies/loans/2026.js';

const funding = calculateFundingSummary(SAMPLE_PROFILE);
const closeTo = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) < 1e-8);
};

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
