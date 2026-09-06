import { selectedLoanCandidate } from '../../app/selectors.js';
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

function safetyCopy(value) {
  return {
    safe: ['상환 후 생활비 충족', '현재 소득 기준으로 상환 후에도 희망 생활비가 남습니다.'],
    watch: ['상환 후 생활비 조정 필요', '상환 후 남는 월소득이 희망 생활비보다 적습니다.'],
    'at-risk': ['상환 후 생활비 주의', '상환 후 남는 월소득이 서비스의 생활비 점검 기준보다 낮습니다.'],
    deficit: ['상환 후 생활비 부족', '월평균으로 비교한 상환부담이 예상 월소득보다 큽니다.'],
    'calculation-impossible': ['계산 불가', '공식 정책값을 확인한 뒤 다시 계산해야 합니다.'],
  }[value];
}

function renderComposition(candidate) {
  const { tuition, living } = candidate.compositionDescription.purposes;
  return `<div class="composition-ledger"><h4>상품·용도별 신규 대출</h4><div class="table-wrap"><table><caption>선택한 신규 대출 구성</caption><thead><tr><th scope="col">용도</th><th scope="col">상품</th><th scope="col">대출액</th><th scope="col">자격 상태</th></tr></thead><tbody>${[tuition, living].map((purpose) => `<tr><th scope="row">${purpose.purposeLabel}</th><td>${purpose.productLabel}</td><td>${formatMoney(purpose.principal, { digits: 1 })}</td><td>${purpose.eligibilityLabel}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function missingFieldLabel(field) {
  if (field.startsWith('commonEligibility.')) return '공통 신청요건';
  return {
    academicLevel: '학부·대학원',
    age: '현재 만 나이',
    studentStatus: '학적 구분',
    previousSemesterScore: '직전학기 성적',
    previousSemesterCredits: '직전학기 이수학점',
    isDisabled: '장애학생 여부',
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
  const workEffect = scenario.livingLoan.principal > 0
    ? scenario.workHoursReduced > 0
      ? `남은 재학기간의 생활비 대출은 총 ${formatMoney(scenario.livingLoan.principal, { digits: 1 })}입니다. 현재보다 주당 ${formatHours(scenario.workHoursReduced)}시간 덜 일할 때의 생활비 부족분을 채웁니다.`
      : `현재 근로시간을 유지해도 부족한 생활비를 채우기 위해, 남은 재학기간에 총 ${formatMoney(scenario.livingLoan.principal, { digits: 1 })}을 빌리는 계산입니다.`
    : scenario.workHoursReduced > 0
      ? `주당 ${formatHours(scenario.workHours)}시간 일할 때의 근로소득으로 희망 생활비를 채웁니다. 생활비 대출 없이 현재보다 주당 ${formatHours(scenario.workHoursReduced)}시간 줄일 수 있습니다.`
      : '생활비 대출 없이 현재 근로시간을 유지하는 계산입니다.';
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
      ? [`현재 대출 선택과 한도를 반영하면 남은 재학기간의 생활비가 총 ${formatMoney(scenario.unmetLivingGap, { digits: 1 })} 부족합니다. 생활비 대출 포함 여부와 처음 입력한 생활비·근로시간을 확인해 주세요.`]
      : []),
  ];

  return `<section class="recommendation-explanation" aria-labelledby="recommendation-reason-title"><div><h4 id="recommendation-reason-title">${title}</h4><p>${workEffect}</p></div><div>
    ${reasons.length ? `<ul class="reason-list">${reasons.map(({ message }) => `<li>${safe(message)}</li>`).join('')}</ul>` : '<p class="reason-empty">다른 구성의 대출액과 상환부담도 함께 비교해 보세요.</p>'}
    ${missing.length ? `<p class="current-value-notice"><strong>추천 전에 확인할 정보</strong> ${safe(missing.join(', '))}. 위의 ‘현재 판정에 필요한 자격 조건’을 열어 입력하면 다시 계산됩니다.</p>` : ''}
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

function renderTenYearComparison(loan) {
  const comparison = loan.currentValueComparison;
  if (!comparison) return '';

  return `<section class="ten-year-ledger" aria-labelledby="ten-year-title"><div><h4 id="ten-year-title">현재 기준 10년 단순 비교</h4><p>취업 시점부터 10년(120개월)을 비교합니다. 소득·생활비·상환기준소득·금리를 현재 값으로 유지하며, 미래의 상승·하락은 예측하지 않습니다.</p></div><dl>
    <div><dt>10년간 납부액</dt><dd>${moneyOrPending(comparison.totalPayment)}</dd><small>이 기간에 갚는 원금과 이자의 합계</small></div>
    <div><dt>10년간 납부이자</dt><dd>${moneyOrPending(comparison.totalInterest)}</dd><small>10년간 납부액에 이미 포함된 이자</small></div>
    <div><dt>10년 말 남은 잔액</dt><dd>${moneyOrPending(comparison.endingBalance)}</dd><small>10년이 지난 뒤에도 갚아야 할 금액</small></div>
  </dl></section>`;
}

function renderExecutionLedger(candidate) {
  const entries = candidate.calculationTrace.steps.loanDisbursements.entries;
  return `<details class="execution-ledger"><summary>학기별 대출 실행과 계산 순서 ${icon('chevron')}</summary><div><p>대출 실행일은 실제로 대출을 받는 날을 뜻합니다. 아래 날짜는 이번 계획의 예상 일정입니다.</p>${entries.length ? `<ol>${entries.map((entry) => `<li><span>이번 계획의 ${entry.semester}번째 학기 · ${entry.purpose === 'tuition' ? '등록금' : '생활비'} · ${entry.product === 'general' ? '일반 상환' : '취업 후 상환'}</span><strong>${formatMoney(entry.principal, { digits: 1 })}</strong><small>예상 실행일 ${entry.disbursementDate}</small></li>`).join('')}</ol>` : '<p>이번 계획에서 새로 받을 대출은 없습니다.</p>'}<p>학비·생활비에서 대출 없이 낼 등록금과 근로소득을 먼저 뺍니다. 부족분에 신청 단위와 한도를 적용해 학기별 대출액을 정하고, 거치이자와 상환액을 계산합니다.</p></div></details>`;
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
  const loan = candidate.loan;
  const safety = safetyCopy(candidate.safety);
  const workReductionNote = scenario.workHoursReduced === 0
    ? '현재 근로시간 유지'
    : `현재보다 주당 ${formatHours(scenario.workHoursReduced)}시간 덜 일할 수 있어요`;

  return `<section class="selected-detail" aria-labelledby="detail-title">
    <div class="detail-heading"><div><h3 id="detail-title">${scenario.name}</h3><p>${scenario.summary}</p></div><span class="safety safety-${candidate.safety}"><b>${safety[0]}</b>${safety[1]}</span></div>
    <div class="detail-metrics">
      ${metric('대학 시절 월 생활비 여력', moneyOrPending(scenario.possibleCollegeSpend), `희망 ${formatMoney(state.profile.desiredCollegeSpend)} 대비 ${signedMoney(scenario.collegeSpendGap)}`)}
      ${metric('시나리오 주당 근로시간', `${formatHours(scenario.workHours)}<small>시간</small>`, workReductionNote)}
      ${metric('신규 대출 원금', moneyOrPending(candidate.loanComposition.totals.combined), '남은 재학기간에 새로 빌리는 총액 · 이자 제외')}
      ${metric('졸업 시 예상 대출잔액', moneyOrPending(loan.balanceAtGraduation), '졸업할 때까지 갚지 않고 남아 있을 금액')}
    </div>
    ${renderComposition(candidate)}
    ${renderRecommendationExplanation(candidate, scenario)}
    ${renderRepayment(loan)}
    ${renderTenYearComparison(loan)}
    ${renderExecutionLedger(candidate)}
    ${renderPolicyBasis(candidate)}
  </section>`;
}

function metric(label, value, note) {
  return `<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
}
