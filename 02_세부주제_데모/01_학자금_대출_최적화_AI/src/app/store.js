import { DEFAULT_PROFILE } from '../data/sample-profile.js';
import { EMPTY_STRESS } from '../domain/scenarios/normalize-stress.js';

export function createInitialState() {
  return {
    profile: { ...DEFAULT_PROFILE },
    selectedScenarioId: 'balance',
    baselineScenarios: [],
    currentScenarios: [],
    policySnapshotIds: [],
    stress: { ...EMPTY_STRESS },
    ui: {
      calculated: false,
      loading: false,
      inputMode: 'manual',
    },
  };
}
