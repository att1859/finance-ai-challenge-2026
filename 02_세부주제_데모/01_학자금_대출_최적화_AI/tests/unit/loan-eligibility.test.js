import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateLoanCompositionEligibility,
  evaluateLoanEligibility,
  evaluateLoanEligibilityCombinations,
} from '../../src/domain/loans/eligibility.js';
import { createLoanComposition } from '../../src/domain/loans/loan-composition.js';
import { LOAN_POLICY_SNAPSHOT } from '../../src/policies/loans/2026.js';

const confirmedCommonEligibility = Object.fromEntries(
  LOAN_POLICY_SNAPSHOT.commonEligibilityRules.map((id) => [id, true]),
);

const COMPLETE_UNDERGRADUATE = Object.freeze({
  academicLevel: 'undergraduate',
  age: 24,
  studentStatus: 'continuing',
  previousSemesterScore: 80,
  previousSemesterCredits: 15,
  isDisabled: false,
  isGraduating: false,
  supportBracket: 3,
  enteredByAge55AndContinuouslyEnrolled: false,
  qualifyingEmployedUndergraduateProgram: false,
  hasEmergencyLivelihood: false,
  isMultiChildHousehold: false,
  isCareLeaver: false,
  isProtectedChild: false,
  isBasicOrNearPoverty: false,
  mandatoryRepaymentStarted: false,
  isNonCapitalRegionUniversity: false,
  annualIncomeNotAboveRepaymentThreshold: false,
  commonEligibility: confirmedCommonEligibility,
});

const evaluate = (overrides = {}, options = {}) => evaluateLoanEligibility({
  applicant: { ...COMPLETE_UNDERGRADUATE, ...overrides },
  asOfDate: options.asOfDate,
  policySnapshot: LOAN_POLICY_SNAPSHOT,
  product: options.product ?? 'income-contingent',
  purpose: options.purpose ?? 'living',
});

test('입력이 모두 확인되면 정책의 네 상품·용도 조합이 eligible이다', () => {
  const combinations = evaluateLoanEligibilityCombinations({
    applicant: COMPLETE_UNDERGRADUATE,
    policySnapshot: LOAN_POLICY_SNAPSHOT,
  });

  assert.deepEqual(
    combinations.map(({ id }) => id),
    [
      'general:general',
      'general:income-contingent',
      'income-contingent:general',
      'income-contingent:income-contingent',
    ],
  );
  assert.ok(combinations.every(({ status }) => status === 'eligible'));
});

test('네 상품 조합은 용도별 자격 차이를 독립적으로 반영한다', () => {
  const combinations = evaluateLoanEligibilityCombinations({
    applicant: {
      ...COMPLETE_UNDERGRADUATE,
      supportBracket: 10,
    },
    policySnapshot: LOAN_POLICY_SNAPSHOT,
  });

  assert.deepEqual(
    combinations.map(({ id, status }) => ({ id, status })),
    [
      { id: 'general:general', status: 'eligible' },
      { id: 'general:income-contingent', status: 'ineligible' },
      { id: 'income-contingent:general', status: 'eligible' },
      { id: 'income-contingent:income-contingent', status: 'ineligible' },
    ],
  );
});

test('취업후상환 생활비는 학부 8구간까지 가능하고 9·10구간 예외를 분리한다', () => {
  [6, 7, 8].forEach((supportBracket) => {
    assert.equal(evaluate({ supportBracket }).eligibility.status, 'eligible');
  });

  const tierNineConditional = evaluate({
    supportBracket: 9,
    hasEmergencyLivelihood: undefined,
    isMultiChildHousehold: undefined,
    isCareLeaver: undefined,
  });
  assert.equal(tierNineConditional.eligibility.status, 'conditional');
  assert.ok(tierNineConditional.eligibility.missingFields.includes('hasEmergencyLivelihood'));
  assert.equal(evaluate({ supportBracket: 9 }).eligibility.status, 'ineligible');
  assert.equal(evaluate({
    supportBracket: 9,
    hasEmergencyLivelihood: true,
  }).eligibility.status, 'eligible');

  assert.equal(evaluate({
    supportBracket: 10,
    hasEmergencyLivelihood: true,
  }).eligibility.status, 'ineligible');
  assert.equal(evaluate({
    supportBracket: 10,
    isMultiChildHousehold: true,
  }).eligibility.status, 'eligible');
});

test('취업후상환 대학원 생활비는 6구간 경계를 적용한다', () => {
  const graduate = {
    academicLevel: 'graduate',
    age: 35,
    previousSemesterCredits: undefined,
  };

  assert.equal(evaluate({
    ...graduate,
    supportBracket: 6,
  }).eligibility.status, 'eligible');
  assert.equal(evaluate({
    ...graduate,
    supportBracket: 7,
  }).eligibility.status, 'ineligible');
});

test('일반 상환과 취업후상환의 연령 상한 및 특례 경계를 구분한다', () => {
  const general = (age, entered) => evaluate({
    age,
    enteredByAge55AndContinuouslyEnrolled: entered,
  }, { product: 'general', purpose: 'tuition' }).eligibility.status;
  assert.equal(general(55, false), 'eligible');
  assert.equal(general(56, undefined), 'conditional');
  assert.equal(general(59, true), 'eligible');
  assert.equal(general(59, false), 'ineligible');
  assert.equal(general(60, true), 'ineligible');

  const undergraduate = (age, qualifying) => evaluate({
    age,
    qualifyingEmployedUndergraduateProgram: qualifying,
  }, { purpose: 'tuition' }).eligibility.status;
  assert.equal(undergraduate(35, false), 'eligible');
  assert.equal(undergraduate(36, undefined), 'conditional');
  assert.equal(undergraduate(45, true), 'eligible');
  assert.equal(undergraduate(45, false), 'ineligible');
  assert.equal(undergraduate(46, true), 'ineligible');

  assert.equal(evaluate({
    academicLevel: 'graduate',
    age: 40,
  }, { purpose: 'tuition' }).eligibility.status, 'eligible');
  assert.equal(evaluate({
    academicLevel: 'graduate',
    age: 41,
  }, { purpose: 'tuition' }).eligibility.status, 'ineligible');
});

test('학적·성적·학점과 공식 면제 조건을 상품별로 판정한다', () => {
  assert.equal(evaluate({
    previousSemesterScore: 69,
  }, { product: 'general', purpose: 'tuition' }).eligibility.status, 'ineligible');
  assert.equal(evaluate({
    studentStatus: 'new',
    previousSemesterScore: undefined,
    previousSemesterCredits: undefined,
  }, { product: 'general', purpose: 'tuition' }).eligibility.status, 'eligible');
  assert.equal(evaluate({
    previousSemesterScore: 69,
    isDisabled: undefined,
  }, { product: 'general', purpose: 'tuition' }).eligibility.status, 'conditional');

  assert.equal(evaluate({
    previousSemesterScore: undefined,
    previousSemesterCredits: 11,
  }, { purpose: 'tuition' }).eligibility.status, 'ineligible');
  assert.equal(evaluate({
    previousSemesterScore: undefined,
    previousSemesterCredits: 11,
    isGraduating: true,
  }, { purpose: 'tuition' }).eligibility.status, 'eligible');
});

test('정보 부족은 unknown, 확인된 공통요건 위반은 ineligible로 구분한다', () => {
  const unknown = evaluateLoanEligibility({
    applicant: { supportBracket: 3 },
    policySnapshot: LOAN_POLICY_SNAPSHOT,
    product: 'general',
    purpose: 'tuition',
  });
  assert.equal(unknown.eligibility.status, 'unknown');
  assert.ok(unknown.eligibility.missingFields.includes('age'));
  assert.ok(unknown.eligibility.missingFields.some((field) => (
    field.startsWith('commonEligibility.')
  )));

  const failedRule = LOAN_POLICY_SNAPSHOT.commonEligibilityRules[0];
  const ineligible = evaluate({
    commonEligibility: {
      ...confirmedCommonEligibility,
      [failedRule]: false,
    },
  }, { product: 'general', purpose: 'tuition' });
  assert.equal(ineligible.eligibility.status, 'ineligible');
  assert.ok(ineligible.eligibility.reasonCodes.includes(`${failedRule}_NOT_MET`));
});

test('자격 예외·이자면제·상환유예와 시행일을 서로 분리한다', () => {
  const applicant = {
    isBasicOrNearPoverty: true,
    isCareLeaver: true,
    isNonCapitalRegionUniversity: true,
    annualIncomeNotAboveRepaymentThreshold: true,
  };
  const beforeEffectiveDate = evaluate(applicant, { asOfDate: '2026-09-01' });
  const onEffectiveDate = evaluate(applicant, { asOfDate: '2026-11-20' });
  const regionalBefore = beforeEffectiveDate.interestExemptions
    .find(({ id }) => id === 'icl-regional-university-tier-eight');
  const regionalOn = onEffectiveDate.interestExemptions
    .find(({ id }) => id === 'icl-regional-university-tier-eight');

  assert.ok(beforeEffectiveDate.eligibilityOverrides.length > 0);
  assert.ok(beforeEffectiveDate.interestExemptions.length > 0);
  assert.ok(beforeEffectiveDate.repaymentDeferrals.length > 0);
  assert.equal(regionalBefore.status, 'scheduled');
  assert.equal(regionalBefore.effectiveFrom, '2026-11-20');
  assert.equal(regionalOn.status, 'applied');
  assert.equal(
    beforeEffectiveDate.repaymentDeferrals[0].status,
    'applied',
  );
  assert.equal(beforeEffectiveDate.eligibility.status, 'eligible');
});

test('대출 구성의 각 실행분에 자격과 세 특례 묶음을 연결한다', () => {
  const composition = createLoanComposition({
    policySnapshot: LOAN_POLICY_SNAPSHOT,
    principalByPurpose: { tuition: 420, living: 200 },
    productByPurpose: {
      tuition: 'general',
      living: 'income-contingent',
    },
    semesters: 1,
  });
  const evaluated = evaluateLoanCompositionEligibility({
    applicant: COMPLETE_UNDERGRADUATE,
    composition,
    policySnapshot: LOAN_POLICY_SNAPSHOT,
  });
  const tuition = evaluated.tuitionComponents[0];
  const living = evaluated.livingComponents[0];

  assert.equal(tuition.eligibility.status, 'eligible');
  assert.equal(living.eligibility.status, 'eligible');
  assert.ok(Array.isArray(living.eligibilityOverrides));
  assert.ok(Array.isArray(living.interestExemptions));
  assert.ok(Array.isArray(living.repaymentDeferrals));
  assert.equal(living.interestExemptions[0].sourceId, 'kosaf-icl');
});
