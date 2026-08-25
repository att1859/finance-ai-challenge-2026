import './style.css';

const USER_GOALS = {
  collegeSpend: 130,
  careerSpend: 250,
  currentWorkHours: 20,
  hourlyWage: 12000,
  graduationYears: 4,
  salary: 300,
};

const SCENARIOS = [
  {
    id: 'focus',
    name: '대학 집중형',
    workHours: 0,
    loanUse: 5000,
    loanRate: 100,
    collegeSpend: 104,
    repayment: 86,
    careerSpend: 214,
    headline: '대학의 시간을 확보하고, 취업 후 나눠 갚아요.',
  },
  {
    id: 'balance',
    name: '균형형',
    workHours: 10,
    loanUse: 2500,
    loanRate: 50,
    collegeSpend: 100,
    repayment: 43,
    careerSpend: 257,
    headline: '지금과 미래의 부담을 절반씩 나눠요.',
  },
  {
    id: 'future',
    name: '미래 여유형',
    workHours: 20,
    loanUse: 0,
    loanRate: 0,
    collegeSpend: 96,
    repayment: 0,
    careerSpend: 300,
    headline: '지금 더 일하고, 첫 월급을 온전히 사용해요.',
  },
];

const money = (value) => `${value.toLocaleString('ko-KR')}만원`;

const scenarioButtons = SCENARIOS.map(
  (scenario) => `
    <button
      class="scenario-option"
      type="button"
      role="radio"
      aria-checked="false"
      data-scenario="${scenario.id}"
    >
      <span class="scenario-copy">
        <strong>${scenario.name}</strong>
        <span>${scenario.workHours === 0 ? '공부에 집중' : scenario.workHours === 10 ? '일과 공부의 균형' : '취업 후 여유 확보'}</span>
      </span>
      <span class="scenario-hours">주 <b>${scenario.workHours}</b>시간</span>
      <span class="select-mark" aria-hidden="true"></span>
    </button>
  `,
).join('');

document.querySelector('#app').innerHTML = `
  <main class="shell" data-active-scenario="focus">
    <header class="topbar">
      <a class="brand" href="#main-result" aria-label="학자금 대출 최적화 AI 결과로 이동">
        <svg aria-hidden="true" viewBox="0 0 28 28">
          <path d="M4 20V8l10-5 10 5v12l-10 5-10-5Z" />
          <path d="M4 8l10 5 10-5M14 13v12" />
        </svg>
        <span>학자금 대출 최적화 AI</span>
      </a>
      <div class="goal-strip" aria-label="사용자 희망 기준">
        <span>나의 기준</span>
        <b>대학 ${money(USER_GOALS.collegeSpend)}</b>
        <b>취업 후 ${money(USER_GOALS.careerSpend)}</b>
        <b>현재 주 ${USER_GOALS.currentWorkHours}시간</b>
      </div>
      <button class="goal-toggle" type="button" aria-pressed="true">
        <span class="toggle-dot"></span>
        <span class="toggle-label">목표선 켜짐</span>
      </button>
    </header>

    <section class="intro" aria-labelledby="page-title">
      <div>
        <h1 id="page-title">지금의 시간과<br>미래의 생활비.</h1>
        <p>카드 하나만 누르면 두 시기의 차이가 바로 바뀝니다.</p>
      </div>
      <div class="demo-stamp" aria-label="데모 계산 조건">
        <span>DEMO</span>
        <b>대출 5,000만원</b>
        <small>연 1.5% · 취업 후 5년</small>
      </div>
    </section>

    <section class="scenario-picker" aria-labelledby="scenario-title">
      <div class="section-heading">
        <h2 id="scenario-title">주당 노동시간을 고르세요</h2>
        <span>카드 전체 선택</span>
      </div>
      <div class="scenario-options" role="radiogroup" aria-label="근로와 대출 사용 시나리오">
        ${scenarioButtons}
      </div>
    </section>

    <section class="result-stage result-split" id="main-result" aria-live="polite">
      <div class="result-summary">
        <div class="result-head">
          <div><span class="active-level" id="active-level"></span><h2 id="scenario-headline"></h2></div>
        </div>
        <div class="consumption-bridge">
          <article class="period college-period"><span class="period-label">대학 시절</span><div class="amount-line"><strong id="college-spend"></strong><span>/ 월</span></div><div class="goal-track college-track"><i class="actual-fill"></i><i class="goal-marker"><span>${money(USER_GOALS.collegeSpend)}</span></i></div><span class="amount-gap" id="college-gap"></span></article>
          <div class="repayment-path"><svg aria-hidden="true" viewBox="0 0 180 54" preserveAspectRatio="none"><path class="path-base" d="M4 27H176"/><path class="path-motion" d="M4 27H176"/><path class="path-arrow" d="m164 15 12 12-12 12"/></svg><span>5년 상환</span><strong id="repayment"></strong></div>
          <article class="period career-period"><span class="period-label">취업 후</span><div class="amount-line"><strong id="career-spend"></strong><span>/ 월</span></div><div class="goal-track career-track"><i class="actual-fill"></i><i class="goal-marker"><span>${money(USER_GOALS.careerSpend)}</span></i></div><span class="amount-gap" id="career-gap"></span></article>
        </div>
      </div>
      <aside class="result-detail">
        <span>선택한 결과</span>
        <h3>숫자가 이렇게 나온 이유</h3>
        <p><b>대학 시절</b> 근로소득과 대출금을 48개월로 나눠 월 소비 여력을 계산했어요.</p>
        <p><b>취업 후</b> 월급 300만원에서 5년간의 원리금 상환액을 뺐어요.</p>
        <p>세금·주휴수당·물가 변화는 이번 데모에서 제외했어요.</p>
      </aside>
    </section>

    <section class="journey-section" aria-labelledby="journey-title">
      <div class="section-heading journey-heading">
          <h2 id="journey-title">시간과 돈의 이동</h2>
      </div>
      <div class="visual-tools" aria-label="시간과 상환 기간 시각화">
      <article class="week-tool">
        <div class="tool-head">
          <div>
            <h2>한 주의 노동시간</h2>
            <p>한 칸은 1시간</p>
          </div>
          <strong id="work-hours"></strong>
        </div>
        <div class="hour-grid" aria-hidden="true">
          ${Array.from({ length: 20 }, (_, index) => `<i data-hour="${index + 1}"></i>`).join('')}
        </div>
      </article>

      <article class="timeline-tool">
        <div class="tool-head">
          <div>
            <h2>돈의 이동 경로</h2>
            <p>대학 4년 + 상환 5년</p>
          </div>
          <button class="play-route" type="button" aria-label="돈의 이동 경로 다시 보기">
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m7 4 7 6-7 6V4Z" /></svg>
            다시 보기
          </button>
        </div>
        <div class="year-route" aria-label="대학 4년과 취업 후 상환 5년">
          ${Array.from({ length: 9 }, (_, index) => `
            <span class="year-node ${index < 4 ? 'college-year' : 'career-year'}">
              <i></i><small>${index + 1}년</small>
            </span>
          `).join('')}
          <span class="route-progress"></span>
          <b class="graduation-pin">졸업</b>
        </div>
      </article>
      </div>
    </section>

    <section class="method-section" aria-labelledby="method-title">
      <details class="calculation-details">
        <summary>
          <span id="method-title">계산 방식 보기</span>
          <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5 8 5 5 5-5" /></svg>
        </summary>
        <div class="detail-grid">
          <p><b>대학 생활</b><span>근로소득 + 대출 사용액 ÷ 48개월</span></p>
          <p><b>취업 후</b><span>월급 300만원 − 5년 원리금 균등상환액</span></p>
          <p><b>제외 항목</b><span>세금, 주휴수당, 물가 변화는 이번 데모에서 제외</span></p>
        </div>
      </details>
    </section>

    <footer>
      <p>이 화면은 아이디어 검토용 데모이며 실제 금융 자문이 아닙니다.</p>
      <span>졸업까지 4년 · 취업 월급 ${money(USER_GOALS.salary)} · 시급 ${USER_GOALS.hourlyWage.toLocaleString('ko-KR')}원</span>
    </footer>
  </main>
`;

const shell = document.querySelector('.shell');
const scenarioOptions = [...document.querySelectorAll('.scenario-option')];
const goalToggle = document.querySelector('.goal-toggle');
const routeButton = document.querySelector('.play-route');

function gapCopy(actual, desired) {
  const gap = actual - desired;
  if (gap === 0) return '희망 수준과 같아요';
  return `희망보다 ${money(Math.abs(gap))} ${gap > 0 ? '여유' : '낮음'}`;
}

function setTrack(trackSelector, actual, desired, max) {
  const track = document.querySelector(trackSelector);
  track.style.setProperty('--actual-ratio', Math.min(actual / max, 1));
  track.style.setProperty('--goal', `${Math.min((desired / max) * 100, 100)}%`);
}

function selectScenario(id, shouldFocus = false) {
  const scenario = SCENARIOS.find((item) => item.id === id) ?? SCENARIOS[0];
  shell.dataset.activeScenario = scenario.id;

  scenarioOptions.forEach((option) => {
    const selected = option.dataset.scenario === scenario.id;
    option.setAttribute('aria-checked', String(selected));
    option.tabIndex = selected ? 0 : -1;
    if (selected && shouldFocus) option.focus();
  });

  document.querySelector('#scenario-headline').textContent = scenario.headline;
  document.querySelector('#active-level').textContent = `${scenario.name} · 주 ${scenario.workHours}시간`;
  document.querySelector('#college-spend').textContent = money(scenario.collegeSpend);
  document.querySelector('#career-spend').textContent = money(scenario.careerSpend);
  document.querySelector('#repayment').textContent = scenario.repayment ? `월 ${money(scenario.repayment)}` : '상환 없음';
  document.querySelector('#college-gap').textContent = gapCopy(scenario.collegeSpend, USER_GOALS.collegeSpend);
  document.querySelector('#career-gap').textContent = gapCopy(scenario.careerSpend, USER_GOALS.careerSpend);
  document.querySelector('#work-hours').textContent = `주 ${scenario.workHours}시간`;

  setTrack('.college-track', scenario.collegeSpend, USER_GOALS.collegeSpend, 150);
  setTrack('.career-track', scenario.careerSpend, USER_GOALS.careerSpend, 320);

  [
    ['#college-gap', scenario.collegeSpend, USER_GOALS.collegeSpend],
    ['#career-gap', scenario.careerSpend, USER_GOALS.careerSpend],
  ].forEach(([selector, actual, desired]) => {
    const element = document.querySelector(selector);
    element.classList.toggle('is-positive', actual > desired);
    element.classList.toggle('is-negative', actual < desired);
  });

  document.querySelectorAll('.hour-grid i').forEach((block, index) => {
    block.classList.toggle('is-work', index < scenario.workHours);
  });

  restartRoute();
}

function restartRoute() {
  const route = document.querySelector('.year-route');
  route.classList.remove('is-running');
  void route.offsetWidth;
  route.classList.add('is-running');
}

scenarioOptions.forEach((option, index) => {
  option.addEventListener('click', () => selectScenario(option.dataset.scenario));
  option.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const delta = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
    const nextIndex = (index + delta + scenarioOptions.length) % scenarioOptions.length;
    selectScenario(scenarioOptions[nextIndex].dataset.scenario, true);
  });
});

goalToggle.addEventListener('click', () => {
  const nextState = goalToggle.getAttribute('aria-pressed') !== 'true';
  goalToggle.setAttribute('aria-pressed', String(nextState));
  goalToggle.querySelector('.toggle-label').textContent = nextState ? '목표선 켜짐' : '목표선 꺼짐';
  shell.classList.toggle('goals-hidden', !nextState);
});

routeButton.addEventListener('click', restartRoute);

selectScenario('focus');
