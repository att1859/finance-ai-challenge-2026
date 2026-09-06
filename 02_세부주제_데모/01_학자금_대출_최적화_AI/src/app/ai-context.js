import { selectedScenario, selectedLoanCandidate, visibleScenarios } from './selectors.js';

const money = value => Number.isFinite(value)
  ? `${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만 원` : '확인 필요';
const fact = (label, value) => ({ label, value });

function describeScenario(state, scenario) {
  const candidate = selectedLoanCandidate({ ...state, selectedScenarioId: scenario.id });
  const summary = scenario.timeline?.summary ?? {};
  const purposes = candidate?.compositionDescription?.purposes;
  return {
    id: scenario.id,
    name: scenario.name,
    facts: [
      fact('이번 학기 등록금 대출', money(scenario.tuitionFunding?.principal)),
      fact('이번 학기 생활비 대출', money(scenario.livingLoan?.principal)),
      fact('등록금 상품', purposes?.tuition?.productLabel ?? '확인 필요'),
      fact('생활비 상품', purposes?.living?.productLabel ?? '확인 필요'),
      fact('이번 학기 월 생활비 · 이자/상환 차감 전', money(summary.collegeLiving)),
      fact('이번 학기 월 생활비 · 이자/상환 차감 후', money(scenario.collegeAfterRepayment)),
      fact('남겨두는 등록금 자기자금 · 생활비 미합산', money(scenario.tuitionFunding?.retainedContribution)),
      fact('생활비 부족분 / 월', money(scenario.monthlyLivingGap)),
      fact('생활비 보완 추가 알바 / 월', Number.isFinite(scenario.monthlyWorkHours) ? `약 ${Math.round(scenario.monthlyWorkHours)}시간` : '확인 필요'),
      fact('졸업 시 예상 잔액', money(summary.graduationBalance)),
      fact('상환 기준기간 월평균 부담 · ICL 포함 시 환산액', money(summary.careerRepayment)),
      fact('상환기간 월 생활비', money(summary.careerLiving)),
      fact('상환 기준기간', Number.isFinite(scenario.timeline?.repaymentReferenceMonth)
        ? `현재부터 ${scenario.timeline.repaymentReferenceMonth}~${scenario.timeline.repaymentReferenceMonth + 12}개월` : '확인 필요'),
      fact('등록금 자격 상태 · 실제 승인 아님', purposes?.tuition?.eligibilityLabel ?? '확인 필요'),
      fact('생활비 자격 상태 · 실제 승인 아님', purposes?.living?.eligibilityLabel ?? '확인 필요'),
    ],
  };
}

// Keep this adapter separate: the scenario engine can evolve independently.
export function buildAiContext(state) {
  if (!state.ui.calculated || state.ui.loading) return null;
  const selected = selectedScenario(state);
  if (!selected) return null;
  return {
    selected: describeScenario(state, selected),
    comparison: visibleScenarios(state)
      .filter(scenario => state.comparison.ids.includes(scenario.id))
      .map(scenario => describeScenario(state, scenario)),
    view: state.comparison.view === 'baseline' ? '기본 조건' : '변경 조건',
    policyVersions: state.policySnapshotIds ?? [],
  };
}
