function selectSources(policySnapshot, sourceIds) {
  const requested = new Set(sourceIds);
  return policySnapshot.sources
    .filter(({ id }) => requested.has(id))
    .map(({ id, title, url, checkedAt }) => ({ id, title, url, checkedAt }));
}

function reference(policySnapshot, id, category, values, sourceIds) {
  return Object.freeze({
    id,
    category,
    snapshotId: policySnapshot.snapshotId,
    academicTerm: policySnapshot.academicTerm,
    effectiveFrom: policySnapshot.effectiveFrom,
    effectiveTo: policySnapshot.effectiveTo,
    checkedAt: policySnapshot.checkedAt,
    values: Object.freeze(values),
    sources: Object.freeze(selectSources(policySnapshot, sourceIds)),
  });
}

function eligibilityReferences(policySnapshot, loanComposition) {
  const components = [
    ...loanComposition.tuitionComponents,
    ...loanComposition.livingComponents,
  ];
  const combinations = new Map();

  components.forEach((component) => {
    const key = `${component.product}:${component.purpose}`;
    if (!combinations.has(key)) combinations.set(key, component);
  });

  return [...combinations.values()].map((component) => {
    const productPolicy = policySnapshot.products[component.product === 'general'
      ? 'general'
      : 'incomeContingent'];
    return reference(
      policySnapshot,
      `eligibility:${component.product}:${component.purpose}`,
      'eligibility',
      {
        product: component.product,
        purpose: component.purpose,
        incomeBracket: productPolicy.eligibility.incomeBracket,
        age: productPolicy.eligibility.age,
        academics: productPolicy.eligibility.academics,
      },
      component.policyReference.sourceIds,
    );
  });
}

export function buildCalculationPolicyReferences({
  scenario,
  loanComposition,
  loan,
  policySnapshot,
}) {
  const references = [
    reference(
      policySnapshot,
      'tuition-limit',
      'limit',
      policySnapshot.purposes.tuition,
      ['kosaf-overview'],
    ),
    reference(
      policySnapshot,
      'living-limit',
      'limit',
      {
        ...policySnapshot.purposes.living,
        appliedCumulativeLimit: scenario.livingLoan.cumulativeLimit,
      },
      ['kosaf-overview', 'kosaf-living'],
    ),
    ...eligibilityReferences(policySnapshot, loanComposition),
  ];

  if (loan.repayments.general) {
    references.push(reference(
      policySnapshot,
      'general-interest-and-repayment',
      'repayment',
      {
        interest: policySnapshot.products.general.interest,
        repayment: policySnapshot.products.general.repayment,
      },
      ['kosaf-general', 'moe-2026-first-semester'],
    ));
  }

  if (loan.repayments.incomeContingent) {
    references.push(reference(
      policySnapshot,
      'income-contingent-interest-and-repayment',
      'repayment',
      {
        interest: policySnapshot.products.incomeContingent.interest,
        repayment: policySnapshot.products.incomeContingent.repayment,
      },
      ['kosaf-icl', 'kosaf-mandatory-repayment', 'moe-2026-first-semester'],
    ));
  }

  return Object.freeze(references);
}
