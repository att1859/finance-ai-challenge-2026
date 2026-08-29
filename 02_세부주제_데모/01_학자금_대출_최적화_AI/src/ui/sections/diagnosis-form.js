import { DEFAULT_PROFILE } from '../../data/sample-profile.js';
import { monthlyWorkIncome } from '../../domain/funding/work-income.js';
import { INCOME_CONTINGENT_POLICY } from '../../policies/loans/2026.js';
import { moneyHtml } from '../formatters/money.js';
import { escapeHtml } from '../shared/escape-html.js';
import { icon } from '../shared/icon.js';

const safe = escapeHtml;
const money = moneyHtml;

export function renderDiagnosisSection(profile, inputMode = 'manual') {
  const sampleMode = inputMode === 'sample';
  return `<section class="diagnosis-section" id="diagnosis" aria-labelledby="diagnosis-title"><div class="section-heading"><h2 id="diagnosis-title">계산에 필요한 정보를 입력해 주세요.</h2><p>모르는 지원사업 금액은 넣지 않아도 됩니다. 실제 납부액과 이미 확정된 지원금만 계산에 사용해요.</p></div><div class="input-mode" aria-label="입력 방식"><button class="mode-option ${sampleMode ? '' : 'is-active'}" type="button" data-action="manual"><span>직접 입력</span><small>내 상황에 맞게 값을 바꿔요</small></button><button class="mode-option ${sampleMode ? 'is-active' : ''}" type="button" data-action="sample"><span>예시 정보로 시작하기</span><small>${sampleMode ? '가상 정보가 입력됐어요' : '가상 정보가 입력돼요'}</small></button></div>${renderForm(profile)}</section>`;
}

export function renderForm(p) {
  return `
    <form id="diagnosis-form" novalidate>
      <div class="form-section">
        <div class="form-section-title"><span>01</span><div><h3>재학 정보</h3><p>졸업까지 남은 기간이 총 필요금액과 대출 실행 횟수를 결정해요.</p></div></div>
        <div class="form-grid">
          <label class="field"><span>학교</span><input name="school" value="${safe(p.school)}" placeholder="학교명을 입력해 주세요" required><small class="error" data-error-for="school"></small></label>
          <label class="field"><span>학년</span><select name="academicYear"><option value="1">1학년</option><option value="2">2학년</option><option value="3">3학년</option><option value="4">4학년 이상</option></select></label>
          <label class="field"><span>졸업까지 남은 기간</span><span class="input-unit"><input name="graduationYears" type="number" min="0.5" max="8" step="0.5" value="${p.graduationYears}" required><em>년</em></span><small id="graduation-equivalent" class="field-hint">${p.graduationYears}년 = ${p.graduationYears * 2}학기 · ${p.graduationYears * 12}개월</small><small class="error" data-error-for="graduationYears"></small></label>
          <label class="field"><span>지역</span><select name="region">${['서울특별시','경기도','인천광역시','부산광역시','대구광역시','광주광역시','대전광역시','울산광역시','강원특별자치도','충청북도','충청남도','전북특별자치도','전라남도','경상북도','경상남도','제주특별자치도'].map((item) => `<option ${p.region === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title"><span>02</span><div><h3>학비와 지원 정보</h3><p>지원사업 후보 금액은 빼지 않고, 확정된 금액만 반영합니다.</p></div></div>
        <div class="form-grid">
          <label class="field"><span>확정 장학금·감면 반영 후 학기당 실제 납부 등록금</span><span class="input-unit"><input name="tuitionPerSemester" type="number" min="0" value="${p.tuitionPerSemester}" required><em>만 원</em></span><small class="error" data-error-for="tuitionPerSemester"></small></label>
          <label class="field"><span>졸업 전까지 확정된 생활비성 지원금 총액 <i>선택</i></span><span class="input-unit"><input name="confirmedLivingGrantTotal" type="number" min="0" value="${p.confirmedLivingGrantTotal}"><em>만 원</em></span><small class="field-hint">수혜가 확정된 금액만 입력해 주세요.</small></label>
          <label class="field"><span>학자금 지원구간</span><select name="supportBracket"><option value="">모름 / 확인 필요</option>${Array.from({length:10},(_,i)=>`<option value="${i+1}">${i+1}구간</option>`).join('')}</select></label>
          <fieldset class="field field-wide"><legend>특별 자격 <i>선택</i></legend><div class="check-row">${['다자녀','농어촌 가구','비수도권 인재','다문화·탈북 배경'].map((item)=>`<label><input type="checkbox" name="specialQualifications" value="${item}" ${p.specialQualifications.includes(item)?'checked':''}><span>${item}</span></label>`).join('')}</div></fieldset>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title"><span>03</span><div><h3>생활과 근로</h3><p>희망 생활비와 근로시간의 차이를 세 계획에서 비교해요.</p></div></div>
        <div class="form-grid three">
          ${numberField('desiredCollegeSpend','대학 시절 희망 월 생활비',p.desiredCollegeSpend,'만 원')}
          ${numberField('hourlyWage','현재 시급',p.hourlyWage,'원')}
          ${numberField('currentWorkHours','현재 주당 근로시간',p.currentWorkHours,'시간')}
          ${numberField('desiredWorkHours','희망 주당 근로시간',p.desiredWorkHours,'시간')}
          ${numberField('salary','취업 후 예상 월소득',p.salary,'만 원')}
          ${numberField('desiredCareerSpend','취업 후 희망 월 생활비',p.desiredCareerSpend,'만 원')}
        </div>
        <p class="inline-summary">현재 월 근로소득 예상 <strong id="work-income-preview">${money(monthlyWorkIncome(p.currentWorkHours,p.hourlyWage))}</strong> <span>주휴수당 제외</span></p>
      </div>
      <div class="form-section">
        <div class="form-section-title"><span>04</span><div><h3>대출 계획</h3><p>상환 방식에 따라 졸업 후 표시되는 금액이 달라져요.</p></div></div>
        <fieldset class="loan-type-fieldset"><legend>학자금대출 유형</legend><div class="loan-type-grid">
          ${loanChoice('general','일반 상환','정한 거치·상환기간에 따라 매달 갚아요.',p.loanType)}
          ${loanChoice('income-contingent','취업 후 상환','연소득이 기준을 넘으면 의무상환액이 생겨요.',p.loanType)}
        </div></fieldset>
        <details class="loan-explainer"><summary>두 대출 유형은 무엇이 다른가요? ${icon('chevron')}</summary><div><p><strong>일반 상환</strong>은 거치기간 뒤 정해진 기간 동안 원금과 이자를 갚습니다.</p><p><strong>취업 후 상환</strong>은 소득이 상환기준을 넘으면 초과분을 기준으로 의무상환액이 정해집니다. 실제 자격과 상환액은 공식 심사를 확인해야 합니다.</p></div></details>
        <div class="form-grid three loan-common">
          ${numberField('loanCap','신규 대출 한도',p.loanCap,'만 원')}
          ${numberField('existingLoanBalance','현재 학자금대출 잔액',p.existingLoanBalance,'만 원')}
          ${numberField('annualRate','계산 금리',p.annualRate,'%', '0.1')}
        </div>
        <div id="general-loan-fields" class="form-grid three ${p.loanType === 'general' ? '' : 'is-hidden'}">
          ${numberField('graceYears','졸업 후 거치기간',p.graceYears,'년','0.5')}
          ${numberField('repaymentYears','상환기간',p.repaymentYears,'년','0.5')}
          <fieldset class="field"><legend>상환 방식</legend><div class="segmented"><label><input type="radio" name="repaymentMethod" value="equal-payment" ${p.repaymentMethod==='equal-payment'?'checked':''}><span>원리금균등</span></label><label><input type="radio" name="repaymentMethod" value="equal-principal" ${p.repaymentMethod==='equal-principal'?'checked':''}><span>원금균등</span></label></div></fieldset>
        </div>
        <p id="icl-policy-note" class="policy-inline ${p.loanType === 'income-contingent' ? '' : 'is-hidden'}">${icon('info')} ${INCOME_CONTINGENT_POLICY.basisYear}년 상환기준소득 ${money(INCOME_CONTINGENT_POLICY.annualIncomeThreshold)}, 예상 의무상환율 ${INCOME_CONTINGENT_POLICY.repaymentRate*100}%를 사용합니다.</p>
      </div>
      <div class="form-submit-row"><div><strong>입력값을 바꾸면 세 계획을 다시 계산합니다.</strong><p>간이 예상 결과이며 공식 심사·승인 결과가 아닙니다.</p></div><button class="button button-primary button-large" type="submit">세 가지 계획 비교하기 ${icon('arrow')}</button></div>
    </form>`;
}

function numberField(name, label, value, unit, step = '1') {
  return `<label class="field"><span>${label}</span><span class="input-unit"><input name="${name}" type="number" min="0" step="${step}" value="${value}" required><em>${unit}</em></span><small class="error" data-error-for="${name}"></small></label>`;
}

function loanChoice(value, title, copy, selected) {
  return `<label class="loan-choice"><input type="radio" name="loanType" value="${value}" ${selected===value?'checked':''} required><span><strong>${title}</strong><small>${copy}</small></span></label>`;
}

export function toggleLoanFields(type) {
  document.querySelector('#general-loan-fields').classList.toggle('is-hidden', type !== 'general');
  document.querySelector('#icl-policy-note').classList.toggle('is-hidden', type !== 'income-contingent');
}

export function readProfile(form) {
  const data = new FormData(form);
  const numeric = ['tuitionPerSemester','confirmedLivingGrantTotal','desiredCollegeSpend','desiredCareerSpend','currentWorkHours','desiredWorkHours','hourlyWage','graduationYears','salary','loanCap','annualRate','repaymentYears','graceYears','existingLoanBalance'];
  const profile = { ...DEFAULT_PROFILE };
  for (const [key, value] of data.entries()) if (!numeric.includes(key) && key !== 'specialQualifications') profile[key] = value;
  numeric.forEach((key) => {
    profile[key] = Number(data.get(key) ?? DEFAULT_PROFILE[key]);
  });
  profile.specialQualifications = data.getAll('specialQualifications');
  return profile;
}

export function validateProfile(profile) {
  const errors = {};
  if (!profile.school.trim()) errors.school = '학교명을 입력해 주세요.';
  if (profile.graduationYears < 0.5 || profile.graduationYears > 8 || (profile.graduationYears * 2) % 1 !== 0) errors.graduationYears = '0.5년 단위로 0.5~8년 사이를 입력해 주세요.';
  ['tuitionPerSemester','desiredCollegeSpend','desiredCareerSpend','currentWorkHours','desiredWorkHours','hourlyWage','salary','loanCap','annualRate','repaymentYears','graceYears','existingLoanBalance'].forEach((key) => {
    if (!Number.isFinite(profile[key]) || profile[key] < 0) errors[key] = '0 이상의 숫자를 입력해 주세요.';
  });
  return errors;
}
