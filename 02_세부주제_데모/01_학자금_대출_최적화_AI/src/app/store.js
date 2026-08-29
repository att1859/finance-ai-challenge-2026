import { DEFAULT_PROFILE } from '../data/sample-profile.js';
import { EMPTY_STRESS } from '../domain/scenarios/normalize-stress.js';

export function createInitialState() {
  return {
    profile: {
      ...DEFAULT_PROFILE,
      specialQualifications: [...DEFAULT_PROFILE.specialQualifications],
    },
    selectedScenarioId: 'balance',
    baselineScenarios: [],
    currentScenarios: [],
    supportPrograms: [],
    supportSummary: null,
    policySnapshotIds: [],
    stress: { ...EMPTY_STRESS },
    ui: {
      calculated: false,
      loading: false,
      catalogOpen: false,
      catalogFilter: '전체',
      inputMode: 'manual',
    },
  };
}
