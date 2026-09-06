import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScenario } from '../../src/domain/scenarios/calculate-scenario.js';
import { buildScenarioTimeline } from '../../src/domain/scenarios/timeline.js';
import { SCENARIO_DEFINITIONS } from '../../src/domain/scenarios/definitions.js';
import { SAMPLE_PROFILE } from '../../src/data/sample-profile.js';
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7, `${a} != ${b}`);
const run = (profile={},stress={}) => {
 const s=calculateScenario({...SAMPLE_PROFILE,...profile},SCENARIO_DEFINITIONS[1],stress);
 return {s,t:buildScenarioTimeline(s,168)};
};
test('월 원장은 기존 재학 평균·졸업 잔액·일반 납입을 보존한다',()=>{
 const {s,t}=run({loanType:'general'});
 near(t.summary.collegeLiving,s.possibleCollegeSpend);
 near(t.rows[48].balance,s.loan.balanceAtGraduation);
 for(const row of t.rows) near(row.repayment,s.loan.monthlyRepaymentSchedule.find(r=>r.globalMonth===row.month)?.totalPayment??0);
 const rows=t.rows.slice(48,168);
 near(rows.reduce((sum,r)=>sum+r.repayment,0),s.loan.currentValueComparison.totalPayment);
 near(t.rows[168].balance,s.loan.currentValueComparison.endingBalance);
});
test('취업 지연·초봉 감소를 함께 적용해도 관찰 기간과 일반 약정은 유지한다',()=>{
 const base=run({loanType:'general'});
 const changed=run({loanType:'general'},{employmentDelayMonths:12,salaryReductionRate:.2});
 assert.equal(base.t.endMonth,changed.t.endMonth);
 assert.equal(changed.t.employmentMonth,60);
 for(let m=48;m<60;m++) near(changed.t.rows[m].living,-changed.t.rows[m].repayment);
 for(let m=0;m<168;m++) near(base.t.rows[m].repayment,changed.t.rows[m].repayment);
 near(changed.t.rows[60].living,240-changed.t.rows[60].repayment);
});
test('취업후 연간 결산과 월평균 부담은 기존 10년 원장과 일치한다',()=>{
 for(const stress of [{},{employmentDelayMonths:6},{salaryReductionRate:.2},{employmentDelayMonths:12,salaryReductionRate:.2}]) {
  const {s,t}=run({loanType:'income-contingent'},stress);
  const start=t.employmentMonth;
  near(t.rows[start].balance,s.loan.repayments.incomeContingent.balanceAtEmployment);
  for(let year=0;year<9;year++) {
   const r=s.loan.currentValueComparison.incomeContingent.annualSchedule[year];
   near(t.rows[start+year*12].repayment,r.mandatoryRepayment/12);
   near(t.rows[start+(year+1)*12].balance,r.closingBalance);
  }
 }
});
test('무대출·무소득·음수 생활비·계산 불가를 구분한다',()=>{
 const zero=run({tuitionPerSemester:0,desiredCollegeSpend:0,existingLoanBalance:0,loanType:'general',salary:0});
 assert.ok(zero.t.rows.every(r=>r.balance===0&&r.repayment===0));
 const deficit=run({salary:0,loanType:'general'});
 assert.ok(deficit.t.rows.some(r=>r.living<0));
 const impossible=buildScenarioTimeline({...deficit.s,calculationPossible:false},168);
 assert.ok(impossible.rows.every(r=>r.balance===null&&r.living===null&&r.repayment===null));
 const unpaid=run({salary:0,loanType:'income-contingent'});
 assert.ok(unpaid.t.rows[168].balance>unpaid.t.rows[48].balance);
});
