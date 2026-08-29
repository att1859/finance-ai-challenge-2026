import { nonNegative } from '../shared/numbers.js';

export function amortizedLoan(principal, annualRate, years) {
  const originalPrincipal = nonNegative(principal);
  const monthlyRate = nonNegative(annualRate) / 100 / 12;
  const paymentMonths = Math.max(1, Math.round(nonNegative(years) * 12));

  if (originalPrincipal === 0) {
    return {
      principal: 0,
      monthlyPayment: 0,
      totalInterest: 0,
      totalRepayment: 0,
      paymentMonths,
    };
  }

  const monthlyPayment = monthlyRate === 0
    ? originalPrincipal / paymentMonths
    : originalPrincipal * (monthlyRate / (1 - ((1 + monthlyRate) ** -paymentMonths)));
  const totalRepayment = monthlyPayment * paymentMonths;

  return {
    principal: originalPrincipal,
    monthlyPayment,
    totalInterest: Math.max(0, totalRepayment - originalPrincipal),
    totalRepayment,
    paymentMonths,
  };
}
