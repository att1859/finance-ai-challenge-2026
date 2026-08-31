import { calculateAllScenarios } from '../domain/scenarios/calculate-scenario.js';
import {
  GENERAL_LOAN_POLICY,
  INCOME_CONTINGENT_POLICY,
} from '../policies/loans/2026.js';

export function calculatePlan(profile, stress = {}) {
  return {
    baselineScenarios: calculateAllScenarios(profile),
    currentScenarios: calculateAllScenarios(profile, stress),
    policySnapshotIds: [
      INCOME_CONTINGENT_POLICY.id,
      GENERAL_LOAN_POLICY.id,
    ],
  };
}
