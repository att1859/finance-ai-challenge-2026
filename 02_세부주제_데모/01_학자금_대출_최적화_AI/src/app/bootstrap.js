import { mountAiAssistant } from './ai-chat.js';
import { renderRepaymentGuide } from '../ui/sections/repayment-guide.js';
import { selectableMonths, nearestMonth, moveSelectedMonth } from './chart-selection.js';
import { calculatePlan } from '../application/calculate-plan.js';
import { renderCustomEditor } from '../ui/sections/custom-scenario-editor.js';
import { validateCustomScenario, stepLivingAmount, requestedLivingAmounts, validateLivingAmount } from '../domain/scenarios/custom-scenario.js';
import {
  applyPlan,
  resetStress,
  selectLoanCandidate,
  selectScenario,
  selectComparison,
  setProfile,
  updateResultSelections,
  updateStress,
  updateUi,
} from './actions.js';
import { selectedScenario as findSelectedScenario } from './selectors.js';
import { createInitialState } from './store.js';
import { DEFAULT_PROFILE, SAMPLE_PROFILE } from '../data/sample-profile.js';
import { formatMoney } from '../ui/formatters/money.js';
import {
  readProfile,
  renderDiagnosisSection,
  validateProfile,
} from '../ui/sections/diagnosis-form.js';
import {
  confirmedCommonEligibility,
  renderLoanOptions,
} from '../ui/sections/loan-options.js';
import {
  renderComparisonFigure,
  renderScenarioSelector,
  renderPointReadout,
} from '../ui/sections/scenario-comparison.js';
import { renderSelectedDetail } from '../ui/sections/selected-detail.js';
import { renderShell } from '../ui/sections/shell.js';
import { escapeHtml } from '../ui/shared/escape-html.js';
import { icon } from '../ui/shared/icon.js';

const app = document.querySelector('#app');
const state = createInitialState();
let aiAssistant;

const safe = escapeHtml;
const selectedScenario = () => findSelectedScenario(state);

function bindShell() {
  const form = document.querySelector('#diagnosis-form');
  const smoothingDialog = document.querySelector('#smoothing-dialog');
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
  if (action === 'tuition-help') {
    const help = document.querySelector('#tuition-help');
    help.hidden = !help.hidden;
    trigger.setAttribute('aria-expanded', String(!help.hidden));
  }
  if (action === 'sample') loadSample();
  if (action === 'manual') document.querySelector('#diagnosis-form input')?.focus();
  if (action === 'open-smoothing') openSmoothingDialog();
  if (action === 'close-smoothing') document.querySelector('#smoothing-dialog')?.close();
  if (action === 'reset-stress') {
    resetStress(state);
    recalculate();
  }
  if (action === 'add-custom' || action === 'edit-custom') openCustomEditor(action === 'edit-custom' ? trigger.dataset.id : null);
  if (action === 'delete-custom') {
    const id = trigger.dataset.id;
    state.customScenarios = state.customScenarios.filter(item => item.id !== id);
    delete state.resultSelections.candidateByScenario[id];
    delete state.resultSelections.includeLivingByScenario[id];
    const remaining = state.currentScenarios.filter(s => s.id !== id).map(s => s.id);
    state.comparison.ids = state.comparison.ids.map(value => value === id ? remaining.find(v => !state.comparison.ids.includes(v)) : value);
    if (state.selectedScenarioId === id) state.selectedScenarioId = state.comparison.ids[0];
    recalculate();
    document.querySelector('[data-action="add-custom"]')?.focus({preventScroll:true});
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

function handleFormInput() {}

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
    document.querySelector('#repayment-guide')?.focus({ preventScroll: true });
    document.querySelector('#repayment-guide')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 360);
}

function loadSample() {
  setProfile(state, { ...SAMPLE_PROFILE });
  updateUi(state, { inputMode: 'sample' });
  document.querySelector('.diagnosis-section').outerHTML = renderDiagnosisSection(
    state.profile,
    state.ui.inputMode,
  );
  const form = document.querySelector('#diagnosis-form');
  form.addEventListener('submit', handleSubmit);
  form.addEventListener('input', handleFormInput);
  form.addEventListener('change', handleFormInput);
  document.querySelector('#diagnosis')?.scrollIntoView({ behavior: 'smooth' });
}

function recalculate(announce = true) {
  const selectionBefore = JSON.stringify(state.resultSelections);
  const resultSelections = Object.fromEntries(
    [...new Set([...state.currentScenarios.map(s => s.id), ...state.customScenarios.map(s => s.id)])].map(id => [id, {
      candidateId: state.resultSelections.candidateByScenario[id],
      includeLiving: state.resultSelections.includeLivingByScenario[id],
    }]),
  );
  applyPlan(state, calculatePlan({
    ...state.profile,
    customScenarios: state.customScenarios,
    graceYears: state.resultSelections.graceYears,
    repaymentYears: state.resultSelections.repaymentYears,
    resultSelections,
  }, state.stress));
  if (selectionBefore !== JSON.stringify(state.resultSelections)) { recalculate(announce); return; }
  renderResults();
  if (announce) announceSelection();
}

function recalculateResultOption(name, value, message) {
  recalculate(false);
  window.requestAnimationFrame(() => {
    const escapedValue = window.CSS?.escape ? window.CSS.escape(String(value)) : String(value);
    const selector = name === 'loanCandidate' && value != null
      ? `[name="${name}"][value="${escapedValue}"]`
      : `[name="${name}"]`;
    document.querySelector(selector)?.focus({ preventScroll: true });
    const status = document.querySelector('#condition-update-status');
    if (status) status.textContent = message;
  });
}

function renderResults() {
  aiAssistant?.update();
  const root = document.querySelector('#result-root');
  const openDetails = [...(root?.querySelectorAll('details[open]') ?? [])].map(el => el.dataset.detail).filter(Boolean);
  if (!root || !state.ui.calculated) return;
  if (state.ui.loading) {
    root.innerHTML = `<section class="result-loading" aria-live="polite"><span class="loader" aria-hidden="true"></span><h2>세 가지 계획을 계산하고 있어요.</h2><p>이번 학기 등록금, 생활비와 가능한 대출 구성을 함께 비교합니다.</p></section>`;
    return;
  }
  const current = selectedScenario();
  root.innerHTML = `
    <section class="results" aria-labelledby="result-title">
      ${renderRepaymentGuide()}
      <p id="selection-status" class="sr-only" role="status" aria-live="polite"></p>
      ${renderComparisonFigure(state, current)}
      ${renderScenarioSelector(state)}
      ${renderLoanOptions(state, current)}
      ${renderSelectedDetail(state, current)}
    </section>`;
  bindResultEvents();
  openDetails.forEach(key => { const details = root.querySelector(`[data-detail="${key}"]`); if (details) details.open = true; });
}

function bindResultEvents() {
  const restore = (name, value) => {
    renderResults();
    const controls = [...document.querySelectorAll('[name]')];
    controls.find(el => el.name === name && ((el.type !== 'radio' && el.getAttribute('role') !== 'radio') || el.value === value))?.focus({ preventScroll: true });
  };
  document.querySelectorAll('[name^="comparison-"], [name="condition-view"]').forEach(input => input.addEventListener('change', event => {
    const { name, value } = event.target;
    if (name === 'comparison-metric') state.comparison.metric = value;
    else if (name === 'condition-view') state.comparison.view = value;
    else selectComparison(state, Number(name.slice(-1)), value);
    restore(name, value);
  }));
  const months = selectableMonths(state);
  const updateMonth = month => {
    state.comparison.month = nearestMonth(months, month);
    document.querySelector('#timeline-readout').innerHTML = renderPointReadout(state);
    const x = 95 + state.comparison.month / months.at(-1) * 765;
    const cursor = document.querySelector('#timeline-cursor');
    cursor.setAttribute('x1', x); cursor.setAttribute('x2', x);
    const source = state.comparison.view === 'baseline' ? state.baselineScenarios : state.currentScenarios;
    const svg = document.querySelector('.timeline-chart');
    svg.querySelectorAll('.timeline-point').forEach(point => {
      const value = source.find(s => s.id === point.dataset.scenario).timeline.rows[state.comparison.month][state.comparison.metric];
      point.setAttribute('visibility', Number.isFinite(value) ? 'visible' : 'hidden');
      if (Number.isFinite(value)) {
        point.setAttribute('cx', x);
        point.setAttribute('cy', Number(svg.dataset.bottom) - (value - Number(svg.dataset.low)) / (Number(svg.dataset.high) - Number(svg.dataset.low)) * Number(svg.dataset.height));
      }
    });
  };
  document.querySelectorAll('[data-month-step]').forEach(button => button.addEventListener('click', () => updateMonth(moveSelectedMonth(months, state.comparison.month, Number(button.dataset.monthStep)))));
  const chart = document.querySelector('.timeline-chart');
  const pointer = event => {
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(chart.getScreenCTM().inverse());
    updateMonth((point.x - 95) / 765 * months.at(-1));
  };
  chart?.addEventListener('click', pointer);
  chart?.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    updateMonth(event.key === 'Home' ? 0 : event.key === 'End' ? months.at(-1) : moveSelectedMonth(months,state.comparison.month,event.key === 'ArrowLeft' ? -1 : 1));
  });
  document.querySelectorAll('.seed-choice').forEach(group => {
    const choose = button => {
      const {name,value} = button;
      if (name === 'employmentDelayMonths') { updateStress(state,{employmentDelayMonths:Number(value)}); recalculate(); restore(name,value); }
      else button.dispatchEvent(new Event('change',{bubbles:true}));
    };
    group.addEventListener('click',event=>{const button=event.target.closest('button');if(button)choose(button);});
    group.addEventListener('keydown',event=>{
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const buttons=[...group.querySelectorAll('button')], index=buttons.indexOf(document.activeElement);
      choose(buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowLeft'?-1:1)+buttons.length)%buttons.length]);
    });
  });
  document.querySelectorAll('input[name="scenario"]').forEach((input)=>input.addEventListener('change',(event)=>{
    selectScenario(state, event.target.value);
    restore('scenario', event.target.value); announceSelection();
  }));
  document.querySelectorAll('.loan-options input, .loan-options select').forEach((input) => (
    input.addEventListener('change', handleResultOptionChange)
  ));
  document.querySelector('.eligibility-panel')?.addEventListener('toggle', (event) => {
    updateResultSelections(state, {
      eligibilityDetailsOpen: event.currentTarget.open,
    });
  });
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
    const { name, value } = event.target;
    recalculate();
    restore(name, value);
  }));
}

function handleResultOptionChange(event) {
  const { name, value, checked: isChecked, type } = event.target;
  const scenarioId = state.selectedScenarioId;
  if (name === 'loanCandidate') {
    selectLoanCandidate(state, scenarioId, value);
    const custom = state.customScenarios.find(s=>s.id===scenarioId);
    if (custom) custom.candidateId = value;
    recalculateResultOption(
      name,
      value,
      '대출 구성을 바꿔 자격과 상환 결과를 다시 계산했습니다.',
    );
    return;
  }
  if (name === 'includeLivingLoan') {
    updateResultSelections(state, {
      includeLivingByScenario: {
        ...state.resultSelections.includeLivingByScenario,
        [scenarioId]: isChecked,
      },
    });
    recalculateResultOption(
      name,
      null,
      '생활비 대출 선택을 반영해 생활비 여력과 대출 실행·상환 결과를 다시 계산했습니다.',
    );
    return;
  }
  if (name === 'graceYears' || name === 'repaymentYears') {
    const numericValue = Number(value);
    const custom = state.customScenarios.find(s=>s.id===scenarioId);
    if (custom) custom[name] = numericValue;
    else { updateResultSelections(state, { [name]: numericValue }); setProfile(state, { ...state.profile, [name]: numericValue }); }
    recalculateResultOption(
      name,
      value,
      '일반 상환 기간을 반영해 월 납입액과 10년 결과를 다시 계산했습니다.',
    );
    return;
  }
  if (name === 'hasExistingLoan') {
    updateResultSelections(state, { hasExistingLoan: isChecked });
    setProfile(state, {
      ...state.profile,
      existingLoanBalance: isChecked ? state.profile.existingLoanBalance : 0,
    });
    recalculateResultOption(
      name,
      null,
      '기존 학자금대출 선택을 반영해 상환 결과를 다시 계산했습니다.',
    );
    return;
  }
  if (name === 'commonEligibilityConfirmed') {
    setProfile(state, {
      ...state.profile,
      commonEligibilityConfirmed: isChecked,
      commonEligibility: isChecked ? confirmedCommonEligibility() : {},
    });
    recalculateResultOption(
      name,
      null,
      '공통 신청요건 확인을 반영해 자격과 추천 후보를 다시 계산했습니다.',
    );
    return;
  }
  const numericFields = ['age', 'previousSemesterScore', 'previousSemesterCredits', 'existingLoanBalance'];
  const profileValue = numericFields.includes(name)
    ? (value === '' ? undefined : Number(value))
    : type === 'checkbox'
      ? isChecked
      : value;
  setProfile(state, { ...state.profile, [name]: profileValue });
  recalculateResultOption(
    name,
    value,
    '입력한 조건을 반영해 자격, 추천 후보와 상환 결과를 다시 계산했습니다.',
  );
}

function announceSelection() {
  window.requestAnimationFrame(()=>{
    const status=document.querySelector('#selection-status'); const scenario=selectedScenario();
    if(status&&scenario) status.textContent=`${scenario.name} 선택. 대학 생활비 여력 ${formatMoney(scenario.possibleCollegeSpend,{digits:1})}, 상환 후 생활비 여력 ${formatMoney(scenario.possibleCareerSpend,{digits:1})}.`;
  });
}

export function bootstrapApp() {
  app.innerHTML = renderShell(state);
  bindShell();
  aiAssistant = mountAiAssistant(state);
  window.matchMedia('(max-width: 580px)').addEventListener('change', () => { if (state.ui.calculated) renderResults(); });
}

function openCustomEditor(id) {
  const scenario = selectedScenario();
  const existing = state.customScenarios.find(item => item.id === id);
  const amounts = scenario.livingLoan.semesters.map(row => row.principal);
  const draft = existing ? structuredClone(existing) : {
    name: `내 시나리오 ${state.nextCustomId}`,
    tuitionStrategy: scenario.custom?.tuitionStrategy ?? scenario.strategy,
    livingPerSemester: amounts[0] ?? 0,
    livingBySemester: amounts.every(v => v === amounts[0]) ? null : amounts,
    graceYears: scenario.custom?.graceYears ?? state.resultSelections.graceYears,
    repaymentYears: scenario.custom?.repaymentYears ?? state.resultSelections.repaymentYears,
  };
  draft.candidateId = state.resultSelections.candidateByScenario[id ?? scenario.id] ?? 'general:general';
  const count = scenario.funding.semesters;
  document.querySelector('#custom-editor')?.remove();
  app.insertAdjacentHTML('beforeend', renderCustomEditor(draft, count, Boolean(existing)));
  const dialog = document.querySelector('#custom-editor');
  const form = dialog.querySelector('form');
  const read = () => ({
    ...draft, name: form.elements['custom-name'].value.trim(),
    livingPerSemester: form.elements['custom-amount'].value,
    livingBySemester: null,
    graceYears: Number(form.elements['custom-grace'].value),
    repaymentYears: Number(form.elements['custom-repayment'].value),
    candidateId: `${form.elements['custom-tuition'].value}:${form.elements['custom-living'].value}`,
  });
  const preview = () => {
    const config = read();
    dialog.querySelector('#custom-error').textContent = '';
    dialog.querySelectorAll('[data-field-error]').forEach(el => {
      const input = form.elements[el.dataset.fieldError];
      const error = validateLivingAmount(input.value);
      el.textContent = error ?? '';
      input.setAttribute('aria-invalid', String(Boolean(error)));
    });
    const values = requestedLivingAmounts(config, count);
    const valid = !validateLivingAmount(config.livingPerSemester) && values.every((v,i)=>!validateLivingAmount(config.livingBySemester?.[i] ?? config.livingPerSemester));
    dialog.querySelector('#custom-amount-preview').textContent = valid
      ? `${count}학기 생활비 대출 합계 ${values.reduce((s,v)=>s+v,0).toLocaleString('ko-KR')}만 원 · 학기별 실행 후 해당 학기 생활비로 나눠 사용합니다.`
      : '실행 가능한 금액을 입력하면 합계를 표시합니다.';
  };
  form.addEventListener('input', preview);
  form.addEventListener('change', preview);
  form.addEventListener('click', event => {
    if (event.target.closest('[data-close-editor]')) { dialog.close(); return; }
    const step = event.target.closest('[data-amount-step]');
    if (step) {
      const input = form.elements[step.dataset.field];
      input.value = stepLivingAmount(input.value, Number(step.dataset.amountStep));
      preview();
    }
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    document.querySelector(existing ? `[data-action="edit-custom"][data-id="${id}"]` : '[data-action="add-custom"]')?.focus({preventScroll:true});
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const config = read();
    const errors = validateCustomScenario(config, state.profile, count);
    if (state.currentScenarios.some(s => s.id !== id && s.name === config.name)) errors.name = '다른 시나리오와 구분되는 이름을 입력해 주세요.';
    if (Object.keys(errors).length) {
      dialog.querySelector('#custom-error').textContent = [...new Set(Object.values(errors))].join(' ');
      const key = Object.keys(errors)[0];
      const fieldName = {name:'custom-name',livingPerSemester:'custom-amount'}[key] ?? key;
      form.elements[fieldName]?.focus();
      return;
    }
    const savedId = id ?? `custom-${state.nextCustomId++}`;
    const saved = {...config,id:savedId,livingPerSemester:Number(config.livingPerSemester),livingBySemester:config.livingBySemester?.map(Number) ?? null};
    state.customScenarios = existing ? state.customScenarios.map(item=>item.id===id?saved:item) : [...state.customScenarios,saved];
    state.resultSelections.candidateByScenario[savedId] = saved.candidateId;
    state.resultSelections.includeLivingByScenario[savedId] = true;
    if (!existing) state.comparison.ids[1] = savedId;
    state.selectedScenarioId = savedId;
    dialog.close();
    recalculate();
    document.querySelector('#detail-title')?.scrollIntoView({block:'nearest'});
  });
  preview();
  dialog.showModal();
  form.elements['custom-name'].focus();
}
