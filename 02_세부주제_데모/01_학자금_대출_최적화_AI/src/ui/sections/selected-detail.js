import { COMMON_LABELS } from './eligibility-intake.js';
import { getLoanCompositionComponents } from '../../domain/loans/loan-composition.js';
import { quietButton } from '../shared/controls.js';
import { selectedLoanCandidate } from '../../app/selectors.js';
import { renderFundingFormula } from './funding-formula.js';
import { renderSources } from './sources.js';
import { formatMoney, moneyHtml, signedMoney } from '../formatters/money.js';
import { escapeHtml } from '../shared/escape-html.js';
import { icon } from '../shared/icon.js';

const money = moneyHtml;
const safe = escapeHtml;
const formatHours = (value) => Number(value).toLocaleString('ko-KR', {
  maximumFractionDigits: 1,
});

function moneyOrPending(value, digits = 1) {
  return Number.isFinite(value) ? money(value, digits) : '확인 필요';
}


function renderComposition(candidate) {
  const { tuition, living } = candidate.compositionDescription.purposes;
  return `<div class="composition-ledger"><h4>상품·용도별 신규 대출</h4><div class="table-wrap"><table><caption>선택한 신규 대출 구성</caption><thead><tr><th scope="col">용도</th><th scope="col">상품</th><th scope="col">대출액</th><th scope="col">자격 상태</th></tr></thead><tbody>${[tuition, living].map((purpose) => `<tr><th scope="row">${purpose.purposeLabel}</th><td data-label="상품">${purpose.productLabel}</td><td data-label="대출액">${formatMoney(purpose.principal, { digits: 1 })}</td><td data-label="자격 상태">${purpose.eligibilityLabel}${purpose.eligibilityLabel.includes("확인")?` <a href="#eligibility-workflow" data-action="eligibility-edit">정보 입력</a>`:""}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function missingFieldLabel(field) {
  if (field.startsWith('commonEligibility.')) return COMMON_LABELS[field.split('.')[1]] ?? '공통 신청요건';
  return {
    supportBracket: '학자금 지원구간',
    academicLevel: '학부·대학원',
    age: '선택 상품의 연령 기준 확인',
    studentStatus: '학적 구분',
    previousSemesterScore: '직전학기 성적',
    previousSemesterCredits: '직전학기 이수학점',
    isDisabled: '장애학생 여부',
    isGraduating: '졸업학년 여부',
    creditsConfirmed: '12학점 충족 여부',
    scoreConfirmed: '성적 기준 확인',
    schoolCreditRuleMet: '학교 학점 예외',
    isUnmarried: '다자녀 미혼 조건',
    isMedianIncome130: '중위소득 130% 이하 여부',
    hasEmergencyLivelihood: '긴급생계곤란 여부',
    isMultiChildHousehold: '다자녀가구 여부',
    isCareLeaver: '자립준비청년 여부',
  }[field] ?? '추가 신청요건';
}

function renderRecommendationExplanation(candidate, scenario) {
  const description = candidate.compositionDescription;
  const title = candidate.isRecommended
    ? '이 구성을 추천한 이유'
    : candidate.isPendingConfirmation
      ? '조건 확인 후 추천을 확정할 수 있어요'
      : '선택한 구성의 특징';
  const workEffect = `이번 학기 생활비 대출 ${formatMoney(scenario.livingLoan.principal)}을 6개월로 나눠 현재 월소득에 더합니다. 이후 학기에는 신규 대출을 반복하지 않습니다.`;
  const missing = [...new Set(candidate.eligibility.missingFields.map(missingFieldLabel))];
  const usesVariableRate = candidate.loan.repayments.incomeContingent != null;
  const reasons = description.reasons.filter(
    ({ code }) => code !== 'ELIGIBILITY_CONFIRMATION_REQUIRED',
  );
  const notices = [
    ...description.warnings.map(({ message }) => message),
    ...(usesVariableRate
      ? ['취업 후 상환은 변동금리 상품입니다. 실제 금리가 바뀌면 이자와 남은 잔액도 달라집니다.']
      : []),
    ...(scenario.unmetLivingGap > 0
      ? [`현재 대출 선택과 한도를 반영하면 이번 학기 생활비가 총 ${formatMoney(scenario.unmetLivingGap, { digits: 1 })} 부족합니다. 생활비 대출 포함 여부와 처음 입력한 생활비·현재 월소득을 확인해 주세요.`]
      : []),
  ];

  return `<section class="recommendation-explanation" aria-labelledby="recommendation-reason-title"><div><h4 id="recommendation-reason-title">${title}</h4><p>${workEffect}</p></div><div>
    ${reasons.length ? `<ul class="reason-list">${reasons.map(({ message }) => `<li>${safe(message)}</li>`).join('')}</ul>` : '<p class="reason-empty">다른 구성의 대출액과 상환부담도 함께 비교해 보세요.</p>'}
    ${missing.length ? `<p class="current-value-notice"><strong>추천 전에 확인할 정보</strong> ${safe(missing.join(', '))}. 그래프 아래 ‘추가정보 입력’에서 입력하면 다시 계산됩니다.</p>` : ''}
    ${notices.length ? `<h5 class="notice-heading">선택 전에 확인하세요</h5><ul class="warning-list">${notices.map((message) => `<li>${safe(message)}</li>`).join('')}</ul>` : ''}
  </div></section>`;
}

function maximumGraceMonthly(general) {
  return general?.monthlyRepaymentSchedule.reduce(
    (maximum, row) => Math.max(maximum, row.graceInterestPayment),
    0,
  ) ?? 0;
}

function renderRepayment(loan) {
  const general = loan.repayments.general;
  const incomeContingent = loan.repayments.incomeContingent;
  const rows = [];

  if (general) {
    rows.push(
      ['일반 상환 월 원리금균등 납입액', moneyOrPending(general.monthlyPayment), '학기별 대출의 원금·이자를 합쳐 가장 많이 내는 달의 금액입니다. 실제 월 합계는 상환 구간에 따라 달라집니다.'],
      ['일반 상환 거치 중 최대 월이자', moneyOrPending(maximumGraceMonthly(general)), '원금 상환 전 이자만 내는 기간을 거치기간이라 합니다. 그 기간의 월이자 합계 중 가장 큰 금액입니다.'],
      ['일반 상환 시작일', general.repaymentStartDate ?? (general.calculationPossible ? '해당 없음' : '확인 필요'), general.repaymentStartDate ? '학기별 대출 중 원금과 이자를 갚기 시작하는 가장 이른 날짜입니다.' : '계산할 상환 일정이 있을 때 시작일을 표시합니다.'],
    );
  }
  if (incomeContingent) {
    rows.push(
      ['취업 후 상환 연간 예상 의무상환액', moneyOrPending(incomeContingent.annualMandatoryRepayment), '입력한 취업 후 소득으로 추정한 첫해 상환액입니다. 실제 소득에 따라 달라집니다.'],
      ['취업 후 상환 월평균 환산액(참고)', moneyOrPending(incomeContingent.monthlyAverageEquivalent), '연간 예상액을 12로 나눈 비교용 금액이며, 실제 매달 청구되는 금액은 아닙니다.'],
      ['현재 총급여 환산 기준', moneyOrPending(incomeContingent.annualGrossIncomeThreshold, 0), '의무상환 기준소득을 연간 총급여로 환산한 값입니다. 확정 상환액 계산에 쓰는 연간소득금액과는 다릅니다.'],
    );
  }

  const timing = general && incomeContingent
    ? '일반 상환은 약정한 날짜부터 매달, 취업 후 상환은 소득에 따른 연간 예상액으로 확인하세요.'
    : general
      ? '일반 상환은 취업 여부와 관계없이 약정한 날짜부터 갚습니다.'
      : '취업 후 상환은 소득에 따라 의무상환액이 정해집니다. 예상액이 0원이어도 대출이 없어지는 것은 아닙니다.';
  return `<div class="loan-detail"><div><h4>언제, 얼마를 갚나요?</h4><p>${timing}</p></div><dl>${rows.map(([term, value, note]) => `<div><dt>${term}</dt><dd>${value}</dd><small>${note}</small></div>`).join('')}</dl></div>`;
}


function renderExecutionLedger(candidate) {
  const entries = candidate.calculationTrace.steps.loanDisbursements.entries;
  return `<details class="execution-ledger"><summary>학기별 대출 실행과 계산 순서 ${icon('chevron')}</summary><div><p>대출 실행일은 실제로 대출을 받는 날을 뜻합니다. 아래 날짜는 이번 계획의 예상 일정입니다.</p>${entries.length ? `<ol>${entries.map((entry) => `<li><span>이번 계획의 ${entry.semester}번째 학기 · ${entry.purpose === 'tuition' ? '등록금' : '생활비'} · ${entry.product === 'general' ? '일반 상환' : '취업 후 상환'}</span><strong>${formatMoney(entry.principal, { digits: 1 })}</strong><small>예상 실행일 ${entry.disbursementDate}</small></li>`).join('')}</ol>` : '<p>이번 계획에서 새로 받을 대출은 없습니다.</p>'}<p>등록금은 부족분·중간값·전액 중 시나리오 규칙으로 정합니다. 생활비는 월 부족분과 학기 한도로 정하고, 거치이자와 상환액은 별도로 계산합니다.</p></div></details>`;
}

function renderPolicyBasis(candidate) {
  const repaymentReferences = candidate.policyReferences.filter(
    ({ category }) => category === 'repayment',
  );
  const sources = [...new Map(
    candidate.policyReferences.flatMap(({ sources: items }) => items)
      .map((source) => [source.id, source]),
  ).values()];

  return `<details class="policy-basis"><summary>이 계산에 사용한 정책 기준 ${icon('chevron')}</summary><div><ul>${repaymentReferences.map((reference) => `<li><strong>${reference.id === 'general-interest-and-repayment' ? '일반 상환' : '취업 후 상환'}</strong><span>연 ${reference.values.interest.annualRate}% · ${reference.values.interest.type === 'fixed' ? '고정금리' : '변동금리'} · 효력 ${reference.effectiveFrom} · 확인 ${reference.checkedAt}</span></li>`).join('')}</ul><p>${sources.map((source) => `<a href="${safe(source.url)}" target="_blank" rel="noreferrer">${safe(source.title)} ${icon('external')}</a>`).join('')}</p></div></details>`;
}

export function renderSelectedDetail(state, scenario) {
  const candidate = selectedLoanCandidate(state);
  if (!candidate) return '';
  const loan = scenario.loan;
  const summary = scenario.timeline.summary;
  const baseline = state.baselineScenarios.find(s => s.id === scenario.id);
  const delta = (key) => state.comparison.view === 'changed'
    && Number.isFinite(summary[key]) && Number.isFinite(baseline.timeline.summary[key])
    ? ` · 기본 대비 ${signedMoney(summary[key] - baseline.timeline.summary[key])}` : '';

  return `<section class="selected-detail" aria-labelledby="detail-title">
    <div class="detail-heading"><div><h3 id="detail-title">${safe(scenario.name)}</h3><p>${state.comparison.view === 'baseline' ? '기본 조건' : '그래프와 같은 변경 조건'} · ${safe(scenario.summary)}</p></div>${scenario.custom ? `<div class="custom-actions"><button type="button" class="${quietButton}" data-action="edit-custom" data-id="${scenario.id}">내 시나리오 수정</button><button type="button" class="${quietButton}" data-action="delete-custom" data-id="${scenario.id}">삭제</button></div>` : ''}     <div class="detail-products">${['tuition','living'].map(purpose=>{
      const component=getLoanCompositionComponents(scenario.loanComposition).find(c=>c.purpose===purpose&&c.principal>0);
      return `<span>${purpose==='tuition'?'등록금':'생활비'}: ${!component?'대출 없음':component.product==='general'?'일반 상환':'취업 후 상환(ICL)'}</span>`;
    }).join('')}</div></div>
    ${scenario.custom && scenario.livingLoan.semesters.some(s=>s.limitedByPolicy) ? '<p role="status">누적 대출 한도로 일부 학기 금액이 줄었습니다. 자금 계산 내역에서 실제 반영액을 확인하세요.</p>' : ''}

    ${state.eligibility.completed && candidate.eligibility.missingFields.length?`<p class="missing-information">확인할 정보: ${[...new Set(candidate.eligibility.missingFields.map(missingFieldLabel))].join(', ')} <a href="#eligibility-workflow" data-action="eligibility-edit">정보 입력하기 ↑</a></p>`:''}
    ${renderExemptionSummary(loan)}
    <div class="detail-metrics">
      ${metric('이번 학기 월평균 생활비 여력', moneyOrPending(summary.collegeLiving), '이자·상환 차감 전' + delta('collegeLiving'))}
      ${metric('생활비 보완에 필요한 추가 알바', `월 약 ${Math.round(scenario.monthlyWorkHours)}<small>시간</small>`, `생활비 부족 ${formatMoney(scenario.monthlyLivingGap)} / 월 · 최저시급 단순 환산`)}
      ${metric('졸업 시 예상 대출잔액', moneyOrPending(summary.graduationBalance), '졸업할 때 남아 있는 금액' + delta('graduationBalance'))}
      ${metric('상환 기준기간 월평균 부담', moneyOrPending(summary.careerRepayment), (loan.repayments.incomeContingent ? 'ICL은 연간액의 월평균 환산 · 실제 월 청구액 아님' : '일반 상환 약정 월납입액 기준') + delta('careerRepayment'))}
      ${metric('상환 첫 1년 생활비', moneyOrPending(summary.careerLiving), `현재부터 ${scenario.timeline.repaymentReferenceMonth}~${scenario.timeline.repaymentReferenceMonth+12}개월 · 예상 월소득 − 상환부담` + delta('careerLiving'))}
    </div>
    <p class="tuition-resources">이번 학기 등록금 대출 ${formatMoney(scenario.tuitionFunding.principal)} · 실제 사용할 자기자금 ${formatMoney(scenario.tuitionFunding.contributionPerSemester)} · 남겨두는 자기자금 ${formatMoney(scenario.tuitionFunding.retainedContribution)}. 남겨두는 돈은 생활비에 자동 합산하지 않습니다.</p>
    <p>이번 학기 이자·상환 부담 월평균 ${formatMoney(scenario.currentSemesterPayment / scenario.funding.fundingMonths, {digits:1})}은 별도입니다. 이를 낸 뒤 생활비 여력은 ${formatMoney(scenario.collegeAfterRepayment, {digits:1})}입니다.</p>
    <details class="detail-disclosure" data-detail="loans"><summary>상환 일정과 계산 내역</summary>
    ${renderComposition(candidate)}
    ${renderRecommendationExplanation(candidate, scenario)}
    ${renderRepayment(loan)}
    ${renderExecutionLedger(candidate)}
    </details>
    <details class="detail-disclosure" data-detail="funding"><summary>자금 계산 내역</summary>
    ${renderFundingFormula(state, scenario)}
    <p>이번 학기 생활비 막대 = 현재 월소득 + 생활비 대출의 월 배분. 이자·상환부담은 별도로 확인합니다. 취업 후에는 월소득에서 상환부담을 뺍니다.</p></details>
    <details class="detail-disclosure" data-detail="sources"><summary>계산 가정 및 출처</summary>
    <p>소득·생활비·금리·상환기준소득을 고정합니다. 세금·물가·추가 차입은 예측하지 않습니다. 취업 후 상환의 월 부담은 연간 예상액 ÷ 12이며, 취업 이후 잔액은 연간 결산 시점에 갱신합니다.</p>
    ${renderPolicyBasis(candidate)}
    ${renderSources()}
    </details>
  </section>`;
}

function metric(label, value, note) {
  return `<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
}

function renderExemptionSummary(loan) {
 const e=loan.repayments.incomeContingent?.interestExemption;
 if(!e) return '';
 const label=e.newLoan.status==='applied'?`이번 학기 ICL 이자면제 적용 (${e.newLoan.types.join('·')})`:e.newLoan.status==='unknown'?'이번 학기 ICL: 혜택 정보 미확인 · 면제 미반영 추정':'이번 학기 ICL: 이자면제 비대상';
 return `<div class="exemption-summary"><strong>${label}</strong><p>면제 예상 이자 ${formatMoney(e.exemptedInterest,{digits:1})} · 현재부터 취업 후 10년까지의 계산 범위</p>${e.newLoan.status==='applied'||e.existingLoan==='applied'?`<p>면제 기간: 현재부터 ${e.endMonth===null?'소득 기준 초과 전까지 (현재 소득 가정에서는 계속 면제)':`${e.endMonth}개월 시점 전까지`}. 졸업과 소득 기준 초과 중 늦은 시점으로 추정합니다.</p>`:''}${e.existingLoan?`<p>기존 ICL: ${e.existingLoan==='applied'?'확인한 면제 적용':e.existingLoan==='unknown'?'면제 상태 미확인 · 면제 미반영 추정':'이자면제 비대상'}</p>`:''}<small>입력한 조건에 따른 예상이며 실제 면제 확정·고지일은 한국장학재단에서 확인합니다.</small></div>`;
}
