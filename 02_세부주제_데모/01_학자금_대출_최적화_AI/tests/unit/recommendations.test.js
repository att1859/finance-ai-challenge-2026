import test from 'node:test';
import assert from 'node:assert/strict';

import { calculatePlan } from '../../src/application/calculate-plan.js';
import { SAMPLE_PROFILE } from '../../src/data/sample-profile.js';
import { RECOMMENDATION_CONFIG } from '../../src/domain/recommendations/config.js';
import { applyRecommendationRules } from '../../src/domain/recommendations/rules.js';
import {
  scoreRecommendationCandidates,
  selectJointTopCandidates,
} from '../../src/domain/recommendations/score.js';
import { LOAN_POLICY_SNAPSHOT } from '../../src/policies/loans/2026.js';

const commonEligibility = Object.fromEntries(
  LOAN_POLICY_SNAPSHOT.commonEligibilityRules.map((id) => [id, true]),
);

const COMPLETE_PROFILE = Object.freeze({
  ...SAMPLE_PROFILE,
  desiredCollegeSpend: 130,
  academicLevel: 'undergraduate',
  age: 24,
  studentStatus: 'continuing',
  previousSemesterScore: 80,
  previousSemesterCredits: 15,
  isDisabled: false,
  isGraduating: false,
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
  commonEligibility,
});

function ruleCandidate(overrides = {}) {
  return {
    id: overrides.id ?? 'candidate',
    eligibility: { status: 'eligible', reasonCodes: [], missingFields: [] },
    fundingGoalMet: true,
    scenarioGoalMet: true,
    safety: 'safe',
    loan: {
      monthlyBurdenForComparison: 10,
      currentValueComparison: { totalPayment: 100, endingBalance: 0 },
    },
    ...overrides,
  };
}

test('추천 설정은 10년 납부액 45%·잔액 35%·초기부담 20%로 고정한다', () => {
  assert.deepEqual(RECOMMENDATION_CONFIG.scoreWeights, {
    tenYearTotalPayment: 0.45,
    tenYearEndingBalance: 0.35,
    initialMonthlyBurden: 0.2,
  });
  assert.equal(RECOMMENDATION_CONFIG.jointCandidateScoreDifference, 0.02);
});

test('규칙 등급이 높은 후보는 더 낮은 비용 점수에 뒤집히지 않는다', () => {
  const safeButExpensive = ruleCandidate({
    id: 'safe',
    loan: {
      monthlyBurdenForComparison: 100,
      currentValueComparison: { totalPayment: 10000, endingBalance: 1000 },
    },
  });
  const unsafeButCheap = ruleCandidate({
    id: 'cheap',
    safety: 'at-risk',
    loan: {
      monthlyBurdenForComparison: 1,
      currentValueComparison: { totalPayment: 10, endingBalance: 0 },
    },
  });
  const ruled = applyRecommendationRules([unsafeButCheap, safeButExpensive]);

  assert.deepEqual(ruled.topRuleCandidates.map(({ id }) => id), ['safe']);
});

test('같은 규칙 등급에서만 점수를 적용하고 0.02 이내는 공동 후보로 남긴다', () => {
  const same = [
    ruleCandidate({ id: 'a' }),
    ruleCandidate({ id: 'b' }),
  ];
  const scored = scoreRecommendationCandidates(same);

  assert.deepEqual(selectJointTopCandidates(scored).map(({ id }) => id), ['a', 'b']);
});

test('최초 정보 부족 후보는 네 조합을 유지하지만 추천 배지를 확정하지 않는다', () => {
  const recommendation = calculatePlan({
    ...SAMPLE_PROFILE,
    desiredCollegeSpend: 130,
  }).currentRecommendations.find(({ scenarioId }) => scenarioId === 'maximum-use');

  assert.equal(recommendation.status, 'confirmation-required');
  assert.equal(recommendation.candidates.length, 4);
  assert.deepEqual(recommendation.recommendedCandidateIds, []);
  assert.ok(recommendation.pendingCandidateIds.length > 0);
  assert.ok(recommendation.candidates
    .filter(({ isPendingConfirmation }) => isPendingConfirmation)
    .every(({ reasonCodes }) => reasonCodes.includes('ELIGIBILITY_CONFIRMATION_REQUIRED')));
});

test('자격 확인 뒤 각 시나리오는 추천 조합과 구체적 이유 코드를 반환한다', () => {
  const recommendations = calculatePlan({...COMPLETE_PROFILE,isBasicOrNearPoverty:true}).currentRecommendations;

  assert.equal(recommendations.length, 3);
  assert.ok(recommendations.every(({ status }) => status === 'recommended'));
  assert.ok(recommendations.every(({ recommendedCandidateIds }) => recommendedCandidateIds.length > 0));
  assert.ok(recommendations.every(({ candidates }) => candidates
    .filter(({ isRecommended }) => isRecommended)
    .every(({ reasonCodes }) => reasonCodes.includes('LOWER_TEN_YEAR_BURDEN'))));
  assert.ok(recommendations.some(({ candidates }) => candidates
    .some(({ reasonCodes }) => reasonCodes.includes('ICL_INTEREST_EXEMPTION'))));
  assert.ok(recommendations.every(({ candidates }) => candidates
    .every((candidate) => !('internalScore' in candidate))));
  assert.ok(recommendations.every(({ candidates }) => candidates
    .every(({ calculationTrace }) => calculationTrace.order.at(-1) === 'repayment')));
});

test('확정적으로 불가능한 생활비 상품 조합만 제외 목록으로 이동한다', () => {
  const recommendation = calculatePlan({
    ...COMPLETE_PROFILE,
    supportBracket: 10,
  }).currentRecommendations.find(({ scenarioId }) => scenarioId === 'maximum-use');

  assert.equal(recommendation.candidates.length, 2);
  assert.equal(recommendation.excludedCandidates.length, 2);
  assert.ok(recommendation.excludedCandidates.every(
    ({ livingProduct }) => livingProduct === 'income-contingent',
  ));
});

test('혼합 추천 후보는 두 상품의 금리·상환 기준과 공식 출처를 함께 보존한다', () => {
  const recommendation = calculatePlan(COMPLETE_PROFILE)
    .currentRecommendations.find(({ scenarioId }) => scenarioId === 'maximum-use');
  const mixed = recommendation.candidates.find(
    ({ id }) => id === 'general:income-contingent',
  );
  const ids = mixed.policyReferences.map(({ id }) => id);
  const incomeRepayment = mixed.policyReferences.find(
    ({ id }) => id === 'income-contingent-interest-and-repayment',
  );

  assert.ok(ids.includes('general-interest-and-repayment'));
  assert.ok(ids.includes('income-contingent-interest-and-repayment'));
  assert.equal(incomeRepayment.values.repayment.basisYear, 2026);
  assert.equal(incomeRepayment.values.repayment.annualGrossIncomeThreshold, 3037);
  assert.ok(incomeRepayment.sources.some(({ id }) => id === 'kosaf-mandatory-repayment'));
});

test('상품 구성 설명은 용도별 상품·금액·자격과 추천·제외 이유를 사용자 문장으로 제공한다', () => {
  const recommended = calculatePlan(COMPLETE_PROFILE)
    .currentRecommendations[0].candidates.find(({ isRecommended }) => isRecommended);
  const excluded = calculatePlan({
    ...COMPLETE_PROFILE,
    supportBracket: 10,
  }).currentRecommendations[0].excludedCandidates[0];

  assert.equal(
    recommended.compositionDescription.purposes.tuition.principal,
    recommended.loanComposition.totals.tuition,
  );
  assert.equal(
    recommended.compositionDescription.purposes.living.productLabel,
    recommended.livingProduct === 'general' ? '일반 상환' : '취업 후 상환',
  );
  assert.equal(recommended.compositionDescription.recommendationState, 'recommended');
  assert.ok(recommended.compositionDescription.reasons.every(({ message }) => message.length > 0));
  assert.equal(excluded.compositionDescription.recommendationState, 'excluded');
  assert.ok(excluded.compositionDescription.exclusionReasons.some(
    ({ message }) => message.includes('지원구간'),
  ));
  assert.ok(recommended.compositionDescription.policyReferences.length > 0);
});
