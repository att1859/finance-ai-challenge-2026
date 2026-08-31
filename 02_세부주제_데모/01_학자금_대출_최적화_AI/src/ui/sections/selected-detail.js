import { INCOME_CONTINGENT_POLICY } from '../../policies/loans/2026.js';
import { formatMoney, moneyHtml, signedMoney } from '../formatters/money.js';

const money = moneyHtml;
const loanTypeLabel = (type) => type === 'income-contingent' ? '취업 후 상환' : '일반 상환';
const formatHours = (value) => Number(value).toLocaleString('ko-KR', {
  maximumFractionDigits: 1,
});

function formatLoanAssumption(assumption) {
  if (typeof assumption === 'string') return assumption;
  if (assumption?.type !== 'income-contingent-formula') return '계산 가정을 확인할 수 없습니다.';
  return '연소득 ' + formatMoney(assumption.annualIncome)
    + '에서 상환기준소득 ' + formatMoney(assumption.annualIncomeThreshold)
    + '을 뺀 금액에 ' + Math.round(assumption.repaymentRate * 100)
    + '%를 적용했습니다.';
}

export function renderSelectedDetail(state, scenario) {
  const loan = scenario.loan;
  const safety = { safe:['여유 있음','입력한 희망 생활비를 충족합니다.'], watch:['조정 필요','희망 생활비보다 낮아 다른 지출과 함께 점검해야 합니다.'], 'at-risk':['주의','상환 뒤 생활비 여력이 안전선보다 낮습니다.'], deficit:['부족','상환액이 예상 소득보다 큽니다.'], 'calculation-impossible':['계산 불가','공식 정책값을 확인한 뒤 다시 계산해야 합니다.'] }[scenario.safety];
  const other = state.currentScenarios.filter((item)=>item.id!==scenario.id);
  const workReductionNote = scenario.workHoursReduced === 0
    ? '현재 근로시간 유지'
    : `현재보다 주당 ${formatHours(scenario.workHoursReduced)}시간 덜 일할 수 있어요`;
  const closestCollege = [...other].sort((a,b)=>Math.abs(a.possibleCollegeSpend-scenario.possibleCollegeSpend)-Math.abs(b.possibleCollegeSpend-scenario.possibleCollegeSpend))[0];
  return `<section class="selected-detail" aria-labelledby="detail-title">
    <div class="detail-heading"><div><h3 id="detail-title">${scenario.name}</h3><p>${scenario.summary}</p></div><span class="safety safety-${scenario.safety}"><b>${safety[0]}</b>${safety[1]}</span></div>
    <div class="detail-metrics">
      ${metric('대학 시절 월 생활비 여력',money(scenario.possibleCollegeSpend,1),`희망 ${formatMoney(state.profile.desiredCollegeSpend)} 대비 ${signedMoney(scenario.collegeSpendGap)}`)}
      ${metric('시나리오 주당 근로시간',`${formatHours(scenario.workHours)}<small>시간</small>`,workReductionNote)}
      ${metric('상환 후 월 생활비 여력',money(scenario.possibleCareerSpend,1),`희망 ${formatMoney(state.profile.desiredCareerSpend)} 대비 ${signedMoney(scenario.careerSpendGap)}`)}
      ${metric('졸업 시 예상 대출잔액',money(loan.balanceAtGraduation,1),`신규 원금 ${formatMoney(scenario.newLoan,1)}`)}
    </div>
    <div class="loan-detail">
      <div><h4>${loanTypeLabel(state.profile.loanType)} · ${state.profile.loanType==='general'?'정해진 기간에 갚는 예상 상환액':'소득에 따라 달라지는 예상 의무상환액'}</h4></div>
      <dl>${state.profile.loanType==='general'?`
        <div><dt>첫 달 납입액</dt><dd>${money(loan.firstMonthPayment,1)}</dd></div>
        <div><dt>월평균 납입액</dt><dd>${money(loan.monthlyEquivalent,1)}</dd></div>
        <div><dt>예상 총이자</dt><dd>${money(loan.totalInterest,1)}</dd></div>
        <div><dt>취업 첫해 예상상환액</dt><dd>${money(loan.firstYearRepayment,1)}</dd></div>`:`
        <div><dt>연간 예상 의무상환액</dt><dd>${money(loan.annualMandatoryRepayment,1)}</dd></div>
        <div><dt>월 환산 참고값</dt><dd>${money(loan.monthlyEquivalent,1)}</dd></div>
        <div><dt>적용 상환기준소득</dt><dd>${money(INCOME_CONTINGENT_POLICY.annualIncomeThreshold)}</dd></div>
        <div><dt>취업 첫해 말 예상잔액</dt><dd>${money(loan.projectedBalance,1)}</dd></div>`}</dl>
      <ul>${loan.assumptions.map((item)=>`<li>${formatLoanAssumption(item)}</li>`).join('')}</ul>
    </div>
    <p class="comparison-note"><strong>${scenario.name}을 고르면</strong> ${state.profile.loanType==='general'?`월평균 ${formatMoney(loan.monthlyEquivalent,{digits:1})}을 상환합니다.`:`연간 ${formatMoney(loan.annualMandatoryRepayment,{digits:1})}의 의무상환액이 예상됩니다.`} ${closestCollege.name}과 비교해 대학 생활비 여력은 ${signedMoney(scenario.possibleCollegeSpend-closestCollege.possibleCollegeSpend)} 차이입니다.</p>
  </section>`;
}

function metric(label,value,note){return `<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;}
