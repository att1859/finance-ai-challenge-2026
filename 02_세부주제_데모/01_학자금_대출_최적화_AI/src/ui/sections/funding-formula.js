import { formatMoney, moneyHtml } from '../formatters/money.js';

const money = moneyHtml;

export function renderFundingFormula(state, scenario) {
  const f = scenario.funding;
  return `<section class="funding-section" aria-labelledby="funding-title"><div class="section-heading compact"><h3 id="funding-title">남은 기간이 필요한 금액으로 이렇게 이어집니다.</h3><p>지원사업 후보 금액은 포함하지 않았고, 입력한 확정 금액만 반영했습니다.</p></div>
    <div class="formula-line"><span>${state.profile.graduationYears}년</span><i>× 2</i><span>${f.semesters}학기</span><i>·</i><span>${f.studyMonths}개월</span></div>
    <div class="funding-ledger"><dl>
      <div><dt>등록금</dt><dd>${formatMoney(state.profile.tuitionPerSemester)} × ${f.semesters}학기 <strong>${money(f.educationNeed)}</strong></dd></div>
      <div><dt>희망 생활비</dt><dd>${formatMoney(state.profile.desiredCollegeSpend)} × ${f.studyMonths}개월 <strong>${money(f.livingNeed)}</strong></dd></div>
      <div class="total"><dt>총필요자금</dt><dd><strong>${money(f.totalNeed)}</strong></dd></div>
      <div class="deduct"><dt>확정 생활비성 지원금</dt><dd>− ${money(f.confirmedLivingGrantTotal)}</dd></div>
      <div class="deduct"><dt>${scenario.name} 근로소득</dt><dd>− ${money(scenario.workTotal)}</dd></div>
      <div class="deduct"><dt>신규 대출</dt><dd>− ${money(scenario.newLoan)}</dd></div>
      <div class="gap"><dt>아직 채워지지 않은 금액</dt><dd>${money(scenario.fundingGap,1)}</dd></div>
    </dl></div></section>`;
}
