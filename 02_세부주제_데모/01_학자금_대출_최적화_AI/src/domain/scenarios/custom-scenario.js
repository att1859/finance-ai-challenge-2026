import { LOAN_POLICY_SNAPSHOT } from '../../policies/loans/2026.js';

export function livingCumulativeLimit(profile, policy = LOAN_POLICY_SNAPSHOT) {
  const limits = policy.purposes.living.cumulativePrincipalLimits;
  return limits[profile.livingCumulativeLimitKey]
    ?? (profile.academicLevel === 'graduate' ? limits.generalGraduateMaster : limits.undergraduateFourYearOrCollege);
}

export function validateLivingAmount(value, policy = LOAN_POLICY_SNAPSHOT) {
  const { minimumPerDisbursement: minimum, applicationUnit: unit, semesterLimit: maximum } = policy.purposes.living;
  if (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0) return '0 이상의 금액을 입력해 주세요.';
  const amount = Number(value);
  if (amount > maximum) return `학기당 ${maximum}만 원 이하여야 합니다.`;
  if (amount !== 0 && amount < minimum) return `대출 없음(0원) 또는 최소 ${minimum}만 원부터 입력해 주세요.`;
  if (amount % unit !== 0) return `${unit}만 원 단위로 입력해 주세요. ${Math.floor(amount / unit) * unit}만 원 또는 ${Math.ceil(amount / unit) * unit}만 원으로 조정할 수 있습니다.`;
  return null;
}

export function requestedLivingAmounts(config, semesters) {
  return Array.from({ length: semesters }, (_, i) => Number(config.livingBySemester?.[i] ?? config.livingPerSemester));
}

export function validateCustomScenario(config, profile, semesters, policy = LOAN_POLICY_SNAPSHOT) {
  const errors = {};
  if (!String(config.name ?? '').trim() || String(config.name).length > 40) errors.name = '이름을 1~40자로 입력해 주세요.';
  const defaultError = validateLivingAmount(config.livingPerSemester, policy);
  if (defaultError) errors.livingPerSemester = defaultError;
  const amounts = requestedLivingAmounts(config, semesters);
  if (config.livingBySemester) amounts.forEach((amount, i) => { const error = validateLivingAmount(config.livingBySemester?.[i] ?? config.livingPerSemester, policy); if (error) errors[`semester-${i}`] = `${i + 1}학기: ${error}`; });
  if (amounts.reduce((sum, amount) => sum + amount, 0) > livingCumulativeLimit(profile, policy)) errors.total = `생활비 누적 한도 ${livingCumulativeLimit(profile, policy)}만 원을 초과합니다. 학기별 금액을 줄여 주세요.`;
  if (![0,1,2].includes(Number(config.graceYears))) errors.graceYears = '준비기간은 0~2년으로 선택해 주세요.';
  if (!Number.isInteger(Number(config.repaymentYears)) || Number(config.repaymentYears) < 1 || Number(config.repaymentYears) > 10) errors.repaymentYears = '상환기간은 1~10년으로 선택해 주세요.';
  return errors;
}

export function stepLivingAmount(value, direction, policy = LOAN_POLICY_SNAPSHOT) {
  const { minimumPerDisbursement: min, applicationUnit: step, semesterLimit: max } = policy.purposes.living;
  const amount = Math.max(0, Number(value) || 0);
  const next = direction > 0 ? (Math.floor(amount / step) + 1) * step : (Math.ceil(amount / step) - 1) * step;
  return direction > 0 ? Math.min(max, Math.max(min, next)) : next < min ? 0 : Math.min(max, next);
}
