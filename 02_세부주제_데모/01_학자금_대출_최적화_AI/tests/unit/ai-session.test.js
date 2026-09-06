import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiSession } from '../../src/app/ai-session.js';
const response = (version, answer = '설명') => ({ ok: true, json: async () => ({ contextVersion: version, answer, summary: '요약', benefits: [], cautions: [] }) });

test('HTML·빈 응답·잘못된 JSON은 안내로 바꾸고 재시도하면 질문 중복 없이 복구한다', async () => {
  for (const raw of ['<html>Bad Gateway</html>', '', '{broken', 'null', '[]']) {
    let calls = 0;
    const session = createAiSession({ request: async body => ++calls === 1
      ? new Response(raw, { status: 502 }) : response(body.contextVersion) });
    session.setContext({ selected: 'A' }); session.allow();
    await session.send('chat', '생활비를 설명해줘');
    assert.equal(session.state.error, 'AI 답변을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    assert.equal(session.state.busy, false);
    await session.retry();
    assert.equal(session.state.error, '');
    assert.deepEqual(session.state.messages.map(item => item.role), ['user', 'assistant']);
  }
});

test('응답 본문 읽기 중 중단과 네트워크 실패도 기존 안내를 유지한다', async () => {
  for (const [error, message] of [
    [new DOMException('aborted', 'AbortError'), '답변이 늦어지고 있어요. 다시 시도해 주세요.'],
    [new TypeError('network'), 'AI 서버에 연결하지 못했어요. 다시 시도해 주세요.'],
  ]) {
    const session = createAiSession({ request: async () => ({ json: async () => { throw error; } }) });
    session.setContext({ selected: 'A' }); session.allow();
    await session.send('summary');
    assert.equal(session.state.error, message);
  }
});

test('동의 전에는 호출하지 않고 조건 변경 전의 늦은 답변을 버린다', async () => {
  const pending = [];
  const session = createAiSession({ request: body => new Promise(resolve => pending.push({ body, resolve })) });
  session.setContext({ selected: 'A' });
  await session.send('summary');
  assert.equal(pending.length, 0);
  session.allow();
  const first = session.send('summary');
  session.setContext({ selected: 'B' });
  const second = session.send('summary');
  pending[1].resolve(response(2));
  await second;
  pending[0].resolve(response(1, '이전 답변'));
  await first;
  assert.equal(session.state.summary.contextVersion, 2);
  assert.equal(session.state.busy, false);
});
test('실패한 질문 재시도는 질문을 중복 추가하지 않는다', async () => {
  let calls = 0;
  const session = createAiSession({ request: async body => {
    if (!calls++) return { ok: false, json: async () => ({ error: { message: '연결 실패' } }) };
    return response(body.contextVersion);
  } });
  session.setContext({ selected: 'A' }); session.allow();
  await session.send('chat', '왜 이 금액인가요?');
  assert.equal(session.state.error, '연결 실패');
  await session.retry();
  assert.deepEqual(session.state.messages.map(item => item.role), ['user', 'assistant']);
  assert.equal(session.state.error, '');
});
test('닫기 취소와 대화 초기화 이후 응답은 상태를 덮어쓰지 않는다', async () => {
  let resolve;
  const session = createAiSession({ request: () => new Promise(done => { resolve = done; }) });
  session.setContext({ selected: 'A' }); session.allow();
  const pending = session.send('chat', '설명해줘');
  session.reset();
  resolve(response(1));
  await pending;
  assert.deepEqual(session.state.messages, []);
  assert.equal(session.state.busy, false);
});
