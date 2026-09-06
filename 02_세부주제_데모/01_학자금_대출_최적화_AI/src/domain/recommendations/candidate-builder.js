import { calculateLoan } from '../loans/calculate-loan.js';
import { evaluateLoanCompositionEligibility } from '../loans/eligibility.js';
import { createLoanComposition } from '../loans/loan-composition.js';
import { buildCalculationPolicyReferences } from '../loans/policy-references.js';
import { normalizeStress } from '../scenarios/normalize-stress.js';
import { buildCalculationTrace } from '../scenarios/calculation-trace.js';
import { nonNegative } from '../shared/numbers.js';

const STATUS_PRIORITY = Object.freeze({
  eligible: 0,
  conditional: 1,
  unknown: 2,
  ineligible: 3,
});

function aggregateEligibility(components) {
  const statuses = components.map(({ eligibility }) => eligibility.status);
  const status = statuses.reduce((result, candidate) => (
    STATUS_PRIORITY[candidate] > STATUS_PRIORITY[result] ? candidate : result
  ), 'eligible');

  return Object.freeze({
    status,
    reasonCodes: Object.freeze([
      ...new Set(components.flatMap(({ eligibility }) => eligibility.reasonCodes)),
    ]),
    missingFields: Object.freeze([
      ...new Set(components.flatMap(({ eligibility }) => eligibility.missingFields)),
    ]),
  });
}

function productLabel(product) {
  return product === 'income-contingent' ? '취업 후 상환' : '일반 상환';
}

function calculateSafety(profile, loan, stress) {
  if (!loan.calculationPossible || loan.monthlyBurdenForComparison == null) {
    return Object.freeze({ possibleCareerSpend: null, safety: 'calculation-impossible' });
  }
  const adjustedSalary = nonNegative(profile.salary)
    * (1 - normalizeStress(stress).salaryReductionRate);
  const possibleCareerSpend = adjustedSalary
    - loan.monthlyBurdenForComparison;
  const minimumLivingLine = Math.min(
    180,
    nonNegative(profile.desiredCareerSpend) * 0.72,
  );
  const safety = possibleCareerSpend < 0
    ? 'deficit'
    : possibleCareerSpend < minimumLivingLine
      ? 'at-risk'
      : possibleCareerSpend < nonNegative(profile.desiredCareerSpend)
        ? 'watch'
        : 'safe';

  return Object.freeze({ possibleCareerSpend, safety });
}

export function buildLoanCandidates({
  profile,
  scenario,
  stress = {},
  policySnapshot,
}) {
  const principalByPurpose = {
    tuition: scenario.tuitionFunding.principal,
    living: scenario.livingLoan.principal,
  };
  const principalByPurposeSemester = {
    tuition: Array.from(
      { length: scenario.funding.semesters },
      () => scenario.tuitionFunding.loanPerSemester,
    ),
    living: scenario.livingLoan.semesters.map(({ principal }) => principal),
  };

  return policySnapshot.combinationRules.allowedCombinations.map((products) => {
    const draftComposition = createLoanComposition({
      policySnapshot,
      principalByPurpose,
      principalByPurposeSemester,
      productByPurpose: {
        tuition: products.tuitionProduct,
        living: products.livingProduct,
      },
      semesters: scenario.funding.semesters,
    });
    const loanComposition = evaluateLoanCompositionEligibility({
      applicant: profile,
      composition: draftComposition,
      policySnapshot,
    });
    const components = [
      ...loanComposition.tuitionComponents,
      ...loanComposition.livingComponents,
    ];
    const eligibility = aggregateEligibility(components);
    const loan = calculateLoan(
      profile,
      loanComposition,
      scenario.funding,
      stress,
      policySnapshot,
    );
    const safety = calculateSafety(profile, loan, stress);

    const candidate = {
      id: `${products.tuitionProduct}:${products.livingProduct}`,
      label: `${productLabel(products.tuitionProduct)} 등록금 + ${productLabel(products.livingProduct)} 생활비`,
      tuitionProduct: products.tuitionProduct,
      livingProduct: products.livingProduct,
      loanComposition,
      loan,
      eligibility,
      fundingGoalMet: scenario.unmetLivingGap === 0,
      scenarioGoalMet: scenario.unmetLivingGap === 0,
      possibleCareerSpend: safety.possibleCareerSpend,
      desiredCareerSpend: nonNegative(profile.desiredCareerSpend),
      safety: safety.safety,
      interestExemptionApplied: components.some(({ interestExemptions = [] }) => (
        interestExemptions.some(({ status }) => status === 'applied')
      )),
    };
    const policyReferences = buildCalculationPolicyReferences({
      scenario,
      loanComposition,
      loan,
      policySnapshot,
    });

    return {
      ...candidate,
      policyReferences,
      calculationTrace: buildCalculationTrace({
        profile,
        scenario,
        loanComposition,
        loan,
        policyReferences,
      }),
    };
  });
}
