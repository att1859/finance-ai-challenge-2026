
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
  state.comparison.month = Math.min(state.comparison.month, plan.baselineScenarios[0].timeline.endMonth);

  state.currentRecommendations.forEach((recommendation) => {
    const scenarioId = recommendation.scenarioId;
    const currentSelection = state.resultSelections.candidateByScenario[scenarioId];
    const available = recommendation.candidates.some(({ id }) => id === currentSelection);
    if (!available && !state.customScenarios?.some(s => s.id === scenarioId)) {
      state.resultSelections.candidateByScenario[scenarioId]
        = recommendation.recommendedCandidateIds[0]
        ?? recommendation.pendingCandidateIds[0]
        ?? recommendation.candidates[0]?.id
        ?? null;
    }
    if (!(scenarioId in state.resultSelections.includeLivingByScenario)) {
      state.resultSelections.includeLivingByScenario[scenarioId]
        = true;
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
  state.stress = { ...state.stress, employmentDelayMonths: 0, salaryReductionRate: 0 };
  state.comparison.view = state.stress.graduationDelayMonths ? 'changed' : 'baseline';
}

export function updateStress(state, patch) {
  state.stress = { ...state.stress, ...patch };
  state.comparison.view = Object.values(state.stress).some(value => value > 0) ? 'changed' : 'baseline';
}

export function selectComparison(state, side, id) {
  if (!state.currentScenarios.some(scenario => scenario.id === id)) return;
  const other = 1 - side;
  if (state.comparison.ids[other] === id) state.comparison.ids[other] = state.comparison.ids[side];
  state.comparison.ids[side] = id;
  if (!state.comparison.ids.includes(state.selectedScenarioId)) state.selectedScenarioId = id;
}

export function updateUi(state, patch) {
  state.ui = { ...state.ui, ...patch };
}
