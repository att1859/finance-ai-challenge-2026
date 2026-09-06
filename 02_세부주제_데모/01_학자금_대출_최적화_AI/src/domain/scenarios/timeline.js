import { calculateIncomeContingentCurrentValueComparison } from '../loans/current-value-comparison.js';
// Month-start balances; payments belong to the following monthly interval.
// ICL keeps the existing annual settlement model, without inventing monthly bills.
export function buildScenarioTimeline(scenario, endMonth) {
  const { loan, funding, stress } = scenario;
  const graduationMonth = funding.studyMonths;
  const employmentMonth = graduationMonth + stress.employmentDelayMonths;
  const general = loan.repayments.general;
  const icl = loan.repayments.incomeContingent;
  const projection = scenarioRepaymentProjection(scenario);
  const annualSchedule = projection.annualSchedule;
  const generalRows = new Map((general?.monthlyRepaymentSchedule ?? []).map(row => [row.globalMonth, row]));
  const principalStart = general?.monthlyRepaymentSchedule.find(row => row.principalPayment > 0)?.globalMonth;
  const repaymentReferenceMonth = Math.max(employmentMonth, principalStart ?? employmentMonth);
  const rows = Array.from({ length: Math.max(endMonth + 1, repaymentReferenceMonth + 12) }, (_, month) => {
    const phase = month < graduationMonth ? 'study' : month < employmentMonth ? 'transition' : 'career';
    const common = { month, phase, calculationPossible: scenario.calculationPossible };
    if (!scenario.calculationPossible) return { ...common, living: null, repayment: null, balance: null };
    const generalRow = generalRows.get(month);
    let balance = generalRow?.openingPrincipal ?? 0;
    let repayment = generalRow?.totalPayment ?? 0;
    if (icl) {
      if (month < employmentMonth) {
        const rate = icl.annualRate / 100 / 12;
        const newPrincipal = icl.disbursementSchedule.reduce((sum, item) => sum + item.principal, 0);
        balance += (icl.principal - newPrincipal) * (1 + rate) ** month;
        balance += icl.disbursementSchedule.reduce((sum, item) => sum + (item.month <= month ? item.principal * (1 + rate) ** (month - item.month) : 0), 0);
      } else {
        const elapsed = month - employmentMonth;
        const year = annualSchedule[Math.floor(elapsed / 12)];
        // Only annual balances exist after employment. Carry the latest settled
        // balance until the next annual settlement, rather than interpolate it.
        balance += year?.openingBalance ?? annualSchedule.at(-1)?.closingBalance ?? 0;
        repayment += year ? year.mandatoryRepayment / 12 : 0;
      }
    }
    const semester = scenario.livingLoan.semesters[Math.floor(month / 6)];
    const resources = phase === 'study'
      ? scenario.currentMonthlyIncome + (semester ? semester.principal / semester.monthCount : 0)
      : phase === 'career' ? scenario.adjustedSalary : 0;
    return { ...common, living: resources - repayment, repayment, balance, monthlyAverage: Boolean(icl), annualBalance: Boolean(icl && phase === 'career') };
  });
  const average = (selected, key) => selected.length && selected.every(row => Number.isFinite(row[key]))
    ? selected.reduce((sum, row) => sum + row[key], 0) / selected.length : null;
  const firstYear = rows.filter(row => row.month >= repaymentReferenceMonth && row.month < repaymentReferenceMonth + 12);
  return {
    graduationMonth, employmentMonth, endMonth, repaymentReferenceMonth, repaymentEndMonth: projection.repaymentEndMonth, projectionLimited: projection.projectionLimited, rows: rows.slice(0, endMonth + 1),
    summary: {
      collegeLiving: scenario.calculationPossible ? scenario.possibleCollegeSpend : null,
      collegeAfterRepayment: average(rows.filter(row => row.month < funding.fundingMonths), 'living'),
      graduationBalance: scenario.calculationPossible ? loan.balanceAtGraduation : null,
      careerLiving: average(firstYear, 'living'),
      careerRepayment: average(firstYear, 'repayment'),
    },
  };
}

// The fixed 10-year recommendation ledger stays separate from payoff visualization.
export function scenarioRepaymentProjection(scenario) {
  const employment = scenario.funding.studyMonths + scenario.stress.employmentDelayMonths;
  const general = scenario.loan.repayments.general;
  const icl = scenario.loan.repayments.incomeContingent;
  const generalEnd = (general?.monthlyRepaymentSchedule ?? []).filter(r => r.totalPayment > 0).at(-1)?.globalMonth;
  const annualSchedule = icl?.calculationPossible ? calculateIncomeContingentCurrentValueComparison({
    ...icl.policy, balanceAtEmployment: icl.balanceAtEmployment,
    annualGrossIncome: scenario.adjustedSalary * 12, comparisonYears: 50,
  }).annualSchedule : [];
  const paidYear = annualSchedule.findIndex(r => r.closingBalance <= 1e-8);
  const projectionLimited = Boolean(icl && paidYear < 0 && icl.principal > 0);
  const iclEnd = icl?.principal > 0 ? employment + (paidYear < 0 ? 50 : paidYear + 1) * 12 : 0;
  const end = Math.max(generalEnd == null ? 0 : generalEnd + 1, iclEnd);
  return { annualSchedule, projectionLimited, repaymentEndMonth: projectionLimited ? null : end,
    endMonth: Math.max(employment + 12, end + (projectionLimited ? 0 : 12)) };
}
