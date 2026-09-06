const PRODUCT_LABELS = Object.freeze({
  general: '일반 상환',
  'income-contingent': '취업 후 상환',
});

const STATUS_LABELS = Object.freeze({
  eligible: '현재 입력 기준 가능',
  conditional: '조건 확인 필요',
  unknown: '정보 확인 필요',
  ineligible: '현재 입력 기준 불가',
  'not-applicable': '대출 없음',
});

export const LOAN_REASON_MESSAGES = Object.freeze({
  ICL_INTEREST_EXEMPTION: '입력한 조건에서 취업 후 상환 이자면제 규칙이 적용됩니다.',
  LOW_INITIAL_MANDATORY_PAYMENT: '입력한 취업 후 소득을 기준으로 첫해 의무상환 부담을 비교했습니다.',
  GENERAL_PAYMENT_AFFORDABLE: '일반 상환 월 납입 후에도 희망 생활비를 지킬 수 있습니다.',
  LOWER_TEN_YEAR_BURDEN: '자격·생활비 충족·상환 여건이 비슷한 구성 중, 10년 납부액·남은 잔액·초기 상환부담을 함께 비교해 고른 후보입니다.',
  RESIDUAL_BALANCE_WARNING: '10년 뒤에도 취업 후 상환 잔액이 남을 수 있습니다.',
  ELIGIBILITY_CONFIRMATION_REQUIRED: '추천을 확정하려면 자격 조건을 추가로 확인해야 합니다.',
  UNDERGRADUATE_LIVING_BRACKET_EXCEEDED: '취업 후 상환 생활비 대출의 학부 지원구간 기준을 넘습니다.',
  GRADUATE_LIVING_BRACKET_EXCEEDED: '취업 후 상환 생활비 대출의 대학원 지원구간 기준을 넘습니다.',
  GENERAL_AGE_LIMIT_EXCEEDED: '일반 상환 대출의 연령 기준을 충족하지 않습니다.',
  INCOME_CONTINGENT_UNDERGRADUATE_AGE_LIMIT_EXCEEDED: '취업 후 상환 학부 대출의 연령 기준을 충족하지 않습니다.',
  INCOME_CONTINGENT_GRADUATE_AGE_LIMIT_EXCEEDED: '취업 후 상환 대학원 대출의 연령 기준을 충족하지 않습니다.',
  AGE_CRITERION_NOT_MET: '해당 상품의 연령 기준을 충족하지 않는 것으로 확인했습니다.',
  SUPPORTED_INSTITUTION_NOT_MET: '지원 대상 대학 요건을 충족하지 않는 것으로 확인했습니다.',
  NATIONALITY_OR_ALLOWED_DOMESTIC_RESIDENCY_NOT_MET: '국적·국내 거주 요건을 충족하지 않는 것으로 확인했습니다.',
  NO_DUPLICATE_FUNDING_NOT_MET: '등록금 범위를 초과하는 중복지원이 없는지 확인이 필요합니다.',
  NO_RESTRICTED_INSTITUTION_NOT_MET: '학자금 지원 제한 대학에 해당하지 않는다는 요건을 충족하지 않습니다.',
  NO_FALSE_INFORMATION_NOT_MET: '허위 정보·부실 자료가 없다는 요건을 충족하지 않습니다.',
  NO_UNRETURNED_TUITION_DIFFERENCE_NOT_MET: '반환하지 않은 등록금 대출 차액이 없다는 요건을 충족하지 않습니다.',
  NO_FINANCIAL_TRANSACTION_BLOCK_NOT_MET: '금융거래 제한 사유가 없다는 요건을 충족하지 않습니다.',
  SCORE_BELOW_MINIMUM: '직전학기 성적 기준을 충족하지 않습니다.',
  CREDITS_BELOW_MINIMUM: '직전학기 이수학점 기준을 충족하지 않습니다.',
});

function aggregatePurposeEligibility(components) {
  if (components.length === 0) return 'not-applicable';
  const statuses = components.map(({ eligibility }) => eligibility.status);
  if (statuses.includes('ineligible')) return 'ineligible';
  if (statuses.includes('unknown')) return 'unknown';
  if (statuses.includes('conditional')) return 'conditional';
  return 'eligible';
}

function describePurpose(candidate, purpose) {
  const components = candidate.loanComposition[`${purpose}Components`];
  const product = candidate[`${purpose}Product`];
  const eligibilityStatus = aggregatePurposeEligibility(components);

  return Object.freeze({
    purpose,
    purposeLabel: purpose === 'tuition' ? '등록금' : '생활비',
    product,
    productLabel: PRODUCT_LABELS[product],
    principal: candidate.loanComposition.totals[purpose],
    eligibilityStatus,
    eligibilityLabel: STATUS_LABELS[eligibilityStatus],
    missingFields: Object.freeze([
      ...new Set(components.flatMap(({ eligibility }) => eligibility.missingFields)),
    ]),
    policyReferenceIds: Object.freeze([
      ...new Set(components.map(
        (component) => `eligibility:${component.product}:${component.purpose}`,
      )),
    ]),
  });
}

function reasonItems(codes) {
  return Object.freeze([...new Set(codes)].map((code) => Object.freeze({
    code,
    message: LOAN_REASON_MESSAGES[code]
      ?? '현재 입력과 정책 기준을 추가로 확인해야 합니다.',
  })));
}

export function createLoanCompositionDescription(candidate) {
  const recommendationState = candidate.isRecommended
    ? 'recommended'
    : candidate.isPendingConfirmation
      ? 'confirmation-required'
      : candidate.eligibility.status === 'ineligible'
        ? 'excluded'
        : 'alternative';

  return Object.freeze({
    label: candidate.label,
    recommendationState,
    eligibilityStatus: candidate.eligibility.status,
    eligibilityLabel: STATUS_LABELS[candidate.eligibility.status],
    purposes: Object.freeze({
      tuition: describePurpose(candidate, 'tuition'),
      living: describePurpose(candidate, 'living'),
    }),
    reasons: reasonItems(candidate.reasonCodes ?? []),
    warnings: reasonItems(candidate.warningCodes ?? []),
    exclusionReasons: reasonItems(candidate.eligibility.status === 'ineligible'
      ? [...candidate.loanComposition.tuitionComponents,...candidate.loanComposition.livingComponents].flatMap(component=>(component.eligibility.rules??[]).filter(rule=>rule.status==='ineligible').map(rule=>rule.reasonCode)).filter(Boolean)
      : candidate.exclusionReasonCodes ?? []),
    policyReferences: candidate.policyReferences,
  });
}
