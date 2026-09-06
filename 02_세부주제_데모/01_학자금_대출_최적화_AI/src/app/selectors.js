const nonNegative = (value) => Math.max(
  0,
  Number.isFinite(Number(value)) ? Number(value) : 0,
);

export function scenarioById(state, scenarioId, scenarios = state.currentScenarios) {
  return scenarios.find(({ id }) => id === scenarioId);
}

export function selectedScenario(state) {
  return scenarioById(state, state.selectedScenarioId, visibleScenarios(state));
}

export function selectedRecommendation(state) {
  return (state.comparison?.view === 'baseline' ? state.baselineRecommendations : state.currentRecommendations).find(
    ({ scenarioId }) => scenarioId === state.selectedScenarioId,
  );
}

export function visibleScenarios(state) {
  return state.comparison?.view === 'baseline' ? state.baselineScenarios : state.currentScenarios;
}

export function selectedLoanCandidate(state) {
  const recommendation = selectedRecommendation(state);
  const candidateId = state.resultSelections.candidateByScenario[
    state.selectedScenarioId
  ];
  return recommendation?.candidates.find(({ id }) => id === candidateId)
    ?? (selectedScenario(state)?.custom ? recommendation?.excludedCandidates.find(({ id }) => id === candidateId) : null)
    ?? recommendation?.candidates[0]
    ?? null;
}

export function hasActiveStress(state) {
  return Object.values(state.stress).some((value) => value > 0);
}

export function buildScenarioComparison(state) {
  const { profile, currentScenarios } = state;
  return [
    {
      id: 'college',
      label: '대학 시절 월 생활비 여력',
      unit: '만 원/월',
      referenceLabel: '희망',
      reference: nonNegative(profile.desiredCollegeSpend),
      values: currentScenarios.map(({ id, possibleCollegeSpend }) => ({
        id,
        value: possibleCollegeSpend,
      })),
    },
    {
      id: 'career',
      label: '상환 후 월 생활비 여력',
      unit: '만 원/월',
      referenceLabel: '예상 월소득',
      reference: nonNegative(profile.salary),
      values: currentScenarios.map(({ id, possibleCareerSpend }) => ({
        id,
        value: possibleCareerSpend,
      })),
    },
  ];
}
