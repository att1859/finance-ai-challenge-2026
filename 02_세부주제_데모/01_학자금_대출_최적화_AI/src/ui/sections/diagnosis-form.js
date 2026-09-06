import { DEFAULT_PROFILE } from '../../data/sample-profile.js';
import { escapeHtml as safe } from '../shared/escape-html.js';
import { icon } from '../shared/icon.js';
import { quietButton } from '../shared/controls.js';

export function renderDiagnosisSection(profile, inputMode = 'manual') {
  return `<section class="diagnosis-section" id="diagnosis" aria-labelledby="diagnosis-title"><div class="section-heading"><h2 id="diagnosis-title">계산에 필요한 정보를 입력해 주세요.</h2><p>이번 학기 자금과 졸업까지 남은 학기를 알려주세요.</p></div><button class="${quietButton}" type="button" data-action="sample">${inputMode === 'sample' ? '예시 정보 다시 채우기' : '예시 정보로 채우기'}</button>${renderForm(profile)}</section>`;
}
function numberField(name, label, value, unit, hint = '', max = '') {
  return `<label class="field" for="${name}"><span>${label}</span><span class="input-unit"><input id="${name}" name="${name}" type="number" min="${name === 'remainingSemesters' ? 1 : 0}" ${max ? `max="${max}"` : ''} step="1" value="${safe(value)}" required aria-describedby="${name}-hint ${name}-error"><em>${unit}</em></span><small id="${name}-hint" class="field-hint">${hint}</small><small id="${name}-error" class="error" data-error-for="${name}"></small></label>`;
}
export function renderForm(p) {
  return `<form id="diagnosis-form" novalidate><p class="privacy-note">입력 정보는 브라우저 세션에서만 계산하며 서버에 저장하지 않습니다.</p><div class="compact-profile form-grid">
    ${numberField('remainingSemesters', '졸업까지 남은 학기', p.remainingSemesters ?? p.graduationYears * 2, '학기', '이번 학기를 포함합니다. 1학기는 6개월로 계산합니다.', 16)}
    ${numberField('tuitionPerSemester', '이번 학기 실제 납부 등록금', p.tuitionPerSemester, '만 원', '장학금 감면 후 실제로 납부할 금액입니다.')}
    <div class="contribution-field">${numberField('tuitionContributionPerSemester', '대출 없이 낼 수 있는 등록금 금액', p.tuitionContributionPerSemester, '만 원', '이번 학기 실제 납부 등록금 이내로 입력해 주세요.')}<button type="button" class="${quietButton} info-button" data-action="tuition-help" aria-label="대출 없이 낼 수 있는 등록금 금액 설명" aria-expanded="false" aria-controls="tuition-help">i</button><p id="tuition-help" class="field-help" hidden>아르바이트로 앞으로 벌 돈이나 대출금을 제외하고, 부모님의 지원 또는 이미 저축해 둔 돈으로 이번 학기 등록금에 쓸 수 있는 금액입니다. 아래 현재 월소득에 생활비로 배정한 돈과 중복해서 입력하지 마세요.</p></div>
    ${numberField('currentMonthlyIncome', '현재 월소득', p.currentMonthlyIncome ?? 50, '만 원', '용돈·소득·저축 중 매달 생활비로 쓸 수 있는 금액입니다. 앞으로 추가로 할 알바와 대출은 제외합니다.')}
    ${numberField('desiredCollegeSpend', '대학 시절 월 희망 생활비', p.desiredCollegeSpend, '만 원', '현재 월소득보다 부족한 금액을 대출 또는 추가 알바로 채우는 계산입니다.')}
    ${numberField('salary', '취업 후 예상 월소득', p.salary, '만 원', '취업 후 상환액 비교에 사용하는 예상 소득입니다.')}
  </div><div class="form-submit-row"><div><strong>현재 중시 · 균형 · 미래 중시를 비교합니다.</strong><p>대출상품과 추가 조건은 결과에서 확인할 수 있어요.</p></div><button class="button button-primary button-large" type="submit">결과 확인하기 ${icon('arrow')}</button></div></form>`;
}
export function readProfile(form, previousProfile = {}) {
  const data = new FormData(form);
  const profile = { ...DEFAULT_PROFILE, ...previousProfile };
  for (const key of ['remainingSemesters','tuitionPerSemester','tuitionContributionPerSemester','currentMonthlyIncome','desiredCollegeSpend','salary']) {
    const value = data.get(key);
    profile[key] = value == null || String(value).trim() === '' ? NaN : Number(value);
  }
  profile.graduationYears = profile.remainingSemesters / 2;
  return profile;
}
export function validateProfile(profile) {
  const errors = {};
  if (!Number.isInteger(profile.remainingSemesters) || profile.remainingSemesters < 1 || profile.remainingSemesters > 16) errors.remainingSemesters = '이번 학기를 포함해 1~16학기 사이의 정수를 입력해 주세요.';
  for (const key of ['tuitionPerSemester','tuitionContributionPerSemester','currentMonthlyIncome','desiredCollegeSpend','salary']) {
    if (!Number.isFinite(profile[key]) || profile[key] < 0) errors[key] = '0 이상의 숫자를 입력해 주세요.';
  }
  if (profile.tuitionContributionPerSemester > profile.tuitionPerSemester) errors.tuitionContributionPerSemester = '실제 납부 등록금 이하로 입력해 주세요.';
  return errors;
}
