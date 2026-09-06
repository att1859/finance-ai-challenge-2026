import { hasActiveStress } from '../../app/selectors.js';
import { segmented, quietButton } from '../shared/seed-controls.js';
export function renderStressControls(state) {
 return `<section class="stress-section compact-stress" aria-label="조건 변경"><div class="stress-controls">
 <div class="compact-choice"><span>취업 지연</span>${segmented('employmentDelayMonths','취업 지연',[[0,'없음'],[6,'6개월'],[12,'12개월']],state.stress.employmentDelayMonths)}</div>
 <label class="switch-row"><input type="checkbox" name="salaryReduction" ${state.stress.salaryReductionRate?'checked':''}><span>초봉 20% 감소</span></label>
 <details><summary>추가 조건</summary><label class="switch-row"><input type="checkbox" name="graduationDelay" ${state.stress.graduationDelayMonths?'checked':''}><span>졸업 1년 지연</span></label></details>
 <button class="${quietButton}" type="button" data-action="reset-stress">초기화</button></div>
 ${hasActiveStress(state)?`<div class="condition-view">${segmented('condition-view','조건 보기',[['baseline','기본 조건'],['changed','변경 조건']],state.comparison.view)}</div>`:''}</section>`;
}

