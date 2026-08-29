import { nonNegative, numberOrZero } from '../shared/numbers.js';
import { normalizeStress } from '../scenarios/normalize-stress.js';

export function calculateFundingSummary(profile, stress = {}) {
  const normalizedStress = normalizeStress(stress);
  const remainingYears = Math.max(0.5, numberOrZero(profile.graduationYears));
  const baseStudyMonths = Math.max(6, Math.round(remainingYears * 12));
  const studyMonths = baseStudyMonths + normalizedStress.graduationDelayMonths;
  const semesters = Math.ceil(studyMonths / 6);
  const educationNeed = nonNegative(profile.tuitionPerSemester) * semesters;
  const livingNeed = nonNegative(profile.desiredCollegeSpend) * studyMonths;
  const confirmedLivingGrantTotal = nonNegative(profile.confirmedLivingGrantTotal);
  const totalNeed = educationNeed + livingNeed;

  return {
    baseStudyMonths,
    studyMonths,
    semesters,
    educationNeed,
    livingNeed,
    totalNeed,
    confirmedLivingGrantTotal,
    remainingAfterConfirmedSupport: Math.max(0, totalNeed - confirmedLivingGrantTotal),
  };
}
