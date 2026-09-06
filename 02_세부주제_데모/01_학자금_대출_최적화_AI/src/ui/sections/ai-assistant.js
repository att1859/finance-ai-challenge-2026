import { quietButton, primaryButton } from '../shared/controls.js';
import { icon } from '../shared/icon.js';
import { escapeHtml as safe } from '../shared/escape-html.js';

const bot = '<span class="ai-avatar" aria-hidden="true"><span></span><span></span></span>';
export function renderAiAssistant() {
  return `<div class="ai-widget">
    <section class="ai-panel" id="ai-panel" role="region" aria-labelledby="ai-title" hidden>
      <header class="ai-header">${bot}<div class="ai-heading"><h2 id="ai-title">SLOW 봇</h2><p>내 시나리오를 함께 읽어요</p></div>
        <button type="button" class="${quietButton} ai-icon-button" data-ai="close" aria-label="SLOW 봇 닫기">${icon('close')}</button>
      </header>
      <div class="ai-context"><span class="ai-context-label">지금 보고 있는 시나리오</span><strong id="ai-scenario">아직 선택한 안이 없어요</strong><span id="ai-view"></span></div>
      <div class="ai-scroll" tabindex="0" aria-label="시나리오 설명과 대화">
        <div id="ai-overview"></div>
        <div id="ai-messages" role="log" aria-label="SLOW 봇 대화" aria-live="polite" aria-relevant="additions"></div>
      </div>
      <div class="ai-bottom">
        <p id="ai-status" role="status" aria-live="polite" tabindex="-1"></p>
        <div class="ai-consent" hidden><p id="ai-consent-note">AI 설명을 시작하면 선택·비교 시나리오의 금액, 상품, 자격 상태와 질문·최근 대화를 Google Gemini에 전달합니다. SLOW는 대화를 저장하지 않으며, Google의 처리는 해당 서비스 정책을 따릅니다.</p><button type="button" class="${primaryButton}" data-ai="consent" aria-describedby="ai-consent-note" disabled>동의하고 AI 설명 시작</button></div>
        <div class="ai-actions"><button class="${quietButton}" type="button" data-ai="retry" hidden>다시 시도</button><button class="${quietButton}" type="button" data-ai="reset" hidden>대화 초기화</button><button class="${quietButton}" type="button" data-ai="connection">연결 확인</button></div>
        <div class="ai-prompts"><button class="${quietButton}" type="button" data-question="현재 중시, 균형, 미래 중시는 어떻게 다른가요?">세 시나리오 차이</button><button class="${quietButton}" type="button" data-question="균형이면 알바를 안 해도 되나요? 내 생활비 부족분도 설명해 주세요.">균형이면 알바 0시간?</button><button class="${quietButton}" type="button" data-question="일반 상환과 취업 후 상환은 어떻게 다른가요?">상환 방식 차이</button></div>
        <form id="ai-form"><label class="sr-only" for="ai-question">SLOW 봇에게 질문하세요</label><textarea id="ai-question" rows="2" maxlength="1000" placeholder="SLOW 봇에게 질문하세요" aria-describedby="ai-input-note"></textarea><button class="${primaryButton} ai-send" type="submit" aria-label="질문 보내기">${icon('arrow')}</button></form>
        <p class="ai-footnote" id="ai-input-note">AI 답변은 참고용이며 실제 대출 승인이 아닙니다.</p>
      </div>
    </section>
    <button class="${primaryButton} ai-launcher" type="button" data-ai="toggle" aria-expanded="false" aria-controls="ai-panel"><span class="ai-launcher-heading">${bot}<span>SLOW 봇</span></span><span class="ai-launcher-greeting">내 시나리오의 숫자들,<br>쉽게 풀어 드릴게요.</span></button>
  </div>`;
}
export function renderAiOverview(state) {
  if (!state.context) return '<div class="ai-welcome"><p class="ai-eyebrow">안녕하세요, SLOW 봇이에요</p><h3>숫자 너머의 의미를<br>함께 살펴볼까요?</h3><p>먼저 내 정보를 입력하고 시나리오를 계산해 주세요. 선택한 안의 특징과 주의점을 여기에서 설명해 드릴게요.</p></div>';
  const summary = state.summary;
  if (summary) return `<div class="ai-summary"><span class="ai-eyebrow">AI가 읽어드리는 내 선택</span><h3>선택한 안을 살펴보면</h3><p>${safe(summary.summary)}</p>${[['장점', summary.benefits], ['주의점', summary.cautions]].map(([label, items]) => `<div class="ai-summary-part"><h4>${label}</h4><ul>${items.map(item => `<li>${safe(item)}</li>`).join('')}</ul></div>`).join('')}</div>`;
  return `<div class="ai-summary"><span class="ai-eyebrow">계산 결과 미리보기 · AI 생성 아님</span><h3>이번 학기, 이렇게 달라져요</h3><dl class="ai-facts">${state.context.selected.facts.filter((_, index) => [0,1,4].includes(index)).map(({label,value}) => `<div><dt>${safe(label)}</dt><dd>${safe(value)}</dd></div>`).join('')}</dl>
    ${state.consent ? '<p class="ai-help">선택한 안의 장점과 주의점을 짧게 정리해 드릴게요.</p>' : ''}
    </div>`;
}
export function renderAiMessage(message) {
  return `<article class="ai-message ai-message--${message.role}"><strong>${message.role === 'user' ? '나' : 'SLOW 봇'}</strong><p>${safe(message.content)}</p></article>`;
}
