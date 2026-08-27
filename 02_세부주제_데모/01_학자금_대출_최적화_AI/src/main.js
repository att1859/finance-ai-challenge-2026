import './style.css';
import {
  DEFAULT_INPUTS,
  SAMPLE_INPUTS,
  SCENARIO_DEFINITIONS,
  calculateAllScenarios,
  calculateFundingSummary,
  calculateStressPreview,
  formatMoney,
  roundMoney,
} from './lib/calculations.js';
import {
  PROGRAM_STATUSES,
  evaluateScholarships,
  summarizeScholarships,
} from './data/scholarships.js';

const state = {
  profile: { ...DEFAULT_INPUTS },
  programs: [],
  scholarshipSummary: null,
  funding: null,
  scenarios: [],
  stress: {
    scholarshipMiss: false,
    employmentDelayMonths: 0,
    salaryReductionRate: 0,
    graduationDelayMonths: 0,
  },
  programFilter: '전체',
  programQuery: '',
};

const statusClass = {
  '자동 매칭 가능': 'match',
  '추가 심사 필요': 'review',
  '정보 부족': 'missing',
  '대상 아님': 'ineligible',
  '모집 종료': 'closed',
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const icon = (name) => {
  const paths = {
    arrow: '<path d="M4 10h12M12 5l5 5-5 5"/>',
    check: '<path d="m4 10 4 4 8-8"/>',
    lock: '<rect x="4" y="8" width="12" height="9" rx="2"/><path d="M7 8V6a3 3 0 0 1 6 0v2"/>',
    external: '<path d="M11 4h5v5M16 4l-7 7"/><path d="M14 11v5H4V6h5"/>',
    info: '<circle cx="10" cy="10" r="7"/><path d="M10 9v5M10 6.5h.01"/>',
    search: '<circle cx="9" cy="9" r="5"/><path d="m13 13 4 4"/>',
    chevron: '<path d="m6 8 4 4 4-4"/>',
  };
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 20 20">${paths[name]}</svg>`;
};

const samplePrograms = evaluateScholarships(SAMPLE_INPUTS);
const sampleSummary = summarizeScholarships(samplePrograms, SAMPLE_INPUTS.graduationYears * 2);
const sampleFunding = calculateFundingSummary(SAMPLE_INPUTS, sampleSummary.estimatedTotal);

const inputWithUnit = ({ id, label, value, unit, min = 0, max, step = 1, help = '' }) => `
  <label class="field" for="${id}">
    <span>${label}</span>
    <span class="input-unit">
      <input id="${id}" name="${id}" type="number" value="${value}" min="${min}" ${max ? `max="${max}"` : ''} step="${step}" inputmode="decimal" />
      <b>${unit}</b>
    </span>
    ${help ? `<small>${help}</small>` : ''}
  </label>
`;

document.querySelector('#app').innerHTML = `
  <header class="site-header">
    <a class="brand" href="#top" aria-label="학자금 소비평탄화 AI 처음으로 이동">
      <svg class="brand-mark" aria-hidden="true" viewBox="0 0 32 32">
        <path d="M4 8h24M4 16h18M4 24h12" />
        <path class="brand-accent" d="M24 16h4M18 24h10" />
      </svg>
      <span>학자금 소비평탄화 AI</span>
    </a>
    <nav aria-label="주요 탐색">
      <a href="#diagnosis">진단</a>
      <a href="#results">결과</a>
      <a href="#sources">출처·가정</a>
    </nav>
    <span class="session-badge">${icon('lock')} 비회원 · 브라우저 세션</span>
  </header>

  <main id="top">
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <h1 id="page-title">장학금을 먼저 찾고,<br />남은 부담을 나눠요.</h1>
        <p>대출을 늘리는 대신 장학금과 감면을 먼저 적용하고, 남은 총필요자금을 근로와 공적 학자금대출로 배치해 대학의 생활·학업시간과 졸업 후 상환 부담을 함께 비교합니다.</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#diagnosis">빠른 진단 시작 ${icon('arrow')}</a>
          <button class="button button-secondary" id="hero-sample" type="button">공모전용 샘플 마이데이터 불러오기</button>
        </div>
        <p class="privacy-line">가상 데이터로만 시연하며 주민등록번호·계좌번호·인증서·금융기관 비밀번호를 받지 않습니다.</p>
      </div>

      <aside class="allocation-ledger" aria-label="공모전 데모 기준 자금 배분 예시">
        <div class="ledger-heading">
          <h2>지원이 먼저인 자금 원장</h2>
          <span>가상 예시</span>
        </div>
        <div class="ledger-row ledger-total">
          <span>졸업까지 총필요자금</span>
          <strong>${formatMoney(sampleFunding.totalNeed)}</strong>
        </div>
        <div class="need-composition" aria-label="교육비와 생활소비 구성">
          <span style="--share: ${(sampleFunding.educationNeed / sampleFunding.totalNeed) * 100}%">교육비 ${formatMoney(sampleFunding.educationNeed)}</span>
          <span style="--share: ${(sampleFunding.livingNeed / sampleFunding.totalNeed) * 100}%">생활소비 ${formatMoney(sampleFunding.livingNeed)}</span>
        </div>
        <div class="ledger-operation">
          <span class="operation-sign" aria-hidden="true">−</span>
          <div>
            <span>조건상 장학금 후보</span>
            <small>8개 학기 연속 충족 가정 · 수혜 확정 아님</small>
          </div>
          <strong>${formatMoney(sampleSummary.estimatedTotal)}</strong>
        </div>
        <div class="ledger-row ledger-remaining">
          <span>근로·대출로 나눌 금액</span>
          <strong>${formatMoney(sampleFunding.remainingAfterScholarship)}</strong>
        </div>
        <p>금액을 키우기보다 무엇이 얼마를 담당하는지 먼저 보여줍니다.</p>
      </aside>
    </section>

    <section class="diagnosis-section" id="diagnosis" aria-labelledby="diagnosis-title">
      <div class="section-intro">
        <h2 id="diagnosis-title">내 조건으로 빠르게 계산해 보세요.</h2>
        <p>필요한 값만 브라우저에서 계산합니다. 결과를 만든 뒤에도 모든 입력을 다시 바꿀 수 있어요.</p>
      </div>

      <form id="diagnosis-form" novalidate>
        <div class="data-source">
          <div>
            <h3>입력 방식</h3>
            <p>직접 입력하거나 명시된 가상 금융정보를 채울 수 있습니다.</p>
          </div>
          <button class="button button-dark" id="form-sample" type="button">
            <span>샘플 마이데이터 불러오기</span>
            ${icon('arrow')}
          </button>
        </div>

        <div class="sample-summary" id="sample-summary" hidden aria-live="polite">
          <span>가상 데이터</span>
          <p><b>계산 입력 · 월 근로소득 96만원</b><b>계산 입력 · 희망 생활소비 130만원</b><b>참고용 · 최근 생활소비 118만원</b><b>참고용 · 고정지출 72만원</b><b>계산 입력 · 기존 학자금대출 0원</b></p>
          <small>실제 연동이나 로그인 없이 입력칸만 채웠습니다. 최근 생활소비와 고정지출은 비교 맥락용 가상 거래 요약이며, 계산에는 아래 희망 생활소비 입력값만 사용합니다. 서버로 전송되지 않습니다.</small>
        </div>

        <div class="form-error" id="form-error" tabindex="-1" hidden></div>

        <fieldset class="form-block">
          <legend>학교와 장학 조건</legend>
          <p>지원사업의 후보 상태와 제외 이유를 만드는 데 사용합니다.</p>
          <div class="field-grid field-grid-three">
            <label class="field" for="school">
              <span>학교</span>
              <input id="school" name="school" type="text" autocomplete="organization" placeholder="예: 한빛대학교" />
              <small>데모에서는 학교별 자체 기준을 추가 심사로 표시합니다.</small>
            </label>
            <label class="field" for="academicYear">
              <span>학년</span>
              <select id="academicYear" name="academicYear">
                <option value="1">1학년</option><option value="2" selected>2학년</option><option value="3">3학년</option><option value="4">4학년</option><option value="5">5학년 이상</option>
              </select>
            </label>
            ${inputWithUnit({ id: 'tuitionPerSemester', label: '학기 등록금', value: 420, unit: '만원', max: 3000 })}
            <label class="field" for="supportBracket">
              <span>학자금 지원구간</span>
              <select id="supportBracket" name="supportBracket">
                <option value="">선택해 주세요</option>
                ${Array.from({ length: 10 }, (_, index) => `<option value="${index + 1}">${index + 1}구간</option>`).join('')}
              </select>
              <small>정확한 자격 확정이 아닌 데모 규칙 매칭에만 사용합니다.</small>
            </label>
            <label class="field" for="region">
              <span>현재 지역</span>
              <select id="region" name="region">
                ${['서울특별시', '경기도', '인천광역시', '부산광역시', '대구광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시', '강원특별자치도', '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도'].map((region) => `<option ${region === '부산광역시' ? 'selected' : ''}>${region}</option>`).join('')}
              </select>
            </label>
            <div class="field special-field">
              <span>특별자격 <small>선택</small></span>
              <div class="check-grid">
                ${['다자녀', '비수도권 인재', '농어촌 가구', '다문화·탈북 배경'].map((value) => `
                  <label><input type="checkbox" name="specialQualifications" value="${value}" /><span>${value}</span></label>
                `).join('')}
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset class="form-block">
          <legend>대학 시절의 생활과 시간</legend>
          <p>주휴수당을 제외하고 월 4주 기준으로 근로소득을 계산합니다.</p>
          <div class="field-grid field-grid-three">
            ${inputWithUnit({ id: 'desiredCollegeSpend', label: '희망 월 생활소비', value: 130, unit: '만원', max: 1000 })}
            ${inputWithUnit({ id: 'hourlyWage', label: '현재 시급', value: 12000, unit: '원', max: 100000, step: 100 })}
            ${inputWithUnit({ id: 'currentWorkHours', label: '현재 주당 근로시간', value: 20, unit: '시간', max: 80 })}
            ${inputWithUnit({ id: 'desiredWorkHours', label: '희망 주당 근로시간', value: 10, unit: '시간', max: 80 })}
            ${inputWithUnit({ id: 'graduationYears', label: '졸업까지 남은 기간', value: 4, unit: '년', min: 0.5, max: 10, step: 0.5 })}
            ${inputWithUnit({ id: 'existingLoanBalance', label: '기존 학자금대출 잔액', value: 0, unit: '만원', max: 20000 })}
          </div>
        </fieldset>

        <fieldset class="form-block">
          <legend>졸업 후 목표와 상환 가정</legend>
          <p>취업 가능성을 예측하지 않고 사용자가 입력한 시점과 월소득만 기준으로 삼습니다.</p>
          <div class="field-grid field-grid-three">
            ${inputWithUnit({ id: 'salary', label: '취업 후 월소득', value: 300, unit: '만원', max: 3000 })}
            ${inputWithUnit({ id: 'desiredCareerSpend', label: '취업 후 희망 월 생활소비', value: 250, unit: '만원', max: 3000 })}
            ${inputWithUnit({ id: 'loanCap', label: '신규 공적 학자금대출 상한', value: 5000, unit: '만원', max: 20000 })}
            ${inputWithUnit({ id: 'annualRate', label: '연이율', value: 1.5, unit: '%', max: 30, step: 0.1 })}
            ${inputWithUnit({ id: 'repaymentYears', label: '첫 월급부터 상환기간', value: 5, unit: '년', min: 1, max: 30 })}
          </div>
        </fieldset>

        <div class="form-submit">
          <div>
            <p>${icon('lock')} 계산값은 이 탭을 닫으면 사라집니다.</p>
            <small>향후 실제 금융연동은 인가된 마이데이터 사업자 또는 금융회사 API 제휴가 필요합니다.</small>
          </div>
          <button class="button button-primary button-large" id="calculate-button" type="submit">장학금부터 계산하기 ${icon('arrow')}</button>
        </div>
      </form>
    </section>

    <div id="results" hidden>
      <section class="result-opening" aria-labelledby="result-title">
        <div>
          <h2 id="result-title" tabindex="-1">지원부터 적용한 뒤, 세 선택을 같은 기준으로 비교했습니다.</h2>
          <p id="result-description"></p>
        </div>
        <a href="#diagnosis" class="text-link">입력 수정하기 ${icon('arrow')}</a>
      </section>

      <section class="scholarship-section" aria-labelledby="scholarship-title">
        <div class="section-intro section-intro-row">
          <div>
            <h2 id="scholarship-title">지원사업은 매칭되지 않아도 숨기지 않습니다.</h2>
            <p>자동 판정이 어려운 사업도 부족한 정보와 제외 이유를 함께 보여줍니다.</p>
          </div>
          <button class="button button-dark" id="toggle-programs" type="button" aria-expanded="false" aria-controls="program-directory">전체 지원사업 보기 ${icon('arrow')}</button>
        </div>
        <div class="coverage-contract">
          <div>${icon('info')}<p><b>데모 범위</b> <span>한국장학재단 국내 학부 지원사업의 대표 19개 항목으로 전체 목록 구조를 시연합니다.</span></p></div>
          <p>실제 전체 제도를 수록한 것으로 주장하지 않으며, 상용화 시 학기별 공개사업 전체 스냅샷과 사람 검수가 필요합니다.</p>
        </div>
        <div class="match-overview" id="match-overview"></div>
        <div class="program-directory" id="program-directory" hidden>
          <div class="directory-tools">
            <div class="status-filters" id="status-filters" aria-label="지원사업 상태 필터"></div>
            <label class="program-search" for="program-query">${icon('search')}<input id="program-query" type="search" placeholder="사업명 검색" autocomplete="off" /></label>
          </div>
          <div id="program-list" aria-live="polite"></div>
        </div>
      </section>

      <section class="funding-section" aria-labelledby="funding-title">
        <div class="section-intro">
          <h2 id="funding-title">장학금 적용 전후의 자금격차</h2>
          <p>공식 결과가 아닌 조건상 후보 금액을 먼저 빼고, 교육비와 생활소비를 분리했습니다.</p>
        </div>
        <div id="funding-comparison"></div>
      </section>

      <section class="scenario-section" aria-labelledby="scenario-title">
        <div class="section-intro section-intro-row">
          <div>
            <h2 id="scenario-title">세 시나리오를 같은 지표로 비교하세요.</h2>
            <p>균형형은 기본 제안일 뿐, 사용자의 우선순위와 공식 심사를 대신하지 않습니다.</p>
          </div>
          <span class="comparison-hint">대학 생활 ↔ 졸업 후 상환</span>
        </div>
        <div class="scenario-comparison" id="scenario-comparison"></div>
      </section>

      <section class="stress-section" aria-labelledby="stress-title">
        <div class="section-intro">
          <h2 id="stress-title">계획이 흔들리는 경우를 먼저 확인하세요.</h2>
          <p>여러 조건을 함께 켜면 대출이자·대학 생활소비·취업 후 가처분소비를 즉시 다시 계산합니다.</p>
        </div>
        <div class="stress-workbench">
          <div class="stress-controls">
            <label class="stress-toggle">
              <input type="checkbox" id="stress-scholarship" />
              <span><b>장학금 미선정</b><small>조건상 후보 금액을 0원으로 재계산</small></span>
            </label>
            <fieldset class="delay-control">
              <legend>취업 지연</legend>
              <div>
                <label><input type="radio" name="employment-delay" value="0" checked /><span>없음</span></label>
                <label><input type="radio" name="employment-delay" value="6" /><span>6개월</span></label>
                <label><input type="radio" name="employment-delay" value="12" /><span>12개월</span></label>
              </div>
            </fieldset>
            <label class="stress-toggle">
              <input type="checkbox" id="stress-salary" />
              <span><b>초봉 20% 감소</b><small>입력 월소득의 80%로 재계산</small></span>
            </label>
            <label class="stress-toggle">
              <input type="checkbox" id="stress-graduation" />
              <span><b>졸업 1년 지연</b><small>등록금 2학기와 생활기간 12개월 추가</small></span>
            </label>
          </div>
          <div class="stress-readout" id="stress-readout" aria-live="polite"></div>
        </div>
      </section>

      <section class="reason-section" aria-labelledby="reason-title">
        <div class="section-intro">
          <h2 id="reason-title">추천 근거와 아직 모르는 것</h2>
          <p>AI 설명, 규칙 판정, 최적화 계산의 역할을 분리해 결과를 다시 확인할 수 있게 했습니다.</p>
        </div>
        <div id="recommendation"></div>
      </section>
    </div>

    <section class="sources-section" id="sources" aria-labelledby="sources-title">
      <div class="section-intro">
        <h2 id="sources-title">공식 정보와 데모 가정을 구분했습니다.</h2>
        <p>숫자는 가정에서 나오고, 신청과 최종 판정은 공식기관에서 이뤄집니다.</p>
      </div>
      <div class="source-columns">
        <article>
          <h3>공식 확인 경로</h3>
          <ul>
            <li><a href="https://www.kosaf.go.kr/ko/main.do" target="_blank" rel="noreferrer">한국장학재단 공식 홈페이지 ${icon('external')}</a><span>사업 공고·신청·최종 자격 확인</span></li>
            <li><a href="https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_01_01" target="_blank" rel="noreferrer">취업 후 상환 학자금대출 ${icon('external')}</a><span>상품 용도·금리·상환조건 확인</span></li>
            <li><a href="https://www.kosaf.go.kr/ko/tuition.do?naviParam=HD&pg=tuition04_02_01" target="_blank" rel="noreferrer">일반상환 학자금대출 ${icon('external')}</a><span>대출조건과 상환방식 확인</span></li>
          </ul>
        </article>
        <article>
          <h3>이번 데모의 계산 가정</h3>
          <ul>
            <li><span>근로소득</span><b>시급 × 주당 시간 × 월 4주, 주휴수당 제외</b></li>
            <li><span>대출상환</span><b>연 1.5%, 첫 월급부터 5년 원리금균등상환</b></li>
            <li><span>생활소비</span><b>세금·물가·예상치 못한 지출은 제외</b></li>
          </ul>
        </article>
      </div>
      <details class="assumption-details">
        <summary>개인정보·AI·금융서비스 경계 자세히 보기 ${icon('chevron')}</summary>
        <div>
          <p><b>개인정보</b> MVP는 비회원 브라우저 세션 계산이며 입력을 서버에 저장하지 않습니다. 주민등록번호, 계좌번호, 인증서, 금융기관 비밀번호를 수집하지 않습니다.</p>
          <p><b>AI</b> 공고 구조화와 결과 설명을 담당합니다. 규칙엔진이 자격 후보를, 최적화엔진이 장학금·근로·대출 조합을 계산합니다.</p>
          <p><b>최종 판단</b> AI가 장학금 수혜나 대출 승인을 확정하지 않습니다. 한국장학재단과 각 기관의 공식 결과가 최종입니다.</p>
          <p><b>향후 연동</b> 실제 금융연동에는 인가된 마이데이터 사업자 또는 금융회사 API 제휴와 별도 규제 검토가 필요합니다.</p>
        </div>
      </details>
    </section>
  </main>

  <footer class="site-footer">
    <a class="brand" href="#top"><span>학자금 소비평탄화 AI</span></a>
    <p>공모전 검증용 웹 MVP · 금융·법률 자문 또는 장학금·대출 승인 결과가 아닙니다.</p>
    <span>기준일 2026-08-27</span>
  </footer>
`;

const form = document.querySelector('#diagnosis-form');
const resultsRegion = document.querySelector('#results');
const formError = document.querySelector('#form-error');
const calculateButton = document.querySelector('#calculate-button');
const sampleButtons = [document.querySelector('#hero-sample'), document.querySelector('#form-sample')];

function setFormValues(values) {
  Object.entries(values).forEach(([key, value]) => {
    if (key === 'specialQualifications') {
      form.querySelectorAll('[name="specialQualifications"]').forEach((checkbox) => {
        checkbox.checked = value.includes(checkbox.value);
      });
      return;
    }
    const field = form.elements.namedItem(key);
    if (field) field.value = value;
  });
}

function readProfile() {
  const data = new FormData(form);
  const numericFields = [
    'tuitionPerSemester', 'desiredCollegeSpend', 'hourlyWage', 'currentWorkHours',
    'desiredWorkHours', 'graduationYears', 'existingLoanBalance', 'salary',
    'desiredCareerSpend', 'loanCap', 'annualRate', 'repaymentYears',
  ];
  const profile = {
    school: String(data.get('school') || '').trim(),
    academicYear: String(data.get('academicYear') || ''),
    supportBracket: String(data.get('supportBracket') || ''),
    region: String(data.get('region') || ''),
    specialQualifications: data.getAll('specialQualifications').map(String),
  };
  numericFields.forEach((field) => {
    profile[field] = Number(data.get(field));
  });
  return profile;
}

function validateProfile(profile) {
  const errors = [];
  const positiveFields = new Set([
    'tuitionPerSemester', 'desiredCollegeSpend', 'hourlyWage', 'graduationYears',
    'salary', 'desiredCareerSpend', 'repaymentYears',
  ]);
  form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
  if (!profile.school) errors.push({ field: 'school', message: '학교명을 입력해 주세요.' });
  if (!profile.supportBracket) errors.push({ field: 'supportBracket', message: '학자금 지원구간을 선택해 주세요.' });
  form.querySelectorAll('input[type="number"]').forEach((input) => {
    const value = profile[input.name];
    const label = input.closest('label').querySelector(':scope > span').textContent;
    const declaredMin = input.min === '' ? Number.NEGATIVE_INFINITY : Number(input.min);
    const minimum = positiveFields.has(input.name) ? Math.max(Number.EPSILON, declaredMin) : declaredMin;
    const maximum = input.max === '' ? Number.POSITIVE_INFINITY : Number(input.max);
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
      const minimumLabel = positiveFields.has(input.name) && declaredMin === 0
        ? '0보다 크고'
        : `${declaredMin} 이상`;
      const range = Number.isFinite(maximum) ? `${minimumLabel} ${maximum} 이하` : minimumLabel;
      errors.push({ field: input.name, message: `${label}에 ${range}의 값을 입력해 주세요.` });
    }
  });
  errors.forEach(({ field }) => form.elements.namedItem(field)?.setAttribute('aria-invalid', 'true'));
  return errors;
}

function showFormErrors(errors) {
  if (!errors.length) {
    formError.hidden = true;
    formError.innerHTML = '';
    return;
  }
  formError.hidden = false;
  formError.innerHTML = `<strong>계산하기 전에 ${errors.length}개 항목을 확인해 주세요.</strong><ul>${errors.map(({ field, message }) => `<li><a href="#${field}">${message}</a></li>`).join('')}</ul>`;
  formError.focus();
}

function loadSample(trigger) {
  sampleButtons.forEach((button) => {
    button.disabled = true;
    button.classList.add('is-loading');
  });
  const originalText = trigger.querySelector('span')?.textContent || trigger.textContent;
  if (trigger.querySelector('span')) trigger.querySelector('span').textContent = '가상 데이터를 확인하는 중';
  else trigger.textContent = '가상 데이터를 확인하는 중';

  window.setTimeout(() => {
    setFormValues(SAMPLE_INPUTS);
    document.querySelector('#sample-summary').hidden = false;
    sampleButtons.forEach((button) => {
      button.disabled = false;
      button.classList.remove('is-loading');
    });
    if (trigger.querySelector('span')) trigger.querySelector('span').textContent = originalText;
    else trigger.textContent = originalText;
    document.querySelector('#diagnosis').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelector('#school').focus({ preventScroll: true });
  }, 560);
}

function renderMatchOverview() {
  const summary = state.scholarshipSummary;
  document.querySelector('#match-overview').innerHTML = `
    <div class="match-lead">
      <span>조건상 후보 금액</span>
      <strong>${formatMoney(summary.estimatedTotal)}</strong>
      <p>${summary.appliedPrograms.length}개 등록금 지원 후보를 계산에 먼저 적용했습니다. 매 학기 자격 재확인이 필요합니다.</p>
    </div>
    <div class="status-counts">
      ${PROGRAM_STATUSES.map((status) => `<div><span class="status-dot status-${statusClass[status]}"></span><b>${status}</b><strong>${summary.counts[status]}</strong></div>`).join('')}
    </div>
  `;
  document.querySelector('#status-filters').innerHTML = ['전체', ...PROGRAM_STATUSES].map((status) => `
    <button type="button" class="filter-button ${state.programFilter === status ? 'is-active' : ''}" data-filter="${status}" aria-pressed="${state.programFilter === status}">${status}${status === '전체' ? ` ${state.programs.length}` : ` ${summary.counts[status]}`}</button>
  `).join('');
}

function renderProgramList() {
  const normalizedQuery = state.programQuery.trim().toLocaleLowerCase('ko-KR');
  const filtered = state.programs.filter((item) => {
    const matchesStatus = state.programFilter === '전체' || item.status === state.programFilter;
    const matchesQuery = !normalizedQuery || `${item.name} ${item.kind}`.toLocaleLowerCase('ko-KR').includes(normalizedQuery);
    return matchesStatus && matchesQuery;
  });
  const list = document.querySelector('#program-list');
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">${icon('search')}<h3>조건에 맞는 사업이 없습니다.</h3><p>검색어를 지우거나 다른 상태 필터를 선택해 주세요.</p><button type="button" class="text-button" id="clear-program-filter">필터 초기화</button></div>`;
    return;
  }
  list.innerHTML = filtered.map((item) => `
    <article class="program-row">
      <div class="program-status"><span class="status-badge status-${statusClass[item.status]}">${item.status}</span><small>${item.kind}</small></div>
      <div class="program-main"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.reason)}</p>${item.estimatedSemesterAmount ? `<span class="demo-estimate">데모 계산값 · 학기당 ${formatMoney(item.estimatedSemesterAmount)}</span>` : ''}</div>
      <dl class="program-meta"><div><dt>출처</dt><dd>${item.institution}</dd></div><div><dt>기준</dt><dd>${item.semester}</dd></div><div><dt>최종 확인</dt><dd>${item.checkedAt}</dd></div></dl>
      <div class="program-actions"><a href="${item.officialUrl}" target="_blank" rel="noreferrer">공식 원문 ${icon('external')}</a><a href="${item.applicationUrl}" target="_blank" rel="noreferrer">신청 페이지 ${icon('external')}</a></div>
    </article>
  `).join('');
}

function renderFundingComparison() {
  const funding = state.funding;
  const grantShare = funding.totalNeed ? (funding.scholarshipTotal / funding.totalNeed) * 100 : 0;
  document.querySelector('#funding-comparison').innerHTML = `
    <div class="funding-relationship">
      <article><span>장학금 적용 전</span><strong>${formatMoney(funding.totalNeed)}</strong><div class="funding-bar before-bar"><i style="--width:${(funding.educationNeed / funding.totalNeed) * 100}%"></i><i style="--width:${(funding.livingNeed / funding.totalNeed) * 100}%"></i></div><dl><div><dt>교육비</dt><dd>${formatMoney(funding.educationNeed)}</dd></div><div><dt>희망 생활소비</dt><dd>${formatMoney(funding.livingNeed)}</dd></div></dl></article>
      <div class="funding-minus" aria-label="장학금 후보 금액 차감"><span>장학금 후보 우선</span><strong>− ${formatMoney(funding.scholarshipTotal)}</strong><small>수혜 확정 아님</small></div>
      <article class="funding-after"><span>근로·대출로 배치할 금액</span><strong>${formatMoney(funding.remainingAfterScholarship)}</strong><div class="funding-bar after-bar"><i style="--width:${100 - grantShare}%"></i></div><p>총필요자금의 <b>${roundMoney(grantShare, 1)}%</b>를 상환 의무 없는 후보 지원이 먼저 담당합니다.</p></article>
    </div>
    <div class="assumption-strip"><span>데모 가정</span><p>등록금 ${formatMoney(state.profile.tuitionPerSemester)} × ${funding.semesters}학기 + 월 생활소비 ${formatMoney(state.profile.desiredCollegeSpend)} × ${funding.studyMonths}개월</p><button type="button" class="text-button" data-scroll-target="sources">출처·가정 확인 ${icon('arrow')}</button></div>
  `;
}

function safetyCopy(scenario) {
  if (scenario.safety === 'calculation-impossible') return { label: '계산 불가', detail: '월소득보다 상환액이 커서 생활소비를 계산할 수 없습니다.' };
  if (scenario.safety === 'at-risk') return { label: '안전선 미달', detail: '상환 후 생활소비가 데모 최소생활선보다 낮습니다.' };
  if (scenario.safety === 'watch') return { label: '목표보다 낮음', detail: '상환은 가능하지만 입력한 희망 생활소비에 미치지 못합니다.' };
  return { label: '목표선 충족', detail: '입력한 취업 후 희망 생활소비를 유지합니다.' };
}

function scenarioMarkup(scenario) {
  const preview = calculateStressPreview(state.profile, state.scholarshipSummary.estimatedTotal, SCENARIO_DEFINITIONS.find((item) => item.id === scenario.id));
  const safety = safetyCopy(scenario);
  const sourceTotal = scenario.funding.scholarshipTotal + scenario.workTotal + scenario.newLoan;
  const sourceWidth = (value) => {
    if (!sourceTotal || value <= 0) return 0;
    return Math.max(2, (value / sourceTotal) * 100);
  };
  const stressActive = Object.values(state.stress).some(Boolean);
  return `
    <article class="scenario-column scenario-${scenario.id} ${scenario.recommended ? 'is-recommended' : ''}">
      <header><div><h3>${scenario.name}</h3>${scenario.recommended ? '<span>기본 제안</span>' : ''}</div><p>${scenario.summary}</p></header>
      <div class="scenario-metric primary-metric"><span>대학 시절 월 생활소비</span><div><small>희망 ${formatMoney(state.profile.desiredCollegeSpend)}</small><strong>${formatMoney(scenario.possibleCollegeSpend, { digits: 1 })}</strong></div><p class="metric-delta ${scenario.collegeSpendGap < 0 ? 'is-negative' : 'is-positive'}">희망 대비 ${scenario.collegeSpendGap < 0 ? '' : '+'}${formatMoney(scenario.collegeSpendGap, { digits: 1 })}</p></div>
      <div class="scenario-metric work-metric"><span>주당 근로시간</span><dl><div><dt>현재</dt><dd>${state.profile.currentWorkHours}시간</dd></div><div><dt>희망</dt><dd>${state.profile.desiredWorkHours}시간</dd></div><div><dt>시나리오</dt><dd>${scenario.workHours}시간</dd></div></dl></div>
      <div class="scenario-metric repayment-metric"><span>취업 후 상환</span><dl><div><dt>월 원리금</dt><dd>${formatMoney(scenario.loan.monthlyPayment, { digits: 1 })}</dd></div><div><dt>총이자</dt><dd>${formatMoney(scenario.loan.totalInterest, { digits: 1 })}</dd></div></dl></div>
      <div class="scenario-metric primary-metric career-metric"><span>취업 후 월 생활소비</span><div><small>희망 ${formatMoney(state.profile.desiredCareerSpend)}</small><strong>${scenario.calculationPossible ? formatMoney(scenario.possibleCareerSpend, { digits: 1 }) : '계산 불가'}</strong></div><p class="safety-label safety-${scenario.safety}">${safety.label}<small>${safety.detail}</small></p></div>
      <div class="scenario-metric source-metric"><span>졸업까지 자금 담당</span><div class="source-bar" aria-hidden="true"><i class="source-scholarship" style="--width:${sourceWidth(scenario.funding.scholarshipTotal)}%"></i><i class="source-work" style="--width:${sourceWidth(scenario.workTotal)}%"></i><i class="source-loan" style="--width:${sourceWidth(scenario.newLoan)}%"></i></div><dl><div><dt>장학금</dt><dd>${formatMoney(scenario.funding.scholarshipTotal)}</dd></div><div><dt>근로소득</dt><dd>${formatMoney(scenario.workTotal)}</dd></div><div><dt>신규 대출</dt><dd>${formatMoney(scenario.newLoan)}</dd></div><div><dt>남는 격차</dt><dd>${formatMoney(scenario.fundingGap)}</dd></div></dl></div>
      <div class="scenario-stress ${stressActive ? 'is-active' : ''}"><span>${stressActive ? '적용한 위험 조건' : '미리 보는 위험 변화'}</span>${stressActive ? `<p>대학 월 생활소비 ${formatMoney(scenario.possibleCollegeSpend, { digits: 1 })} · 취업 후 ${scenario.calculationPossible ? formatMoney(scenario.possibleCareerSpend, { digits: 1 }) : '계산 불가'}</p>${scenario.transitionGap ? `<small>취업 전 공백자금 ${formatMoney(scenario.transitionGap)} 별도 필요</small>` : ''}` : `<p>장학금 미선정 시 대학 월 ${formatMoney(preview.scholarshipCollegeDelta, { digits: 1 })} 변화</p><small>취업 12개월 지연 시 월 상환 +${formatMoney(preview.delayedPaymentDelta, { digits: 1 })} · 공백자금 ${formatMoney(preview.delayedTransitionGap)}</small>`}</div>
    </article>
  `;
}

function renderScenarioComparison() {
  document.querySelector('#scenario-comparison').innerHTML = state.scenarios.map(scenarioMarkup).join('');
}

function renderStressReadout() {
  const activeLabels = [];
  if (state.stress.scholarshipMiss) activeLabels.push('장학금 미선정');
  if (state.stress.employmentDelayMonths) activeLabels.push(`취업 ${state.stress.employmentDelayMonths}개월 지연`);
  if (state.stress.salaryReductionRate) activeLabels.push('초봉 20% 감소');
  if (state.stress.graduationDelayMonths) activeLabels.push('졸업 1년 지연');
  const balance = state.scenarios.find((scenario) => scenario.id === 'balance');
  const baseline = calculateAllScenarios(state.profile, state.scholarshipSummary.estimatedTotal).find((scenario) => scenario.id === 'balance');
  const readout = document.querySelector('#stress-readout');
  if (!activeLabels.length) {
    readout.innerHTML = `<span>기준 시나리오</span><h3>위험 조건을 선택하면 세 결과가 함께 바뀝니다.</h3><p>균형형 기준 대학 월 생활소비 ${formatMoney(balance.possibleCollegeSpend, { digits: 1 })}, 취업 후 ${formatMoney(balance.possibleCareerSpend, { digits: 1 })}입니다.</p>`;
    return;
  }
  const collegeDelta = balance.possibleCollegeSpend - baseline.possibleCollegeSpend;
  const careerDelta = balance.possibleCareerSpend - baseline.possibleCareerSpend;
  readout.innerHTML = `<span>${activeLabels.join(' · ')}</span><h3>균형형의 현재·미래 여력이 함께 변했습니다.</h3><div class="stress-deltas"><div><span>대학 월 생활소비 변화</span><strong>${collegeDelta > 0 ? '+' : ''}${formatMoney(collegeDelta, { digits: 1 })}</strong></div><div><span>취업 후 월 생활소비 변화</span><strong>${careerDelta > 0 ? '+' : ''}${formatMoney(careerDelta, { digits: 1 })}</strong></div><div><span>취업 전 공백자금</span><strong>${formatMoney(balance.transitionGap)}</strong></div></div><p class="stress-verdict safety-${balance.safety}">${safetyCopy(balance).detail}</p>`;
}

function renderRecommendation() {
  const balance = state.scenarios.find((scenario) => scenario.id === 'balance');
  const focus = state.scenarios.find((scenario) => scenario.id === 'focus');
  const debtMin = state.scenarios.find((scenario) => scenario.id === 'debt-min');
  const workHourDelta = state.profile.currentWorkHours - balance.workHours;
  const workHourReason = workHourDelta >= 0
    ? `현재 주 ${state.profile.currentWorkHours}시간에서 ${balance.workHours}시간으로 조정해 주 ${workHourDelta}시간을 학업에 돌립니다.`
    : `현재 주 ${state.profile.currentWorkHours}시간보다 ${Math.abs(workHourDelta)}시간 늘어나는 안이라 학업시간 영향을 다시 확인해야 합니다.`;
  document.querySelector('#recommendation').innerHTML = `
    <div class="recommendation-layout">
      <article class="recommendation-main"><span>기본 제안 · 균형형</span><h3>주 ${balance.workHours}시간을 출발점으로, 생활 격차와 미래 상환을 함께 줄입니다.</h3><ol><li><b>지원이 먼저입니다.</b><p>조건상 장학금 후보 ${formatMoney(state.scholarshipSummary.estimatedTotal)}을 등록금에 먼저 적용했습니다.</p></li><li><b>시간 영향을 함께 봅니다.</b><p>${workHourReason}</p></li><li><b>양쪽 극단의 비용을 피합니다.</b><p>학업시간 확보형보다 신규 대출을 ${formatMoney(focus.newLoan - balance.newLoan)} 줄이고, 부채 최소형보다 대학 월 생활소비를 ${formatMoney(balance.possibleCollegeSpend - debtMin.possibleCollegeSpend, { digits: 1 })} 높입니다.</p></li></ol><p class="recommendation-caution">이 제안은 사용자의 입력과 데모 규칙에 따른 비교안입니다. 장학금 수혜와 대출 승인을 확정하지 않으며 공식기관의 최종 판단이 우선합니다.</p></article>
      <aside class="unknowns"><h3>아직 부족한 정보</h3><ul><li><span>성적·이수학점</span><b>우수·국가장학 세부판정</b></li><li><span>대학 유형·캠퍼스</span><b>대학별 II유형과 지역인재</b></li><li><span>부모 주소·통학거리</span><b>주거안정장학금</b></li><li><span>전공·대학 추천</span><b>우수학생 장학금</b></li></ul><p>정보가 없으면 ‘탈락’으로 단정하지 않고 정보 부족 또는 추가 심사로 남겼습니다.</p></aside>
    </div>
    <div class="engine-boundary"><div><span>AI</span><p>공고를 구조화하고 결과를 쉬운 말로 설명</p></div><i aria-hidden="true"></i><div><span>규칙엔진</span><p>입력 조건으로 후보·제외 이유를 재현</p></div><i aria-hidden="true"></i><div><span>최적화엔진</span><p>장학금·근로·대출 조합과 위험을 계산</p></div><i aria-hidden="true"></i><div><span>공식기관</span><p>자격·수혜·대출 승인을 최종 판단</p></div></div>
  `;
}

function calculateAndRender(profile) {
  const semesters = Math.round(profile.graduationYears * 2);
  state.profile = profile;
  state.programs = evaluateScholarships(profile);
  state.scholarshipSummary = summarizeScholarships(state.programs, semesters);
  state.funding = calculateFundingSummary(profile, state.scholarshipSummary.estimatedTotal, state.stress);
  state.scenarios = calculateAllScenarios(profile, state.scholarshipSummary.estimatedTotal, state.stress);
  document.querySelector('#result-description').textContent = `${profile.school} ${profile.academicYear}학년 입력값을 기준으로 대표 지원사업 ${state.programs.length}개를 점검했습니다.`;
  renderMatchOverview();
  renderProgramList();
  renderFundingComparison();
  renderScenarioComparison();
  renderStressReadout();
  renderRecommendation();
  resultsRegion.hidden = false;
}

function updateStress() {
  state.stress = {
    scholarshipMiss: document.querySelector('#stress-scholarship').checked,
    employmentDelayMonths: Number(document.querySelector('[name="employment-delay"]:checked').value),
    salaryReductionRate: document.querySelector('#stress-salary').checked ? 0.2 : 0,
    graduationDelayMonths: document.querySelector('#stress-graduation').checked ? 12 : 0,
  };
  state.funding = calculateFundingSummary(state.profile, state.scholarshipSummary.estimatedTotal, state.stress);
  state.scenarios = calculateAllScenarios(state.profile, state.scholarshipSummary.estimatedTotal, state.stress);
  renderFundingComparison();
  renderScenarioComparison();
  renderStressReadout();
  renderRecommendation();
}

sampleButtons.forEach((button) => button.addEventListener('click', () => loadSample(button)));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const profile = readProfile();
  const errors = validateProfile(profile);
  showFormErrors(errors);
  if (errors.length) return;
  calculateButton.disabled = true;
  calculateButton.classList.add('is-loading');
  calculateButton.innerHTML = '<span>지원사업과 자금격차를 계산하는 중</span>';
  window.setTimeout(() => {
    calculateAndRender(profile);
    calculateButton.disabled = false;
    calculateButton.classList.remove('is-loading');
    calculateButton.innerHTML = `다시 계산하기 ${icon('arrow')}`;
    document.querySelector('#result-title').focus({ preventScroll: true });
    resultsRegion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 420);
});

document.querySelector('#toggle-programs').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const directory = document.querySelector('#program-directory');
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  directory.hidden = expanded;
  button.innerHTML = expanded ? `전체 지원사업 보기 ${icon('arrow')}` : `전체 목록 접기 ${icon('chevron')}`;
  if (!expanded) document.querySelector('#program-query').focus({ preventScroll: true });
});

document.querySelector('#status-filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  state.programFilter = button.dataset.filter;
  renderMatchOverview();
  renderProgramList();
});

document.querySelector('#program-query').addEventListener('input', (event) => {
  state.programQuery = event.target.value;
  renderProgramList();
});

document.querySelector('#program-list').addEventListener('click', (event) => {
  if (event.target.id !== 'clear-program-filter') return;
  state.programFilter = '전체';
  state.programQuery = '';
  document.querySelector('#program-query').value = '';
  renderMatchOverview();
  renderProgramList();
});

document.querySelectorAll('.stress-controls input').forEach((control) => control.addEventListener('change', updateStress));

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-scroll-target]');
  if (!target) return;
  document.querySelector(`#${target.dataset.scrollTarget}`)?.scrollIntoView({ behavior: 'smooth' });
});
