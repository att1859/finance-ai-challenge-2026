import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLoanEligibility } from '../../src/domain/loans/eligibility.js';
import { LOAN_POLICY_SNAPSHOT as policy } from '../../src/policies/loans/2026.js';
import { resolveInterestExemption, buildExemptedBalances } from '../../src/domain/loans/interest-exemption.js';
const base = {academicLevel:'undergraduate',studentStatus:'continuing',ageGeneralConfirmed:true,ageIclUndergraduateConfirmed:true,scoreConfirmed:true,creditsConfirmed:true,isDisabled:false,isGraduating:false,schoolCreditRuleMet:false,supportBracket:3,commonEligibility:Object.fromEntries(policy.commonEligibilityRules.map(id=>[id,true]))};
const check=(changes={},product='general')=>evaluateLoanEligibility({applicant:{...base,...changes},policySnapshot:policy,product,purpose:'tuition'}).eligibility;
test('threshold confirmations work without invented numeric age score credits',()=>assert.equal(check().status,'eligible'));
test('new transfer and readmitted applicants need no academic confirmations',()=>{
 for(const studentStatus of ['new','transfer','readmitted']) assert.equal(check({studentStatus,scoreConfirmed:undefined,creditsConfirmed:undefined}).status,'eligible');
});
test('failed credits are distinct from unknown and graduation disability or school exceptions apply',()=>{
 assert.notEqual(check({creditsConfirmed:undefined}).status,'eligible');
 assert.equal(check({creditsConfirmed:false}).status,'ineligible');
 for(const exception of ['isGraduating','isDisabled','schoolCreditRuleMet']) assert.equal(check({creditsConfirmed:false,[exception]:true}).status,'eligible');
});
test('ICL never requires score confirmation and general age confirmation does not confirm ICL age',()=>{
 assert.equal(check({scoreConfirmed:undefined},'income-contingent').status,'eligible');
 assert.notEqual(check({ageIclUndergraduateConfirmed:undefined},'income-contingent').status,'eligible');
});
const noBenefits={isBasicOrNearPoverty:false,isMultiChildHousehold:false,isCareLeaver:false,isMedianIncome130:false};
test('support bracket alone never establishes interest exemption',()=>{
 assert.equal(resolveInterestExemption({supportBracket:1}).status,'unknown');
 assert.equal(resolveInterestExemption({...noBenefits,supportBracket:1}).status,'not-applicable');
});
test('policy effective dates and unmarried multi-child condition are respected',()=>{
 assert.equal(resolveInterestExemption({...noBenefits,isMedianIncome130:true},'2026-06-30').status,'not-applicable');
 assert.equal(resolveInterestExemption({...noBenefits,isMedianIncome130:true},'2026-07-01').status,'applied');
 assert.equal(resolveInterestExemption({...noBenefits,isCareLeaver:true},'2026-05-11').status,'not-applicable');
 assert.equal(resolveInterestExemption({...noBenefits,isCareLeaver:true},'2026-05-12').status,'applied');
 assert.equal(resolveInterestExemption({...noBenefits,isMultiChildHousehold:true,isUnmarried:false}).status,'not-applicable');
 assert.equal(resolveInterestExemption({...noBenefits,isMultiChildHousehold:true,isUnmarried:true}).status,'applied');
});
const balances=(overrides={},delay=0)=>buildExemptedBalances({salary:300,...noBenefits,...overrides},[{principal:400,month:0,disbursementDate:'2026-09-01'}],{studyMonths:48},{employmentDelayMonths:delay,salaryReductionRate:0},{annualRate:1.7,annualGrossIncomeThreshold:2000});
test('confirmed exemption covers study and employment delay while unknown accrues interest',()=>{
 const normal=balances(), exempt=balances({isMedianIncome130:true},12);
 assert.ok(normal.preEmploymentBalances[48]>400);
 assert.equal(exempt.preEmploymentBalances[60],400);
 assert.equal(exempt.exemption.endMonth,60);
 assert.ok(exempt.exemption.exemptedInterest>0);
 assert.equal(exempt.exemptBalanceAtEmployment,0);
});
test('below-threshold income preserves exempt balance in long term projection',()=>{
 const result=balances({isMedianIncome130:true,salary:100});
 assert.equal(result.exemption.endMonth,null);
 assert.equal(result.exemptBalanceAtEmployment,400);
});
test('existing loans require separate confirmation even when new loans are exempt',()=>{
 const unknown=balances({isMedianIncome130:true,existingLoanBalance:100});
 assert.ok(unknown.preEmploymentBalances[48]>500);
 assert.equal(unknown.exemption.existingLoan,'unknown');
 const confirmed=balances({isMedianIncome130:true,existingLoanBalance:100,existingExemptionEligible:true,existingExemptionActive:true});
 assert.equal(confirmed.preEmploymentBalances[48],500);
});
