function hasProduct(candidate, product) {
  return candidate.tuitionProduct === product
    || candidate.livingProduct === product;
}

export function explainCandidate(candidate, { lowerTenYearBurden = false } = {}) {
  const reasonCodes = [];
  const warningCodes = [];
  const incomeContingent = candidate.loan.repayments.incomeContingent;
  const general = candidate.loan.repayments.general;

  if (candidate.eligibility.status !== 'eligible') {
    reasonCodes.push('ELIGIBILITY_CONFIRMATION_REQUIRED');
  }
  if (candidate.interestExemptionApplied && hasProduct(candidate, 'income-contingent')) {
    reasonCodes.push('ICL_INTEREST_EXEMPTION');
  }
  if (
    incomeContingent
    && incomeContingent.monthlyAverageEquivalent <= (general?.monthlyPayment ?? Infinity)
  ) {
    reasonCodes.push('LOW_INITIAL_MANDATORY_PAYMENT');
  }
  if (lowerTenYearBurden) reasonCodes.push('LOWER_TEN_YEAR_BURDEN');
  if ((incomeContingent?.currentValueComparison?.endingBalance ?? 0) > 0) {
    warningCodes.push('RESIDUAL_BALANCE_WARNING');
  }

  return {
    reasonCodes: [...new Set(reasonCodes)],
    warningCodes: [...new Set(warningCodes)],
  };
}
