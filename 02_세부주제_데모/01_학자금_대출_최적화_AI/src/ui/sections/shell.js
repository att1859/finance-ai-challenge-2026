import { renderDiagnosisSection } from './diagnosis-form.js';
import { renderSmoothingExplainer } from './smoothing-explainer.js';
import { renderLoanIntroduction } from './loan-introduction.js';

export function renderShell(state) {
  return `
    <a class="skip-link" href="#main">본문으로 바로가기</a>
    <header class="site-header">
      <a class="brand" href="#top" aria-label="SLOW 홈">
        <span>SLOW</span>
      </a>
      <nav aria-label="주요 메뉴">
        <a href="#diagnosis">계획 계산</a>
        <a href="#how-it-works">계산 방식</a>
        <a href="#sources">공식 정보</a>
      </nav>
    </header>
    <main id="main">
      ${renderLoanIntroduction()}

      <section class="process-strip" id="how-it-works" aria-label="계산 과정">
        <span><b>1</b> 현재 조건 입력</span><span aria-hidden="true">→</span>
        <span><b>2</b> 세 계획 계산</span><span aria-hidden="true">→</span>
        <span><b>3</b> 부담 비교</span>
      </section>

      ${renderDiagnosisSection(state.profile, state.ui.inputMode)}
      <div id="result-root" tabindex="-1"></div>
    </main>
    <footer>
      <div><strong>SLOW</strong><p>학비·생활비와 졸업 후 상환 계획을 비교하는 간이 계산 서비스</p></div>
      <p>주민등록번호, 계좌번호, 인증서, 금융기관 비밀번호를 요구하지 않습니다.</p>
    </footer>
    ${renderSmoothingExplainer()}`;
}
