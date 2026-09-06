import { selectedLoanCandidate, selectedRecommendation } from '../../app/selectors.js';
import { LOAN_POLICY_SNAPSHOT } from '../../policies/loans/2026.js';
import { formatMoney } from '../formatters/money.js';
import { escapeHtml } from '../shared/escape-html.js';
import { icon } from '../shared/icon.js';

const safe = escapeHtml;

function selected(value, expected) {
  return String(value ?? '') === expected ? 'selected' : '';
}

function checked(value) {
  return value === true ? 'checked' : '';
}

function renderCandidate(candidate, selectedId) {
  const description = candidate.compositionDescription;
  const badge = candidate.isRecommended
    ? '<em>추천 구성</em>'
    : candidate.isPendingConfirmation
      ? '<em>자격 확인 전 후보</em>'
      : '';

  return `<label class="loan-candidate ${candidate.id === selectedId ? 'is-selected' : ''}">
    <input type="radio" name="loanCandidate" value="${candidate.id}" ${candidate.id === selectedId ? 'checked' : ''}>
    <span class="loan-candidate-copy">
      <span class="loan-candidate-title"><strong>${safe(candidate.label)}</strong>${badge}</span>
      <span class="loan-purpose-line"><b>등록금</b> ${description.purposes.tuition.productLabel} · ${formatMoney(description.purposes.tuition.principal, { digits: 1 })} · ${description.purposes.tuition.eligibilityLabel}</span>
      <span class="loan-purpose-line"><b>생활비</b> ${description.purposes.living.productLabel} · ${formatMoney(description.purposes.living.principal, { digits: 1 })} · ${description.purposes.living.eligibilityLabel}</span>
    </span>
  </label>`;
}

function fieldNeeded(missingFields, field) {
  return missingFields.includes(field);
}

function renderEligibilityFields(state, candidate) {
  const profile = state.profile;
  const missing = candidate.eligibility.missingFields;
  const fields = [];

  if (fieldNeeded(missing, 'academicLevel')) {
    fields.push(`<label class="field"><span>학부·대학원</span><select name="academicLevel"><option value="">선택해 주세요</option><option value="undergraduate" ${selected(profile.academicLevel, 'undergraduate')}>학부</option><option value="graduate" ${selected(profile.academicLevel, 'graduate')}>대학원</option></select></label>`);
  }
  if (fieldNeeded(missing, 'age')) {
    fields.push(`<label class="field"><span>현재 만 나이</span><span class="input-unit"><input name="age" type="number" min="0" max="100" value="${profile.age ?? ''}"><em>세</em></span></label>`);
  }
  if (fieldNeeded(missing, 'studentStatus')) {
    fields.push(`<label class="field"><span>학적 구분</span><select name="studentStatus"><option value="">선택해 주세요</option><option value="continuing" ${selected(profile.studentStatus, 'continuing')}>재학생</option><option value="new" ${selected(profile.studentStatus, 'new')}>신입생</option><option value="transfer" ${selected(profile.studentStatus, 'transfer')}>편입생</option><option value="readmitted" ${selected(profile.studentStatus, 'readmitted')}>재입학생</option></select></label>`);
  }
  if (fieldNeeded(missing, 'previousSemesterScore')) {
    fields.push(`<label class="field"><span>직전학기 백분위 성적</span><span class="input-unit"><input name="previousSemesterScore" type="number" min="0" max="100" value="${profile.previousSemesterScore ?? ''}"><em>점</em></span></label>`);
  }
  if (fieldNeeded(missing, 'previousSemesterCredits')) {
    fields.push(`<label class="field"><span>직전학기 이수학점</span><span class="input-unit"><input name="previousSemesterCredits" type="number" min="0" value="${profile.previousSemesterCredits ?? ''}"><em>학점</em></span></label>`);
  }
  if (fieldNeeded(missing, 'isDisabled')) {
    fields.push(`<label class="condition-check"><input name="isDisabled" type="checkbox" ${checked(profile.isDisabled)}><span><strong>장애학생에 해당해요</strong><small>성적·이수학점 예외 판정에만 사용합니다.</small></span></label>`);
  }
  if (missing.some((field) => field.startsWith('commonEligibility.'))) {
    fields.push(`<label class="condition-check condition-check-wide"><input name="commonEligibilityConfirmed" type="checkbox" ${checked(profile.commonEligibilityConfirmed)}><span><strong>공통 신청요건을 모두 확인했어요</strong><small>대상기관·국적/거주·중복지원·제한대학·허위정보·차액 반환·금융거래 제한 요건입니다.</small></span></label>`);
  }

  const usesIncomeContingent = candidate.tuitionProduct === 'income-contingent'
    || candidate.livingProduct === 'income-contingent';
  if (usesIncomeContingent) {
    fields.push(`<label class="condition-check"><input name="isMultiChildHousehold" type="checkbox" ${checked(profile.isMultiChildHousehold)}><span><strong>다자녀가구 학생이에요</strong><small>생활비 자격 예외와 이자면제를 다시 판정합니다.</small></span></label>`);
    fields.push(`<label class="condition-check"><input name="isCareLeaver" type="checkbox" ${checked(profile.isCareLeaver)}><span><strong>자립준비청년이에요</strong><small>생활비 자격 예외와 이자면제를 다시 판정합니다.</small></span></label>`);
    fields.push(`<label class="condition-check"><input name="isBasicOrNearPoverty" type="checkbox" ${checked(profile.isBasicOrNearPoverty)}><span><strong>기초·차상위 대상이에요</strong><small>취업 후 상환 이자면제를 다시 판정합니다.</small></span></label>`);
  }

  return fields.length
    ? `<div class="result-condition-grid">${fields.join('')}</div>`
    : '<p class="condition-complete">현재 선택에 필요한 자격 정보를 모두 확인했습니다.</p>';
}

function renderRepaymentTerms(state, candidate) {
  const hasGeneral = candidate.loan.repayments.general != null;
  if (!hasGeneral) return '';
  return `<fieldset class="result-subsection"><legend>일반 상환 기간</legend><div class="form-grid">
    <label class="field"><span>졸업 후 준비기간</span><select name="graceYears"><option value="0" ${selected(state.resultSelections.graceYears, '0')}>0년</option><option value="1" ${selected(state.resultSelections.graceYears, '1')}>1년</option><option value="2" ${selected(state.resultSelections.graceYears, '2')}>2년</option></select></label>
    <label class="field"><span>상환기간</span><select name="repaymentYears">${Array.from({ length: 10 }, (_, index) => `<option value="${index + 1}" ${selected(state.resultSelections.repaymentYears, String(index + 1))}>${index + 1}년</option>`).join('')}</select></label>
  </div></fieldset>`;
}

function renderExistingLoan(state) {
  const hasExistingLoan = state.resultSelections.hasExistingLoan;
  return `<fieldset class="result-subsection"><legend>기존 학자금대출</legend>
    <label class="condition-check condition-check-wide"><input name="hasExistingLoan" type="checkbox" ${checked(hasExistingLoan)}><span><strong>기존 학자금대출이 있어요</strong><small>선택하면 현재 잔액과 상품을 함께 계산합니다.</small></span></label>
    ${hasExistingLoan ? `<div class="form-grid existing-loan-fields">
      <label class="field"><span>기존 대출 상품</span><select name="existingLoanProduct"><option value="general" ${selected(state.profile.existingLoanProduct, 'general')}>일반 상환</option><option value="income-contingent" ${selected(state.profile.existingLoanProduct, 'income-contingent')}>취업 후 상환</option></select></label>
      <label class="field"><span>현재 대출 잔액</span><span class="input-unit"><input name="existingLoanBalance" type="number" min="0" value="${state.profile.existingLoanBalance ?? 0}"><em>만 원</em></span></label>
    </div>` : ''}
  </fieldset>`;
}

export function renderLoanOptions(state, scenario) {
  const recommendation = selectedRecommendation(state);
  const candidate = selectedLoanCandidate(state);
  if (!recommendation || !candidate) return '';
  const selectedId = state.resultSelections.candidateByScenario[scenario.id];
  const statusCopy = recommendation.status === 'recommended'
    ? '현재 입력으로 추천 구성을 찾았습니다.'
    : recommendation.status === 'confirmation-required'
      ? '자격 정보를 확인하면 추천을 확정할 수 있습니다.'
      : '현재 입력으로 선택 가능한 구성이 없습니다.';
  const fullCap = state.currentFullLoanCapView;

  return `<section class="loan-options" aria-labelledby="loan-options-title">
    <div class="section-heading compact"><h3 id="loan-options-title">${scenario.name}의 대출 구성을 확인하세요.</h3><p>${statusCopy} 추천은 선택한 계획 안에서 상품을 비교한 결과입니다. 상품과 아래 조건을 바꾸면 대출액과 상환 결과가 바로 갱신됩니다.</p></div>
    <p id="condition-update-status" class="sr-only" role="status" aria-live="polite"></p>
    <fieldset class="loan-candidate-group"><legend>가능한 상품 구성</legend><div class="loan-candidates">${recommendation.candidates.map((item) => renderCandidate(item, selectedId)).join('')}</div></fieldset>
    <div class="living-choice-row">
      <label class="condition-check condition-check-wide"><input name="includeLivingLoan" type="checkbox" ${checked(state.resultSelections.includeLivingByScenario[scenario.id])}><span><strong>생활비 대출 포함</strong><small>제외하면 근로시간 감소량과 생활비 미충족액을 다시 계산합니다.</small></span></label>
      <details><summary>풀대출 상한 보기 ${icon('chevron')}</summary><p>추천액과 별개로 ${fullCap.semesters}학기 동안 생활비 대출은 최대 ${formatMoney(fullCap.livingPrincipal)}입니다. 학기 ${formatMoney(fullCap.semesterLimit)}와 누적 ${formatMoney(fullCap.cumulativeLimit)} 중 먼저 닿는 한도를 적용합니다.</p></details>
    </div>
    ${renderRepaymentTerms(state, candidate)}
    <details class="eligibility-panel" ${state.resultSelections.eligibilityDetailsOpen ? 'open' : ''}><summary>현재 판정에 필요한 자격 조건 ${icon('chevron')}</summary><div><p>선택한 구성에 필요한 항목만 확인합니다. 이 정보는 브라우저 세션에만 남습니다.</p>${renderEligibilityFields(state, candidate)}</div></details>
    ${renderExistingLoan(state)}
    ${recommendation.excludedCandidates.length ? `<details class="excluded-options"><summary>제외된 선택지와 이유 ${icon('chevron')}</summary><ul>${recommendation.excludedCandidates.map((item) => `<li><strong>${safe(item.label)}</strong>${item.compositionDescription.exclusionReasons.map(({ message }) => `<span>${safe(message)}</span>`).join('')}</li>`).join('')}</ul></details>` : ''}
  </section>`;
}

export function confirmedCommonEligibility() {
  return Object.fromEntries(
    LOAN_POLICY_SNAPSHOT.commonEligibilityRules.map((id) => [id, true]),
  );
}
