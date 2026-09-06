function traceDisbursements(loanComposition) {
  return [
    ...loanComposition.tuitionComponents,
    ...loanComposition.livingComponents,
  ].map((component) => ({
    id: component.id,
    product: component.product,
    purpose: component.purpose,
    semester: component.semester,
    disbursementDate: component.disbursementDate,
    principal: component.principal,
  }));
}

function traceGraceInterest(loan) {
  return (loan.repayments.general?.componentRepaymentSchedules ?? [])
    .map((component) => ({
      componentId: component.id,
      principal: component.principal,
      annualRate: component.annualRate
        ?? loan.repayments.general.annualRate,
      graceMonths: component.graceMonths,
      monthlyGraceInterest: component.monthlyGraceInterest,
      graceInterest: component.graceInterest,
      repaymentStartDate: component.repaymentStartDate,
    }));
}

function traceRepayment(loan) {
  const general = loan.repayments.general;
  const incomeContingent = loan.repayments.incomeContingent;

  return {
    general: general
      ? {
        repaymentMethod: general.repaymentMethod,
        repaymentTerms: general.repaymentTerms,
        monthlyPayment: general.monthlyPayment,
        monthlySchedule: general.monthlyRepaymentSchedule.map((row) => ({ ...row })),
      }
      : null,
    incomeContingent: incomeContingent
      ? {
        annualGrossIncomeThreshold: incomeContingent.annualGrossIncomeThreshold,
        repaymentRate: incomeContingent.repaymentRate,
        minimumAnnualMandatoryRepayment: incomeContingent.minimumAnnualMandatoryRepayment,
        annualMandatoryRepayment: incomeContingent.annualMandatoryRepayment,
        annualSchedule: (incomeContingent.currentValueComparison?.annualSchedule ?? [])
          .map((row) => ({ ...row })),
      }
      : null,
  };
}

export function buildCalculationTrace({
  profile,
  scenario,
  loanComposition,
  loan,
  policyReferences = [],
}) {
  const funding = scenario.funding;
  const tuitionFunding = scenario.tuitionFunding;
  const work = scenario.workIncomeBreakdown;

  return {
    unit: 'KRW_10K',
    rounding: 'none',
    policyReferences,
    order: [
      'funding-need',
      'work-income',
      'living-loan-by-semester',
      'loan-disbursements',
      'grace-interest',
      'repayment',
    ],
    steps: {
      fundingNeed: {
        id: 'funding-need',
        policyReferenceIds: ['tuition-limit', 'living-limit'],
        inputs: {
          tuitionPerSemester: tuitionFunding.billedPerSemester,
          tuitionContributionPerSemester: tuitionFunding.contributionPerSemester,
          desiredCollegeSpend: profile.desiredCollegeSpend,
          studyMonths: funding.studyMonths,
          semesters: funding.semesters,
        },
        outputs: {
          grossEducationNeed: funding.educationNeed,
          tuitionContributionTotal: tuitionFunding.contributionPerSemester
            * funding.semesters,
          tuitionLoanNeed: tuitionFunding.principal,
          livingNeed: funding.livingNeed,
          grossTotalNeed: funding.totalNeed,
        },
      },
      workIncome: {
        id: 'work-income',
        inputs: {
          weeklyHours: scenario.workHours,
          hourlyWage: profile.hourlyWage,
          taxPreset: profile.workTaxPreset,
          studyMonths: funding.studyMonths,
        },
        outputs: {
          monthlyWeeks: work.monthlyWeeks,
          weeklyHolidayEligible: work.weeklyHolidayEligible,
          weeklyHolidayHours: work.weeklyHolidayHours,
          baseMonthly: work.baseMonthly,
          holidayMonthly: work.holidayMonthly,
          grossMonthly: work.grossMonthly,
          taxRate: work.taxRate,
          deductionMonthly: work.deductionMonthly,
          netMonthly: work.netMonthly,
          totalDuringStudy: scenario.workTotal,
        },
      },
      livingLoanBySemester: {
        id: 'living-loan-by-semester',
        policyReferenceIds: ['living-limit'],
        cumulativeLimit: scenario.livingLoan.cumulativeLimit,
        rawRequired: scenario.livingLoan.rawRequired,
        principal: scenario.livingLoan.principal,
        unmetLivingGap: scenario.livingLoan.unmetLivingGap,
        semesters: scenario.livingLoan.semesters.map((semester) => ({ ...semester })),
      },
      loanDisbursements: {
        id: 'loan-disbursements',
        policyReferenceIds: [
          ...new Set(traceDisbursements(loanComposition).map(
            ({ product, purpose }) => `eligibility:${product}:${purpose}`,
          )),
        ],
        entries: traceDisbursements(loanComposition),
      },
      graceInterest: {
        id: 'grace-interest',
        policyReferenceIds: loan.repayments.general
          ? ['general-interest-and-repayment']
          : [],
        entries: traceGraceInterest(loan),
        total: loan.graceInterest,
      },
      repayment: {
        id: 'repayment',
        policyReferenceIds: [
          ...(loan.repayments.general ? ['general-interest-and-repayment'] : []),
          ...(loan.repayments.incomeContingent
            ? ['income-contingent-interest-and-repayment']
            : []),
        ],
        ...traceRepayment(loan),
      },
    },
  };
}
