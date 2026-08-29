import { calculateAllScenarios } from '../domain/scenarios/calculate-scenario.js';
import {
  GENERAL_LOAN_POLICY,
  INCOME_CONTINGENT_POLICY,
} from '../policies/loans/2026.js';
import {
  SUPPORT_PROGRAM_POLICY,
} from '../policies/support-programs/2026-2.js';
import { assessSupportPrograms } from './assess-support-programs.js';

export function calculatePlan(profile, stress = {}) {
  const supportPrograms = assessSupportPrograms(profile);

  return {
    baselineScenarios: calculateAllScenarios(profile),
    currentScenarios: calculateAllScenarios(profile, stress),
    supportPrograms: supportPrograms.programs,
    supportSummary: supportPrograms.summary,
    policySnapshotIds: [
      INCOME_CONTINGENT_POLICY.id,
      GENERAL_LOAN_POLICY.id,
      SUPPORT_PROGRAM_POLICY.id,
    ],
  };
}
