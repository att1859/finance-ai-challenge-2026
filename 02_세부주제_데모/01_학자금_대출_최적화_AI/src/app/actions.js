import { EMPTY_STRESS } from '../domain/scenarios/normalize-stress.js';

export function setProfile(state, profile) {
  state.profile = profile;
}

export function applyPlan(state, plan) {
  state.baselineScenarios = plan.baselineScenarios;
  state.currentScenarios = plan.currentScenarios;
  state.policySnapshotIds = plan.policySnapshotIds;

  if (!state.currentScenarios.some(({ id }) => id === state.selectedScenarioId)) {
    state.selectedScenarioId = 'balance';
  }
}

export function selectScenario(state, scenarioId) {
  if (state.currentScenarios.some(({ id }) => id === scenarioId)) {
    state.selectedScenarioId = scenarioId;
  }
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
