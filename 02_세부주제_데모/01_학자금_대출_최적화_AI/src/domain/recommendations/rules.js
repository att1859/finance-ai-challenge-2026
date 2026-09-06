import { RECOMMENDATION_CONFIG } from './config.js';

function eligibilityRank(status) {
  return status === 'eligible' ? 2 : 1;
}

export function recommendationRuleRank(candidate) {
  return Object.freeze([
    eligibilityRank(candidate.eligibility.status),
    candidate.fundingGoalMet ? 1 : 0,
    candidate.scenarioGoalMet ? 1 : 0,
    RECOMMENDATION_CONFIG.safetyRank[candidate.safety] ?? 0,
  ]);
}

export function compareRuleRanks(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return right[index] - left[index];
  }
  return 0;
}

export function applyRecommendationRules(candidates) {
  const excludedCandidates = candidates
    .filter(({ eligibility }) => eligibility.status === 'ineligible')
    .map((candidate) => ({
      ...candidate,
      exclusionReasonCodes: candidate.eligibility.reasonCodes,
    }));
  const availableCandidates = candidates
    .filter(({ eligibility }) => eligibility.status !== 'ineligible')
    .map((candidate) => ({
      ...candidate,
      ruleRank: recommendationRuleRank(candidate),
    }))
    .sort((left, right) => compareRuleRanks(left.ruleRank, right.ruleRank));
  const topRuleRank = availableCandidates[0]?.ruleRank;
  const topRuleCandidates = topRuleRank
    ? availableCandidates.filter(
      ({ ruleRank }) => compareRuleRanks(ruleRank, topRuleRank) === 0,
    )
    : [];

  return { availableCandidates, excludedCandidates, topRuleCandidates };
}
