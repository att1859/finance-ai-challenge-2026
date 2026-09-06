import { createInitialState } from '../../src/app/store.js';
import { applyPlan, selectLoanCandidate } from '../../src/app/actions.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNoLoanComparison } from '../../src/domain/funding/no-loan-comparison.js';
import { calculatePlan } from '../../src/application/calculate-plan.js';
import { DEFAULT_PROFILE } from '../../src/data/sample-profile.js';
import { chartAxis } from '../../src/ui/formatters/chart-axis.js';

test('NO 대출은 즉시 필요한 등록금과 생활비 알바를 분리한다', () => {
  const p = { ...DEFAULT_PROFILE, tuitionPerSemester:420, tuitionContributionPerSemester:120, currentMonthlyIncome:50, desiredCollegeSpend:80 };
  const r=calculateNoLoanComparison(p);
  assert.equal(r.collegeLiving,50);
  assert.equal(r.tuitionGap,300);
  assert.equal(r.tuitionFunded,false);
  assert.equal(r.monthlyGap,30);
  assert.equal(r.monthlyHours,300000/10320);
  assert.equal(Math.round(r.monthlyHours),29);
  const enough=calculateNoLoanComparison({...p,currentMonthlyIncome:200});
  assert.equal(enough.monthlyGap,0);
  assert.equal(enough.monthlyHours,0);
  assert.equal(calculateNoLoanComparison({...p,existingLoanBalance:99999}).balance,0);
});

test('남은 학기는 신규 원금을 늘리지 않고 취업후 졸업잔액·일반 거치기간에 반영한다', () => {
  for(const loanType of ['general','income-contingent']) {
    const short=calculatePlan({...DEFAULT_PROFILE,remainingSemesters:1,loanType}).currentScenarios[1];
    const long=calculatePlan({...DEFAULT_PROFILE,remainingSemesters:8,loanType}).currentScenarios[1];
    assert.equal(short.loan.principal,long.loan.principal);
    assert.equal(short.livingLoan.principal,long.livingLoan.principal);
    if(loanType==='general') assert.ok(long.loan.repaymentStartDate>short.loan.repaymentStartDate);
    else assert.ok(long.loan.balanceAtGraduation>short.loan.balanceAtGraduation);
  }
});

test('막대 축은 0·음수·최대값을 모두 포함하고 작은 금액에서도 눈금이 중복되지 않는다', () => {
  for(const values of [[0,0],[.05,.1],[-20,50,80],[10000,9999],[null,NaN]]) {
    const axis=chartAxis(values);
    assert.ok(axis.low<=0 && axis.high>axis.low);
    for(const v of values.filter(Number.isFinite)) assert.ok(v>=axis.low && v<=axis.high);
    assert.equal(new Set(axis.ticks).size,axis.ticks.length);
  }
});

test('400/200 등록금·80/50 생활비 예시를 모든 상품에서 동일한 차입액으로 계산한다', () => {
 for(const loanType of ['general','income-contingent']) {
  const p=calculatePlan({...DEFAULT_PROFILE,tuitionPerSemester:400,tuitionContributionPerSemester:200,desiredCollegeSpend:80,currentMonthlyIncome:50,loanType});
  const [present,balance,future]=p.currentScenarios;
  assert.deepEqual([future,balance,present].map(s=>s.tuitionFunding.principal),[200,300,400]);
  assert.deepEqual([future,balance,present].map(s=>s.livingLoan.principal),[0,180,200]);
  assert.deepEqual([future,balance,present].map(s=>Math.round(s.monthlyWorkHours)),[29,0,0]);
  assert.deepEqual([future,balance,present].map(s=>s.tuitionFunding.contributionPerSemester),[200,100,0]);
  assert.deepEqual([future,balance,present].map(s=>s.tuitionFunding.retainedContribution),[0,100,200]);
  assert.equal(balance.timeline.summary.collegeLiving,80);
  assert.equal(p.currentNoLoanComparison.tuitionGap,200);
  for(const s of p.currentScenarios) {
   assert.equal(s.tuitionFunding.contributionPerSemester+s.tuitionFunding.principal,400);
   assert.equal(s.tuitionFunding.contributionPerSemester+s.tuitionFunding.retainedContribution,200);
   const candidates=p.currentRecommendations.find(r=>r.scenarioId===s.id).candidates;
   assert.ok(candidates.every(c=>c.loanComposition.totals.tuition===s.tuitionFunding.principal));
  }
 }
});
test('등록금 자비 0·전액·등록금 0 경계와 생활비 한도 부족을 구분한다', () => {
 for(const tuition of [0,400]) for(const available of [0,tuition]) {
  const p=calculatePlan({...DEFAULT_PROFILE,tuitionPerSemester:tuition,tuitionContributionPerSemester:available,currentMonthlyIncome:0,desiredCollegeSpend:100});
  const [present,balance,future]=p.currentScenarios;
  assert.equal(future.tuitionFunding.principal,tuition-available);
  assert.equal(balance.tuitionFunding.principal,tuition-available/2);
  assert.equal(present.tuitionFunding.principal,tuition);
  assert.equal(balance.livingLoan.principal,200);
  assert.ok(balance.monthlyWorkHours>0);
 }
});
test('내 시나리오는 복사한 등록금 전략을 유지한다', () => {
 const config={id:'custom-1',name:'복사안',tuitionStrategy:'maximum-use',livingPerSemester:180,graceYears:1,repaymentYears:10,candidateId:'general:general'};
 const s=calculatePlan({...DEFAULT_PROFILE,tuitionPerSemester:400,tuitionContributionPerSemester:200,customScenarios:[config]}).currentScenarios.at(-1);
 assert.equal(s.tuitionFunding.principal,400);
 assert.equal(s.tuitionFunding.retainedContribution,200);
 assert.equal(s.monthlyWorkHours,0);
});


test('상환 기준기간은 일반 원금 상환 시작 뒤이며 상품별 선택이 요약을 바꾼다', () => {
 const profile={...DEFAULT_PROFILE,remainingSemesters:8,tuitionPerSemester:420,tuitionContributionPerSemester:200,currentMonthlyIncome:60,desiredCollegeSpend:80,salary:350};
 const general=calculatePlan({...profile,loanType:'general'}).currentScenarios;
 for(const s of general) {
  assert.equal(s.timeline.repaymentReferenceMonth,60);
  assert.ok(s.timeline.summary.careerRepayment > s.loan.principal*.017/12);
  assert.ok(Math.abs(s.timeline.summary.careerLiving+s.timeline.summary.careerRepayment-350)<1e-8);
 }
 const icl=calculatePlan({...profile,resultSelections:Object.fromEntries(general.map(s=>[s.id,{candidateId:'income-contingent:income-contingent'}]))}).currentScenarios;
 assert.equal(icl[0].timeline.repaymentReferenceMonth,48);
 assert.ok(Math.abs(icl[0].timeline.summary.careerLiving-330.6166666667)<1e-6);
 assert.equal(icl[0].timeline.summary.careerLiving,icl[1].timeline.summary.careerLiving);
 assert.notEqual(icl[0].timeline.summary.graduationBalance,icl[1].timeline.summary.graduationBalance);
 assert.notEqual(icl[1].timeline.summary.careerLiving,general[1].timeline.summary.careerLiving);
 const delayed=calculatePlan({...profile,loanType:'general'},{employmentDelayMonths:24}).currentScenarios[0];
 assert.equal(delayed.timeline.repaymentReferenceMonth,72);
});


test('잔액 그래프는 10년 이후도 해마다 결산하고 각 안의 완납까지 확장한다', () => {
 const plan=calculatePlan({...DEFAULT_PROFILE,loanType:'income-contingent',salary:270,tuitionPerSemester:420,tuitionContributionPerSemester:200,currentMonthlyIncome:60,desiredCollegeSpend:80});
 const [present,balance]=plan.currentScenarios;
 assert.ok(present.timeline.endMonth>168);
 assert.ok(present.timeline.repaymentEndMonth>balance.timeline.repaymentEndMonth);
 for(const s of [present,balance]) {
  assert.equal(s.timeline.rows[s.timeline.repaymentEndMonth].balance,0);
  assert.equal(s.timeline.rows.at(-1).balance,0);
  const start=s.timeline.employmentMonth;
  assert.ok(s.timeline.rows[start+132].balance<s.timeline.rows[start+120].balance);
 }
 const general=calculatePlan({...DEFAULT_PROFILE,loanType:'general'}).currentScenarios[0];
 assert.equal(general.timeline.rows.at(-1).balance,0);
});

test('소득 부족으로 완납하지 못하면 관찰 한도를 명시하고 잔액을 보존한다', () => {
 const s=calculatePlan({...DEFAULT_PROFILE,loanType:'income-contingent',salary:0}).currentScenarios[0];
 assert.equal(s.timeline.projectionLimited,true);
 assert.equal(s.timeline.repaymentEndMonth,null);
 assert.ok(s.timeline.rows.at(-1).balance>0);
 assert.ok(s.timeline.endMonth>=s.timeline.employmentMonth+600);
});


test('첫 결과는 일반+일반으로 시작하고 사용자가 바꾼 상품은 유지한다', () => {
 const state=createInitialState();
 applyPlan(state,calculatePlan(state.profile));
 assert.ok(Object.values(state.resultSelections.candidateByScenario).every(id=>id==='general:general'));
 selectLoanCandidate(state,'balance','income-contingent:income-contingent');
 applyPlan(state,calculatePlan(state.profile));
 assert.equal(state.resultSelections.candidateByScenario.balance,'income-contingent:income-contingent');
 assert.equal(state.resultSelections.candidateByScenario['maximum-use'],'general:general');
});


