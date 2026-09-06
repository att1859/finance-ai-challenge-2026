import { requiredMark } from '../shared/controls.js';
import { renderEligibilityIntake } from './eligibility-intake.js';
import { ALL_PRODUCT_CONTEXT, eligibilityRequirements } from '../../app/eligibility-draft.js';
import { escapeHtml as safe } from '../shared/escape-html.js';
export function renderEligibilityGraphStatus(state) {
 const flow=state.eligibility;
 const text=!flow.completed?'일반 상환 기준 예상 결과 · 자격 확인 전':(flow.open||flow.dirty)?'이전 확인 정보 기준 결과 · 수정 중인 답변은 아직 반영되지 않았습니다.':'확인한 정보 기준 예상 결과 · 실제 대출 승인과는 다릅니다.';
 return `<p class="eligibility-graph-status" role="status">${text}</p>`;
}
export function renderEligibilityWorkflow(state) {
 const flow=state.eligibility;
 const p=flow.draft?{...state.profile,...flow.draft}:state.profile;
 const student={continuing:'재학생',new:'신입생',transfer:'편입생',readmitted:'재입학생'}[state.profile.studentStatus];
 const summary=flow.completed?`${state.profile.academicLevel==='graduate'?'대학원':'학부'} · ${student} · ${state.profile.supportBracket}구간`:'';
 const requirements=eligibilityRequirements(p,flow.reviewed);
 const error=flow.errors.eligibilityReviewed;
 return `<section class="eligibility-workflow" id="eligibility-workflow" aria-labelledby="eligibility-workflow-title">
 <div class="eligibility-workflow-heading"><div><h3 id="eligibility-workflow-title">추가정보 입력</h3><p>${flow.completed?safe(summary):'추가 정보를 확인하면 네 가지 상환상품의 가능 여부와 이유를 볼 수 있어요.'}</p></div><button type="button" class="button button-secondary" data-action="eligibility-toggle" aria-expanded="${flow.open}" aria-controls="eligibility-content">${flow.open?'입력 접기':flow.completed?'정보 수정':flow.draft?'이어서 입력':'추가 정보 입력'}</button></div>
 ${!flow.open&&flow.dirty?'<p class="eligibility-pending">수정사항 미반영 · 입력을 마치고 상품 확인을 눌러 주세요.</p>':''}
 <div id="eligibility-content" ${flow.open?'':'hidden'}>${flow.open?`<p class="eligibility-pending" role="status">${flow.completed?'수정 중 · 다시 확인하면 결과에 반영됩니다.':'작성 중 · 입력을 마치기 전까지 일반 상환 예상 결과를 유지합니다.'}</p><form id="eligibility-form" novalidate>
 ${renderEligibilityIntake({...state,profile:p},ALL_PRODUCT_CONTEXT)}
 <div class="eligibility-completion"><p id="eligibility-progress">필수 확인 ${requirements.filter(item=>item.valid).length}/${requirements.length} 완료</p>
 <label class="eligibility-review"><input type="checkbox" name="eligibilityReviewed" aria-required="true" ${flow.reviewed?'checked':''} ${error?'aria-invalid="true" aria-describedby="eligibility-reviewed-error"':''}><span>기본값과 체크하지 않은 항목을 포함해 위 내용을 확인했습니다. ${requiredMark}</span></label>
 <p>공통 요건을 모두 충족하지 않아도 입력을 완료할 수 있습니다. 체크하지 않은 요건은 미충족으로 판정합니다.</p>
 ${error?`<p class="eligibility-error" id="eligibility-reviewed-error" role="alert">${safe(error)}</p>`:''}
 <button type="submit" class="button button-primary" id="eligibility-complete">입력 완료 · 상품 확인</button></div></form>`:''}</div></section>`;
}
