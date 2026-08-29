import { hasActiveStress, scenarioById } from '../../app/selectors.js';
import { formatMoney, moneyHtml, signedMoney } from '../formatters/money.js';
import { icon } from '../shared/icon.js';

const money = moneyHtml;

export function renderStressControls(state, scenario) {
  const baseline = scenarioById(state, scenario.id, state.baselineScenarios);
  const changed = hasActiveStress(state);
  return `<section class="stress-section" aria-labelledby="stress-title"><div class="section-heading compact"><h3 id="stress-title">계획이 달라져도 감당할 수 있는지 확인해 보세요.</h3><p>조건은 선택한 ${scenario.name}에 바로 반영됩니다.</p></div>
    <div class="stress-controls">
      <fieldset><legend>취업 지연</legend><div class="segmented">${[[0,'없음'],[6,'6개월'],[12,'12개월']].map(([value,label])=>`<label><input type="radio" name="employmentDelayMonths" value="${value}" ${state.stress.employmentDelayMonths===value?'checked':''}><span>${label}</span></label>`).join('')}</div></fieldset>
      <label class="switch-row"><input type="checkbox" name="salaryReduction" ${state.stress.salaryReductionRate===0.2?'checked':''}><span><b>초봉 20% 감소</b><small>${formatMoney(state.profile.salary)} → ${formatMoney(state.profile.salary*0.8)}</small></span></label>
      <label class="switch-row"><input type="checkbox" name="graduationDelay" ${state.stress.graduationDelayMonths===12?'checked':''}><span><b>졸업 1년 지연</b><small>2학기 · 12개월 추가</small></span></label>
    </div>
    <div class="stress-result ${changed?'is-changed':''}"><div><span>선택안의 대학 생활비 여력</span><strong>${money(scenario.possibleCollegeSpend,1)}</strong><small>기준 대비 ${signedMoney(scenario.possibleCollegeSpend-baseline.possibleCollegeSpend)}</small></div><div><span>${state.profile.loanType==='income-contingent'?'연간 예상 의무상환액':'월평균 상환액'}</span><strong>${state.profile.loanType==='income-contingent'?money(scenario.loan.firstYearRepayment,1):money(scenario.loan.monthlyEquivalent,1)}</strong><small>기준 대비 ${signedMoney((state.profile.loanType==='income-contingent'?scenario.loan.firstYearRepayment-baseline.loan.firstYearRepayment:scenario.loan.monthlyEquivalent-baseline.loan.monthlyEquivalent))}</small></div><div><span>상환 후 월 생활비 여력</span><strong>${money(scenario.possibleCareerSpend,1)}</strong><small>기준 대비 ${signedMoney(scenario.possibleCareerSpend-baseline.possibleCareerSpend)}</small></div>${changed?`<button type="button" data-action="reset-stress">${icon('reset')} 위험 조건 초기화</button>`:''}</div>
  </section>`;
}

