import { escapeHtml as safe } from '../shared/escape-html.js';
import { quietButton, primaryButton } from '../shared/seed-controls.js';
import { LOAN_POLICY_SNAPSHOT } from '../../policies/loans/2026.js';

export function amountField(name, label, value) {
  return `<div class="field amount-field"><label for="${name}">${label}</label><span class="amount-stepper"><button type="button" class="${quietButton}" data-amount-step="-1" data-field="${name}" aria-label="${label} 줄이기">−</button><input id="${name}" aria-label="${label}" name="${name}" type="number" min="0" max="${LOAN_POLICY_SNAPSHOT.purposes.living.semesterLimit}" step="1" inputmode="numeric" value="${value}" aria-describedby="custom-amount-help ${name}-error"><em>만 원</em><button type="button" class="${quietButton}" data-amount-step="1" data-field="${name}" aria-label="${label} 늘리기">＋</button></span><small id="${name}-error" data-field-error="${name}"></small></div>`;
}

export function renderCustomEditor(draft, semesters, editing) {
  return `<dialog id="custom-editor" class="custom-editor seed-surface" aria-labelledby="custom-editor-title"><form id="custom-form" novalidate>
    <div class="editor-heading"><div><small>${editing ? '내 시나리오 수정' : '선택한 안을 복사해 시작해요'}</small><h3 id="custom-editor-title">${editing ? '내 시나리오 수정' : '내 시나리오 추가'}</h3></div><button type="button" class="${quietButton}" data-close-editor aria-label="닫기">닫기</button></div>
    <div class="form-grid"><label class="field"><span>시나리오 이름</span><input name="custom-name" maxlength="40" value="${safe(draft.name)}"></label><label class="field"><span>주당 근로시간</span><input name="custom-hours" type="number" min="0" max="80" step="0.5" value="${draft.workHours}"></label></div>
    <fieldset><legend>생활비 대출 · 학기 기준</legend><p id="custom-amount-help">0원은 대출 없음. 최소 10만 원부터 5만 원 단위, 학기당 최대 ${LOAN_POLICY_SNAPSHOT.purposes.living.semesterLimit}만 원입니다. 직접 입력도 같은 실행 단위를 적용합니다.</p>
    ${amountField('custom-amount', '학기당 생활비 대출액', draft.livingPerSemester)}
    <label class="editor-check"><input type="checkbox" name="individual-semesters" ${draft.livingBySemester ? 'checked' : ''}>학기별로 다르게 설정</label>
    <div id="semester-fields" ${draft.livingBySemester ? '' : 'hidden'}><p>개별 금액은 아래에서 조정합니다. 졸업 지연으로 추가되는 학기는 위의 학기당 금액을 적용하며 누적 한도 도달 시 제한됩니다.</p><div class="semester-fields">${Array.from({length:semesters},(_,i)=>amountField(`semester-${i}`, `${i+1}학기 생활비 대출액`, draft.livingBySemester?.[i] ?? draft.livingPerSemester)).join('')}</div></div>
    <p id="custom-amount-preview"></p></fieldset>
    <fieldset><legend>대출 구성과 일반 상환 조건</legend><div class="form-grid"><label class="field"><span>등록금 상환상품</span><select name="custom-tuition">${productOptions(draft.candidateId.split(':')[0])}</select></label><label class="field"><span>생활비 상환상품</span><select name="custom-living">${productOptions(draft.candidateId.split(':')[1])}</select></label><label class="field"><span>졸업 후 준비기간</span><select name="custom-grace">${[0,1,2].map(n=>`<option value="${n}" ${n===Number(draft.graceYears)?'selected':''}>${n}년</option>`).join('')}</select></label><label class="field"><span>상환기간</span><select name="custom-repayment">${Array.from({length:10},(_,i)=>`<option value="${i+1}" ${i+1===Number(draft.repaymentYears)?'selected':''}>${i+1}년</option>`).join('')}</select></label></div><p>상환기간은 일반 상환에만 적용합니다. 상품 자격은 결과에서 확인하며 실제 대출 승인 여부와 다를 수 있습니다.</p></fieldset>
    <p id="custom-error" role="alert"></p><div class="editor-footer"><button type="button" class="${quietButton}" data-close-editor>취소</button><button type="submit" class="${primaryButton}">${editing ? '변경 적용' : '시나리오 추가'}</button></div>
  </form></dialog>`;
}
function productOptions(value) {
  return [['general','일반 상환'],['income-contingent','취업 후 상환']].map(([id,label])=>`<option value="${id}" ${id===value?'selected':''}>${label}</option>`).join('');
}
