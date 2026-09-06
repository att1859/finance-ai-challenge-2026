import { DEFAULT_PROFILE } from '../../data/sample-profile.js';
import {
  calculateMonthlyWorkIncome,
  WORK_TAX_PRESETS,
} from '../../domain/funding/work-income.js';
import { formatMoney } from '../formatters/money.js';
import { escapeHtml } from '../shared/escape-html.js';
import { icon } from '../shared/icon.js';

const safe = escapeHtml;
const compactMoney = (value) => formatMoney(value, { digits: 1 }).replace(' 만 원', '만 원');

export function renderDiagnosisSection(profile, inputMode = 'manual') {
  const sampleMode = inputMode === 'sample';
  return `<section class="diagnosis-section" id="diagnosis" aria-labelledby="diagnosis-title"><div class="section-heading"><h2 id="diagnosis-title">계산에 필요한 정보를 입력해 주세요.</h2><p>현재 확인할 수 있는 학비, 생활비와 근로조건만 입력해 주세요.</p></div><div class="input-mode" aria-label="입력 방식"><button class="mode-option ${sampleMode ? '' : 'is-active'}" type="button" data-action="manual"><span>직접 입력</span><small>내 상황에 맞게 값을 바꿔요</small></button><button class="mode-option ${sampleMode ? 'is-active' : ''}" type="button" data-action="sample"><span>예시 정보로 시작하기</span><small>${sampleMode ? '가상 정보가 입력됐어요' : '가상 정보가 입력돼요'}</small></button></div>${renderForm(profile)}</section>`;
}

export function renderForm(p) {
  return `
    <form id="diagnosis-form" novalidate>
      <p class="privacy-note">입력 정보는 브라우저 세션에서만 계산하며 서버에 저장하지 않습니다.</p>
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
        <div class="form-section-title"><span>02</span><div><h3>학비</h3><p>실제 납부 등록금에서 대출 없이 낼 금액을 먼저 빼요.</p></div></div>
        <div class="form-grid">
          <label class="field"><span>학기당 실제 납부 등록금</span><span class="input-unit"><input name="tuitionPerSemester" type="number" min="0" value="${p.tuitionPerSemester}" required><em>만 원</em></span><small class="error" data-error-for="tuitionPerSemester"></small></label>
          <label class="field"><span>학기당 대출 없이 낼 등록금</span><span class="input-unit"><input name="tuitionContributionPerSemester" type="number" min="0" value="${p.tuitionContributionPerSemester}" required><em>만 원</em></span><small class="field-hint">실제 납부 등록금보다 클 수 없어요.</small><small class="error" data-error-for="tuitionContributionPerSemester"></small></label>
          <label class="field"><span>학자금 지원구간</span><select name="supportBracket"><option value="">모름 / 확인 필요</option>${Array.from({length:10},(_,i)=>`<option value="${i+1}">${i+1}구간</option>`).join('')}</select></label>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title"><span>03</span><div><h3>생활과 근로</h3><p>희망 생활비와 근로시간의 차이를 세 계획에서 비교해요.</p></div></div>
        <div class="form-grid three">
          ${numberField('desiredCollegeSpend','대학 시절 희망 월 생활비',p.desiredCollegeSpend,'만 원')}
          ${numberField('hourlyWage','현재 시급',p.hourlyWage,'원')}
          ${numberField('currentWorkHours','현재 주당 근로시간',p.currentWorkHours,'시간')}
          ${taxPresetField(p.workTaxPreset)}
          ${numberField('salary','취업 후 예상 월소득',p.salary,'만 원')}
          ${numberField('desiredCareerSpend','취업 후 희망 월 생활비',p.desiredCareerSpend,'만 원')}
        </div>
        <div id="work-income-summary" class="inline-summary work-income-summary" aria-live="polite">${renderWorkIncomeSummaryContent(p)}</div>
        <details class="loan-explainer work-income-explainer"><summary>근로소득 계산 기준과 주의사항 ${icon('chevron')}</summary><div><p>주휴수당은 주 5일 근무, 소정근로일 개근, 계속근로를 가정해 간편 계산합니다. 연장·야간·휴일근로 가산수당은 포함하지 않습니다.</p><p>선택한 차감률은 비교를 위한 추정값으로 실제 세금·보험료와 다를 수 있습니다. <a href="https://www.moel.go.kr/mainpop2.do" target="_blank" rel="noopener">고용노동부 안내</a>와 <a href="https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=4&amp;cciNo=1&amp;cnpClsNo=1&amp;csmSeq=1381&amp;popMenu=ov" target="_blank" rel="noopener">찾기쉬운 생활법령정보</a>에서 조건을 확인할 수 있습니다.</p></div></details>
      </div>
      <div class="form-submit-row"><div><strong>먼저 세 계획과 가능한 대출 구성을 계산합니다.</strong><p>상품과 상환조건은 결과에서 비교하고 바꿀 수 있어요.</p></div><button class="button button-primary button-large" type="submit">추천 결과 확인하기 ${icon('arrow')}</button></div>
    </form>`;
}

function numberField(name, label, value, unit, step = '1') {
  return `<label class="field"><span>${label}</span><span class="input-unit"><input name="${name}" type="number" min="0" step="${step}" value="${value}" required><em>${unit}</em></span><small class="error" data-error-for="${name}"></small></label>`;
}

function taxPresetField(selected) {
  return `<label class="field"><span>근로소득 간편 차감</span><select name="workTaxPreset" aria-describedby="work-tax-hint">${Object.entries(WORK_TAX_PRESETS).map(([value, preset]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${preset.label}</option>`).join('')}</select><small id="work-tax-hint" class="field-hint">실제 세금·보험료가 아닌 시나리오 비교용 추정값입니다.</small></label>`;
}

export function renderWorkIncomeSummaryContent(profile) {
  const income = calculateMonthlyWorkIncome({
    weeklyHours: profile.currentWorkHours,
    hourlyWage: profile.hourlyWage,
    taxPreset: profile.workTaxPreset,
  });
  const holidayNote = income.weeklyHolidayEligible
    ? `주휴 ${income.weeklyHolidayHours.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}시간/주 반영`
    : '주휴수당 적용 안 됨';

  return `<p class="work-income-total"><span>현재 월 예상 실수령 근로소득</span><strong id="work-income-preview">${compactMoney(income.netMonthly)}</strong></p><p id="work-income-breakdown" class="work-income-breakdown">기본급 ${compactMoney(income.baseMonthly)} <b>+</b> 주휴수당 ${compactMoney(income.holidayMonthly)} <b>−</b> ${WORK_TAX_PRESETS[income.taxPreset].label} ${compactMoney(income.deductionMonthly)}</p><p id="work-holiday-note" class="work-income-assumption"><strong>${holidayNote}</strong> · 월평균 4.345주와 주휴 지급 조건을 가정한 간편 추정입니다.</p>`;
}

export function readProfile(form) {
  const data = new FormData(form);
  const numeric = ['tuitionPerSemester','tuitionContributionPerSemester','desiredCollegeSpend','desiredCareerSpend','currentWorkHours','hourlyWage','graduationYears','salary'];
  const profile = { ...DEFAULT_PROFILE };
  for (const [key, value] of data.entries()) if (!numeric.includes(key)) profile[key] = value;
  numeric.forEach((key) => {
    profile[key] = Number(data.get(key) ?? DEFAULT_PROFILE[key]);
  });
  return profile;
}

export function validateProfile(profile) {
  const errors = {};
  if (!profile.school.trim()) errors.school = '학교명을 입력해 주세요.';
  if (profile.graduationYears < 0.5 || profile.graduationYears > 8 || (profile.graduationYears * 2) % 1 !== 0) errors.graduationYears = '0.5년 단위로 0.5~8년 사이를 입력해 주세요.';
  ['tuitionPerSemester','tuitionContributionPerSemester','desiredCollegeSpend','desiredCareerSpend','currentWorkHours','hourlyWage','salary'].forEach((key) => {
    if (!Number.isFinite(profile[key]) || profile[key] < 0) errors[key] = '0 이상의 숫자를 입력해 주세요.';
  });
  if (profile.tuitionContributionPerSemester > profile.tuitionPerSemester) {
    errors.tuitionContributionPerSemester = '실제 납부 등록금 이하로 입력해 주세요.';
  }
  return errors;
}
