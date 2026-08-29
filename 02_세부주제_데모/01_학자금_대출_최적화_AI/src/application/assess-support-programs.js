import {
  evaluateSupportPrograms,
  summarizeSupportPrograms,
} from '../domain/support-programs/evaluate-program.js';
import {
  SUPPORT_PROGRAM_CATALOG,
} from '../policies/support-programs/2026-2.js';

export function assessSupportPrograms(profile) {
  const programs = evaluateSupportPrograms(SUPPORT_PROGRAM_CATALOG, profile);
  return {
    programs,
    summary: summarizeSupportPrograms(programs),
  };
}
