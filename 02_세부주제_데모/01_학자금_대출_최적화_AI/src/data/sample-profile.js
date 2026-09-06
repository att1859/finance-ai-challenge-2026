export const DEFAULT_PROFILE = Object.freeze({
  remainingSemesters: 8,
  graduationYears: 4,
  tuitionPerSemester: 420,
  tuitionContributionPerSemester: 0,
  currentMonthlyIncome: 50,
  desiredCollegeSpend: 80,
  salary: 300,
  supportBracket: '',
  loanCap: 5000,
  repaymentYears: 10,
  graceYears: 1,
  loanType: 'general',
  existingLoanBalance: 0,
});
export const SAMPLE_PROFILE = Object.freeze({ ...DEFAULT_PROFILE, tuitionContributionPerSemester: 120 });
