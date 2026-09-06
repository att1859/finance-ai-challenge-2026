import { EMPTY_STRESS } from '../domain/scenarios/normalize-stress.js';

export function setProfile(state, profile) {
  state.profile = profile;
}

export function applyPlan(state, plan) {
  state.baselineScenarios = plan.baselineScenarios;
  state.currentScenarios = plan.currentScenarios;
  state.baselineRecommendations = plan.baselineRecommendations;
  state.currentRecommendations = plan.currentRecommendations;
  state.baselineFullLoanCapView = plan.baselineFullLoanCapView;
  state.currentFullLoanCapView = plan.currentFullLoanCapView;
  state.policySnapshotIds = plan.policySnapshotIds;

  state.currentRecommendations.forEach((recommendation) => {
    const scenarioId = recommendation.scenarioId;
    const currentSelection = state.resultSelections.candidateByScenario[scenarioId];
    const available = recommendation.candidates.some(({ id }) => id === currentSelection);
    if (!available) {
      state.resultSelections.candidateByScenario[scenarioId]
        = recommendation.recommendedCandidateIds[0]
        ?? recommendation.pendingCandidateIds[0]
        ?? recommendation.candidates[0]?.id
        ?? null;
    }
    if (!(scenarioId in state.resultSelections.includeLivingByScenario)) {
      const scenario = state.currentScenarios.find(({ id }) => id === scenarioId);
      state.resultSelections.includeLivingByScenario[scenarioId]
        = (scenario?.livingLoan.principal ?? 0) > 0;
    }
  });

  if (!state.currentScenarios.some(({ id }) => id === state.selectedScenarioId)) {
    state.selectedScenarioId = state.currentScenarios.some(({ id }) => id === 'balance')
      ? 'balance'
      : state.currentScenarios[0]?.id ?? null;
  }
}

export function selectScenario(state, scenarioId) {
  if (state.currentScenarios.some(({ id }) => id === scenarioId)) {
    state.selectedScenarioId = scenarioId;
  }
}

export function selectLoanCandidate(state, scenarioId, candidateId) {
  const recommendation = state.currentRecommendations.find(
    (item) => item.scenarioId === scenarioId,
  );
  if (recommendation?.candidates.some(({ id }) => id === candidateId)) {
    state.resultSelections.candidateByScenario[scenarioId] = candidateId;
  }
}

export function updateResultSelections(state, patch) {
  state.resultSelections = { ...state.resultSelections, ...patch };
}

export function resetStress(state) {
  state.stress = { ...EMPTY_STRESS };
}

export function updateStress(state, patch) {
  state.stress = { ...state.stress, ...patch };
}

export function updateUi(state, patch) {
  state.ui = { ...state.ui, ...patch };
}
