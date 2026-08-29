import { renderForm } from './diagnosis-form.js';
import { icon } from '../shared/icon.js';

export function renderShell(state) {
  return `
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
        ${renderForm(state.profile)}
      </section>
      <div id="result-root" tabindex="-1"></div>
    </main>
    <footer>
      <div><strong>학자금 소비평탄화 AI</strong><p>지원사업 후보 확인과 학비·생활비 계획을 돕는 간이 계산 서비스</p></div>
      <p>주민등록번호, 계좌번호, 인증서, 금융기관 비밀번호를 요구하지 않습니다.</p>
    </footer>`;
}
