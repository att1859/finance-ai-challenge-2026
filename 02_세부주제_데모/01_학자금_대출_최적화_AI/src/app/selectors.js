const nonNegative = (value) => Math.max(
  0,
  Number.isFinite(Number(value)) ? Number(value) : 0,
);

export function scenarioById(state, scenarioId, scenarios = state.currentScenarios) {
  return scenarios.find(({ id }) => id === scenarioId);
}

export function selectedScenario(state) {
  return scenarioById(state, state.selectedScenarioId);
}

export function hasActiveStress(state) {
  return Object.values(state.stress).some((value) => value > 0);
}

export function visibleSupportPrograms(state) {
  return state.ui.catalogFilter === '전체'
    ? state.supportPrograms
    : state.supportPrograms.filter(
      ({ status }) => status === state.ui.catalogFilter,
    );
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
      id: 'work',
      label: '주당 근로시간',
      unit: '시간/주',
      referenceLabel: '희망',
      reference: nonNegative(profile.desiredWorkHours),
      currentReference: nonNegative(profile.currentWorkHours),
      values: currentScenarios.map(({ id, workHours }) => ({
        id,
        value: workHours,
      })),
    },
    {
      id: 'career',
      label: '상환 후 월 생활비 여력',
      unit: '만 원/월',
      referenceLabel: '희망',
      reference: nonNegative(profile.desiredCareerSpend),
      values: currentScenarios.map(({ id, possibleCareerSpend }) => ({
        id,
        value: possibleCareerSpend,
      })),
    },
  ];
}
