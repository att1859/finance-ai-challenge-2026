import { escapeHtml as safe } from '../shared/escape-html.js';
import { WORK_TAX_PRESETS } from '../../domain/funding/work-income.js';
import { formatMoney, moneyHtml } from '../formatters/money.js';

const money = moneyHtml;
const formatHours = (value) => Number(value).toLocaleString('ko-KR', {
  maximumFractionDigits: 1,
});

export function renderFundingFormula(state, scenario) {
  const f = scenario.funding;
  const work = scenario.workIncomeBreakdown;
  const holidayCopy = work.weeklyHolidayEligible
    ? `주휴수당 ${formatMoney(work.holidayMonthly, { digits: 1 })}/월 반영`
    : '주휴수당 적용 안 됨';
  return `<section class="funding-section" aria-labelledby="funding-title"><div class="section-heading compact"><h3 id="funding-title">남은 기간이 필요한 금액으로 이렇게 이어집니다.</h3><p>등록금과 희망 생활비에서 근로소득과 신규 대출을 반영한 계산입니다.</p></div>
    <div class="formula-line"><span>${state.profile.graduationYears}년</span><i>× 2</i><span>${f.semesters}학기</span><i>·</i><span>${f.studyMonths}개월</span></div>
    ${scenario.custom ? `<div class="table-wrap"><table><caption>직접 입력한 학기별 생활비 대출 · 만 원</caption><thead><tr><th>학기</th><th>입력액</th><th>계산 반영액</th><th>월 배분액</th></tr></thead><tbody>${scenario.livingLoan.semesters.map(row=>`<tr><th scope="row">${row.semester}학기</th><td>${formatMoney(row.requestedPrincipal)}</td><td>${formatMoney(row.principal)}</td><td>${formatMoney(row.principal / row.monthCount,{digits:1})}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <div class="funding-ledger"><dl>
      <div><dt>실제 납부 등록금</dt><dd>${formatMoney(state.profile.tuitionPerSemester)} × ${f.semesters}학기 <strong>${money(f.educationNeed)}</strong></dd></div>
      <div class="deduct"><dt>대출 없이 낼 등록금</dt><dd>${formatMoney(scenario.tuitionFunding.contributionPerSemester)} × ${f.semesters}학기 <strong>− ${money(scenario.tuitionFunding.contributionPerSemester * f.semesters)}</strong></dd></div>
      <div><dt>희망 생활비</dt><dd>${formatMoney(state.profile.desiredCollegeSpend)} × ${f.studyMonths}개월 <strong>${money(f.livingNeed)}</strong></dd></div>
      <div class="total"><dt>총필요자금</dt><dd><strong>${money(f.totalNeed)}</strong></dd></div>
      <div class="deduct"><dt>${safe(scenario.name)} 예상 실수령 근로소득</dt><dd><span>주당 ${formatHours(scenario.workHours)}시간 · 월 ${formatMoney(scenario.workMonthly, { digits: 1 })} × ${f.studyMonths}개월<small>${holidayCopy} · ${WORK_TAX_PRESETS[work.taxPreset].label}</small></span><strong>− ${money(scenario.workTotal)}</strong></dd></div>
      <div class="deduct"><dt>등록금 대출</dt><dd>− ${money(scenario.loanComposition.totals.tuition)}</dd></div>
      <div class="deduct"><dt>생활비 대출</dt><dd>− ${money(scenario.loanComposition.totals.living)}</dd></div>
      <div class="gap"><dt>아직 채워지지 않은 금액</dt><dd>${money(scenario.fundingGap,1)}</dd></div>
    </dl></div></section>`;
}
