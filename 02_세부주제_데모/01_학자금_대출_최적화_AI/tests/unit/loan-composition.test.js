import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createLoanComposition,
  getLoanCompositionComponents,
  getLoanCompositionPrincipal,
} from '../../src/domain/loans/loan-composition.js';
import { LOAN_POLICY_SNAPSHOT } from '../../src/policies/loans/2026.js';

test('정책이 허용한 네 상품·용도 조합을 각각 독립 실행분으로 만든다', () => {
  LOAN_POLICY_SNAPSHOT.combinationRules.allowedCombinations.forEach((combination) => {
    const composition = createLoanComposition({
      policySnapshot: LOAN_POLICY_SNAPSHOT,
      principalByPurpose: { tuition: 840, living: 400 },
      productByPurpose: {
        tuition: combination.tuitionProduct,
        living: combination.livingProduct,
      },
      semesters: 2,
    });

    assert.equal(composition.tuitionComponents.length, 2);
    assert.equal(composition.livingComponents.length, 2);
    assert.ok(composition.tuitionComponents.every((component) => (
      component.product === combination.tuitionProduct
      && component.purpose === 'tuition'
    )));
    assert.ok(composition.livingComponents.every((component) => (
      component.product === combination.livingProduct
      && component.purpose === 'living'
    )));
    assert.equal(getLoanCompositionPrincipal(composition, { purpose: 'tuition' }), 840);
    assert.equal(getLoanCompositionPrincipal(composition, { purpose: 'living' }), 400);
    assert.equal(composition.totals.combined, 1240);
  });
});

test('실행분은 학기·실행일·미판정 자격과 공식 정책근거를 추적한다', () => {
  const composition = createLoanComposition({
    policySnapshot: LOAN_POLICY_SNAPSHOT,
    principalByPurpose: { tuition: 1260, living: 600 },
    productByPurpose: {
      tuition: 'general',
      living: 'income-contingent',
    },
    semesters: 3,
  });
  const components = getLoanCompositionComponents(composition);

  assert.deepEqual(
    composition.tuitionComponents.map(({ principal }) => principal),
    [420, 420, 420],
  );
  assert.deepEqual(
    composition.livingComponents.map(({ principal }) => principal),
    [200, 200, 200],
  );
  assert.deepEqual(
    components.map(({ semester }) => semester),
    [1, 2, 3, 1, 2, 3],
  );
  assert.deepEqual(
    composition.tuitionComponents.map(({ disbursementDate }) => disbursementDate),
    ['2026-07-01', '2027-01-01', '2027-07-01'],
  );
  assert.ok(components.every(({ eligibility }) => (
    eligibility.status === 'unknown'
    && eligibility.reasonCodes.includes('ELIGIBILITY_NOT_EVALUATED')
  )));
  assert.ok(components.every(({ policyReference }) => (
    policyReference.snapshotId === 'kosaf-2026-2'
    && policyReference.sourceIds.includes('kosaf-conversion')
  )));
});

test('원금이 0원인 용도는 실행분을 만들지 않는다', () => {
  const composition = createLoanComposition({
    policySnapshot: LOAN_POLICY_SNAPSHOT,
    principalByPurpose: { tuition: 0, living: 0 },
    productByPurpose: { tuition: 'general', living: 'general' },
    semesters: 8,
  });

  assert.deepEqual(composition.tuitionComponents, []);
  assert.deepEqual(composition.livingComponents, []);
  assert.equal(getLoanCompositionPrincipal(composition), 0);
});

test('정책에 없는 상품·용도 조합은 만들지 않는다', () => {
  const restrictedSnapshot = {
    ...LOAN_POLICY_SNAPSHOT,
    combinationRules: {
      ...LOAN_POLICY_SNAPSHOT.combinationRules,
      allowedCombinations: [
        { tuitionProduct: 'general', livingProduct: 'general' },
      ],
    },
  };

  assert.throws(() => createLoanComposition({
    policySnapshot: restrictedSnapshot,
    principalByPurpose: { tuition: 420, living: 200 },
    productByPurpose: {
      tuition: 'general',
      living: 'income-contingent',
    },
    semesters: 1,
  }), /허용하지 않은 상품·용도 조합/);
});
