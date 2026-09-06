import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialState} from '../../src/app/store.js';
import {beginEligibility,updateEligibilityDraft,completeEligibility} from '../../src/app/eligibility-draft.js';
import {calculatePlan} from '../../src/application/calculate-plan.js';
import {applyPlan} from '../../src/app/actions.js';
import {renderLoanOptions} from '../../src/ui/sections/loan-options.js';
const ready=()=>{const s=createInitialState();applyPlan(s,calculatePlan(s.profile,s.stress));return s;};
const fill=s=>{beginEligibility(s);updateEligibilityDraft(s,{studentStatus:'new',supportBracket:'3'});s.eligibility.reviewed=true;};
test('initial general preview exposes no loan cards before qualification submission',()=>{
 const s=ready();assert.equal(s.eligibility.completed,false);
 assert.equal(s.resultSelections.candidateByScenario.balance,'general:general');
 assert.equal(renderLoanOptions(s,s.currentScenarios[1]),'');
});
test('draft changes never update committed profile, loan eligibility or timelines',()=>{
 const s=ready(),profile=structuredClone(s.profile),scenarios=s.currentScenarios;
 beginEligibility(s);updateEligibilityDraft(s,{supportBracket:'10',isMedianIncome130:true,commonEligibility:{NO_DUPLICATE_FUNDING:false}});
 assert.deepEqual(s.profile,profile);assert.equal(s.currentScenarios,scenarios);
 s.eligibility.open=false;beginEligibility(s);assert.equal(s.eligibility.draft.supportBracket,'10');
});
test('missing fields block completion and preserve preview; final confirmation is required',()=>{
 const s=ready();beginEligibility(s);assert.equal(completeEligibility(s),false);
 assert.deepEqual(Object.keys(s.eligibility.errors),['studentStatus','supportBracket','eligibilityReviewed']);
 updateEligibilityDraft(s,{studentStatus:'new',supportBracket:'3'});
 assert.equal(completeEligibility(s),false);assert.equal(s.profile.supportBracket,'');
});
test('completion is allowed even when common requirements are not met; all four cards remain visible',()=>{
 const s=ready();fill(s);assert.equal(completeEligibility(s),true);
 assert.equal(s.eligibility.open,false);assert.equal(s.profile.commonEligibility.NO_DUPLICATE_FUNDING,false);
 applyPlan(s,calculatePlan(s.profile,s.stress));
 const html=renderLoanOptions(s,s.currentScenarios.find(x=>x.id==='balance'));
 assert.equal((html.match(/name="loanCandidate"/g)??[]).length,4);
 assert.equal((html.match(/ disabled/g)??[]).length,4);
 assert.ok(html.includes('중복지원'));assert.ok(!html.includes('현재 입력과 정책 기준을 추가로 확인해야 합니다.'));
});
test('editing invalidates acknowledgment, retains original profile until commit, and preserves new main inputs',()=>{
 const s=ready();fill(s);completeEligibility(s);
 beginEligibility(s);updateEligibilityDraft(s,{supportBracket:'10'});
 assert.equal(s.eligibility.reviewed,false);assert.equal(s.profile.supportBracket,3);
 s.profile.salary=500;s.eligibility.reviewed=true;assert.equal(completeEligibility(s),true);
 assert.equal(s.profile.supportBracket,10);assert.equal(s.profile.salary,500);
});
test('a claimed age exception needs age, but a known failure does not block submitting',()=>{
 const s=ready();fill(s);updateEligibilityDraft(s,{ageGeneralConfirmed:false,enteredByAge55AndContinuouslyEnrolled:true});s.eligibility.reviewed=true;
 assert.equal(completeEligibility(s),false);assert.ok(s.eligibility.errors.age);
 updateEligibilityDraft(s,{age:57});s.eligibility.reviewed=true;assert.equal(completeEligibility(s),true);
});
