import { ICL_EXEMPTION_POLICY as policy } from '../../policies/loans/icl-interest-exemption.js';
export function resolveInterestExemption(profile, executionDate='2026-07-01') {
 const multi=profile.isMultiChildHousehold===false || profile.isUnmarried===false ? false
   : profile.isMultiChildHousehold===true && profile.isUnmarried===true ? true : undefined;
 const rules=[['기초·차상위',profile.isBasicOrNearPoverty,policy.basicAndMultiChildFrom],
 ['다자녀',multi,policy.basicAndMultiChildFrom],['자립지원',profile.isCareLeaver===true||profile.isProtectedChild===true?true:profile.isCareLeaver,policy.careFrom],
 ['중위소득 130% 이하',profile.isMedianIncome130,policy.median130From]];
 const applied=rules.filter(([,value,start])=>value===true&&executionDate>=start);
 return {status:applied.length?'applied':rules.some(([,v,start])=>v==null&&executionDate>=start)?'unknown':'not-applicable',
 types:applied.map(([name])=>name),sourceUrl:policy.sourceUrl,checkedAt:policy.checkedAt};
}
export function buildExemptedBalances(profile, schedule, funding, stress, repaymentPolicy) {
 const employmentMonth=funding.studyMonths+stress.employmentDelayMonths;
 const above=profile.salary*(1-stress.salaryReductionRate)*12>repaymentPolicy.annualGrossIncomeThreshold;
 const endMonth=above?Math.max(funding.studyMonths,employmentMonth):null;
 const existingStatus=profile.existingExemptionEligible===true&&profile.existingExemptionActive===true?'applied'
   :profile.existingExemptionEligible===false||profile.existingExemptionActive===false?'not-applicable':'unknown';
 const parts=schedule.map(item=>({...item,exemption:resolveInterestExemption(profile,item.disbursementDate)}));
 if(profile.existingLoanBalance>0) parts.push({principal:profile.existingLoanBalance,month:0,existing:true,exemption:{status:existingStatus,types:['기존 대출 확인']}});
 const rate=repaymentPolicy.annualRate/100/12;
 const preEmploymentBalances=Array(employmentMonth+1).fill(0);
 let exemptedInterest=0,exemptBalanceAtEmployment=0;
 for(const part of parts) {
  let balance=part.principal;
  for(let month=part.month;month<=employmentMonth;month++) {
   preEmploymentBalances[month]+=balance;
   if(month===funding.studyMonths&&!part.existing) {part.balanceAtGraduation=balance;part.accruedInterest=balance-part.principal;}
   if(month===employmentMonth) {if(part.exemption.status==='applied'&&endMonth===null)exemptBalanceAtEmployment+=balance;break;}
   const interest=balance*rate;
   if(part.exemption.status==='applied'&&(endMonth===null||month<endMonth)) exemptedInterest+=interest;
   else balance+=interest;
  }
 }
 return {schedule:parts.filter(x=>!x.existing),preEmploymentBalances,exemptBalanceAtEmployment,
 exemption:{newLoan:resolveInterestExemption(profile,schedule[0]?.disbursementDate),existingLoan:profile.existingLoanBalance>0?existingStatus:null,
 startMonth:0,endMonth,exemptedInterest,sourceUrl:policy.sourceUrl}};
}
