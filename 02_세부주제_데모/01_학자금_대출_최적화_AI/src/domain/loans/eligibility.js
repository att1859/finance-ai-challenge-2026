const ELIGIBLE = 'eligible';
const CONDITIONAL = 'conditional';
const INELIGIBLE = 'ineligible';
const UNKNOWN = 'unknown';

export const ELIGIBILITY_STATUSES = Object.freeze([
  ELIGIBLE,
  CONDITIONAL,
  INELIGIBLE,
  UNKNOWN,
]);

const NEW_STUDENT_STATUSES = Object.freeze([
  'new',
  'transfer',
  'readmitted',
]);

const unique = (items) => [...new Set(items.filter(Boolean))];

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function knownNumber(value) {
  if (value === '' || value == null || !Number.isFinite(Number(value))) {
    return null;
  }
  return Number(value);
}

function knownBoolean(value) {
  return value === true || value === false ? value : null;
}

function booleanCondition(applicant, field) {
  const value = knownBoolean(applicant[field]);
  return {
    value,
    missingFields: value == null ? [field] : [],
  };
}

function anyBooleanCondition(applicant, fields) {
  const values = fields.map((field) => knownBoolean(applicant[field]));
  if (values.includes(true)) return { value: true, missingFields: [] };
  if (values.every((value) => value === false)) {
    return { value: false, missingFields: [] };
  }
  return {
    value: null,
    missingFields: fields.filter((field) => knownBoolean(applicant[field]) == null),
  };
}

function evaluateSpecialCondition(rule, applicant, policySnapshot) {
  const supportBracket = knownNumber(applicant.supportBracket);

  switch (rule.condition) {
    case 'ENTERED_BY_AGE_55_AND_CONTINUOUSLY_ENROLLED': {
      const age = knownNumber(applicant.age);
      const policy = policyProduct(policySnapshot, 'general').eligibility.age;
      if (age == null) return { value: null, missingFields: ['age'] };
      if (age <= policy.defaultMaximum || age > policy.continuousStudyMaximum) {
        return { value: false, missingFields: [] };
      }
      return booleanCondition(applicant, 'enteredByAge55AndContinuouslyEnrolled');
    }
    case 'QUALIFYING_EMPLOYED_UNDERGRADUATE_PROGRAM': {
      const age = knownNumber(applicant.age);
      const policy = policyProduct(
        policySnapshot,
        'income-contingent',
      ).eligibility.age;
      if (applicant.academicLevel == null) {
        return { value: null, missingFields: ['academicLevel'] };
      }
      if (age == null) return { value: null, missingFields: ['age'] };
      if (
        applicant.academicLevel !== 'undergraduate'
        || age <= policy.undergraduateMaximum
        || age > policy.employedUndergraduateExceptionMaximum
      ) {
        return { value: false, missingFields: [] };
      }
      return booleanCondition(applicant, 'qualifyingEmployedUndergraduateProgram');
    }
    case 'TIER_9_EMERGENCY_OR_MULTI_CHILD_OR_CARE_LEAVER': {
      if (applicant.academicLevel == null) {
        return { value: null, missingFields: ['academicLevel'] };
      }
      if (applicant.academicLevel !== 'undergraduate') {
        return { value: false, missingFields: [] };
      }
      if (supportBracket == null) {
        return { value: null, missingFields: ['supportBracket'] };
      }
      const incomePolicy = policyProduct(
        policySnapshot,
        'income-contingent',
      ).eligibility.incomeBracket;
      if (supportBracket <= incomePolicy.undergraduateLivingMaximum) {
        return { value: false, missingFields: [] };
      }
      const fields = supportBracket
        === incomePolicy.undergraduateLivingEmergencyExceptionBracket
        ? ['hasEmergencyLivelihood', 'isMultiChildHousehold', 'isCareLeaver']
        : ['isMultiChildHousehold', 'isCareLeaver'];
      return anyBooleanCondition(applicant, fields);
    }
    case 'BASIC_OR_NEAR_POVERTY_OR_MULTI_CHILD':
      return anyBooleanCondition(
        applicant,
        ['isBasicOrNearPoverty', 'isMultiChildHousehold'],
      );
    case 'CARE_LEAVER_OR_PROTECTED_CHILD':
      return anyBooleanCondition(
        applicant,
        ['isCareLeaver', 'isProtectedChild'],
      );
    case 'INCOME_TIER_AT_MOST_6_BEFORE_MANDATORY_REPAYMENT': {
      if (supportBracket == null) {
        return { value: null, missingFields: ['supportBracket'] };
      }
      if (supportBracket > rule.maximumSupportBracket) {
        return { value: false, missingFields: [] };
      }
      const started = knownBoolean(applicant.mandatoryRepaymentStarted);
      return {
        value: started == null ? null : !started,
        missingFields: started == null ? ['mandatoryRepaymentStarted'] : [],
      };
    }
    case 'NON_CAPITAL_REGION_UNIVERSITY_AND_INCOME_TIER_AT_MOST_8': {
      if (supportBracket == null) {
        return { value: null, missingFields: ['supportBracket'] };
      }
      if (supportBracket > rule.maximumSupportBracket) {
        return { value: false, missingFields: [] };
      }
      return booleanCondition(applicant, 'isNonCapitalRegionUniversity');
    }
    case 'ANNUAL_INCOME_NOT_ABOVE_THRESHOLD':
      return booleanCondition(
        applicant,
        'annualIncomeNotAboveRepaymentThreshold',
      );
    default:
      return {
        value: null,
        missingFields: [`condition:${rule.condition}`],
      };
  }
}

function effectiveStatus(rule, asOfDate) {
  if (rule.effectiveFrom && asOfDate < rule.effectiveFrom) return 'scheduled';
  if (rule.effectiveTo && asOfDate > rule.effectiveTo) return 'expired';
  return 'active';
}

function evaluateSpecialRule(rule, applicant, asOfDate, policySnapshot) {
  const effective = effectiveStatus(rule, asOfDate);
  const condition = evaluateSpecialCondition(
    rule,
    applicant,
    policySnapshot,
  );
  const conditionStatus = condition.value === true
    ? 'met'
    : condition.value === false
      ? 'not-met'
      : 'unknown';
  const status = effective !== 'active'
    ? effective
    : condition.value === true
      ? 'applied'
      : condition.value === false
        ? 'not-applied'
        : 'conditional';

  return deepFreeze({
    id: rule.id,
    product: rule.product,
    purposes: rule.purposes ?? ['tuition', 'living'],
    condition: rule.condition,
    status,
    effectiveStatus: effective,
    conditionStatus,
    missingFields: condition.missingFields,
    effectiveFrom: rule.effectiveFrom,
    effectiveTo: rule.effectiveTo,
    sourceId: rule.sourceId,
  });
}

function relevantRules(rules, product, purpose) {
  return rules.filter((rule) => (
    rule.product === product
    && (!rule.purposes || rule.purposes.includes(purpose))
  ));
}

function ruleResult(id, category, status, options = {}) {
  return {
    id,
    category,
    status,
    reasonCode: options.reasonCode ?? null,
    missingFields: options.missingFields ?? [],
  };
}

function aggregateEligibilityStatus(statuses) {
  if (statuses.includes(INELIGIBLE)) return INELIGIBLE;
  if (statuses.includes(UNKNOWN)) return UNKNOWN;
  if (statuses.includes(CONDITIONAL)) return CONDITIONAL;
  return ELIGIBLE;
}

function evaluateSnapshot(policySnapshot, asOfDate) {
  const status = effectiveStatus(policySnapshot, asOfDate);
  return status === 'active'
    ? ruleResult('policy-snapshot', 'policy', ELIGIBLE)
    : ruleResult('policy-snapshot', 'policy', UNKNOWN, {
      reasonCode: 'POLICY_SNAPSHOT_NOT_EFFECTIVE',
    });
}

function evaluateCommonEligibility(policySnapshot, applicant) {
  return policySnapshot.commonEligibilityRules.map((id) => {
    const field = `commonEligibility.${id}`;
    const value = knownBoolean(applicant.commonEligibility?.[id]);
    if (value === true) return ruleResult(id, 'common', ELIGIBLE);
    if (value === false) {
      return ruleResult(id, 'common', INELIGIBLE, {
        reasonCode: `${id}_NOT_MET`,
      });
    }
    return ruleResult(id, 'common', UNKNOWN, {
      reasonCode: `${id}_UNCONFIRMED`,
      missingFields: [field],
    });
  });
}

function appliedOverride(overrides, id) {
  return overrides.find((rule) => rule.id === id);
}

function evaluateIncomeBracket({
  applicant,
  eligibilityPolicy,
  eligibilityOverrides,
  product,
  purpose,
}) {
  if (product === 'general') {
    return eligibilityPolicy.incomeBracket[purpose] === 'NO_LIMIT'
      ? ruleResult('income-bracket', 'income-bracket', ELIGIBLE)
      : ruleResult('income-bracket', 'income-bracket', UNKNOWN, {
        reasonCode: 'INCOME_BRACKET_POLICY_UNKNOWN',
      });
  }

  if (purpose === 'tuition') {
    const incomeBracket = eligibilityPolicy.incomeBracket;
    const noLimit = applicant.academicLevel === 'graduate'
      ? incomeBracket.graduateTuition
      : incomeBracket.undergraduateTuition;
    return noLimit === 'NO_LIMIT'
      ? ruleResult('income-bracket', 'income-bracket', ELIGIBLE)
      : ruleResult('income-bracket', 'income-bracket', UNKNOWN, {
        reasonCode: 'INCOME_BRACKET_POLICY_UNKNOWN',
      });
  }

  if (!['undergraduate', 'graduate'].includes(applicant.academicLevel)) {
    return ruleResult('income-bracket', 'income-bracket', UNKNOWN, {
      reasonCode: 'ACADEMIC_LEVEL_REQUIRED',
      missingFields: ['academicLevel'],
    });
  }

  const supportBracket = knownNumber(applicant.supportBracket);
  if (supportBracket == null) {
    return ruleResult('income-bracket', 'income-bracket', UNKNOWN, {
      reasonCode: 'SUPPORT_BRACKET_REQUIRED',
      missingFields: ['supportBracket'],
    });
  }

  if (applicant.academicLevel === 'graduate') {
    const maximum = eligibilityPolicy.incomeBracket.graduateLivingMaximum;
    return supportBracket <= maximum
      ? ruleResult('income-bracket', 'income-bracket', ELIGIBLE)
      : ruleResult('income-bracket', 'income-bracket', INELIGIBLE, {
        reasonCode: 'GRADUATE_LIVING_BRACKET_EXCEEDED',
      });
  }

  const maximum = eligibilityPolicy.incomeBracket.undergraduateLivingMaximum;
  if (supportBracket <= maximum) {
    return ruleResult('income-bracket', 'income-bracket', ELIGIBLE);
  }

  const exception = appliedOverride(
    eligibilityOverrides,
    'icl-living-income-exceptions',
  );
  if (exception?.status === 'applied') {
    return ruleResult('income-bracket', 'income-bracket', ELIGIBLE, {
      reasonCode: 'ICL_LIVING_INCOME_OVERRIDE_APPLIED',
    });
  }
  if (exception?.status === 'conditional') {
    return ruleResult('income-bracket', 'income-bracket', CONDITIONAL, {
      reasonCode: 'ICL_LIVING_INCOME_OVERRIDE_CONFIRMATION_REQUIRED',
      missingFields: exception.missingFields,
    });
  }
  return ruleResult('income-bracket', 'income-bracket', INELIGIBLE, {
    reasonCode: 'UNDERGRADUATE_LIVING_BRACKET_EXCEEDED',
  });
}

function evaluateAge({ applicant, eligibilityPolicy, eligibilityOverrides, product }) {
  const age = knownNumber(applicant.age);
  if (age == null) {
    return ruleResult('age', 'age', UNKNOWN, {
      reasonCode: 'AGE_REQUIRED',
      missingFields: ['age'],
    });
  }

  if (product === 'general') {
    const { defaultMaximum, continuousStudyMaximum } = eligibilityPolicy.age;
    if (age <= defaultMaximum) return ruleResult('age', 'age', ELIGIBLE);
    if (age > continuousStudyMaximum) {
      return ruleResult('age', 'age', INELIGIBLE, {
        reasonCode: 'GENERAL_AGE_LIMIT_EXCEEDED',
      });
    }
    const exception = appliedOverride(
      eligibilityOverrides,
      'general-continuous-study-age',
    );
    if (exception?.status === 'applied') {
      return ruleResult('age', 'age', ELIGIBLE, {
        reasonCode: 'GENERAL_CONTINUOUS_STUDY_AGE_OVERRIDE_APPLIED',
      });
    }
    if (exception?.status === 'conditional') {
      return ruleResult('age', 'age', CONDITIONAL, {
        reasonCode: 'GENERAL_AGE_OVERRIDE_CONFIRMATION_REQUIRED',
        missingFields: exception.missingFields,
      });
    }
    return ruleResult('age', 'age', INELIGIBLE, {
      reasonCode: 'GENERAL_AGE_LIMIT_EXCEEDED',
    });
  }

  if (!['undergraduate', 'graduate'].includes(applicant.academicLevel)) {
    return ruleResult('age', 'age', UNKNOWN, {
      reasonCode: 'ACADEMIC_LEVEL_REQUIRED',
      missingFields: ['academicLevel'],
    });
  }

  if (applicant.academicLevel === 'graduate') {
    return age <= eligibilityPolicy.age.graduateMaximum
      ? ruleResult('age', 'age', ELIGIBLE)
      : ruleResult('age', 'age', INELIGIBLE, {
        reasonCode: 'INCOME_CONTINGENT_GRADUATE_AGE_LIMIT_EXCEEDED',
      });
  }

  if (age <= eligibilityPolicy.age.undergraduateMaximum) {
    return ruleResult('age', 'age', ELIGIBLE);
  }
  if (age > eligibilityPolicy.age.employedUndergraduateExceptionMaximum) {
    return ruleResult('age', 'age', INELIGIBLE, {
      reasonCode: 'INCOME_CONTINGENT_UNDERGRADUATE_AGE_LIMIT_EXCEEDED',
    });
  }

  const exception = appliedOverride(
    eligibilityOverrides,
    'icl-undergraduate-age-45',
  );
  if (exception?.status === 'applied') {
    return ruleResult('age', 'age', ELIGIBLE, {
      reasonCode: 'INCOME_CONTINGENT_EMPLOYED_AGE_OVERRIDE_APPLIED',
    });
  }
  if (exception?.status === 'conditional') {
    return ruleResult('age', 'age', CONDITIONAL, {
      reasonCode: 'INCOME_CONTINGENT_AGE_OVERRIDE_CONFIRMATION_REQUIRED',
      missingFields: exception.missingFields,
    });
  }
  return ruleResult('age', 'age', INELIGIBLE, {
    reasonCode: 'INCOME_CONTINGENT_UNDERGRADUATE_AGE_LIMIT_EXCEEDED',
  });
}

function exemptionCondition(exemptionId, applicant) {
  switch (exemptionId) {
    case 'new-student-group':
      if (applicant.studentStatus == null) {
        return { value: null, missingFields: ['studentStatus'] };
      }
      return {
        value: NEW_STUDENT_STATUSES.includes(applicant.studentStatus),
        missingFields: [],
      };
    case 'disabled-student':
      return booleanCondition(applicant, 'isDisabled');
    case 'graduating-undergraduate':
      if (applicant.academicLevel == null) {
        return { value: null, missingFields: ['academicLevel'] };
      }
      if (applicant.academicLevel !== 'undergraduate') {
        return { value: false, missingFields: [] };
      }
      return booleanCondition(applicant, 'isGraduating');
    case 'graduate-student':
      if (applicant.academicLevel == null) {
        return { value: null, missingFields: ['academicLevel'] };
      }
      return {
        value: applicant.academicLevel === 'graduate',
        missingFields: [],
      };
    default:
      return {
        value: null,
        missingFields: [`academicExemption:${exemptionId}`],
      };
  }
}

function evaluateAcademicExemptions(exemptionIds, applicant) {
  const conditions = exemptionIds.map(
    (exemptionId) => exemptionCondition(exemptionId, applicant),
  );
  if (conditions.some(({ value }) => value === true)) {
    return { value: true, missingFields: [] };
  }
  if (conditions.every(({ value }) => value === false)) {
    return { value: false, missingFields: [] };
  }
  return {
    value: null,
    missingFields: unique(conditions.flatMap(({ missingFields }) => missingFields)),
  };
}

function evaluateAcademicMinimum({
  applicant,
  category,
  exemptionIds,
  field,
  minimum,
}) {
  if (minimum == null) {
    return ruleResult(category, 'academics', ELIGIBLE);
  }

  const exemptions = evaluateAcademicExemptions(exemptionIds, applicant);
  if (exemptions.value === true) {
    return ruleResult(category, 'academics', ELIGIBLE, {
      reasonCode: `${category.toUpperCase()}_EXEMPTION_APPLIED`,
    });
  }

  const value = knownNumber(applicant[field]);
  if (value == null) {
    return ruleResult(category, 'academics', UNKNOWN, {
      reasonCode: `${category.toUpperCase()}_REQUIRED`,
      missingFields: unique([field, ...exemptions.missingFields]),
    });
  }
  if (value >= minimum) return ruleResult(category, 'academics', ELIGIBLE);
  if (exemptions.value == null) {
    return ruleResult(category, 'academics', CONDITIONAL, {
      reasonCode: `${category.toUpperCase()}_EXEMPTION_CONFIRMATION_REQUIRED`,
      missingFields: exemptions.missingFields,
    });
  }
  return ruleResult(category, 'academics', INELIGIBLE, {
    reasonCode: `${category.toUpperCase()}_BELOW_MINIMUM`,
  });
}

function policyProduct(policySnapshot, product) {
  return Object.values(policySnapshot.products)
    .find(({ id }) => id === product);
}

export function evaluateLoanEligibility({
  applicant = {},
  asOfDate,
  policySnapshot,
  product,
  purpose,
}) {
  const productPolicy = policyProduct(policySnapshot, product);
  if (!productPolicy || !['tuition', 'living'].includes(purpose)) {
    throw new RangeError('지원하지 않는 대출상품 또는 자금용도입니다.');
  }

  const evaluatedAt = asOfDate ?? policySnapshot.checkedAt;
  const eligibilityOverrides = relevantRules(
    policySnapshot.eligibilityOverrides,
    product,
    purpose,
  ).map((rule) => evaluateSpecialRule(
    rule,
    applicant,
    evaluatedAt,
    policySnapshot,
  ));
  const interestExemptions = relevantRules(
    policySnapshot.interestExemptions,
    product,
    purpose,
  ).map((rule) => evaluateSpecialRule(
    rule,
    applicant,
    evaluatedAt,
    policySnapshot,
  ));
  const repaymentDeferrals = relevantRules(
    policySnapshot.repaymentDeferrals,
    product,
    purpose,
  ).map((rule) => evaluateSpecialRule(
    rule,
    applicant,
    evaluatedAt,
    policySnapshot,
  ));
  const eligibilityPolicy = productPolicy.eligibility;
  const rules = [
    evaluateSnapshot(policySnapshot, evaluatedAt),
    ...evaluateCommonEligibility(policySnapshot, applicant),
    evaluateIncomeBracket({
      applicant,
      eligibilityPolicy,
      eligibilityOverrides,
      product,
      purpose,
    }),
    evaluateAge({
      applicant,
      eligibilityPolicy,
      eligibilityOverrides,
      product,
    }),
    evaluateAcademicMinimum({
      applicant,
      category: 'score',
      exemptionIds: eligibilityPolicy.academics.scoreExemptions ?? [],
      field: 'previousSemesterScore',
      minimum: eligibilityPolicy.academics.minimumPreviousScore,
    }),
    evaluateAcademicMinimum({
      applicant,
      category: 'credits',
      exemptionIds: eligibilityPolicy.academics.creditExemptions ?? [],
      field: 'previousSemesterCredits',
      minimum: eligibilityPolicy.academics.minimumPreviousCredits,
    }),
  ];
  const status = aggregateEligibilityStatus(
    rules.map((rule) => rule.status),
  );

  return deepFreeze({
    eligibility: {
      status,
      reasonCodes: unique(rules.map(({ reasonCode }) => reasonCode)),
      missingFields: unique(rules.flatMap(({ missingFields }) => missingFields)),
      rules,
      evaluatedAt,
      policyReference: {
        snapshotId: policySnapshot.snapshotId,
        checkedAt: policySnapshot.checkedAt,
      },
    },
    eligibilityOverrides,
    interestExemptions,
    repaymentDeferrals,
  });
}

export function evaluateLoanEligibilityCombinations({
  applicant = {},
  asOfDate,
  policySnapshot,
}) {
  return deepFreeze(policySnapshot.combinationRules.allowedCombinations.map(
    ({ tuitionProduct, livingProduct }) => {
      const tuition = evaluateLoanEligibility({
        applicant,
        asOfDate,
        policySnapshot,
        product: tuitionProduct,
        purpose: 'tuition',
      });
      const living = evaluateLoanEligibility({
        applicant,
        asOfDate,
        policySnapshot,
        product: livingProduct,
        purpose: 'living',
      });
      const status = aggregateEligibilityStatus([
        tuition.eligibility.status,
        living.eligibility.status,
      ]);

      return {
        id: `${tuitionProduct}:${livingProduct}`,
        tuitionProduct,
        livingProduct,
        status,
        reasonCodes: unique([
          ...tuition.eligibility.reasonCodes,
          ...living.eligibility.reasonCodes,
        ]),
        missingFields: unique([
          ...tuition.eligibility.missingFields,
          ...living.eligibility.missingFields,
        ]),
        tuition,
        living,
      };
    },
  ));
}

export function evaluateLoanCompositionEligibility({
  applicant = {},
  asOfDate,
  composition,
  policySnapshot,
}) {
  const evaluateComponent = (component) => deepFreeze({
    ...component,
    ...evaluateLoanEligibility({
      applicant,
      asOfDate,
      policySnapshot,
      product: component.product,
      purpose: component.purpose,
    }),
  });

  return deepFreeze({
    ...composition,
    tuitionComponents: composition.tuitionComponents.map(evaluateComponent),
    livingComponents: composition.livingComponents.map(evaluateComponent),
  });
}
