import './style.css';
import {
  DEFAULT_INPUTS, SAMPLE_INPUTS, SCENARIO_DEFINITIONS, buildScenarioComparison,
  calculateAllScenarios, formatMoney, monthlyWorkIncome, roundMoney,
} from './lib/calculations.js';
import { evaluateScholarships, PROGRAM_STATUSES, summarizeScholarships } from './data/scholarships.js';
import { GENERAL_LOAN_POLICY, INCOME_CONTINGENT_POLICY } from './data/loanPolicies.js';

const app = document.querySelector('#app');
const state = {
  profile: { ...DEFAULT_INPUTS },
  selectedScenarioId: 'balance',
  baselineScenarios: [],
  currentScenarios: [],
  stress: { employmentDelayMonths: 0, salaryReductionRate: 0, graduationDelayMonths: 0 },
  calculated: false,
  loading: false,
  catalogOpen: false,
  catalogFilter: '전체',
};

const icon = (name) => {
  const icons = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    shield: '<path d="M12 3l7 3v5c0 4.6-2.8 7.4-7 10-4.2-2.6-7-5.4-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
    check: '<path d="M5 12l4 4L19 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    reset: '<path d="M4 7v5h5"/><path d="M5.5 15a7 7 0 101-8L4 12"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${icons[name] || ''}</svg>`;
};

const safe = (value) => String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
const money = (value, digits = 0) => `<span class="nowrap">${formatMoney(value, { digits })}</span>`;
const signedMoney = (value) => !Number.isFinite(value) ? '계산 불가' : `${value >= 0 ? '+' : ''}${formatMoney(value, { digits: 1 })}`;
const scenarioById = (id, scenarios = state.currentScenarios) => scenarios.find((item) => item.id === id);
const selectedScenario = () => scenarioById(state.selectedScenarioId);
const loanTypeLabel = (type) => type === 'income-contingent' ? '취업 후 상환' : '일반 상환';

function renderShell() {
  app.innerHTML = `
    <a class="skip-link" href="#main">본문으로 바로가기</a>
    <header class="site-header">
      <a class="brand" href="#top" aria-label="학자금 소비평탄화 AI 홈">
        <span class="brand-mark" aria-hidden="true">평</span>
        <span>학자금 소비평탄화 AI</span>
      </a>
      <nav aria-label="주요 메뉴">
        <a href="#diagnosis">계획 계산</a>
        <a href="#how-it-works">계산 방식</a>
        <a href="#sources">공식 정보</a>
      </nav>
    </header>
    <main id="main">
      <section class="hero" id="top" aria-labelledby="hero-title">
        <div class="hero-copy">
          <h1 id="hero-title">대학 생활과 졸업 후 부담을 한 번에 비교해 보세요.</h1>
          <p class="hero-lead">확정된 지원금과 근로소득을 먼저 반영하고, 남은 필요자금을 공적 학자금대출과 나눠 세 가지 계획으로 보여드려요.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#diagnosis">내 계획 계산하기 ${icon('arrow')}</a>
            <button class="button button-quiet" type="button" data-action="sample">예시 정보로 시작하기</button>
          </div>
          <p class="privacy-note">${icon('shield')} 입력 정보는 브라우저 세션에서만 계산하며 서버에 저장하지 않습니다.</p>
        </div>
        <aside class="hero-ledger" aria-label="비교할 세 가지 기준">
          <p class="ledger-kicker">세 계획에서 달라지는 것</p>
          <ol>
            <li><span>01</span><strong>대학 시절 월 생활비 여력</strong></li>
            <li><span>02</span><strong>주당 근로시간</strong></li>
            <li><span>03</span><strong>상환 후 월 생활비 여력</strong></li>
          </ol>
          <p>한 가지 숫자보다 지금의 시간과 미래의 부담을 함께 살펴보세요.</p>
        </aside>
      </section>

      <section class="process-strip" id="how-it-works" aria-label="계산 과정">
        <span><b>1</b> 확정 금액 입력</span><span aria-hidden="true">→</span>
        <span><b>2</b> 세 계획 계산</span><span aria-hidden="true">→</span>
        <span><b>3</b> 부담 비교</span>
      </section>

      <section class="diagnosis-section" id="diagnosis" aria-labelledby="diagnosis-title">
        <div class="section-heading">
          <h2 id="diagnosis-title">계산에 필요한 정보를 입력해 주세요.</h2>
          <p>모르는 지원사업 금액은 넣지 않아도 됩니다. 실제 납부액과 이미 확정된 지원금만 계산에 사용해요.</p>
        </div>
        <div class="input-mode" aria-label="입력 방식">
          <button class="mode-option is-active" type="button" data-action="manual"><span>직접 입력</span><small>내 상황에 맞게 값을 바꿔요</small></button>
          <button class="mode-option" type="button" data-action="sample"><span>예시 정보로 시작하기</span><small>가상 정보가 입력돼요</small></button>
        </div>
        ${renderForm()}
      </section>
      <div id="result-root" tabindex="-1"></div>
    </main>
    <footer>
      <div><strong>학자금 소비평탄화 AI</strong><p>장학금 후보 확인과 학비·생활비 계획을 돕는 간이 계산 서비스</p></div>
      <p>주민등록번호, 계좌번호, 인증서, 금융기관 비밀번호를 요구하지 않습니다.</p>
    </footer>`;
}

function renderForm() {
  const p = state.profile;
  return `
    <form id="diagnosis-form" novalidate>
      <div class="form-section">
        <div class="form-section-title"><span>01</span><div><h3>재학 정보</h3><p>졸업까지 남은 기간이 총 필요금액과 대출 실행 횟수를 결정해요.</p></div></div>
        <div class="form-grid">
          <label class="field"><span>학교</span><input name="school" value="${safe(p.school)}" placeholder="학교명을 입력해 주세요" required><small class="error" data-error-for="school"></small></label>
          <label class="field"><span>학년</span><select name="academicYear"><option value="1">1학년</option><option value="2">2학년</option><option value="3">3학년</option><option value="4">4학년 이상</option></select></label>
          <label class="field"><span>졸업까지 남은 기간</span><span class="input-unit"><input name="graduationYears" type="number" min="0.5" max="8" step="0.5" value="${p.graduationYears}" required><em>년</em></span><small id="graduation-equivalent" class="field-hint">${p.graduationYears}년 = ${p.graduationYears * 2}학기 · ${p.graduationYears * 12}개월</small><small class="error" data-error-for="graduationYears"></small></label>
          <label class="field"><span>지역</span><select name="region">${['서울특별시','경기도','인천광역시','부산광역시','대구광역시','광주광역시','대전광역시','울산광역시','강원특별자치도','충청북도','충청남도','전북특별자치도','전라남도','경상북도','경상남도','제주특별자치도'].map((item) => `<option ${p.region === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title"><span>02</span><div><h3>학비와 지원 정보</h3><p>후보 장학금은 빼지 않고, 확정된 금액만 반영합니다.</p></div></div>
        <div class="form-grid">
          <label class="field"><span>확정 장학금·감면 반영 후 학기당 실제 납부 등록금</span><span class="input-unit"><input name="tuitionPerSemester" type="number" min="0" value="${p.tuitionPerSemester}" required><em>만 원</em></span><small class="error" data-error-for="tuitionPerSemester"></small></label>
          <label class="field"><span>졸업 전까지 확정된 생활비성 지원금 총액 <i>선택</i></span><span class="input-unit"><input name="confirmedLivingGrantTotal" type="number" min="0" value="${p.confirmedLivingGrantTotal}"><em>만 원</em></span><small class="field-hint">수혜가 확정된 금액만 입력해 주세요.</small></label>
          <label class="field"><span>학자금 지원구간</span><select name="supportBracket"><option value="">모름 / 확인 필요</option>${Array.from({length:10},(_,i)=>`<option value="${i+1}">${i+1}구간</option>`).join('')}</select></label>
          <fieldset class="field field-wide"><legend>특별 자격 <i>선택</i></legend><div class="check-row">${['다자녀','농어촌 가구','비수도권 인재','다문화·탈북 배경'].map((item)=>`<label><input type="checkbox" name="specialQualifications" value="${item}" ${p.specialQualifications.includes(item)?'checked':''}><span>${item}</span></label>`).join('')}</div></fieldset>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title"><span>03</span><div><h3>생활과 근로</h3><p>희망 생활비와 근로시간의 차이를 세 계획에서 비교해요.</p></div></div>
        <div class="form-grid three">
          ${numberField('desiredCollegeSpend','대학 시절 희망 월 생활비',p.desiredCollegeSpend,'만 원')}
          ${numberField('hourlyWage','현재 시급',p.hourlyWage,'원')}
          ${numberField('currentWorkHours','현재 주당 근로시간',p.currentWorkHours,'시간')}
          ${numberField('desiredWorkHours','희망 주당 근로시간',p.desiredWorkHours,'시간')}
          ${numberField('salary','취업 후 예상 월소득',p.salary,'만 원')}
          ${numberField('desiredCareerSpend','취업 후 희망 월 생활비',p.desiredCareerSpend,'만 원')}
        </div>
        <p class="inline-summary">현재 월 근로소득 예상 <strong id="work-income-preview">${money(monthlyWorkIncome(p.currentWorkHours,p.hourlyWage))}</strong> <span>주휴수당 제외</span></p>
      </div>
      <div class="form-section">
        <div class="form-section-title"><span>04</span><div><h3>대출 계획</h3><p>상환 방식에 따라 졸업 후 표시되는 금액이 달라져요.</p></div></div>
        <fieldset class="loan-type-fieldset"><legend>학자금대출 유형</legend><div class="loan-type-grid">
          ${loanChoice('general','일반 상환','정한 거치·상환기간에 따라 매달 갚아요.',p.loanType)}
          ${loanChoice('income-contingent','취업 후 상환','연소득이 기준을 넘으면 의무상환액이 생겨요.',p.loanType)}
        </div></fieldset>
        <details class="loan-explainer"><summary>두 대출 유형은 무엇이 다른가요? ${icon('chevron')}</summary><div><p><strong>일반 상환</strong>은 거치기간 뒤 정해진 기간 동안 원금과 이자를 갚습니다.</p><p><strong>취업 후 상환</strong>은 소득이 상환기준을 넘으면 초과분을 기준으로 의무상환액이 정해집니다. 실제 자격과 상환액은 공식 심사를 확인해야 합니다.</p></div></details>
        <div class="form-grid three loan-common">
          ${numberField('loanCap','신규 대출 한도',p.loanCap,'만 원')}
          ${numberField('existingLoanBalance','현재 학자금대출 잔액',p.existingLoanBalance,'만 원')}
          ${numberField('annualRate','계산 금리',p.annualRate,'%', '0.1')}
        </div>
        <div id="general-loan-fields" class="form-grid three ${p.loanType === 'general' ? '' : 'is-hidden'}">
          ${numberField('graceYears','졸업 후 거치기간',p.graceYears,'년','0.5')}
          ${numberField('repaymentYears','상환기간',p.repaymentYears,'년','0.5')}
          <fieldset class="field"><legend>상환 방식</legend><div class="segmented"><label><input type="radio" name="repaymentMethod" value="equal-payment" ${p.repaymentMethod==='equal-payment'?'checked':''}><span>원리금균등</span></label><label><input type="radio" name="repaymentMethod" value="equal-principal" ${p.repaymentMethod==='equal-principal'?'checked':''}><span>원금균등</span></label></div></fieldset>
        </div>
        <p id="icl-policy-note" class="policy-inline ${p.loanType === 'income-contingent' ? '' : 'is-hidden'}">${icon('info')} ${INCOME_CONTINGENT_POLICY.basisYear}년 상환기준소득 ${money(INCOME_CONTINGENT_POLICY.annualIncomeThreshold)}, 예상 의무상환율 ${INCOME_CONTINGENT_POLICY.repaymentRate*100}%를 사용합니다.</p>
      </div>
      <div class="form-submit-row"><div><strong>입력값을 바꾸면 세 계획을 다시 계산합니다.</strong><p>간이 예상 결과이며 공식 심사·승인 결과가 아닙니다.</p></div><button class="button button-primary button-large" type="submit">세 가지 계획 비교하기 ${icon('arrow')}</button></div>
    </form>`;
}

function numberField(name, label, value, unit, step = '1') {
  return `<label class="field"><span>${label}</span><span class="input-unit"><input name="${name}" type="number" min="0" step="${step}" value="${value}" required><em>${unit}</em></span><small class="error" data-error-for="${name}"></small></label>`;
}

function loanChoice(value, title, copy, selected) {
  return `<label class="loan-choice"><input type="radio" name="loanType" value="${value}" ${selected===value?'checked':''} required><span><strong>${title}</strong><small>${copy}</small></span></label>`;
}

function bindShell() {
  const form = document.querySelector('#diagnosis-form');
  form.elements.academicYear.value = state.profile.academicYear;
  form.elements.supportBracket.value = state.profile.supportBracket;
  app.addEventListener('click', handleClick);
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
  if (action === 'catalog') { state.catalogOpen = !state.catalogOpen; renderResults(); }
  if (action === 'reset-stress') { state.stress = { employmentDelayMonths: 0, salaryReductionRate: 0, graduationDelayMonths: 0 }; recalculate(); }
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

function toggleLoanFields(type) {
  document.querySelector('#general-loan-fields').classList.toggle('is-hidden', type !== 'general');
  document.querySelector('#icl-policy-note').classList.toggle('is-hidden', type !== 'income-contingent');
}

function readProfile(form) {
  const data = new FormData(form);
  const numeric = ['tuitionPerSemester','confirmedLivingGrantTotal','desiredCollegeSpend','desiredCareerSpend','currentWorkHours','desiredWorkHours','hourlyWage','graduationYears','salary','loanCap','annualRate','repaymentYears','graceYears','existingLoanBalance'];
  const profile = { ...DEFAULT_INPUTS };
  for (const [key, value] of data.entries()) if (!numeric.includes(key) && key !== 'specialQualifications') profile[key] = value;
  numeric.forEach((key) => { profile[key] = Number(data.get(key) ?? DEFAULT_INPUTS[key]); });
  profile.specialQualifications = data.getAll('specialQualifications');
  return profile;
}

function validateProfile(profile) {
  const errors = {};
  if (!profile.school.trim()) errors.school = '학교명을 입력해 주세요.';
  if (profile.graduationYears < 0.5 || profile.graduationYears > 8 || (profile.graduationYears * 2) % 1 !== 0) errors.graduationYears = '0.5년 단위로 0.5~8년 사이를 입력해 주세요.';
  ['tuitionPerSemester','desiredCollegeSpend','desiredCareerSpend','currentWorkHours','desiredWorkHours','hourlyWage','salary','loanCap','annualRate','repaymentYears','graceYears','existingLoanBalance'].forEach((key) => {
    if (!Number.isFinite(profile[key]) || profile[key] < 0) errors[key] = '0 이상의 숫자를 입력해 주세요.';
  });
  return errors;
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
  state.profile = profile;
  state.loading = true;
  state.calculated = true;
  renderResults();
  window.setTimeout(() => {
    state.loading = false;
    recalculate(false);
    document.querySelector('#result-root')?.focus({ preventScroll: true });
    document.querySelector('#result-root')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 360);
}

function loadSample() {
  state.profile = { ...SAMPLE_INPUTS, specialQualifications: [...SAMPLE_INPUTS.specialQualifications] };
  document.querySelector('.diagnosis-section').outerHTML = `<section class="diagnosis-section" id="diagnosis" aria-labelledby="diagnosis-title"><div class="section-heading"><h2 id="diagnosis-title">계산에 필요한 정보를 입력해 주세요.</h2><p>모르는 지원사업 금액은 넣지 않아도 됩니다. 실제 납부액과 이미 확정된 지원금만 계산에 사용해요.</p></div><div class="input-mode" aria-label="입력 방식"><button class="mode-option" type="button" data-action="manual"><span>직접 입력</span><small>내 상황에 맞게 값을 바꿔요</small></button><button class="mode-option is-active" type="button" data-action="sample"><span>예시 정보로 시작하기</span><small>가상 정보가 입력됐어요</small></button></div>${renderForm()}</section>`;
  const form = document.querySelector('#diagnosis-form');
  form.elements.academicYear.value = state.profile.academicYear;
  form.elements.supportBracket.value = state.profile.supportBracket;
  form.addEventListener('submit', handleSubmit);
  form.addEventListener('input', handleFormInput);
  form.addEventListener('change', handleFormInput);
  document.querySelector('#diagnosis')?.scrollIntoView({ behavior: 'smooth' });
}

function recalculate(announce = true) {
  state.baselineScenarios = calculateAllScenarios(state.profile);
  state.currentScenarios = calculateAllScenarios(state.profile, state.stress);
  if (!scenarioById(state.selectedScenarioId)) state.selectedScenarioId = 'balance';
  renderResults();
  if (announce) announceSelection();
}

function renderResults() {
  const root = document.querySelector('#result-root');
  if (!root || !state.calculated) return;
  if (state.loading) {
    root.innerHTML = `<section class="result-loading" aria-live="polite"><span class="loader" aria-hidden="true"></span><h2>세 가지 계획을 계산하고 있어요.</h2><p>확정 금액, 근로시간, 대출 유형을 같은 기준으로 비교합니다.</p></section>`;
    return;
  }
  const current = selectedScenario();
  const programs = evaluateScholarships(state.profile);
  const scholarshipSummary = summarizeScholarships(programs);
  root.innerHTML = `
    <section class="results" aria-labelledby="result-title">
      <div class="result-intro">
        <div><h2 id="result-title">내게 맞는 대학 생활 계획을 비교해 보세요.</h2><p>${safe(state.profile.school)} · 졸업까지 ${state.profile.graduationYears}년 · ${loanTypeLabel(state.profile.loanType)} 기준</p></div>
        <aside>${icon('info')}<p><strong>간이 예상 결과입니다.</strong> 실제 장학금 수혜와 대출 자격·승인은 한국장학재단과 각 기관이 최종 판단합니다.</p></aside>
      </div>
      ${renderScenarioSelector()}
      <p id="selection-status" class="sr-only" role="status" aria-live="polite"></p>
      ${renderComparisonFigure(current)}
      ${renderSelectedDetail(current)}
      ${renderFundingFormula(current)}
      ${renderScholarships(programs, scholarshipSummary)}
      ${renderStress(current)}
      ${renderSources()}
    </section>`;
  bindResultEvents();
}

function renderScenarioSelector() {
  return `<fieldset class="scenario-selector"><legend>비교할 계획을 선택하세요.</legend><div class="scenario-options">${state.currentScenarios.map((scenario) => `
    <label class="scenario-option ${scenario.id === state.selectedScenarioId ? 'is-selected' : ''}">
      <input type="radio" name="scenario" value="${scenario.id}" ${scenario.id===state.selectedScenarioId?'checked':''}>
      <span class="scenario-radio" aria-hidden="true"></span>
      <span class="scenario-option-copy"><span class="scenario-label-line"><strong>${scenario.name}</strong>${scenario.defaultView?'<em>기본 보기</em>':''}${scenario.id===state.selectedScenarioId?'<b>내 선택</b>':''}</span><small>${scenario.summary}</small></span>
    </label>`).join('')}</div></fieldset>`;
}

function renderComparisonFigure(current) {
  const rows = buildScenarioComparison(state.currentScenarios, state.profile);
  return `<figure class="comparison-figure" aria-labelledby="comparison-title">
    <figcaption><div><h3 id="comparison-title">지금의 시간과 미래의 부담을 같은 자리에서 보세요.</h3></div><p>막대 길이는 각 지표 안에서만 비교하세요. 단위가 서로 다릅니다.</p></figcaption>
    <div class="scenario-key" aria-hidden="true">${state.currentScenarios.map((s)=>`<span class="${s.id===current.id?'is-selected':''}"><i></i>${s.name}${s.id===current.id?'<b>내 선택</b>':''}</span>`).join('')}</div>
    <div class="metric-chart" aria-hidden="true">${rows.map((row) => renderMetricRow(row,current)).join('')}</div>
    ${renderAccessibleTable(rows)}
  </figure>`;
}

function renderMetricRow(row, current) {
  const finiteValues = row.values.map((item)=>item.value).filter(Number.isFinite);
  const max = Math.max(1, row.reference || 0, row.currentReference || 0, ...finiteValues.map((v)=>Math.max(0,v))) * 1.12;
  const marker = (value, label) => value == null ? '' : `<span class="reference-marker" style="--left:${Math.min(98,Math.max(0,value/max*100))}%"><b>${label}</b></span>`;
  return `<section class="metric-row"><div class="metric-heading"><h4>${row.label}</h4><span>${row.unit}</span></div><div class="metric-bars">${marker(row.reference,row.referenceLabel)}${row.currentReference!=null?marker(row.currentReference,'현재'):''}${row.values.map((item)=>{
    const scenario = scenarioById(item.id);
    if (!Number.isFinite(item.value)) return `<div class="bar-line boundary"><span>${scenario.name}</span><strong>계산 불가</strong></div>`;
    if (item.value < 0) return `<div class="bar-line boundary"><span>${scenario.name}</span><strong>${signedMoney(item.value)} · 부족</strong></div>`;
    const width = Math.max(item.value===0?0:2,Math.min(100,item.value/max*100));
    return `<div class="bar-line ${item.id===current.id?'is-selected':''}"><span>${scenario.name}</span><i style="--width:${width}%"></i><strong>${row.id==='work'?`${roundMoney(item.value,0)}시간`:`${formatMoney(item.value,{digits:1})}`}${item.id===current.id?'<em>내 선택</em>':''}</strong></div>`;
  }).join('')}</div></section>`;
}

function renderAccessibleTable(rows) {
  return `<div class="table-wrap"><table><caption>세 시나리오 지표 비교표</caption><thead><tr><th scope="col">지표</th>${state.currentScenarios.map((s)=>`<th scope="col">${s.name}${s.id===state.selectedScenarioId?' (내 선택)':''}</th>`).join('')}<th scope="col">사용자 기준</th></tr></thead><tbody>${rows.map((row)=>`<tr><th scope="row">${row.label}<small>${row.unit}</small></th>${row.values.map((item)=>`<td>${Number.isFinite(item.value)?(row.id==='work'?`${roundMoney(item.value,0)}시간`:`${formatMoney(item.value,{digits:1})}`):'계산 불가'}</td>`).join('')}<td>${row.id==='work'?`희망 ${row.reference}시간 · 현재 ${row.currentReference}시간`:`희망 ${formatMoney(row.reference)}`}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderSelectedDetail(scenario) {
  const loan = scenario.loan;
  const safety = { safe:['여유 있음','입력한 희망 생활비를 충족합니다.'], watch:['조정 필요','희망 생활비보다 낮아 다른 지출과 함께 점검해야 합니다.'], 'at-risk':['주의','상환 뒤 생활비 여력이 안전선보다 낮습니다.'], deficit:['부족','상환액이 예상 소득보다 큽니다.'], 'calculation-impossible':['계산 불가','공식 정책값을 확인한 뒤 다시 계산해야 합니다.'] }[scenario.safety];
  const other = state.currentScenarios.filter((item)=>item.id!==scenario.id);
  const workDelta = scenario.workHours - state.profile.currentWorkHours;
  const closestCollege = [...other].sort((a,b)=>Math.abs(a.possibleCollegeSpend-scenario.possibleCollegeSpend)-Math.abs(b.possibleCollegeSpend-scenario.possibleCollegeSpend))[0];
  return `<section class="selected-detail" aria-labelledby="detail-title">
    <div class="detail-heading"><div><h3 id="detail-title">${scenario.name}</h3><p>${scenario.summary}</p></div><span class="safety safety-${scenario.safety}"><b>${safety[0]}</b>${safety[1]}</span></div>
    <div class="detail-metrics">
      ${metric('대학 시절 월 생활비 여력',money(scenario.possibleCollegeSpend,1),`희망 ${formatMoney(state.profile.desiredCollegeSpend)} 대비 ${signedMoney(scenario.collegeSpendGap)}`)}
      ${metric('시나리오 주당 근로시간',`${scenario.workHours}<small>시간</small>`,`현재 대비 ${workDelta>=0?'+':''}${workDelta}시간 · 희망 ${state.profile.desiredWorkHours}시간`)}
      ${metric('상환 후 월 생활비 여력',money(scenario.possibleCareerSpend,1),`희망 ${formatMoney(state.profile.desiredCareerSpend)} 대비 ${signedMoney(scenario.careerSpendGap)}`)}
      ${metric('졸업 시 예상 대출잔액',money(loan.balanceAtGraduation,1),`신규 원금 ${formatMoney(scenario.newLoan,1)}`)}
    </div>
    <div class="loan-detail">
      <div><h4>${loanTypeLabel(state.profile.loanType)} · ${state.profile.loanType==='general'?'정해진 기간에 갚는 예상 상환액':'소득에 따라 달라지는 예상 의무상환액'}</h4></div>
      <dl>${state.profile.loanType==='general'?`
        <div><dt>첫 달 납입액</dt><dd>${money(loan.firstMonthPayment,1)}</dd></div>
        <div><dt>월평균 납입액</dt><dd>${money(loan.monthlyEquivalent,1)}</dd></div>
        <div><dt>예상 총이자</dt><dd>${money(loan.totalInterest,1)}</dd></div>
        <div><dt>취업 첫해 예상상환액</dt><dd>${money(loan.firstYearRepayment,1)}</dd></div>`:`
        <div><dt>연간 예상 의무상환액</dt><dd>${money(loan.annualMandatoryRepayment,1)}</dd></div>
        <div><dt>월 환산 참고값</dt><dd>${money(loan.monthlyEquivalent,1)}</dd></div>
        <div><dt>적용 상환기준소득</dt><dd>${money(INCOME_CONTINGENT_POLICY.annualIncomeThreshold)}</dd></div>
        <div><dt>취업 첫해 말 예상잔액</dt><dd>${money(loan.projectedBalance,1)}</dd></div>`}</dl>
      <ul>${loan.assumptions.map((item)=>`<li>${item}</li>`).join('')}</ul>
    </div>
    <p class="comparison-note"><strong>${scenario.name}을 고르면</strong> ${state.profile.loanType==='general'?`월평균 ${formatMoney(loan.monthlyEquivalent,{digits:1})}을 상환합니다.`:`연간 ${formatMoney(loan.annualMandatoryRepayment,{digits:1})}의 의무상환액이 예상됩니다.`} ${closestCollege.name}과 비교해 대학 생활비 여력은 ${signedMoney(scenario.possibleCollegeSpend-closestCollege.possibleCollegeSpend)} 차이입니다.</p>
  </section>`;
}

function metric(label,value,note){return `<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;}

function renderFundingFormula(scenario) {
  const f = scenario.funding;
  return `<section class="funding-section" aria-labelledby="funding-title"><div class="section-heading compact"><h3 id="funding-title">남은 기간이 필요한 금액으로 이렇게 이어집니다.</h3><p>후보 장학금은 포함하지 않았고, 입력한 확정 금액만 반영했습니다.</p></div>
    <div class="formula-line"><span>${state.profile.graduationYears}년</span><i>× 2</i><span>${f.semesters}학기</span><i>·</i><span>${f.studyMonths}개월</span></div>
    <div class="funding-ledger"><dl>
      <div><dt>등록금</dt><dd>${formatMoney(state.profile.tuitionPerSemester)} × ${f.semesters}학기 <strong>${money(f.educationNeed)}</strong></dd></div>
      <div><dt>희망 생활비</dt><dd>${formatMoney(state.profile.desiredCollegeSpend)} × ${f.studyMonths}개월 <strong>${money(f.livingNeed)}</strong></dd></div>
      <div class="total"><dt>총필요자금</dt><dd><strong>${money(f.totalNeed)}</strong></dd></div>
      <div class="deduct"><dt>확정 생활비성 지원금</dt><dd>− ${money(f.confirmedLivingGrantTotal)}</dd></div>
      <div class="deduct"><dt>${scenario.name} 근로소득</dt><dd>− ${money(scenario.workTotal)}</dd></div>
      <div class="deduct"><dt>신규 대출</dt><dd>− ${money(scenario.newLoan)}</dd></div>
      <div class="gap"><dt>아직 채워지지 않은 금액</dt><dd>${money(scenario.fundingGap,1)}</dd></div>
    </dl></div></section>`;
}

function renderScholarships(programs, summary) {
  const visible = state.catalogFilter === '전체' ? programs : programs.filter((item)=>item.status===state.catalogFilter);
  return `<section class="scholarship-section" aria-labelledby="scholarship-title"><div class="scholarship-intro"><div><h3 id="scholarship-title">신청 가능성을 확인할 지원사업이 ${summary.candidatePrograms.length}개 있어요.</h3><p>후보 금액은 기본 계산에서 차감하지 않습니다. 수혜가 확정되면 입력 화면의 확정 지원금에 직접 반영해 주세요.</p></div><button class="button button-outline" type="button" data-action="catalog" aria-expanded="${state.catalogOpen}">전체 지원사업 보기 <span>${programs.length}</span> ${icon('chevron')}</button></div>
    <div class="status-summary" aria-label="지원사업 상태별 개수">${PROGRAM_STATUSES.map((status)=>`<span><i></i>${status}<b>${summary.counts[status]}</b></span>`).join('')}</div>
    ${state.catalogOpen?`<div class="catalog"><div class="catalog-filters" role="group" aria-label="상태 필터">${['전체',...PROGRAM_STATUSES].map((item)=>`<button type="button" data-filter="${item}" class="${state.catalogFilter===item?'is-active':''}">${item}</button>`).join('')}</div><div class="program-list">${visible.length?visible.map(renderProgram).join(''):'<p class="empty-state">이 상태의 지원사업이 없습니다.</p>'}</div><p class="catalog-boundary">이 목록은 국내 학부 재학생용 대표 규칙과 화면 동작을 확인하기 위한 범위입니다. 해당 학기 전체 공고는 한국장학재단 공식 페이지에서 다시 확인해 주세요.</p></div>`:''}
  </section>`;
}

function renderProgram(item) {
  return `<article class="program"><div><span class="status status-${PROGRAM_STATUSES.indexOf(item.status)}">${item.status}</span><p>${item.institution} · ${item.semester}</p><h4>${item.name}</h4><small>${item.kind}</small></div><div><p>${item.reason}</p><strong>${item.estimatedSemesterAmount!=null?`후보 금액 ${formatMoney(item.estimatedSemesterAmount)} · 계산 미반영`:'금액 미확인 · 계산 미반영'}</strong><span>최종 확인일 ${item.checkedAt}</span><a href="${item.officialUrl}" target="_blank" rel="noreferrer">공식 원문 ${icon('external')}</a></div></article>`;
}

function renderStress(scenario) {
  const baseline = scenarioById(scenario.id,state.baselineScenarios);
  const changed = Object.values(state.stress).some((value)=>value>0);
  return `<section class="stress-section" aria-labelledby="stress-title"><div class="section-heading compact"><h3 id="stress-title">계획이 달라져도 감당할 수 있는지 확인해 보세요.</h3><p>조건은 선택한 ${scenario.name}에 바로 반영됩니다.</p></div>
    <div class="stress-controls">
      <fieldset><legend>취업 지연</legend><div class="segmented">${[[0,'없음'],[6,'6개월'],[12,'12개월']].map(([value,label])=>`<label><input type="radio" name="employmentDelayMonths" value="${value}" ${state.stress.employmentDelayMonths===value?'checked':''}><span>${label}</span></label>`).join('')}</div></fieldset>
      <label class="switch-row"><input type="checkbox" name="salaryReduction" ${state.stress.salaryReductionRate===0.2?'checked':''}><span><b>초봉 20% 감소</b><small>${formatMoney(state.profile.salary)} → ${formatMoney(state.profile.salary*0.8)}</small></span></label>
      <label class="switch-row"><input type="checkbox" name="graduationDelay" ${state.stress.graduationDelayMonths===12?'checked':''}><span><b>졸업 1년 지연</b><small>2학기 · 12개월 추가</small></span></label>
    </div>
    <div class="stress-result ${changed?'is-changed':''}"><div><span>선택안의 대학 생활비 여력</span><strong>${money(scenario.possibleCollegeSpend,1)}</strong><small>기준 대비 ${signedMoney(scenario.possibleCollegeSpend-baseline.possibleCollegeSpend)}</small></div><div><span>${state.profile.loanType==='income-contingent'?'연간 예상 의무상환액':'월평균 상환액'}</span><strong>${state.profile.loanType==='income-contingent'?money(scenario.loan.firstYearRepayment,1):money(scenario.loan.monthlyEquivalent,1)}</strong><small>기준 대비 ${signedMoney((state.profile.loanType==='income-contingent'?scenario.loan.firstYearRepayment-baseline.loan.firstYearRepayment:scenario.loan.monthlyEquivalent-baseline.loan.monthlyEquivalent))}</small></div><div><span>상환 후 월 생활비 여력</span><strong>${money(scenario.possibleCareerSpend,1)}</strong><small>기준 대비 ${signedMoney(scenario.possibleCareerSpend-baseline.possibleCareerSpend)}</small></div>${changed?`<button type="button" data-action="reset-stress">${icon('reset')} 위험 조건 초기화</button>`:''}</div>
  </section>`;
}

function renderSources() {
  return `<section class="sources-section" id="sources" aria-labelledby="sources-title"><div class="section-heading compact"><h3 id="sources-title">계산 기준과 공식 정보를 확인하세요.</h3></div><div class="source-grid">
    <article><span>공식 정보</span><h4>취업 후 상환 학자금대출</h4><p>상환기준소득과 의무상환 방식은 공식 안내를 기준으로 확인했습니다.</p><small>기준연도 ${INCOME_CONTINGENT_POLICY.basisYear} · 최종 확인 ${INCOME_CONTINGENT_POLICY.checkedAt}</small><a href="${INCOME_CONTINGENT_POLICY.officialUrl}" target="_blank" rel="noreferrer">한국장학재단 공식 안내 ${icon('external')}</a></article>
    <article><span>공식 정보</span><h4>일반 상환 학자금대출</h4><p>원금균등·원리금균등, 거치·상환기간 구조는 공식 안내를 기준으로 했습니다.</p><small>최종 확인 ${GENERAL_LOAN_POLICY.checkedAt}</small><a href="${GENERAL_LOAN_POLICY.officialUrl}" target="_blank" rel="noreferrer">한국장학재단 공식 안내 ${icon('external')}</a></article>
    <article class="assumption"><span>계산 가정</span><h4>이 결과에 포함하지 않은 것</h4><p>세금, 물가 변화, 자발적 중도상환, 실제 심사 결과는 계산하지 않았습니다. 금리와 소득은 사용자가 입력한 값이 유지된다고 가정합니다.</p><small>실제 금융정보를 연결하려면 인가된 마이데이터 사업자 또는 금융회사 API 제휴가 필요합니다.</small></article>
  </div><div class="engine-boundary"><strong>결과가 만들어지는 방식</strong><p>공고 정보는 문장 구조를 정리하고, 자격 후보는 입력값과 규칙으로 점검하며, 확정 금액·근로·대출 조합은 계산식으로 비교합니다. 자동 설명은 수혜나 승인을 확정하지 않습니다.</p></div></section>`;
}

function bindResultEvents() {
  document.querySelectorAll('input[name="scenario"]').forEach((input)=>input.addEventListener('change',(event)=>{
    state.selectedScenarioId = event.target.value;
    renderResults(); announceSelection();
  }));
  document.querySelectorAll('[data-filter]').forEach((button)=>button.addEventListener('click',()=>{state.catalogFilter=button.dataset.filter;renderResults();}));
  document.querySelectorAll('.stress-controls input').forEach((input)=>input.addEventListener('change',(event)=>{
    if (event.target.name==='employmentDelayMonths') state.stress.employmentDelayMonths=Number(event.target.value);
    if (event.target.name==='salaryReduction') state.stress.salaryReductionRate=event.target.checked?0.2:0;
    if (event.target.name==='graduationDelay') state.stress.graduationDelayMonths=event.target.checked?12:0;
    recalculate();
  }));
}

function announceSelection() {
  window.requestAnimationFrame(()=>{
    const status=document.querySelector('#selection-status'); const scenario=selectedScenario();
    if(status&&scenario) status.textContent=`${scenario.name} 선택. 대학 생활비 여력 ${formatMoney(scenario.possibleCollegeSpend,{digits:1})}, 주당 근로 ${scenario.workHours}시간, 상환 후 생활비 여력 ${formatMoney(scenario.possibleCareerSpend,{digits:1})}.`;
  });
}

renderShell();
bindShell();
