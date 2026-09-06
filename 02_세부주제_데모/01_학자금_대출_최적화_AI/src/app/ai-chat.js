import { buildAiContext } from './ai-context.js';
import { createAiSession } from './ai-session.js';
import { renderAiAssistant, renderAiOverview, renderAiMessage } from '../ui/sections/ai-assistant.js';

export function mountAiAssistant(appState) {
  const host = document.createElement('div');
  document.body.append(host);
  host.innerHTML = renderAiAssistant();
  const panel = host.querySelector('#ai-panel'), launcher = host.querySelector('.ai-launcher');
  const input = host.querySelector('#ai-question'), form = host.querySelector('#ai-form');
  const log = host.querySelector('#ai-messages'), scroll = host.querySelector('.ai-scroll');
  const overview = host.querySelector('#ai-overview');
  let open = false, connection = 'unknown', healthVersion = 0, summaryTimer, notice = '', overviewHtml = '', renderedMessages = [];
  const session = createAiSession({ onChange: render });
  function render() {
    const state = session.state;
    host.querySelector('#ai-scenario').textContent = state.context?.selected.name ?? '아직 선택한 안이 없어요';
    host.querySelector('#ai-view').textContent = state.context?.view ?? '';
    const next = renderAiOverview(state, connection);
    if (next !== overviewHtml) { overview.innerHTML = next; overviewHtml = next; }
    const hasPrefix = renderedMessages.every((value, i) => value === JSON.stringify(state.messages[i]));
    if (!hasPrefix) { log.replaceChildren(); renderedMessages = []; }
    state.messages.slice(renderedMessages.length).forEach(message => {
      log.insertAdjacentHTML('beforeend', renderAiMessage(message));
      renderedMessages.push(JSON.stringify(message));
    });
    const canChat = Boolean(state.context && state.consent && connection === 'ready' && !state.busy);
    input.disabled = !canChat;
    form.querySelector('button').disabled = !canChat || !input.value.trim();
    host.querySelectorAll('[data-question]').forEach(button => { button.disabled = !canChat; });
    host.querySelector('[data-ai="reset"]').hidden = !state.consent;
    host.querySelector('[data-ai="retry"]').hidden = !state.error;
    host.querySelector('#ai-status').textContent = state.busy ? '선택한 안을 읽고 있어요…'
      : state.error || (connection === 'missing' ? 'AI 연결 준비 중 · 계산 결과 미리보기는 이용할 수 있어요.'
        : connection === 'offline' ? 'AI 서버에 연결하지 못했어요. 연결 확인을 눌러 주세요.'
          : connection === 'checking' ? 'AI 연결 상태를 확인하고 있어요…'
            : state.summary || state.messages.some(message => message.role === 'assistant')
              ? 'Gemini 응답 확인됨 · FAQ와 현재 시나리오로 답변해요.'
              : notice || (connection === 'ready' ? 'API 키 설정됨 · 첫 답변으로 연결을 확인해 주세요.' : ''));
  }
  function scheduleSummary() {
    clearTimeout(summaryTimer);
    if (open && session.state.context && session.state.consent && connection === 'ready' && !session.state.summary && !session.state.busy && !session.state.error) {
      summaryTimer = setTimeout(() => { if (open) session.send('summary'); }, 400);
    }
  }
  async function checkConnection() {
    const id = ++healthVersion;
    connection = 'checking'; render();
    try {
      const response = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (id !== healthVersion) return;
      connection = data.configured === true ? 'ready' : 'missing';
    } catch { if (id !== healthVersion) return; connection = 'offline'; }
    render(); scheduleSummary();
  }
  function setOpen(value) {
    open = value; panel.hidden = !value; launcher.setAttribute('aria-expanded', String(value));
    clearTimeout(summaryTimer);
    if (open) { render(); host.querySelector('[data-ai="close"]').focus({ preventScroll: true }); checkConnection(); }
    else { session.cancel(); launcher.focus({ preventScroll: true }); }
  }
  host.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.ai;
    if (action === 'toggle') setOpen(!open);
    if (action === 'close') setOpen(false);
    if (action === 'connection') checkConnection();
    if (action === 'consent') { session.allow(); session.send('summary'); }
    if (action === 'retry') session.retry();
    if (action === 'reset') { session.reset(); input.value = ''; notice = '대화를 초기화했어요.'; scheduleSummary(); render(); }
    if (button.dataset.question) { input.value = button.dataset.question; form.requestSubmit(); }
  });
  host.addEventListener('keydown', event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false); }
  });
  input.addEventListener('input', render);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (input.disabled || !text || text.length > 1000) return;
    input.value = ''; notice = '';
    clearTimeout(summaryTimer);
    const pending = session.send('chat', text);
    scroll.scrollTop = scroll.scrollHeight;
    await pending;
    if (open) { scroll.scrollTop = scroll.scrollHeight; if (!input.disabled) input.focus({ preventScroll: true }); }
  });
  render();
  return {
    update() {
      if (session.setContext(buildAiContext(appState))) {
        notice = session.state.context ? '선택한 조건에 맞춰 설명을 새로 시작해요.' : '';
        input.value = ''; render(); scheduleSummary();
      }
    },
  };
}
