import { calculateAllScenarios } from '../domain/scenarios/calculate-scenario.js';
import {
  evaluateLoanEligibilityCombinations,
} from '../domain/loans/eligibility.js';
import {
  LOAN_POLICY_SNAPSHOT,
} from '../policies/loans/2026.js';

export function calculatePlan(profile, stress = {}) {
  return {
    baselineScenarios: calculateAllScenarios(profile, {}, LOAN_POLICY_SNAPSHOT),
    currentScenarios: calculateAllScenarios(
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
