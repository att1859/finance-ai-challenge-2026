export const DEFAULT_PROFILE = Object.freeze({
  school: '',
  academicYear: '2',
  tuitionPerSemester: 420,
  supportBracket: '',
  region: '부산광역시',
  desiredCollegeSpend: 80,
  desiredCareerSpend: 250,
  currentWorkHours: 20,
  hourlyWage: 12000,
  workTaxPreset: 'simple-3.3',
  graduationYears: 4,
  salary: 300,
  loanCap: 5000,
  repaymentYears: 5,
  graceYears: 0,
  loanType: 'general',
  existingLoanBalance: 0,
});

export const SAMPLE_PROFILE = Object.freeze({
  ...DEFAULT_PROFILE,
  school: '한빛대학교',
  supportBracket: '3',
  region: '부산광역시',
});
