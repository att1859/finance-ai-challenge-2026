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

function renderCandidate(candidate, selectedId, unavailable = false) {
  const description = candidate.compositionDescription;
  const badge = unavailable ? '<em>요건 미충족</em>' : candidate.isRecommended
    ? '<em>추천 구성</em>'
    : candidate.isPendingConfirmation
      ? '<em>자격 확인 전 후보</em>'
      : '';

  return `<label class="loan-candidate ${candidate.id === selectedId ? 'is-selected' : ''} ${unavailable ? 'is-unavailable' : ''}">
    <input type="radio" name="loanCandidate" value="${candidate.id}" ${unavailable ? 'disabled' : ''} ${candidate.id === selectedId ? 'checked' : ''}>
    <span class="loan-candidate-copy">
      <span class="loan-candidate-title"><strong>${safe(candidate.label)}</strong>${badge}</span>
      <span class="loan-purpose-line"><b>등록금</b> ${description.purposes.tuition.productLabel} · ${formatMoney(description.purposes.tuition.principal, { digits: 1 })} · ${description.purposes.tuition.eligibilityLabel}</span>
      <span class="loan-purpose-line"><b>생활비</b> ${description.purposes.living.productLabel} · ${formatMoney(description.purposes.living.principal, { digits: 1 })} · ${description.purposes.living.eligibilityLabel}</span>
      ${unavailable ? `<span class="candidate-reason">${safe([...new Set(description.exclusionReasons.map(item=>item.message))].join(' ') || '현재 입력한 자격 요건을 충족하지 않습니다.')}</span>` : ''}
      ${candidate.id===selectedId?'<span class="candidate-selection-note">현재 그래프에 반영 중'+(unavailable?' · 자격 미충족 가정':'')+'</span>':''}
    </span>
  </label>`;
}

function renderRepaymentTerms(state, candidate, scenario) {
  const terms = scenario.custom ?? state.resultSelections;
  const hasGeneral = candidate.loan.repayments.general != null;
  if (!hasGeneral) return '';
  return `<fieldset class="result-subsection"><legend>일반 상환 기간</legend><div class="form-grid">
    <label class="field"><span>졸업 후 준비기간</span><select name="graceYears"><option value="0" ${selected(terms.graceYears, '0')}>0년</option><option value="1" ${selected(terms.graceYears, '1')}>1년</option><option value="2" ${selected(terms.graceYears, '2')}>2년</option><option value="3" ${selected(terms.graceYears, '3')}>3년</option></select></label>
    <label class="field"><span>상환기간</span><select name="repaymentYears">${Array.from({ length: 10 }, (_, index) => `<option value="${index + 1}" ${selected(terms.repaymentYears, String(index + 1))}>${index + 1}년</option>`).join('')}</select></label>
  </div><small>준비기간은 비교용 가정입니다. 실제 가능한 거치기간은 학제·연령과 전체 대출기간에 따라 달라져요.</small></fieldset>`;
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
  if(!state.eligibility.completed || state.eligibility.open) return '';
  const recommendation = selectedRecommendation(state);
  const candidate = selectedLoanCandidate(state);
  if (!recommendation || !candidate) return '';
  const selectedId = state.resultSelections.candidateByScenario[scenario.id];
  const excludedIds = new Set(recommendation.excludedCandidates.map(item=>item.id));
  const byId = new Map([...recommendation.candidates,...recommendation.excludedCandidates].map(item=>[item.id,item]));
  const cards = ['general:general','general:income-contingent','income-contingent:general','income-contingent:income-contingent'].map(id=>byId.get(id)).filter(Boolean);

  const statusCopy = recommendation.status === 'recommended'
    ? '현재 입력으로 추천 구성을 찾았습니다.'
    : recommendation.status === 'confirmation-required'
      ? '자격 정보를 확인하면 추천을 확정할 수 있습니다.'
      : '현재 입력으로 선택 가능한 구성이 없습니다.';
  const fullCap = state.comparison?.view === 'baseline' ? state.baselineFullLoanCapView : state.currentFullLoanCapView;

  return `<section class="loan-options" aria-labelledby="loan-options-title">
    <div class="section-heading compact"><h3 id="loan-options-title" tabindex="-1">${safe(scenario.name)}의 상환상품 바꾸기</h3><p>등록금과 생활비의 상품을 함께 골라주세요. 이 선택은 <strong>${safe(scenario.name)}</strong>의 그래프에만 반영됩니다.</p></div>
    ${excludedIds.size ? `<p class="candidate-availability-note">${excludedIds.size===cards.length?'현재 입력으로는 네 구성 모두 요건을 충족하지 않습니다.':'회색 카드는 현재 입력한 요건을 충족하지 않아 선택할 수 없습니다.'} <a href="#eligibility-workflow" data-action="eligibility-edit">자격·혜택 정보 수정</a>${excludedIds.has(selectedId)?' 현재 그래프는 이전 선택을 유지한 가정입니다.':''}</p>` : ''}
    <p id="condition-update-status" class="sr-only" role="status" aria-live="polite"></p>
    <fieldset class="loan-candidate-group"><legend>상환상품 구성</legend><div class="loan-candidates">${cards.map((item) => renderCandidate(item, selectedId, excludedIds.has(item.id))).join('')}</div></fieldset>
    <details class="loan-extra-options" data-detail="loan-extra"><summary>기간·생활비 포함·기존 대출 조정</summary><div class="living-choice-row">
      <label class="condition-check condition-check-wide"><input name="includeLivingLoan" type="checkbox" ${checked(state.resultSelections.includeLivingByScenario[scenario.id])}><span><strong>생활비 대출 포함</strong><small>제외하면 생활비 여력과 미충족액을 다시 계산합니다.</small></span></label>
      <details><summary>풀대출 상한 보기 ${icon('chevron')}</summary><p>추천액과 별개로 ${fullCap.semesters}학기 동안 생활비 대출은 최대 ${formatMoney(fullCap.livingPrincipal)}입니다. 학기 ${formatMoney(fullCap.semesterLimit)}와 누적 ${formatMoney(fullCap.cumulativeLimit)} 중 먼저 닿는 한도를 적용합니다.</p></details>
    </div>
    ${renderRepaymentTerms(state, candidate, scenario)}
    ${renderExistingLoan(state)}

    </details>
  </section>`;
}

export function confirmedCommonEligibility() {
  return Object.fromEntries(
    LOAN_POLICY_SNAPSHOT.commonEligibilityRules.map((id) => [id, true]),
  );
}
