import { nonNegative } from '../shared/numbers.js';

export function monthlyWorkIncome(workHours, hourlyWage) {
  return (nonNegative(workHours) * nonNegative(hourlyWage) * 4) / 10000;
}
