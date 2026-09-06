import { formatMoney, moneyHtml } from '../formatters/money.js';
const money = moneyHtml;
export function renderFundingFormula(state, scenario) {
  const f = scenario.funding;
  return `<section class="funding-section" aria-labelledby="funding-title"><div class="section-heading compact"><h3 id="funding-title">이번 학기 자금 계산</h3><p>등록금과 생활비는 이번 학기만 계산합니다. 남은 ${f.remainingSemesters}학기는 졸업 시점·거치기간·이자 계산에 사용합니다.</p></div><div class="funding-ledger"><dl>
    <div><dt>실제 납부 등록금</dt><dd>${money(f.educationNeed)}</dd></div>
    <div class="deduct"><dt>등록금에 실제 사용할 자기자금</dt><dd>− ${money(scenario.tuitionFunding.contributionPerSemester)}</dd></div>
    <div><dt>대출로 남겨두는 등록금 자기자금 · 생활비에 미합산</dt><dd>${money(scenario.tuitionFunding.retainedContribution)}</dd></div>
    <div><dt>희망 생활비 · 6개월</dt><dd>${money(f.livingNeed)}</dd></div>
    <div class="deduct"><dt>현재 월소득 · 6개월</dt><dd>− ${money(scenario.currentIncomeTotal)}</dd></div>
    <div class="deduct"><dt>등록금 대출</dt><dd>− ${money(scenario.loanComposition.totals.tuition)}</dd></div>
    <div class="deduct"><dt>생활비 대출</dt><dd>− ${money(scenario.loanComposition.totals.living)}</dd></div>
    <div><dt>이번 학기 이자·상환부담 · 별도</dt><dd> ${money(scenario.currentSemesterPayment, 1)}</dd></div>
    <div class="gap"><dt>알바로 보완할 생활비 부족분 · 6개월</dt><dd>${money(scenario.fundingGap, 1)}</dd></div>
  </dl></div><p>생활비 대출 ${formatMoney(scenario.livingLoan.principal)}을 6개월로 나눠 사용합니다. 이자·상환부담은 생활비 부족분과 분리합니다. 신청 최소액·5만 원 단위·한도 때문에 균형의 생활비가 희망액과 조금 다를 수 있습니다. 부족분을 자동으로 알바 소득에 더하지 않습니다.</p></section>`;
}
