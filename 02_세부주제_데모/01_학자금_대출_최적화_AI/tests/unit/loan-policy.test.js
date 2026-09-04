import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GENERAL_LOAN_POLICY,
  INCOME_CONTINGENT_POLICY,
  LOAN_POLICY_SNAPSHOT,
} from '../../src/policies/loans/2026.js';

test('2026-2 정책 스냅샷은 버전과 효력일, 공식 출처를 보존한다', () => {
  assert.equal(LOAN_POLICY_SNAPSHOT.snapshotId, 'kosaf-2026-2');
  assert.equal(LOAN_POLICY_SNAPSHOT.academicTerm, '2026-2');
  assert.equal(LOAN_POLICY_SNAPSHOT.effectiveFrom, '2026-07-01');
  assert.equal(LOAN_POLICY_SNAPSHOT.effectiveTo, '2026-12-31');
  assert.equal(LOAN_POLICY_SNAPSHOT.checkedAt, '2026-09-01');
  assert.ok(LOAN_POLICY_SNAPSHOT.sources.length >= 8);
  assert.ok(LOAN_POLICY_SNAPSHOT.sources.every(({ url }) => url.startsWith('https://')));
  assert.equal(Object.isFrozen(LOAN_POLICY_SNAPSHOT.products.general.repayment), true);
});

test('일반·취업후상환 금리 유형과 생활비 실행 경계를 분리한다', () => {
  assert.deepEqual(LOAN_POLICY_SNAPSHOT.products.general.interest, {
    annualRate: 1.7,
    type: 'fixed',
  });
  assert.equal(LOAN_POLICY_SNAPSHOT.products.incomeContingent.interest.annualRate, 1.7);
  assert.equal(LOAN_POLICY_SNAPSHOT.products.incomeContingent.interest.type, 'variable');
  assert.equal(LOAN_POLICY_SNAPSHOT.purposes.living.semesterLimit, 200);
  assert.equal(LOAN_POLICY_SNAPSHOT.purposes.living.minimumPerDisbursement, 10);
  assert.equal(LOAN_POLICY_SNAPSHOT.purposes.living.applicationUnit, 5);
  assert.equal(LOAN_POLICY_SNAPSHOT.purposes.living.cumulativePrincipalLimits.undergraduateFourYearOrCollege, 2400);
});

test('네 상품·용도 조합은 구성요소별 자격 충족을 전제로 허용한다', () => {
  assert.equal(LOAN_POLICY_SNAPSHOT.combinationRules.componentExecution, 'SEPARATE_TUITION_AND_LIVING_EXECUTION');
  assert.equal(LOAN_POLICY_SNAPSHOT.combinationRules.mixedProductByPurpose, 'ALLOWED');
  assert.deepEqual(LOAN_POLICY_SNAPSHOT.combinationRules.allowedCombinations, [
    { tuitionProduct: 'general', livingProduct: 'general' },
    { tuitionProduct: 'general', livingProduct: 'income-contingent' },
    { tuitionProduct: 'income-contingent', livingProduct: 'general' },
    { tuitionProduct: 'income-contingent', livingProduct: 'income-contingent' },
  ]);
});

test('상품·용도별 지원구간과 주요 시행일을 정책값으로 제공한다', () => {
  const general = LOAN_POLICY_SNAPSHOT.products.general;
  const contingent = LOAN_POLICY_SNAPSHOT.products.incomeContingent;
  assert.equal(general.eligibility.incomeBracket.tuition, 'NO_LIMIT');
  assert.equal(general.eligibility.incomeBracket.living, 'NO_LIMIT');
  assert.equal(contingent.eligibility.incomeBracket.undergraduateTuition, 'NO_LIMIT');
  assert.equal(contingent.eligibility.incomeBracket.graduateTuition, 'NO_LIMIT');
  assert.equal(contingent.eligibility.incomeBracket.undergraduateLivingMaximum, 8);
  assert.equal(contingent.eligibility.incomeBracket.graduateLivingMaximum, 6);
  assert.equal(contingent.eligibility.incomeBracket.undergraduateLivingEmergencyExceptionBracket, 9);
  const regional = LOAN_POLICY_SNAPSHOT.interestExemptions.find(({ id }) => id === 'icl-regional-university-tier-eight');
  assert.equal(regional.effectiveFrom, '2026-11-20');
  assert.equal(regional.maximumSupportBracket, 8);
  assert.equal(regional.status, 'scheduled-within-snapshot');
});

test('서비스 상환 기준은 일반 원리금균등과 취업후상환 연간 기준을 분리한다', () => {
  const contingent = LOAN_POLICY_SNAPSHOT.products.incomeContingent.repayment;
  assert.equal(GENERAL_LOAN_POLICY.repaymentMethod, 'equal-payment');
  assert.equal(contingent.annualGrossIncomeThreshold, 3037);
  assert.equal(contingent.annualGrossIncomeThresholdKind, 'GROSS_PAY_EQUIVALENT');
  assert.equal(contingent.undergraduateRate, 0.2);
  assert.equal(contingent.graduateRate, 0.25);
  assert.equal(INCOME_CONTINGENT_POLICY.snapshotId, LOAN_POLICY_SNAPSHOT.snapshotId);
});
