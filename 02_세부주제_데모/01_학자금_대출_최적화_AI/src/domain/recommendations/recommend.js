import { buildLoanCandidates } from './candidate-builder.js';
import { createLoanCompositionDescription } from '../loans/composition-description.js';
import { explainCandidate } from './explainer.js';
import { applyRecommendationRules } from './rules.js';
import {
  scoreRecommendationCandidates,
  selectJointTopCandidates,
} from './score.js';

export function recommendLoanCompositions({
  profile,
  scenario,
  stress = {},
  policySnapshot,
}) {
  const candidates = buildLoanCandidates({
    profile,
    scenario,
    stress,
    policySnapshot,
  });
  const ruled = applyRecommendationRules(candidates);
  const scoredTopCandidates = scoreRecommendationCandidates(
    ruled.topRuleCandidates,
  );
  const jointTopCandidates = selectJointTopCandidates(scoredTopCandidates);
  const topIds = new Set(jointTopCandidates.map(({ id }) => id));
  const decorate = (candidate) => {
    const explanation = explainCandidate(candidate, {
      lowerTenYearBurden: topIds.has(candidate.id),
    });
    const decorated = {
      ...candidate,
      ...explanation,
      isRecommended: candidate.eligibility.status === 'eligible'
        && topIds.has(candidate.id),
      isPendingConfirmation: candidate.eligibility.status !== 'eligible'
        && topIds.has(candidate.id),
    };

    return {
      ...decorated,
      compositionDescription: createLoanCompositionDescription(decorated),
    };
  };
  const decoratedCandidates = ruled.availableCandidates.map(decorate);
  const recommendedCandidateIds = decoratedCandidates
    .filter(({ isRecommended }) => isRecommended)
    .map(({ id }) => id);
  const pendingCandidateIds = decoratedCandidates
    .filter(({ isPendingConfirmation }) => isPendingConfirmation)
    .map(({ id }) => id);

  return {
    scenarioId: scenario.id,
    status: recommendedCandidateIds.length > 0
      ? 'recommended'
      : pendingCandidateIds.length > 0
        ? 'confirmation-required'
        : 'unavailable',
    candidates: decoratedCandidates,
    excludedCandidates: ruled.excludedCandidates.map(decorate),
    recommendedCandidateIds,
    pendingCandidateIds,
  };
}
