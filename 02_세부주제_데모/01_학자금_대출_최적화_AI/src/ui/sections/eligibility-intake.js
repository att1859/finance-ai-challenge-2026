import { requiredMark } from '../shared/controls.js';
import { eligibilityRequirements } from '../../app/eligibility-draft.js';
import { escapeHtml as safe } from '../shared/escape-html.js';
export const COMMON_LABELS = {
 SUPPORTED_INSTITUTION:'학자금대출 지원 대상 대학에 재학·입학 예정입니다',
 NATIONALITY_OR_ALLOWED_DOMESTIC_RESIDENCY:'선택 상품의 국적·국내 거주 요건을 충족합니다',
 NO_DUPLICATE_FUNDING:'등록금 범위를 초과하는 중복지원을 받지 않습니다',
 NO_RESTRICTED_INSTITUTION:'해당 상품의 학자금 지원 제한 대학에 해당하지 않습니다',
 NO_FALSE_INFORMATION:'허위 정보나 부실 자료를 제출하지 않습니다',
 NO_UNRETURNED_TUITION_DIFFERENCE:'반환하지 않은 등록금 대출 차액이 없습니다',
 NO_FINANCIAL_TRANSACTION_BLOCK:'금융거래 안심차단 등 대출 제한 사유가 없습니다',
};
function radios(name,label,value,options,boolean=false) {
 return `<div class="eligibility-radio-row" id="elig-${name}"><span id="label-${name}">${safe(label)}</span><div role="radiogroup" aria-labelledby="label-${name}">${options.map(([id,text])=>`<label><input type="radio" name="${name}" value="${id}" ${boolean?'data-tristate="true"':''} ${String(value)===id?'checked':''}><span>${text}</span></label>`).join('')}</div></div>`;
}
export function tri(name,label,value) {
 return radios(name,label,value===true,[['true','네'],['false','아니요']],true);
}
function persistentQuestion(name,label,value,reason='') {
 const control=tri(name,label,value);
 return `<div class="persistent-question ${reason?'is-inapplicable':''}">${reason?control.replaceAll('type="radio"','type="radio" disabled'):control}<small class="applicability-note">${safe(reason)}</small></div>`;
}
function choice(name,label,value,options,error='') {
 const selected=options.find(([id])=>id===value);
 return `<div class="field" id="elig-${name}"><span id="label-${name}">${label} ${requiredMark}</span><details class="eligibility-select" data-choice="${name}"><summary aria-haspopup="listbox" aria-expanded="false" name="${name}" ${error?`aria-invalid="true" aria-describedby="error-${name}"`:''} aria-labelledby="label-${name} value-${name}"><span id="value-${name}">${selected?selected[1]:label+' 선택'}</span><span aria-hidden="true">⌄</span></summary><div role="listbox" aria-required="true" aria-labelledby="label-${name}">${options.map(([id,text])=>`<button type="button" role="option" tabindex="-1" aria-selected="${id===value}" data-choice-value="${id}">${text}</button>`).join('')}</div></details>${error?`<small id="error-${name}" class="eligibility-error" role="alert">${safe(error)}</small>`:''}</div>`;
}
export function commonConfirmations(profile, scenario) {
 const general=Boolean(scenario.loan.repayments.general),icl=Boolean(scenario.loan.repayments.incomeContingent);
 const list=Object.entries(COMMON_LABELS).map(([id,label])=>({name:`common:${id}`,label,value:profile.commonEligibility?.[id]}));
 if(general) list.push({name:'ageGeneralConfirmed',label:'일반 상환 연령 기준(만 55세 이하)을 충족합니다',value:profile.ageGeneralConfirmed});
 if(icl && profile.academicLevel) {
  const grad=profile.academicLevel==='graduate';
  const name=grad?'ageIclGraduateConfirmed':'ageIclUndergraduateConfirmed';
  list.push({name,label:`ICL 연령 기준(만 ${grad?40:35}세 이하)을 충족합니다`,value:profile[name]});
 }
 if(general) list.push({name:'scoreConfirmed',label:'직전 학기 백분위 성적이 70점 이상입니다',value:profile.scoreConfirmed,disabled:profile.studentStatus!=='continuing'||profile.isDisabled===true});
 return list;
}
export function renderEligibilityIntake(state,scenario) {
 const p=state.profile;
 const ageRequired=eligibilityRequirements(p,false).some(item=>item.name==='age');
 const common=commonConfirmations(p,scenario);
 const hasAgeFailure=common.some(f=>f.name.startsWith('age') && f.value===false);
 const creditReason=!p.studentStatus?'학적을 먼저 선택해 주세요.':p.studentStatus!=='continuing'?'입학 시 직전 학기 학점 기준 제외':p.academicLevel==='graduate'?'대학원생은 이수학점 기준 제외':p.isDisabled===true?'장애학생은 이수학점 기준 제외':'';
 const graduationReason=creditReason || (p.creditsConfirmed===true?'12학점 이상 이수하여 예외 확인 불필요':'');
 const schoolReason=graduationReason || (p.isGraduating===true?'졸업학년 예외 적용':'');
 return `<section class="eligibility-intake" id="eligibility-intake" tabindex="-1" aria-labelledby="eligibility-title">
 <h4 id="eligibility-title">자격·혜택 확인</h4><p>한 번 확인한 내 정보는 모든 시나리오에 적용됩니다. 네 가지 상품을 함께 확인합니다. 아래 기본값을 본인에게 맞게 수정하고 마지막에 입력을 완료해 주세요.</p>
 <fieldset class="individual-requirements"><legend>1. 개별 요건 확인</legend><p>지원구간·가구 조건·학적은 개인마다 달라 직접 확인합니다. 이 정보는 상품을 바꾸어도 유지됩니다.</p>
 <div class="academic-questions">${choice('studentStatus','학적',p.studentStatus,[['continuing','재학생'],['new','신입생'],['transfer','편입생'],['readmitted','재입학생']],state.eligibility.errors.studentStatus)}${radios('academicLevel','학부·대학원',p.academicLevel??'undergraduate',[['undergraduate','학부'],['graduate','대학원']])}</div>
 <div class="form-grid">${persistentQuestion('creditsConfirmed','직전 학기 12학점 이상 이수했나요?',p.creditsConfirmed,creditReason)}
 ${persistentQuestion('isGraduating','졸업학년 학부생인가요?',p.isGraduating,graduationReason)}
 ${persistentQuestion('isDisabled','장애학생인가요?',p.isDisabled)}
 ${persistentQuestion('schoolCreditRuleMet','학교가 정한 12학점 미만의 별도 최소 이수학점 기준을 충족하나요?',p.schoolCreditRuleMet,schoolReason)}</div>
 <p>4학년 등 졸업학년 여부는 12학점 미충족 시 확인합니다. 군 복무·인턴으로 학점이 부족한 경우에도 실제 이수 여부를 선택해 주세요.</p><fieldset><legend>지원구간·가구 조건과 혜택</legend><div class="form-grid">${choice('supportBracket','학자금 지원구간',String(p.supportBracket??''),Array.from({length:10},(_,i)=>[String(i+1),`${i+1}구간`]),state.eligibility.errors.supportBracket)}
 ${tri('isBasicOrNearPoverty','기초생활수급자·차상위계층인가요?',p.isBasicOrNearPoverty)}
 ${tri('isMultiChildHousehold','본인을 포함한 형제·자매가 3명 이상인가요?',p.isMultiChildHousehold)}
 ${persistentQuestion('isUnmarried','미혼인가요? (다자녀 이자면제 조건)',p.isUnmarried,p.isMultiChildHousehold===true?'':'다자녀 조건 해당 시 확인')}
 ${tri('isCareLeaver','자립준비청년·보호아동 등 자립지원 대상인가요?',p.isCareLeaver)}
 ${tri('isMedianIncome130','대출 실행 시점 기준 중위소득 130% 이하인가요?',p.isMedianIncome130)}
 ${persistentQuestion('hasEmergencyLivelihood','9구간 긴급생계곤란 예외에 해당하나요?',p.hasEmergencyLivelihood,String(p.supportBracket)==='9'&&p.academicLevel==='undergraduate'?'':'학부 9구간일 때 확인')}</div><p>지원구간은 생활비 대출 자격에 사용합니다. 이자면제는 별도 조건이며, 혜택 기본값은 아니요이며, 해당하는 경우 네로 변경해 주세요. 일반 상환에는 ICL 이자면제를 적용하지 않으며, 입력한 정보는 ICL 선택 시에도 사용합니다.</p></fieldset></fieldset>
 ${state.resultSelections.hasExistingLoan && (p.existingLoanProduct??p.loanType)==='income-contingent'?`<fieldset><legend>기존 ICL 대출의 이자면제</legend><p>이번 학기 혜택과 별도로, 기존 대출 잔액에 앞으로 적용할 면제를 확인합니다.</p><div class="form-grid">${tri('existingExemptionEligible','기존 대출 실행 당시 이자면제 대상이었나요?',p.existingExemptionEligible)}${tri('existingExemptionActive','기존 대출은 현재 이자면제가 적용되고 있나요?',p.existingExemptionActive)}</div></fieldset>`:''}
 <fieldset class="common-confirmations"><legend>2. 공통 요건 확인</legend><label class="common-check check-all"><input type="checkbox" name="confirmAll" data-confirm-all ${common.filter(f=>!f.disabled).every(f=>f.value===true)?'checked':''}><span>모두 체크</span></label><p>맞는 항목을 체크해 주세요. 개별 체크를 해제하면 미충족으로 반영되며, 체크하지 않은 항목도 마지막 확인을 거쳐 미충족으로 제출할 수 있습니다.</p><div class="common-list">${common.map(f=>`<label class="common-check" id="elig-${f.name}"><input type="checkbox" name="${f.name}" data-common-check ${f.disabled?'disabled':''} ${f.value===true?'checked':''}><span>${safe(f.label)}</span></label>`).join('')}</div></fieldset>
 ${hasAgeFailure?`<div class="form-grid"><label class="field" id="elig-age"><span>예외 확인을 위한 현재 만 나이 ${ageRequired?requiredMark:''}</span><input type="number" name="age" aria-required="${ageRequired}" min="0" max="100" value="${p.age??''}" ${state.eligibility.errors.age?'aria-invalid="true" aria-describedby="error-age"':''}>${state.eligibility.errors.age?`<small class="eligibility-error" id="error-age" role="alert">${safe(state.eligibility.errors.age)}</small>`:''}</label>${p.ageGeneralConfirmed===false?tri('enteredByAge55AndContinuouslyEnrolled','만 55세 이전 입학 후 중단 없이 학업을 이어가고 있나요?',p.enteredByAge55AndContinuouslyEnrolled):''}${p.ageIclUndergraduateConfirmed===false?tri('qualifyingEmployedUndergraduateProgram','ICL 만 45세 이하 재직자 특별전형 등 연령 예외 요건에 해당하나요?',p.qualifyingEmployedUndergraduateProgram):''}</div>`:''}
 <a href="https://www.kosaf.go.kr/ko/tuition.do?pg=tuition05_07" target="_blank" rel="noreferrer">한국장학재단 이자면제 기준</a></section>`;
}
