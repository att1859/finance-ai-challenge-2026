import { DEFAULT_PROFILE } from '../data/sample-profile.js';
import { LOAN_POLICY_SNAPSHOT } from '../policies/loans/2026.js';

const BOOLEAN_FIELDS = ['creditsConfirmed','isDisabled','isGraduating','schoolCreditRuleMet','isBasicOrNearPoverty','isMultiChildHousehold','isUnmarried','isCareLeaver','isProtectedChild','isMedianIncome130','hasEmergencyLivelihood','enteredByAge55AndContinuouslyEnrolled','qualifyingEmployedUndergraduateProgram','existingExemptionEligible','existingExemptionActive','ageGeneralConfirmed','ageIclUndergraduateConfirmed','ageIclGraduateConfirmed','scoreConfirmed'];
const FIELDS = ['studentStatus','academicLevel','supportBracket','age',...BOOLEAN_FIELDS,'commonEligibility'];
export const ALL_PRODUCT_CONTEXT = {loan:{repayments:{general:{},incomeContingent:{}}}};
export function createEligibilityWorkflow() {
 return {open:false,completed:false,draft:null,reviewed:false,dirty:false,errors:{}};
}
export function beginEligibility(state) {
 const flow=state.eligibility;
 if(!flow.draft) flow.draft=Object.fromEntries(FIELDS.map(key=>[key,structuredClone(state.profile[key] ?? DEFAULT_PROFILE[key])]));
 flow.open=true;
}
export function updateEligibilityDraft(state,patch) {
 beginEligibility(state);
 Object.assign(state.eligibility.draft,patch);
 state.eligibility.reviewed=false;
 state.eligibility.dirty=true;
 for(const name of Object.keys(patch)) delete state.eligibility.errors[name];
}
export function eligibilityRequirements(draft,reviewed) {
 const rows=[
  {name:'studentStatus',valid:['continuing','new','transfer','readmitted'].includes(draft.studentStatus),message:'학적을 선택해 주세요.'},
  {name:'supportBracket',valid:Number.isInteger(Number(draft.supportBracket))&&Number(draft.supportBracket)>=1&&Number(draft.supportBracket)<=10,message:'학자금 지원구간을 선택해 주세요.'},
 ];
 const iclAgeKey=draft.academicLevel==='graduate'?'ageIclGraduateConfirmed':'ageIclUndergraduateConfirmed';
 const needsAge=(draft.ageGeneralConfirmed!==true&&draft.enteredByAge55AndContinuouslyEnrolled===true)||(iclAgeKey==='ageIclUndergraduateConfirmed'&&draft[iclAgeKey]!==true&&draft.qualifyingEmployedUndergraduateProgram===true);
 if(needsAge) rows.push({name:'age',valid:draft.age!==''&&draft.age!=null&&Number.isInteger(Number(draft.age))&&Number(draft.age)>=0&&Number(draft.age)<=100,message:'연령 예외를 확인하려면 현재 만 나이를 입력해 주세요.'});
 rows.push({name:'eligibilityReviewed',valid:reviewed===true,message:'기본값과 체크하지 않은 항목까지 확인한 뒤 확인란에 체크해 주세요.'});
 return rows;
}
export function completeEligibility(state) {
 const flow=state.eligibility;
 const requirements=eligibilityRequirements(flow.draft??{},flow.reviewed);
 flow.errors=Object.fromEntries(requirements.filter(item=>!item.valid).map(item=>[item.name,item.message]));
 if(Object.keys(flow.errors).length) return false;
 const profile={...state.profile,...structuredClone(flow.draft)};
 BOOLEAN_FIELDS.forEach(key=>{profile[key]=profile[key]===true;});
 profile.supportBracket=Number(profile.supportBracket);
 profile.commonEligibility=Object.fromEntries(LOAN_POLICY_SNAPSHOT.commonEligibilityRules.map(key=>[key,profile.commonEligibility?.[key]===true]));
 state.profile=profile;
 flow.draft=null; flow.completed=true; flow.open=false; flow.dirty=false;
 return true;
}
