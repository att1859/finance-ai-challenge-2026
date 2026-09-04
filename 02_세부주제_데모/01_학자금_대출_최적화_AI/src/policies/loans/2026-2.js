const CHECKED_AT = '2026-09-01';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

export const LOAN_POLICY_SNAPSHOT = deepFreeze({
  snapshotId: 'kosaf-2026-2',
  academicTerm: '2026-2',
  effectiveFrom: '2026-07-01',
  effectiveTo: '2026-12-31',
  checkedAt: CHECKED_AT,
  units: {
    money: 'KRW_10K',
    annualRate: 'percent',
  },
  sources: [
    {
      id: 'kosaf-overview',
      title: '한눈에 보는 학자금대출',
      url: 'https://www.kosaf.go.kr/ko/tuition.do?pg=tuition02',
      checkedAt: CHECKED_AT,
      supports: ['product-eligibility', 'tuition-limits', 'living-limits'],
    },
    {
      id: 'kosaf-icl',
      title: '취업 후 상환 학자금대출',
      url: 'https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_01_01&ttab1=1',
      checkedAt: CHECKED_AT,
      supports: ['income-contingent-eligibility', 'income-contingent-exemptions'],
    },
    {
      id: 'kosaf-general',
      title: '일반 상환 학자금대출',
      url: 'https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_02_01&ttab1=1',
      checkedAt: CHECKED_AT,
      supports: ['general-eligibility', 'general-repayment'],
    },
    {
      id: 'kosaf-living',
      title: '생활비대출',
      url: 'https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_04_02',
      checkedAt: CHECKED_AT,
      supports: ['living-disbursement', 'living-cumulative-limits', 'second-semester-rate'],
    },
    {
      id: 'kosaf-conversion',
      title: '취업 후 상환 학자금 전환대출',
      url: 'https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_05_01',
      checkedAt: CHECKED_AT,
      supports: ['component-level-conversion', 'mixed-product-composition'],
    },
    {
      id: 'kosaf-mandatory-repayment',
      title: '취업 후 상환 학자금대출 의무적상환',
      url: 'https://www.kosaf.go.kr/ko/tuition.do?pg=tuition05_01_03',
      checkedAt: CHECKED_AT,
      supports: ['repayment-rates', 'minimum-mandatory-repayment'],
    },
    {
      id: 'moe-2026-first-semester',
      title: '2026학년도 1학기 학자금대출 신청 안내',
      url: 'https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=105052&lev=0&m=020402&opType=N&page=1&s=moe&searchType=null&statusYN=W&temp=Y',
      checkedAt: CHECKED_AT,
      supports: ['2026-income-threshold', 'product-rate-types', 'income-bracket-expansion'],
    },
    {
      id: 'law-icl-amendments',
      title: '취업 후 학자금 상환 특별법 개정문',
      url: 'https://www.law.go.kr/LSW/lsRvsDocListP.do?chrClsCd=010102&lsId=011136',
      checkedAt: CHECKED_AT,
      supports: ['interest-exemption-effective-dates'],
    },
  ],
  purposes: {
    tuition: {
      minimumPerDisbursement: 10,
      applicationUnit: null,
      semesterLimit: 'BILLED_TUITION',
      partialLoanAllowed: true,
      paymentDestination: 'INSTITUTION_ACCOUNT',
    },
    living: {
      minimumPerDisbursement: 10,
      applicationUnit: 5,
      semesterLimit: 200,
      annualLimit: 400,
      preRegistrationLimit: 50,
      paymentDestination: 'BORROWER_ACCOUNT',
      splitDisbursementAllowed: true,
      cumulativePrincipalLimits: {
        undergraduateFourYearOrCollege: 2400,
        undergraduateFiveOrSixYear: 3200,
        generalGraduateMaster: 3600,
        generalGraduateDoctor: 4400,
        professionalGraduateMaster: 4000,
        professionalGraduateDoctor: 4800,
      },
    },
  },
  products: {
    general: {
      id: 'general',
      interest: {
        annualRate: 1.7,
        type: 'fixed',
      },
      eligibility: {
        incomeBracket: {
          tuition: 'NO_LIMIT',
          living: 'NO_LIMIT',
        },
        age: {
          defaultMaximum: 55,
          continuousStudyMaximum: 59,
        },
        academics: {
          minimumPreviousScore: 70,
          minimumPreviousCredits: 12,
          scoreExemptions: ['new-student-group', 'disabled-student'],
          creditExemptions: ['new-student-group', 'disabled-student', 'graduating-undergraduate', 'graduate-student'],
        },
      },
      tuitionCumulativePrincipalLimits: {
        undergraduateFourYearOrCollege: 4000,
        undergraduateFiveOrSixYear: 6000,
        undergraduateMedical: 9000,
        professionalTechnologyMaster: 6000,
        generalGraduateMaster: 6000,
        generalGraduateDoctor: 9000,
        professionalGraduateMaster: 9000,
        professionalGraduateDoctor: 12000,
      },
      repayment: {
        officialMethods: ['equal-payment', 'equal-principal'],
        serviceComparisonMethod: 'equal-payment',
        maximumGraceYears: 10,
        maximumRepaymentYears: 10,
      },
    },
    incomeContingent: {
      id: 'income-contingent',
      interest: {
        annualRate: 1.7,
        type: 'variable',
        accrualMethod: 'simple-daily',
      },
      eligibility: {
        incomeBracket: {
          undergraduateTuition: 'NO_LIMIT',
          graduateTuition: 'NO_LIMIT',
          undergraduateLivingMaximum: 8,
          graduateLivingMaximum: 6,
          undergraduateLivingEmergencyExceptionBracket: 9,
          undergraduateLivingTierNineException: 'EMERGENCY_LIVELIHOOD',
          undergraduateLivingNoLimitExceptions: ['multi-child-household', 'care-leaver'],
        },
        age: {
          undergraduateMaximum: 35,
          graduateMaximum: 40,
          employedUndergraduateExceptionMaximum: 45,
        },
        academics: {
          minimumPreviousScore: null,
          minimumPreviousCredits: 12,
          creditExemptions: ['new-student-group', 'disabled-student', 'graduating-undergraduate', 'graduate-student'],
        },
      },
      tuitionCumulativePrincipalLimits: {
        undergraduate: null,
        professionalTechnologyMaster: 6000,
        generalGraduateMaster: 6000,
        generalGraduateDoctor: 9000,
        professionalGraduateMaster: 9000,
        professionalGraduateDoctor: 12000,
      },
      repayment: {
        basisYear: 2026,
        annualGrossIncomeThreshold: 3037,
        annualGrossIncomeThresholdKind: 'GROSS_PAY_EQUIVALENT',
        undergraduateRate: 0.2,
        graduateRate: 0.25,
        minimumAnnualMandatoryRepayment: 36,
      },
    },
  },
  commonEligibilityRules: [
    'SUPPORTED_INSTITUTION',
    'NATIONALITY_OR_ALLOWED_DOMESTIC_RESIDENCY',
    'NO_DUPLICATE_FUNDING',
    'NO_RESTRICTED_INSTITUTION',
    'NO_FALSE_INFORMATION',
    'NO_UNRETURNED_TUITION_DIFFERENCE',
    'NO_FINANCIAL_TRANSACTION_BLOCK',
  ],
  eligibilityOverrides: [
    {
      id: 'general-continuous-study-age',
      product: 'general',
      purposes: ['tuition', 'living'],
      effectiveFrom: '2026-07-01',
      effectiveTo: '2026-12-31',
      condition: 'ENTERED_BY_AGE_55_AND_CONTINUOUSLY_ENROLLED',
      sourceId: 'kosaf-living',
    },
    {
      id: 'icl-undergraduate-age-45',
      product: 'income-contingent',
      purposes: ['tuition', 'living'],
      effectiveFrom: '2026-07-01',
      effectiveTo: '2026-12-31',
      condition: 'QUALIFYING_EMPLOYED_UNDERGRADUATE_PROGRAM',
      sourceId: 'kosaf-icl',
    },
    {
      id: 'icl-living-income-exceptions',
      product: 'income-contingent',
      purposes: ['living'],
      effectiveFrom: '2026-07-01',
      effectiveTo: '2026-12-31',
      condition: 'TIER_9_EMERGENCY_OR_MULTI_CHILD_OR_CARE_LEAVER',
      sourceId: 'kosaf-overview',
    },
  ],
  interestExemptions: [
    {
      id: 'icl-basic-near-poverty-multi-child',
      product: 'income-contingent',
      purposes: ['tuition', 'living'],
      effectiveFrom: '2026-07-01',
      effectiveTo: null,
      condition: 'BASIC_OR_NEAR_POVERTY_OR_MULTI_CHILD',
      sourceId: 'kosaf-icl',
    },
    {
      id: 'icl-care-leaver',
      product: 'income-contingent',
      purposes: ['tuition', 'living'],
      effectiveFrom: '2026-05-12',
      effectiveTo: null,
      condition: 'CARE_LEAVER_OR_PROTECTED_CHILD',
      sourceId: 'kosaf-icl',
    },
    {
      id: 'icl-income-tier-six',
      product: 'income-contingent',
      purposes: ['tuition', 'living'],
      effectiveFrom: '2026-07-01',
      effectiveTo: null,
      condition: 'INCOME_TIER_AT_MOST_6_BEFORE_MANDATORY_REPAYMENT',
      maximumSupportBracket: 6,
      sourceId: 'moe-2026-first-semester',
    },
    {
      id: 'icl-regional-university-tier-eight',
      product: 'income-contingent',
      purposes: ['tuition', 'living'],
      effectiveFrom: '2026-11-20',
      effectiveTo: null,
      condition: 'NON_CAPITAL_REGION_UNIVERSITY_AND_INCOME_TIER_AT_MOST_8',
      maximumSupportBracket: 8,
      status: 'scheduled-within-snapshot',
      sourceId: 'law-icl-amendments',
    },
  ],
  repaymentDeferrals: [
    {
      id: 'icl-income-below-threshold',
      product: 'income-contingent',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      condition: 'ANNUAL_INCOME_NOT_ABOVE_THRESHOLD',
      sourceId: 'kosaf-mandatory-repayment',
    },
  ],
  combinationRules: {
    componentExecution: 'SEPARATE_TUITION_AND_LIVING_EXECUTION',
    candidateRequirement: 'EACH_COMPONENT_MUST_BE_INDIVIDUALLY_ELIGIBLE',
    mixedProductByPurpose: 'ALLOWED',
    sourceId: 'kosaf-conversion',
    allowedCombinations: [
      { tuitionProduct: 'general', livingProduct: 'general' },
      { tuitionProduct: 'general', livingProduct: 'income-contingent' },
      { tuitionProduct: 'income-contingent', livingProduct: 'general' },
      { tuitionProduct: 'income-contingent', livingProduct: 'income-contingent' },
    ],
    samePurposeMultipleProducts: {
      plannerDefault: 'DO_NOT_GENERATE',
      officialTransitionException: 'SAME_TERM_CONVERSION_MAY_PRESERVE_COMPONENT_BALANCES_WITHIN_SHARED_LIMIT',
    },
  },
});

const incomeContingent = LOAN_POLICY_SNAPSHOT.products.incomeContingent;

export const INCOME_CONTINGENT_POLICY = deepFreeze({
  id: `${LOAN_POLICY_SNAPSHOT.snapshotId}:income-contingent`,
  snapshotId: LOAN_POLICY_SNAPSHOT.snapshotId,
  label: '2026학년도 2학기 취업 후 상환 학자금대출 기준',
  basisYear: incomeContingent.repayment.basisYear,
  annualIncomeThreshold: incomeContingent.repayment.annualGrossIncomeThreshold,
  repaymentRate: incomeContingent.repayment.undergraduateRate,
  checkedAt: CHECKED_AT,
  officialUrl: LOAN_POLICY_SNAPSHOT.sources.find(({ id }) => id === 'kosaf-icl').url,
  taxServiceUrl: 'https://www.icl.go.kr',
  note: '2026년 총급여 환산 기준과 학부 상환율을 사용하는 현재 기준 단순 비교값입니다.',
});

const general = LOAN_POLICY_SNAPSHOT.products.general;

export const GENERAL_LOAN_POLICY = deepFreeze({
  id: `${LOAN_POLICY_SNAPSHOT.snapshotId}:general`,
  snapshotId: LOAN_POLICY_SNAPSHOT.snapshotId,
  label: '2026학년도 2학기 일반 상환 학자금대출 기준',
  annualRate: general.interest.annualRate,
  interestType: general.interest.type,
  repaymentMethod: general.repayment.serviceComparisonMethod,
  checkedAt: CHECKED_AT,
  officialUrl: LOAN_POLICY_SNAPSHOT.sources.find(({ id }) => id === 'kosaf-general').url,
  note: '서비스 비교는 공식 방식 중 원리금균등을 사용합니다.',
});
