import { buildScenarioTimeline } from '../domain/scenarios/timeline.js';
import {
  calculateAllScenarios,
  calculateFullLoanCapView,
} from '../domain/scenarios/calculate-scenario.js';
import {
  evaluateLoanEligibilityCombinations,
} from '../domain/loans/eligibility.js';
import {
  LOAN_POLICY_SNAPSHOT,
} from '../policies/loans/2026.js';
import {
  recommendLoanCompositions,
} from '../domain/recommendations/recommend.js';

function recommendationsFor(profile, scenarios, stress) {
  return scenarios.map((scenario) => recommendLoanCompositions({
    profile: scenario.custom ? { ...profile, graceYears: scenario.custom.graceYears, repaymentYears: scenario.custom.repaymentYears } : profile,
    scenario,
    stress,
    policySnapshot: LOAN_POLICY_SNAPSHOT,
  }));
}

export function calculatePlan(profile, stress = {}) {
  const baselineScenarios = calculateAllScenarios(
    profile,
    {},
    LOAN_POLICY_SNAPSHOT,
    true,
  );
  const currentScenarios = calculateAllScenarios(
    profile,
    stress,
    LOAN_POLICY_SNAPSHOT,
    true,
  );

  const endMonth = baselineScenarios[0].funding.studyMonths + 120;
  for (const scenario of [...baselineScenarios, ...currentScenarios]) {
    scenario.timeline = buildScenarioTimeline(scenario, endMonth);
  }
  return {
    baselineScenarios,
    currentScenarios,
    baselineRecommendations: recommendationsFor(profile, baselineScenarios, {}),
    currentRecommendations: recommendationsFor(profile, currentScenarios, stress),
    baselineFullLoanCapView: calculateFullLoanCapView(
      profile,
      {},
      LOAN_POLICY_SNAPSHOT,
    ),
    currentFullLoanCapView: calculateFullLoanCapView(
      profile,
      stress,
      LOAN_POLICY_SNAPSHOT,
    ),
    loanEligibilityCombinations: evaluateLoanEligibilityCombinations({
      applicant: profile,
      policySnapshot: LOAN_POLICY_SNAPSHOT,
    }),
    policySnapshotIds: [LOAN_POLICY_SNAPSHOT.snapshotId],
  };
}
