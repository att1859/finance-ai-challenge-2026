// Reference conversion only. Never feed these hours back into income or a loan.
export const MINIMUM_WAGE = Object.freeze({ year: 2026, hourly: 10320, source: 'https://www.minimumwage.go.kr/minWage/policy/decisionMain.do', checkedAt: '2026-09-06' });
export function calculateNoLoanComparison(profile, stress = {}) {
  const income = Math.max(0, Number(profile.currentMonthlyIncome) || 0);
  const tuitionGap = Math.max(0, Number(profile.tuitionPerSemester) - Number(profile.tuitionContributionPerSemester));
  const collegeLiving = income;
  const monthlyGap = Math.max(0, Number(profile.desiredCollegeSpend) - collegeLiving);
  return { id: 'no-loan', name: 'NO 대출', collegeLiving, careerLiving: Math.max(0, Number(profile.salary) || 0) * (1 - (stress.salaryReductionRate ?? 0)), tuitionGap, tuitionFunded: tuitionGap === 0, monthlyGap, monthlyHours: monthlyGap * 10000 / MINIMUM_WAGE.hourly, principal: 0, balance: 0, repayment: 0, wageBasis: MINIMUM_WAGE };
}
