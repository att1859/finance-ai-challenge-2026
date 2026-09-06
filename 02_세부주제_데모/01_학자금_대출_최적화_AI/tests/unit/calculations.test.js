import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFundingSummary } from '../../src/domain/funding/calculate-funding.js';
import { calculateMonthlyWorkIncome } from '../../src/domain/funding/work-income.js';
import { amortizedLoan } from '../../src/domain/loans/amortized-loan.js';
import { calculateLoan } from '../../src/domain/loans/calculate-loan.js';
import { buildLoanDisbursementSchedule } from '../../src/domain/loans/disbursement-schedule.js';
import {
  createLoanComposition,
  getLoanCompositionComponents,
} from '../../src/domain/loans/loan-composition.js';
import {
  calculateAllScenarios,
  calculateFullLoanCapView,
  calculateScenario,
} from '../../src/domain/scenarios/calculate-scenario.js';
import { SCENARIO_DEFINITIONS } from '../../src/domain/scenarios/definitions.js';
import { DEFAULT_PROFILE, SAMPLE_PROFILE } from '../../src/data/sample-profile.js';
import { LOAN_POLICY_SNAPSHOT } from '../../src/policies/loans/2026.js';

const balance = SCENARIO_DEFINITIONS.find((item) => item.id === 'balance');
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8);
const compositionFor = (principal, funding, product = 'general') => (
  createLoanComposition({
    policySnapshot: LOAN_POLICY_SNAPSHOT,
    principalByPurpose: { tuition: principal, living: 0 },
    productByPurpose: { tuition: product, living: product },
    semesters: funding.semesters,
  })
);
const snapshotWithIncomeRepayment = ({ threshold, rate }) => ({
  ...LOAN_POLICY_SNAPSHOT,
  products: {
    ...LOAN_POLICY_SNAPSHOT.products,
    incomeContingent: {
      ...LOAN_POLICY_SNAPSHOT.products.incomeContingent,
      repayment: {
        ...LOAN_POLICY_SNAPSHOT.products.incomeContingent.repayment,
        annualGrossIncomeThreshold: threshold,
        undergraduateRate: rate,
      },
    },
  },
});

test('최초 프로필은 월 희망 생활비 80만 원을 사용하고 금리는 입력받지 않는다', () => {
  assert.equal(DEFAULT_PROFILE.desiredCollegeSpend, 80);
  assert.equal(SAMPLE_PROFILE.desiredCollegeSpend, 80);
  assert.equal(DEFAULT_PROFILE.graceYears, 1);
  assert.equal(DEFAULT_PROFILE.tuitionContributionPerSemester, 0);
  assert.equal(SAMPLE_PROFILE.tuitionContributionPerSemester, 120);
  assert.equal(DEFAULT_PROFILE.repaymentYears, 10);
  assert.equal('annualRate' in DEFAULT_PROFILE, false);
  assert.equal('repaymentMethod' in DEFAULT_PROFILE, false);
});

test('입력 프로필은 현재 근로시간만 보관한다', () => {
  assert.equal(DEFAULT_PROFILE.currentWorkHours, 20);
  assert.equal(DEFAULT_PROFILE.workTaxPreset, 'simple-3.3');
  assert.equal('desiredWorkHours' in DEFAULT_PROFILE, false);
});

test('주 20시간·시급 12,000원은 주휴와 3.3% 차감을 반영해 월 약 121만 원이다', () => {
  const income = calculateMonthlyWorkIncome({
    weeklyHours: 20,
    hourlyWage: 12000,
    taxPreset: 'simple-3.3',
  });

  closeTo(income.monthlyWeeks, 365 / 7 / 12);
  assert.equal(income.weeklyHolidayEligible, true);
  assert.equal(income.weeklyHolidayHours, 4);
  closeTo(income.baseMonthly, 104.28571428571428);
  closeTo(income.holidayMonthly, 20.857142857142854);
  closeTo(income.grossMonthly, 125.14285714285714);
  closeTo(income.deductionMonthly, 4.129714285714285);
  closeTo(income.netMonthly, 121.01314285714285);
  assert.equal(income.taxRate, 0.033);
});

test('주휴수당은 주 15시간 경계부터 비례 적용된다', () => {
  const below = calculateMonthlyWorkIncome({ weeklyHours: 14, hourlyWage: 12000 });
  const boundary = calculateMonthlyWorkIncome({ weeklyHours: 15, hourlyWage: 12000 });
  const capped = calculateMonthlyWorkIncome({ weeklyHours: 50, hourlyWage: 12000 });

  assert.equal(below.weeklyHolidayEligible, false);
  assert.equal(below.weeklyHolidayHours, 0);
  assert.equal(boundary.weeklyHolidayEligible, true);
  assert.equal(boundary.weeklyHolidayHours, 3);
  assert.equal(capped.weeklyHolidayHours, 8);
});

test('간편 차감 선택은 같은 총소득에 3.3%·9.5%·0%를 각각 적용한다', () => {
  const calculate = (taxPreset) => calculateMonthlyWorkIncome({
    weeklyHours: 20,
    hourlyWage: 12000,
    taxPreset,
  });
  const simple = calculate('simple-3.3');
  const social = calculate('social-9.5');
  const daily = calculate('daily-0');

  closeTo(simple.grossMonthly, social.grossMonthly);
  closeTo(simple.grossMonthly, daily.grossMonthly);
  closeTo(social.deductionMonthly, social.grossMonthly * 0.095);
  assert.ok(social.netMonthly < simple.netMonthly);
  assert.equal(daily.deductionMonthly, 0);
  closeTo(daily.netMonthly, daily.grossMonthly);
});

test('세 시나리오는 최소대출·최대감소의 절반·최대활용 순으로 계산한다', () => {
  const scenarios = calculateAllScenarios({ ...SAMPLE_PROFILE, currentWorkHours: 13 });

  assert.deepEqual(scenarios.map(({ id }) => id), ['minimum-loan', 'balance', 'maximum-use']);
  assert.deepEqual(scenarios.map(({ workHours }) => workHours), [13, 11.5, 9.5]);
  assert.deepEqual(scenarios.map(({ workHoursReduced }) => workHoursReduced), [0, 1.5, 3.5]);
  assert.deepEqual(scenarios.map(({ livingLoan }) => livingLoan.principal), [720, 1080, 1560]);
  assert.ok(scenarios.every(({ workIncomeBreakdown }) => workIncomeBreakdown));
});

test('최대활용안은 주휴수당 15시간 경계를 0.5시간 단위로 탐색한다', () => {
  const maximumUse = calculateAllScenarios({
    ...SAMPLE_PROFILE,
    currentWorkHours: 16,
    graduationYears: 0.5,
    desiredCollegeSpend: 110,
  }).find(({ id }) => id === 'maximum-use');

  assert.equal(maximumUse.workHours, 15);
  assert.equal(maximumUse.workIncomeBreakdown.weeklyHolidayEligible, true);
  assert.equal(maximumUse.unmetLivingGap, 0);
});

test('생활비가 충족되면 0원이며 한도로도 부족하면 미충족액을 남긴다', () => {
  const noLoan = calculateScenario({
    ...SAMPLE_PROFILE,
    desiredCollegeSpend: 50,
  }, SCENARIO_DEFINITIONS[0]);
  const capped = calculateAllScenarios({
    ...SAMPLE_PROFILE,
    currentWorkHours: 0,
    graduationYears: 0.5,
    desiredCollegeSpend: 500,
  });

  assert.equal(noLoan.livingLoan.principal, 0);
  assert.equal(capped.length, 1);
  assert.equal(capped[0].livingLoan.principal, 200);
  assert.equal(capped[0].unmetLivingGap, 2800);
});

test('등록금은 비대출 납부액을 먼저 차감하고 풀대출은 별도 상한으로 계산한다', () => {
  const profile = {
    ...SAMPLE_PROFILE,
    tuitionPerSemester: 420,
    tuitionContributionPerSemester: 120,
  };
  const minimum = calculateScenario(profile, SCENARIO_DEFINITIONS[0]);
  const fullCap = calculateFullLoanCapView(profile);

  assert.equal(minimum.tuitionFunding.loanPerSemester, 300);
  assert.equal(minimum.loanComposition.totals.tuition, 2400);
  assert.equal(fullCap.livingPrincipal, 1600);
  assert.equal(fullCap.isRecommendation, false);
  assert.deepEqual(fullCap.policyReference.sourceIds, ['kosaf-overview', 'kosaf-living']);
});

test('학기당 대출 없이 낼 등록금 0원과 등록금 전액 경계를 계산한다', () => {
  const definition = SCENARIO_DEFINITIONS[0];
  const none = calculateScenario({
    ...SAMPLE_PROFILE,
    tuitionContributionPerSemester: 0,
  }, definition);
  const full = calculateScenario({
    ...SAMPLE_PROFILE,
    tuitionContributionPerSemester: SAMPLE_PROFILE.tuitionPerSemester,
  }, definition);

  assert.equal(none.tuitionFunding.loanPerSemester, SAMPLE_PROFILE.tuitionPerSemester);
  assert.equal(full.tuitionFunding.loanPerSemester, 0);
  assert.equal(full.loanComposition.totals.tuition, 0);
});

test('calculationTrace는 필요자금부터 상환까지 순서와 반올림 전 원시값을 보존한다', () => {
  const scenario = calculateScenario({
    ...SAMPLE_PROFILE,
    desiredCollegeSpend: 130,
    tuitionContributionPerSemester: 120,
  }, SCENARIO_DEFINITIONS[0]);
  const trace = scenario.calculationTrace;

  assert.equal(trace.rounding, 'none');
  assert.deepEqual(trace.order, [
    'funding-need',
    'work-income',
    'living-loan-by-semester',
    'loan-disbursements',
    'grace-interest',
    'repayment',
  ]);
  assert.equal(
    trace.steps.workIncome.outputs.netMonthly,
    scenario.workIncomeBreakdown.netMonthly,
  );
  assert.equal(
    trace.steps.livingLoanBySemester.semesters[0].rawRequired,
    scenario.livingLoan.semesters[0].rawRequired,
  );
  assert.equal(
    trace.steps.fundingNeed.outputs.tuitionLoanNeed,
    scenario.tuitionFunding.principal,
  );
  assert.ok(trace.steps.loanDisbursements.entries.length > 0);
  assert.ok(trace.steps.graceInterest.entries.length > 0);
  assert.ok(trace.steps.repayment.general.monthlySchedule.length > 0);
});

test('계산에 사용한 금리·한도·자격·상환 기준은 기준일과 공식 출처를 추적한다', () => {
  const scenario = calculateScenario({
    ...SAMPLE_PROFILE,
    desiredCollegeSpend: 130,
  }, SCENARIO_DEFINITIONS[0]);
  const byId = Object.fromEntries(
    scenario.policyReferences.map((item) => [item.id, item]),
  );

  assert.equal(byId['living-limit'].values.semesterLimit, 200);
  assert.equal(byId['living-limit'].values.appliedCumulativeLimit, 2400);
  assert.equal(byId['general-interest-and-repayment'].values.interest.annualRate, 1.7);
  assert.equal(byId['general-interest-and-repayment'].effectiveFrom, '2026-07-01');
  assert.equal(byId['general-interest-and-repayment'].checkedAt, '2026-09-01');
  assert.ok(byId['general-interest-and-repayment'].sources.every(
    ({ url }) => url.startsWith('https://'),
  ));
  assert.ok(scenario.calculationTrace.steps.repayment.policyReferenceIds
    .includes('general-interest-and-repayment'));
  assert.ok(byId['eligibility:general:living'].sources.length > 0);
});

test('원리금균등은 금리 0%와 1.5%를 각각 계산한다', () => {
  assert.equal(amortizedLoan(5000, 0, 5).monthlyPayment, 5000 / 60);
  const loan = amortizedLoan(5000, 1.5, 5);
  assert.ok(loan.monthlyPayment > 86 && loan.monthlyPayment < 87);
});

test('잔여기간 0.5·1·4년은 학기와 생활개월에 공통 반영된다', () => {
  [[0.5, 1, 6], [1, 2, 12], [4, 8, 48]].forEach(([years, semesters, months]) => {
    const result = calculateFundingSummary({ ...SAMPLE_PROFILE, graduationYears: years });
    assert.equal(result.semesters, semesters);
    assert.equal(result.studyMonths, months);
    assert.equal(result.educationNeed, SAMPLE_PROFILE.tuitionPerSemester * semesters);
  });
});

test('학기별 실행분 원금 합계는 대출 구성 원금과 일치한다', () => {
  [1, 2, 8].forEach((semesters) => {
    const funding = { semesters, studyMonths: semesters * 6 };
    const composition = compositionFor(5000, funding);
    const schedule = buildLoanDisbursementSchedule(
      getLoanCompositionComponents(composition),
      funding.studyMonths,
      1.5,
    );
    const sum = schedule.reduce((total, item) => total + item.principal, 0);
    assert.ok(Math.abs(sum - 5000) < 1e-8);
  });
});

test('과거 프로필의 지원금 값은 시나리오 계산에 영향을 주지 않는다', () => {
  const withoutLegacyGrant = calculateScenario(SAMPLE_PROFILE, balance);
  const withLegacyGrant = calculateScenario({ ...SAMPLE_PROFILE, confirmedLivingGrantTotal: 600 }, balance);
  assert.deepEqual(withLegacyGrant.loanComposition, withoutLegacyGrant.loanComposition);
  assert.equal(withLegacyGrant.possibleCollegeSpend, withoutLegacyGrant.possibleCollegeSpend);
  assert.equal(withLegacyGrant.fundingGap, withoutLegacyGrant.fundingGap);
});

test('일반 상환은 입력의 과거 상환방식 값과 무관하게 원리금균등을 사용한다', () => {
  const funding = calculateFundingSummary(SAMPLE_PROFILE);
  const composition = compositionFor(3000, funding);
  const equalPayment = calculateLoan({ ...SAMPLE_PROFILE, repaymentMethod: 'equal-payment' }, composition, funding);
  const equalPrincipal = calculateLoan({ ...SAMPLE_PROFILE, repaymentMethod: 'equal-principal' }, composition, funding);
  assert.equal(equalPayment.repayments.general.repaymentMethod, 'equal-payment');
  assert.equal(equalPrincipal.repayments.general.repaymentMethod, 'equal-payment');
  assert.equal(equalPrincipal.monthlyScheduledPayment, equalPayment.monthlyScheduledPayment);
});

test('취업 후 상환은 기준소득 이하·경계·초과에서 예상 의무상환액을 계산한다', () => {
  const funding = calculateFundingSummary(SAMPLE_PROFILE);
  const composition = compositionFor(3000, funding, 'income-contingent');
  const policy = snapshotWithIncomeRepayment({ threshold: 3037, rate: 0.2 });
  const at = (annualIncome) => calculateLoan({ ...SAMPLE_PROFILE, loanType: 'income-contingent', salary: annualIncome / 12 }, composition, funding, {}, policy);
  assert.equal(at(3000).annualMandatoryRepayment, 0);
  assert.equal(at(3037).annualMandatoryRepayment, 0);
  assert.ok(Math.abs(at(3600).annualMandatoryRepayment - 112.6) < 1e-8);
});

test('정책값이 없으면 취업 후 상환액을 임의 계산하지 않는다', () => {
  const funding = calculateFundingSummary(SAMPLE_PROFILE);
  const composition = compositionFor(3000, funding, 'income-contingent');
  const policy = snapshotWithIncomeRepayment({ threshold: undefined, rate: undefined });
  const result = calculateLoan({ ...SAMPLE_PROFILE, loanType: 'income-contingent' }, composition, funding, {}, policy);
  assert.equal(result.calculationPossible, false);
  assert.equal(result.annualMandatoryRepayment, null);
  assert.equal(result.monthlyAverageMandatoryRepayment, null);
});

test('졸업 지연은 재학기간에 반영하고 취업 지연은 일반 상환 약정을 옮기지 않는다', () => {
  const baseline = calculateScenario(SAMPLE_PROFILE, balance);
  const gradDelay = calculateScenario(SAMPLE_PROFILE, balance, { graduationDelayMonths: 12 });
  const jobDelay = calculateScenario(SAMPLE_PROFILE, balance, { employmentDelayMonths: 12 });
  assert.equal(gradDelay.funding.studyMonths, baseline.funding.studyMonths + 12);
  assert.equal(jobDelay.funding.studyMonths, baseline.funding.studyMonths);
  assert.equal(jobDelay.transitionGap, SAMPLE_PROFILE.desiredCareerSpend * 12);
  assert.equal(jobDelay.loan.totalInterest, baseline.loan.totalInterest);
});

test('생활비 한도와 미충족 생활비를 등록금 원금과 섞지 않는다', () => {
  const scenarios = calculateAllScenarios({
    ...SAMPLE_PROFILE,
    currentWorkHours: 0,
    desiredCollegeSpend: 500,
    tuitionPerSemester: 2000,
    tuitionContributionPerSemester: 0,
  });
  assert.ok(scenarios.every((item) => item.loanComposition.totals.living <= 1600));
  assert.ok(scenarios.every((item) => item.unmetLivingGap > 0));
  assert.ok(scenarios.every((item) => item.loanComposition.totals.tuition === 16000));
});
