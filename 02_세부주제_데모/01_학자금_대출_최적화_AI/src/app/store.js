import { DEFAULT_PROFILE } from '../data/sample-profile.js';
import { EMPTY_STRESS } from '../domain/scenarios/normalize-stress.js';

export function createInitialState() {
  return {
    profile: { ...DEFAULT_PROFILE },
    customScenarios: [],
    nextCustomId: 1,
    selectedScenarioId: 'balance',
    comparison: { ids: ['minimum-loan', 'balance'], metric: 'living', month: 0, view: 'baseline' },
    baselineScenarios: [],
    currentScenarios: [],
    baselineRecommendations: [],
    currentRecommendations: [],
    baselineFullLoanCapView: null,
    currentFullLoanCapView: null,
    policySnapshotIds: [],
    resultSelections: {
      candidateByScenario: { 'maximum-use': 'general:general', balance: 'general:general', 'minimum-loan': 'general:general' },
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
