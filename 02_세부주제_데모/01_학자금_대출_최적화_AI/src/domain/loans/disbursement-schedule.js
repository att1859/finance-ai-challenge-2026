import { nonNegative } from '../shared/numbers.js';
import { amortizedLoan } from './amortized-loan.js';

export const DEFAULT_GRADUATION_PREPARATION_YEARS = 1;
export const DEFAULT_GENERAL_REPAYMENT_YEARS = 10;

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function addMonths(dateText, months) {
  const [year, month, day] = String(dateText).split('-').map(Number);
  if (![year, month, day].every(Number.isFinite)) return null;

  const date = new Date(Date.UTC(year, month - 1 + months, day));
  return date.toISOString().slice(0, 10);
}

function disbursementMonth(component, index) {
  const semester = Number.isFinite(component.semester)
    ? Math.max(1, Math.round(component.semester))
    : index + 1;
  return (semester - 1) * 6;
}

function scheduledGraduationMonth(month, baseStudyMonths, studyMonths) {
  return month < baseStudyMonths ? baseStudyMonths : studyMonths;
}

export function resolveGeneralRepaymentTerms(profile = {}, policy = {}) {
  const requestedGraduationPreparationYears = nonNegative(finiteOr(
    profile.graceYears,
    DEFAULT_GRADUATION_PREPARATION_YEARS,
  ));
  const requestedRepaymentYears = Math.max(1, Math.round(nonNegative(finiteOr(
    profile.repaymentYears,
    DEFAULT_GENERAL_REPAYMENT_YEARS,
  ))));
  const maximumGraceYears = Number.isFinite(policy.maximumGraceYears)
    ? nonNegative(policy.maximumGraceYears)
    : null;
  const maximumRepaymentYears = Number.isFinite(policy.maximumRepaymentYears)
    ? Math.max(1, Math.round(nonNegative(policy.maximumRepaymentYears)))
    : null;
  const repaymentYears = maximumRepaymentYears == null
    ? requestedRepaymentYears
    : Math.min(requestedRepaymentYears, maximumRepaymentYears);

  return {
    requestedGraduationPreparationYears,
    requestedRepaymentYears,
    repaymentYears,
    paymentMonths: repaymentYears * 12,
    maximumGraceYears,
    maximumRepaymentYears,
    repaymentYearsLimited: repaymentYears !== requestedRepaymentYears,
  };
}

function buildComponentRepaymentSchedule({
  component,
  index,
  baseStudyMonths,
  studyMonths,
  annualRate,
  terms,
}) {
  const principal = nonNegative(component.principal);
  const month = disbursementMonth(component, index);
  const graduationMonth = scheduledGraduationMonth(
    month,
    baseStudyMonths,
    studyMonths,
  );
  const monthsUntilScheduledGraduation = Math.max(0, graduationMonth - month);
  const studyGraceYears = Math.ceil(monthsUntilScheduledGraduation / 12);
  const requestedGraceYears = studyGraceYears
    + terms.requestedGraduationPreparationYears;
  const graceYears = terms.maximumGraceYears == null
    ? requestedGraceYears
    : Math.min(requestedGraceYears, terms.maximumGraceYears);
  const graceMonths = Math.round(graceYears * 12);
  const appliedGraduationPreparationYears = Math.max(
    0,
    graceYears - studyGraceYears,
  );
  const repaymentStartMonth = month + graceMonths;
  const repaymentEndMonth = repaymentStartMonth + terms.paymentMonths;
  const monthlyRate = nonNegative(annualRate) / 100 / 12;
  const monthlyGraceInterest = principal * monthlyRate;
  const amortized = amortizedLoan(principal, annualRate, terms.repaymentYears);
  const monthlySchedule = [];

  for (let localMonth = 0; localMonth < graceMonths; localMonth += 1) {
    const globalMonth = month + localMonth;
    monthlySchedule.push({
      globalMonth,
      localMonth,
      phase: 'grace',
      periodStartDate: addMonths(component.disbursementDate, localMonth),
      periodEndDate: addMonths(component.disbursementDate, localMonth + 1),
      openingPrincipal: principal,
      graceInterestPayment: monthlyGraceInterest,
      repaymentInterestPayment: 0,
      principalPayment: 0,
      totalPayment: monthlyGraceInterest,
      closingPrincipal: principal,
    });
  }

  let remainingPrincipal = principal;
  for (let repaymentMonth = 0; repaymentMonth < terms.paymentMonths; repaymentMonth += 1) {
    const localMonth = graceMonths + repaymentMonth;
    const repaymentInterestPayment = remainingPrincipal * monthlyRate;
    const principalPayment = repaymentMonth === terms.paymentMonths - 1
      ? remainingPrincipal
      : Math.min(
        remainingPrincipal,
        Math.max(0, amortized.monthlyPayment - repaymentInterestPayment),
      );
    const totalPayment = principalPayment + repaymentInterestPayment;
    const openingPrincipal = remainingPrincipal;
    remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
    monthlySchedule.push({
      globalMonth: month + localMonth,
      localMonth,
      phase: 'repayment',
      repaymentMonth: repaymentMonth + 1,
      periodStartDate: addMonths(component.disbursementDate, localMonth),
      periodEndDate: addMonths(component.disbursementDate, localMonth + 1),
      openingPrincipal,
      graceInterestPayment: 0,
      repaymentInterestPayment,
      principalPayment,
      totalPayment,
      closingPrincipal: remainingPrincipal,
    });
  }

  const rowsBeforeGraduation = monthlySchedule.filter(
    ({ globalMonth }) => globalMonth < studyMonths,
  );
  const balanceAtGraduation = month >= studyMonths
    ? 0
    : rowsBeforeGraduation.at(-1)?.closingPrincipal ?? principal;
  const duringStudyPayment = rowsBeforeGraduation.reduce(
    (sum, row) => sum + row.totalPayment,
    0,
  );
  const graceInterest = monthlyGraceInterest * graceMonths;

  return {
    ...component,
    principal,
    month,
    disbursementMonth: month,
    scheduledGraduationMonth: graduationMonth,
    scheduledGraduationDate: addMonths(component.disbursementDate, graduationMonth - month),
    monthsUntilScheduledGraduation,
    studyGraceYears,
    requestedGraduationPreparationYears: terms.requestedGraduationPreparationYears,
    appliedGraduationPreparationYears,
    graceYears,
    graceMonths,
    graceLimited: graceYears !== requestedGraceYears,
    monthlyGraceInterest,
    graceInterest,
    repaymentYears: terms.repaymentYears,
    paymentMonths: terms.paymentMonths,
    monthlyPayment: amortized.monthlyPayment,
    repaymentInterest: amortized.totalInterest,
    totalInterest: graceInterest + amortized.totalInterest,
    totalRepayment: principal + graceInterest + amortized.totalInterest,
    repaymentStartMonth,
    repaymentStartDate: addMonths(component.disbursementDate, graceMonths),
    repaymentEndMonth,
    repaymentEndDate: addMonths(
      component.disbursementDate,
      graceMonths + terms.paymentMonths,
    ),
    balanceAtGraduation,
    duringStudyPayment,
    monthlySchedule,
  };
}

function aggregateMonthlySchedules(componentSchedules) {
  const months = new Map();

  componentSchedules.forEach((component) => {
    component.monthlySchedule.forEach((row) => {
      const aggregate = months.get(row.globalMonth) ?? {
        globalMonth: row.globalMonth,
        periodStartDate: row.periodStartDate,
        periodEndDate: row.periodEndDate,
        componentIds: [],
        graceComponentCount: 0,
        repaymentComponentCount: 0,
        openingPrincipal: 0,
        graceInterestPayment: 0,
        repaymentInterestPayment: 0,
        principalPayment: 0,
        totalPayment: 0,
        closingPrincipal: 0,
      };
      aggregate.componentIds.push(component.id);
      aggregate.graceComponentCount += row.phase === 'grace' ? 1 : 0;
      aggregate.repaymentComponentCount += row.phase === 'repayment' ? 1 : 0;
      aggregate.openingPrincipal += row.openingPrincipal;
      aggregate.graceInterestPayment += row.graceInterestPayment;
      aggregate.repaymentInterestPayment += row.repaymentInterestPayment;
      aggregate.principalPayment += row.principalPayment;
      aggregate.totalPayment += row.totalPayment;
      aggregate.closingPrincipal += row.closingPrincipal;
      months.set(row.globalMonth, aggregate);
    });
  });

  return [...months.values()].sort((a, b) => a.globalMonth - b.globalMonth);
}

export function buildGeneralRepaymentSchedule({
  components,
  funding,
  annualRate,
  terms,
}) {
  const studyMonths = nonNegative(funding?.studyMonths);
  const baseStudyMonths = Math.min(
    studyMonths,
    nonNegative(finiteOr(funding?.baseStudyMonths, studyMonths)),
  );
  const componentSchedules = components.map((component, index) => (
    buildComponentRepaymentSchedule({
      component,
      index,
      baseStudyMonths,
      studyMonths,
      annualRate,
      terms,
    })
  ));
  const monthlySchedule = aggregateMonthlySchedules(componentSchedules);
  const repaymentStartMonths = componentSchedules.map(
    ({ repaymentStartMonth }) => repaymentStartMonth,
  );
  const firstRepaymentStartMonth = repaymentStartMonths.length
    ? Math.min(...repaymentStartMonths)
    : null;
  const firstRepaymentRow = firstRepaymentStartMonth == null
    ? null
    : monthlySchedule.find(({ globalMonth }) => globalMonth === firstRepaymentStartMonth);
  const firstYearRows = firstRepaymentStartMonth == null
    ? []
    : monthlySchedule.filter(({ globalMonth }) => (
      globalMonth >= firstRepaymentStartMonth
      && globalMonth < firstRepaymentStartMonth + 12
    ));
  const firstYearLastRow = firstYearRows.at(-1);

  return {
    componentSchedules,
    monthlySchedule,
    terms,
    firstRepaymentStartMonth,
    firstRepaymentStartDate: componentSchedules.length
      ? componentSchedules.reduce((earliest, component) => (
        !earliest || component.repaymentStartDate < earliest
          ? component.repaymentStartDate
          : earliest
      ), null)
      : null,
    lastRepaymentEndDate: componentSchedules.length
      ? componentSchedules.reduce((latest, component) => (
        !latest || component.repaymentEndDate > latest
          ? component.repaymentEndDate
          : latest
      ), null)
      : null,
    firstMonthPayment: firstRepaymentRow?.totalPayment ?? 0,
    firstYearPayment: firstYearRows.reduce((sum, row) => sum + row.totalPayment, 0),
    balanceAfterFirstRepaymentYear: firstYearLastRow?.closingPrincipal ?? 0,
    maximumMonthlyPayment: monthlySchedule.reduce(
      (maximum, row) => Math.max(maximum, row.totalPayment),
      0,
    ),
    balanceAtGraduation: componentSchedules.reduce(
      (sum, component) => sum + component.balanceAtGraduation,
      0,
    ),
    duringStudyPayment: componentSchedules.reduce(
      (sum, component) => sum + component.duringStudyPayment,
      0,
    ),
    graceInterest: componentSchedules.reduce(
      (sum, component) => sum + component.graceInterest,
      0,
    ),
    repaymentInterest: componentSchedules.reduce(
      (sum, component) => sum + component.repaymentInterest,
      0,
    ),
    totalInterest: componentSchedules.reduce(
      (sum, component) => sum + component.totalInterest,
      0,
    ),
    totalRepayment: componentSchedules.reduce(
      (sum, component) => sum + component.totalRepayment,
      0,
    ),
  };
}

export function buildLoanDisbursementSchedule(
  components,
  studyMonths,
  annualRate,
) {
  const monthlyRate = nonNegative(annualRate) / 100 / 12;
  const safeStudyMonths = nonNegative(studyMonths);

  return components.map((component) => {
    const month = Math.max(0, (component.semester - 1) * 6);
    const monthsToGraduation = Math.max(0, safeStudyMonths - month);
    const principal = nonNegative(component.principal);
    const balanceAtGraduation = principal * ((1 + monthlyRate) ** monthsToGraduation);

    return {
      ...component,
      principal,
      month,
      monthsToGraduation,
      balanceAtGraduation,
      accruedInterest: Math.max(0, balanceAtGraduation - principal),
    };
  });
}
