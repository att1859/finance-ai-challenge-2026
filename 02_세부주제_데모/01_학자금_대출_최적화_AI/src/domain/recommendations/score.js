import { RECOMMENDATION_CONFIG } from './config.js';

function metricValue(candidate, metric) {
  if (metric === 'tenYearTotalPayment') {
    return candidate.loan.currentValueComparison?.totalPayment;
  }
  if (metric === 'tenYearEndingBalance') {
    return candidate.loan.currentValueComparison?.endingBalance;
  }
  return candidate.loan.monthlyBurdenForComparison;
}

function normalizedLowerIsBetter(value, minimum, maximum) {
  if (!Number.isFinite(value)) return 0;
  if (maximum === minimum) return 1;
  return 1 - (value - minimum) / (maximum - minimum);
}

export function scoreRecommendationCandidates(candidates) {
  const ranges = Object.keys(RECOMMENDATION_CONFIG.scoreWeights).reduce(
    (result, metric) => {
      const values = candidates.map((candidate) => metricValue(candidate, metric))
        .filter(Number.isFinite);
      return {
        ...result,
        [metric]: {
          minimum: values.length ? Math.min(...values) : 0,
          maximum: values.length ? Math.max(...values) : 0,
        },
      };
    },
    {},
  );

  return candidates.map((candidate) => {
    const scoreParts = Object.entries(RECOMMENDATION_CONFIG.scoreWeights)
      .reduce((result, [metric, weight]) => {
        const range = ranges[metric];
        return {
          ...result,
          [metric]: normalizedLowerIsBetter(
            metricValue(candidate, metric),
            range.minimum,
            range.maximum,
          ) * weight,
        };
      }, {});

    return {
      ...candidate,
      internalScore: Object.values(scoreParts).reduce((sum, value) => sum + value, 0),
    };
  }).sort((left, right) => right.internalScore - left.internalScore);
}

export function selectJointTopCandidates(scoredCandidates) {
  const highest = scoredCandidates[0]?.internalScore;
  if (!Number.isFinite(highest)) return [];
  return scoredCandidates.filter(({ internalScore }) => (
    highest - internalScore <= RECOMMENDATION_CONFIG.jointCandidateScoreDifference
  ));
}
