import { INCOME_CONTINGENT_POLICY } from '../../policies/loans/2026.js';
import { normalizeStress } from '../scenarios/normalize-stress.js';
import { calculateGeneralLoan } from './general-loan.js';
import { calculateIncomeContingentLoan } from './income-contingent-loan.js';

export function calculateLoan(
  profile,
  newLoanPrincipal,
  funding,
  stress = {},
  policy = INCOME_CONTINGENT_POLICY,
) {
  const normalizedStress = normalizeStress(stress);

  return profile.loanType === 'income-contingent'
    ? calculateIncomeContingentLoan(
      profile,
      newLoanPrincipal,
      funding,
      normalizedStress,
      policy,
    )
    : calculateGeneralLoan(
      profile,
      newLoanPrincipal,
      funding,
      normalizedStress,
    );
}
