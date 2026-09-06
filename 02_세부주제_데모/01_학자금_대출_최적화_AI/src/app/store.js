import { DEFAULT_PROFILE } from '../data/sample-profile.js';
import { EMPTY_STRESS } from '../domain/scenarios/normalize-stress.js';

export function createInitialState() {
  return {
    profile: { ...DEFAULT_PROFILE },
    selectedScenarioId: 'balance',
    baselineScenarios: [],
    currentScenarios: [],
    baselineRecommendations: [],
    currentRecommendations: [],
    baselineFullLoanCapView: null,
    currentFullLoanCapView: null,
    policySnapshotIds: [],
    resultSelections: {
      candidateByScenario: {},
      includeLivingByScenario: {},
      graceYears: DEFAULT_PROFILE.graceYears,
      repaymentYears: DEFAULT_PROFILE.repaymentYears,
      hasExistingLoan: false,
      eligibilityDetailsOpen: false,
    },
    stress: { ...EMPTY_STRESS },
    ui: {
      calculated: false,
      loading: false,
      inputMode: 'manual',
    },
  };
}
