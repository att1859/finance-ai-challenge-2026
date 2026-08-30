import { calculatePlan } from '../application/calculate-plan.js';
import {
  applyPlan,
  resetStress,
  selectScenario,
  setProfile,
  updateStress,
  updateUi,
} from './actions.js';
import { selectedScenario as findSelectedScenario } from './selectors.js';
import { createInitialState } from './store.js';
import { DEFAULT_PROFILE, SAMPLE_PROFILE } from '../data/sample-profile.js';
import { monthlyWorkIncome } from '../domain/funding/work-income.js';
import { formatMoney, moneyHtml } from '../ui/formatters/money.js';
import {
  readProfile,
  renderDiagnosisSection,
  toggleLoanFields,
  validateProfile,
} from '../ui/sections/diagnosis-form.js';
import { renderFundingFormula } from '../ui/sections/funding-formula.js';
import {
  renderComparisonFigure,
  renderScenarioSelector,
} from '../ui/sections/scenario-comparison.js';
import { renderSelectedDetail } from '../ui/sections/selected-detail.js';
import { renderShell } from '../ui/sections/shell.js';
import { renderSources } from '../ui/sections/sources.js';
import { renderStressControls } from '../ui/sections/stress-controls.js';
import { renderSupportPrograms } from '../ui/sections/support-programs.js';
import { escapeHtml } from '../ui/shared/escape-html.js';
import { icon } from '../ui/shared/icon.js';

const app = document.querySelector('#app');
const state = createInitialState();

const safe = escapeHtml;
const money = moneyHtml;
const selectedScenario = () => findSelectedScenario(state);
const loanTypeLabel = (type) => type === 'income-contingent' ? '취업 후 상환' : '일반 상환';

function bindShell() {
  const form = document.querySelector('#diagnosis-form');
  const smoothingDialog = document.querySelector('#smoothing-dialog');
  form.elements.academicYear.value = state.profile.academicYear;
  form.elements.supportBracket.value = state.profile.supportBracket;
  app.addEventListener('click', handleClick);
  smoothingDialog?.addEventListener('click', (event) => {
    if (event.target === smoothingDialog) smoothingDialog.close();
  });
  form.addEventListener('submit', handleSubmit);
  form.addEventListener('input', handleFormInput);
  form.addEventListener('change', handleFormInput);
}

function handleClick(event) {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const action = trigger.dataset.action;
  if (action === 'sample') loadSample();
  if (action === 'manual') document.querySelector('#diagnosis-form input')?.focus();
  if (action === 'open-smoothing') openSmoothingDialog();
  if (action === 'close-smoothing') document.querySelector('#smoothing-dialog')?.close();
  if (action === 'catalog') {
    updateUi(state, { catalogOpen: !state.ui.catalogOpen });
    renderResults();
  }
  if (action === 'reset-stress') {
    resetStress(state);
    recalculate();
  }
}

function openSmoothingDialog() {
  const dialog = document.querySelector('#smoothing-dialog');
  if (!dialog) return;
  dialog.querySelectorAll('details[open]').forEach((details) => { details.open = false; });
  dialog.showModal();
  dialog.querySelector('.dialog-close').focus({ preventScroll: true });
  dialog.querySelector('.smoothing-dialog-body').scrollTop = 0;
}

function handleFormInput(event) {
  const form = event.currentTarget;
  if (event.target.name === 'loanType') toggleLoanFields(event.target.value);
  if (event.target.name === 'graduationYears') {
    const years = Number(event.target.value) || 0;
    document.querySelector('#graduation-equivalent').textContent = `${years}년 = ${years * 2}학기 · ${years * 12}개월`;
  }
  if (['currentWorkHours','hourlyWage'].includes(event.target.name)) {
    document.querySelector('#work-income-preview').innerHTML = money(monthlyWorkIncome(form.elements.currentWorkHours.value, form.elements.hourlyWage.value));
  }
}

function showErrors(errors) {
  document.querySelectorAll('.error').forEach((item) => { item.textContent = ''; });
  document.querySelectorAll('[aria-invalid="true"]').forEach((item) => item.removeAttribute('aria-invalid'));
  Object.entries(errors).forEach(([key, message]) => {
    const field = document.querySelector(`[name="${key}"]`);
    const error = document.querySelector(`[data-error-for="${key}"]`);
    if (field) field.setAttribute('aria-invalid','true');
    if (error) error.textContent = message;
  });
}

function handleSubmit(event) {
  event.preventDefault();
  const profile = readProfile(event.currentTarget);
  const errors = validateProfile(profile);
  showErrors(errors);
  if (Object.keys(errors).length) {
    document.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  setProfile(state, profile);
  updateUi(state, { loading: true, calculated: true });
  renderResults();
  window.setTimeout(() => {
    updateUi(state, { loading: false });
    recalculate(false);
    document.querySelector('#result-root')?.focus({ preventScroll: true });
    document.querySelector('#result-root')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 360);
}

function loadSample() {
  setProfile(state, {
    ...SAMPLE_PROFILE,
    specialQualifications: [...SAMPLE_PROFILE.specialQualifications],
  });
  updateUi(state, { inputMode: 'sample' });
  document.querySelector('.diagnosis-section').outerHTML = renderDiagnosisSection(
    state.profile,
    state.ui.inputMode,
  );
  const form = document.querySelector('#diagnosis-form');
  form.elements.academicYear.value = state.profile.academicYear;
  form.elements.supportBracket.value = state.profile.supportBracket;
  form.addEventListener('submit', handleSubmit);
  form.addEventListener('input', handleFormInput);
  form.addEventListener('change', handleFormInput);
  document.querySelector('#diagnosis')?.scrollIntoView({ behavior: 'smooth' });
}

function recalculate(announce = true) {
  applyPlan(state, calculatePlan(state.profile, state.stress));
  renderResults();
  if (announce) announceSelection();
}

function renderResults() {
  const root = document.querySelector('#result-root');
  if (!root || !state.ui.calculated) return;
  if (state.ui.loading) {
    root.innerHTML = `<section class="result-loading" aria-live="polite"><span class="loader" aria-hidden="true"></span><h2>세 가지 계획을 계산하고 있어요.</h2><p>확정 금액, 근로시간, 대출 유형을 같은 기준으로 비교합니다.</p></section>`;
    return;
  }
  const current = selectedScenario();
  const programs = state.supportPrograms;
  const supportSummary = state.supportSummary;
  root.innerHTML = `
    <section class="results" aria-labelledby="result-title">
      <div class="result-intro">
        <div><h2 id="result-title">내게 맞는 대학 생활 계획을 비교해 보세요.</h2><p>${safe(state.profile.school)} · 졸업까지 ${state.profile.graduationYears}년 · ${loanTypeLabel(state.profile.loanType)} 기준</p></div>
        <aside>${icon('info')}<p><strong>간이 예상 결과입니다.</strong> 실제 장학금 수혜와 대출 자격·승인은 한국장학재단과 각 기관이 최종 판단합니다.</p></aside>
      </div>
      ${renderScenarioSelector(state)}
      <p id="selection-status" class="sr-only" role="status" aria-live="polite"></p>
      ${renderComparisonFigure(state, current)}
      ${renderSelectedDetail(state, current)}
      ${renderFundingFormula(state, current)}
      ${renderSupportPrograms(state, programs, supportSummary)}
      ${renderStressControls(state, current)}
      ${renderSources()}
    </section>`;
  bindResultEvents();
}

function bindResultEvents() {
  document.querySelectorAll('input[name="scenario"]').forEach((input)=>input.addEventListener('change',(event)=>{
    selectScenario(state, event.target.value);
    renderResults(); announceSelection();
  }));
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    updateUi(state, { catalogFilter: button.dataset.filter });
    renderResults();
  }));
  document.querySelectorAll('.stress-controls input').forEach((input)=>input.addEventListener('change',(event)=>{
    if (event.target.name === 'employmentDelayMonths') {
      updateStress(state, { employmentDelayMonths: Number(event.target.value) });
    }
    if (event.target.name === 'salaryReduction') {
      updateStress(state, { salaryReductionRate: event.target.checked ? 0.2 : 0 });
    }
    if (event.target.name === 'graduationDelay') {
      updateStress(state, { graduationDelayMonths: event.target.checked ? 12 : 0 });
    }
    recalculate();
  }));
}

function announceSelection() {
  window.requestAnimationFrame(()=>{
    const status=document.querySelector('#selection-status'); const scenario=selectedScenario();
    if(status&&scenario) status.textContent=`${scenario.name} 선택. 대학 생활비 여력 ${formatMoney(scenario.possibleCollegeSpend,{digits:1})}, 주당 근로 ${scenario.workHours}시간, 상환 후 생활비 여력 ${formatMoney(scenario.possibleCareerSpend,{digits:1})}.`;
  });
}

export function bootstrapApp() {
  app.innerHTML = renderShell(state);
  bindShell();
}
