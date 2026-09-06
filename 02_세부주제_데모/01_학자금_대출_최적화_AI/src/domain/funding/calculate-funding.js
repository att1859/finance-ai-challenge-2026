import { nonNegative, numberOrZero } from '../shared/numbers.js';
import { normalizeStress } from '../scenarios/normalize-stress.js';

export function calculateFundingSummary(profile, stress = {}) {
  const normalizedStress = normalizeStress(stress);
  const remainingSemesters = Math.max(1, numberOrZero(profile.remainingSemesters ?? profile.graduationYears * 2));
  const baseStudyMonths = remainingSemesters * 6;
  const studyMonths = baseStudyMonths + normalizedStress.graduationDelayMonths;
  // This plan funds only the current semester; graduation is a separate clock.
  const fundingMonths = 6;
  const semesters = 1;
  const educationNeed = nonNegative(profile.tuitionPerSemester);
  const livingNeed = nonNegative(profile.desiredCollegeSpend) * fundingMonths;
  return { remainingSemesters, baseStudyMonths, studyMonths, fundingMonths, semesters, educationNeed, livingNeed, totalNeed: educationNeed + livingNeed };
}
