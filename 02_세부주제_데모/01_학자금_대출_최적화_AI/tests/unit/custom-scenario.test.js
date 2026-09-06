import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLivingAmount, validateCustomScenario, stepLivingAmount } from '../../src/domain/scenarios/custom-scenario.js';
import { calculatePlan } from '../../src/application/calculate-plan.js';
import { SAMPLE_PROFILE } from '../../src/data/sample-profile.js';
import { selectableMonths, nearestMonth, moveSelectedMonth } from '../../src/app/chart-selection.js';
import { applyPlan } from '../../src/app/actions.js';
import { createInitialState } from '../../src/app/store.js';
const config = {id:'custom-1',name:'내 계획',workHours:10,livingPerSemester:100,livingBySemester:null,graceYears:0,repaymentYears:5,candidateId:'general:general'};
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('직접 입력은 대출 없음과 공식 최소·5만원·학기 한도를 검증한다',()=>{
 for(const value of [0,10,15,125,200]) assert.equal(validateLivingAmount(value),null);
 for(const value of ['',-5,5,11,123,201,205,NaN]) assert.ok(validateLivingAmount(value));
 assert.equal(stepLivingAmount(0,1),10);
 assert.equal(stepLivingAmount(10,-1),0);
 assert.equal(stepLivingAmount(125,1),130);
 assert.equal(stepLivingAmount(125,-1),120);
 assert.equal(stepLivingAmount(200,1),200);
 assert.ok(validateCustomScenario({...config,livingBySemester:['']},SAMPLE_PROFILE,8)['semester-0']);
});
test('학기별 직접 입력은 실행분·생활비 월배분·상환 원금에 같은 금액으로 연결된다',()=>{
 const amounts=[0,10,100,125,200,50,75,150];
 const p=calculatePlan({...SAMPLE_PROFILE,customScenarios:[{...config,livingBySemester:amounts}]},{employmentDelayMonths:6,salaryReductionRate:.2});
 const base=p.baselineScenarios.at(-1), changed=p.currentScenarios.at(-1);
 assert.equal(base.workHours,10); assert.equal(changed.workHours,10);
 assert.deepEqual(base.livingLoan.semesters.map(s=>s.principal),amounts);
 assert.deepEqual(changed.livingLoan.semesters.map(s=>s.principal),amounts);
 assert.equal(base.loanComposition.totals.living,710);
 near(base.loanComposition.livingComponents.reduce((sum,c)=>sum+c.principal,0),710);
 for(let m=0;m<48;m++) near(base.timeline.rows[m].living+base.timeline.rows[m].repayment,base.workMonthly+amounts[Math.floor(m/6)]/6);
 assert.equal(changed.timeline.employmentMonth,54);
});
test('사용자별 상환기간과 상품은 독립적으로 유지되고 추천 자동선택으로 덮이지 않는다',()=>{
 const p=calculatePlan({...SAMPLE_PROFILE,supportBracket:10,customScenarios:[{...config,candidateId:'income-contingent:income-contingent'}, {...config,id:'custom-2',graceYears:2,repaymentYears:10}]});
 const first=p.currentScenarios.at(-2),second=p.currentScenarios.at(-1);
 assert.ok(first.loan.repayments.incomeContingent);
 assert.ok(second.loan.repayments.general);
 const state=createInitialState();
 state.customScenarios=[config];
 state.resultSelections.candidateByScenario['custom-1']='income-contingent:income-contingent';
 applyPlan(state,p);
 assert.equal(state.resultSelections.candidateByScenario['custom-1'],'income-contingent:income-contingent');
});
test('졸업 지연 시 추가 학기 기본금액과 누적 한도 조정을 명시한다',()=>{
 const p=calculatePlan({...SAMPLE_PROFILE,customScenarios:[{...config,livingPerSemester:200}]},{graduationDelayMonths:12});
 const s=p.currentScenarios.at(-1);
 assert.equal(s.livingLoan.semesters.length,10);
 assert.equal(s.livingLoan.principal,Math.min(2000,s.livingLoan.cumulativeLimit));
 if(s.livingLoan.cumulativeLimit<2000) assert.ok(s.livingLoan.semesters.some(row=>row.limitedByPolicy));
});
test('조회 점은 학기·졸업·취업·상환 시점으로 이동하며 범위 밖으로 나가지 않는다',()=>{
 const p=calculatePlan({...SAMPLE_PROFILE,customScenarios:[config]},{employmentDelayMonths:6});
 const months=selectableMonths({...p,comparison:{ids:['balance','custom-1']}});
 assert.ok(months.includes(6)); assert.ok(months.includes(48)); assert.ok(months.includes(54));
 assert.equal(nearestMonth(months,-20),0);
 assert.equal(moveSelectedMonth(months,0,-1),0);
 assert.equal(moveSelectedMonth(months,0,1),6);
 assert.equal(moveSelectedMonth(months,months.at(-1),1),months.at(-1));
});

