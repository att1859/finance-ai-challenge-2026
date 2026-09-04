import { nonNegative } from '../shared/numbers.js';

const PURPOSES = Object.freeze(['tuition', 'living']);
const UNKNOWN_ELIGIBILITY = Object.freeze({
  status: 'unknown',
  reasonCodes: Object.freeze(['ELIGIBILITY_NOT_EVALUATED']),
});

function productExists(policySnapshot, productId) {
  return Object.values(policySnapshot.products ?? {})
    .some(({ id }) => id === productId);
}

function assertAllowedComposition(policySnapshot, productByPurpose) {
  PURPOSES.forEach((purpose) => {
    if (!productExists(policySnapshot, productByPurpose[purpose])) {
      throw new RangeError(`지원하지 않는 대출상품입니다: ${productByPurpose[purpose]}`);
    }
  });

  const allowed = policySnapshot.combinationRules?.allowedCombinations ?? [];
  const matches = allowed.some((combination) => (
    combination.tuitionProduct === productByPurpose.tuition
    && combination.livingProduct === productByPurpose.living
  ));

  if (!matches) {
    throw new RangeError('정책에서 허용하지 않은 상품·용도 조합입니다.');
  }
}

function addMonths(dateText, months) {
  const [year, month, day] = String(dateText).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, day));
  return date.toISOString().slice(0, 10);
}

function findPolicySourceIds(policySnapshot, product, purpose) {
  const productSupport = product === 'general'
    ? 'general-eligibility'
    : 'income-contingent-eligibility';
  const purposeSupports = purpose === 'tuition'
    ? ['tuition-limits']
    : ['living-limits', 'living-disbursement'];
  const sourceIds = policySnapshot.sources
    .filter(({ supports = [] }) => (
      supports.includes(productSupport)
      || purposeSupports.some((support) => supports.includes(support))
    ))
    .map(({ id }) => id);
  const combinationSourceId = policySnapshot.combinationRules?.sourceId;

  return Object.freeze([
    ...new Set([
      ...sourceIds,
      ...(combinationSourceId ? [combinationSourceId] : []),
    ]),
  ]);
}

function createPolicyReference(policySnapshot, product, purpose) {
  return Object.freeze({
    snapshotId: policySnapshot.snapshotId,
    academicTerm: policySnapshot.academicTerm,
    effectiveFrom: policySnapshot.effectiveFrom,
    effectiveTo: policySnapshot.effectiveTo,
    checkedAt: policySnapshot.checkedAt,
    product,
    purpose,
    sourceIds: findPolicySourceIds(policySnapshot, product, purpose),
  });
}

function buildPurposeComponents({
  policySnapshot,
  principal,
  product,
  purpose,
  semesters,
}) {
  const safePrincipal = nonNegative(principal);
  if (safePrincipal === 0) return Object.freeze([]);

  const equalPrincipal = safePrincipal / semesters;
  const policyReference = createPolicyReference(
    policySnapshot,
    product,
    purpose,
  );

  return Object.freeze(Array.from({ length: semesters }, (_, index) => {
    const allocatedBefore = equalPrincipal * index;
    const componentPrincipal = index === semesters - 1
      ? safePrincipal - allocatedBefore
      : equalPrincipal;
    const semester = index + 1;

    return Object.freeze({
      id: `${product}:${purpose}:${semester}`,
      product,
      purpose,
      principal: componentPrincipal,
      semester,
      disbursementDate: addMonths(policySnapshot.effectiveFrom, index * 6),
      eligibility: UNKNOWN_ELIGIBILITY,
      policyReference,
    });
  }));
}

export function createLoanComposition({
  policySnapshot,
  principalByPurpose,
  productByPurpose,
  semesters,
}) {
  if (!policySnapshot?.snapshotId || !policySnapshot?.effectiveFrom) {
    throw new TypeError('버전형 대출정책 스냅샷이 필요합니다.');
  }

  assertAllowedComposition(policySnapshot, productByPurpose);
  const semesterCount = Math.max(1, Math.round(nonNegative(semesters)));
  const tuitionPrincipal = nonNegative(principalByPurpose?.tuition);
  const livingPrincipal = nonNegative(principalByPurpose?.living);
  const tuitionComponents = buildPurposeComponents({
    policySnapshot,
    principal: tuitionPrincipal,
    product: productByPurpose.tuition,
    purpose: 'tuition',
    semesters: semesterCount,
  });
  const livingComponents = buildPurposeComponents({
    policySnapshot,
    principal: livingPrincipal,
    product: productByPurpose.living,
    purpose: 'living',
    semesters: semesterCount,
  });

  return Object.freeze({
    tuitionComponents,
    livingComponents,
    totals: Object.freeze({
      tuition: tuitionPrincipal,
      living: livingPrincipal,
      combined: tuitionPrincipal + livingPrincipal,
    }),
  });
}

export function getLoanCompositionComponents(composition, filters = {}) {
  const components = [
    ...(composition?.tuitionComponents ?? []),
    ...(composition?.livingComponents ?? []),
  ];

  return components.filter((component) => (
    (!filters.product || component.product === filters.product)
    && (!filters.purpose || component.purpose === filters.purpose)
  ));
}

export function getLoanCompositionPrincipal(composition, filters = {}) {
  return getLoanCompositionComponents(composition, filters)
    .reduce((total, component) => total + nonNegative(component.principal), 0);
}
