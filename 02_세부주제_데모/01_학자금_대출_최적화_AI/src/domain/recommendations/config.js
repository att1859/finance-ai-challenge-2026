export const RECOMMENDATION_CONFIG = Object.freeze({
  scoreWeights: Object.freeze({
    tenYearTotalPayment: 0.45,
    tenYearEndingBalance: 0.35,
    initialMonthlyBurden: 0.2,
  }),
  jointCandidateScoreDifference: 0.02,
  safetyRank: Object.freeze({
    'calculation-impossible': 0,
    deficit: 1,
    'at-risk': 2,
    watch: 3,
    safe: 4,
  }),
});
