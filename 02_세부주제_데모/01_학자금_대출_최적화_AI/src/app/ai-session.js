// No DOM dependencies: request cancellation and stale-response handling are testable.
export function createAiSession({ request = (body, signal) => fetch('/api/chat', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal,
}), onChange = () => {} } = {}) {
  const state = { context: null, version: 0, messages: [], summary: null, busy: false, error: '', consent: false };
  let fingerprint = '', controller, serial = 0, retry = null;
  function cancel() { serial++; controller?.abort(); state.busy = false; }
  function setContext(context) {
    const next = JSON.stringify(context);
    if (next === fingerprint) return false;
    fingerprint = next;
    cancel();
    state.context = context; state.version++; state.messages = []; state.summary = null; state.error = ''; retry = null;
    onChange();
    return true;
  }
  async function send(mode, question = '', isRetry = false) {
    if (state.busy || !state.context || !state.consent) return;
    const content = question.trim();
    if (mode === 'chat' && (!content || content.length > 1000)) return;
    if (mode === 'chat' && !isRetry) {
      state.messages = [...state.messages.slice(-12), { role: 'user', content }];
    }
    controller = new AbortController();
    const currentController = controller;
    const id = ++serial, version = state.version;
    state.busy = true; state.error = ''; retry = { mode, question: content };
    onChange();
    const timer = setTimeout(() => currentController.abort(), 35_000);
    try {
      const response = await request({ mode, contextVersion: version, context: state.context,
        messages: mode === 'chat' ? state.messages.map(({ role, content }) => ({ role, content })) : [],
      }, currentController.signal);
      let data;
      try { data = await response.json(); }
      catch (error) {
        if (error.name === 'AbortError' || error instanceof TypeError) throw error;
        throw new Error('AI 답변을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('AI 답변을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      if (id !== serial || version !== state.version) return;
      if (!response.ok) throw new Error(data.error?.message || 'AI 연결을 확인해 주세요.');
      if (data.contextVersion !== version) throw new Error('조건이 바뀌었어요. 다시 시도해 주세요.');
      if (mode === 'summary') {
        if (typeof data.summary !== 'string' || !Array.isArray(data.benefits) || !Array.isArray(data.cautions)) throw new Error('답변을 확인하지 못했어요.');
        state.summary = data;
      } else {
        if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('답변을 확인하지 못했어요.');
        state.messages.push({ role: 'assistant', content: data.answer });
        state.messages = state.messages.slice(-12);
      }
      retry = null;
    } catch (error) {
      if (id !== serial) return;
      state.error = error.name === 'AbortError' ? '답변이 늦어지고 있어요. 다시 시도해 주세요.'
        : error instanceof TypeError ? 'AI 서버에 연결하지 못했어요. 다시 시도해 주세요.' : error.message;
    } finally {
      clearTimeout(timer);
      if (id === serial) { state.busy = false; onChange(); }
    }
  }
  return {
    state, setContext, send,
    cancel: () => { if (state.busy) state.error = '답변 생성을 중단했어요. 다시 시도할 수 있어요.'; cancel(); onChange(); },
    allow: () => { state.consent = true; onChange(); },
    reset: () => { cancel(); state.messages = []; state.summary = null; state.error = ''; retry = null; onChange(); },
    retry: () => retry ? send(retry.mode, retry.question, true) : send('summary'),
  };
}
