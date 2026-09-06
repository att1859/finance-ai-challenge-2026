import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { generateAnswer, ApiError, DEFAULT_MODEL } from './ai-provider.js';

const MAX_BODY = 64 * 1024;
const string = (value, limit) => typeof value === 'string' && value.length <= limit;
function scenario(value) {
  if (!value || !string(value.id, 100) || !string(value.name, 100) || !Array.isArray(value.facts) || value.facts.length > 25) return null;
  if (!value.facts.every(item => item && string(item.label, 160) && string(item.value, 300))) return null;
  return { id: value.id, name: value.name, facts: value.facts.map(({ label, value }) => ({ label, value })) };
}
export function validateRequest(body) {
  const bad = () => { throw new ApiError(400, 'INVALID_REQUEST', '질문과 선택한 시나리오를 확인해 주세요.'); };
  if (!body || !['summary', 'chat'].includes(body.mode) || !Number.isSafeInteger(body.contextVersion) || body.contextVersion < 0) bad();
  const context = body.context;
  const selected = scenario(context?.selected);
  if (!selected || !['기본 조건', '변경 조건'].includes(context.view) || !Array.isArray(context.comparison) || context.comparison.length > 2
    || !Array.isArray(context.policyVersions) || context.policyVersions.length > 5 || !context.policyVersions.every(id => string(id, 100))) bad();
  const comparison = context.comparison.map(scenario);
  if (comparison.some(item => !item)) bad();
  if (!Array.isArray(body.messages) || body.messages.length > 13 || !body.messages.every(message =>
    message && ['user', 'assistant'].includes(message.role) && string(message.content, message.role === 'user' ? 1000 : 4000) && message.content.trim())) bad();
  if (body.mode === 'chat' && body.messages.at(-1)?.role !== 'user') bad();
  return {
    mode: body.mode, contextVersion: body.contextVersion,
    context: { selected, comparison, view: context.view, policyVersions: context.policyVersions },
    messages: body.messages.map(({ role, content }) => ({ role, content })),
  };
}
async function readBody(req) {
  if (Number(req.headers['content-length']) > MAX_BODY) throw new ApiError(413, 'TOO_LARGE', '질문이 너무 길어요.');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new ApiError(413, 'TOO_LARGE', '질문이 너무 길어요.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ApiError(400, 'INVALID_JSON', '요청 내용을 확인해 주세요.'); }
}
export function createApiServer({ answer = generateAnswer, env = process.env, now = Date.now } = {}) {
  let windowStart = 0, requests = 0, active = 0;
  const origins = new Set((env.AI_ALLOWED_ORIGINS || 'http://127.0.0.1:5175,http://localhost:5175').split(',').map(value => value.trim()));
  const reply = (res, status, body) => {
    if (res.destroyed) return;
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(body));
  };
  return createServer(async (req, res) => {
    const requestId = randomUUID();
    const controller = new AbortController();
    res.on('close', () => { if (!res.writableEnded) controller.abort(); });
    try {
      // Loopback Host check also rejects DNS rebinding. Origin is enforced for browser writes.
      if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host ?? '')) throw new ApiError(403, 'FORBIDDEN', '허용되지 않은 요청입니다.');
      if (req.headers.origin && !origins.has(req.headers.origin)) throw new ApiError(403, 'FORBIDDEN', '허용되지 않은 요청입니다.');
      if (req.url === '/api/health' && req.method === 'GET') {
        return reply(res, 200, { configured: Boolean(env.GEMINI_API_KEY?.trim()), provider: 'Gemini', model: env.AI_MODEL || DEFAULT_MODEL });
      }
      if (req.url !== '/api/chat') throw new ApiError(404, 'NOT_FOUND', '요청 경로를 확인해 주세요.');
      if (req.method !== 'POST') throw new ApiError(405, 'METHOD_NOT_ALLOWED', '요청 방식을 확인해 주세요.');
      if (!req.headers['content-type']?.startsWith('application/json')) throw new ApiError(415, 'CONTENT_TYPE', 'JSON 요청이 필요합니다.');
      const request = validateRequest(await readBody(req));
      if (now() - windowStart >= 60_000) { windowStart = now(); requests = 0; }
      if (requests >= 20 || active >= 2) throw new ApiError(429, 'RATE_LIMIT', '요청이 많아요. 잠시 후 다시 시도해 주세요.');
      requests++; active++;
      try {
        const output = await answer(request, { apiKey: env.GEMINI_API_KEY || '', model: env.AI_MODEL || DEFAULT_MODEL, signal: controller.signal });
        reply(res, 200, { ...output, requestId, contextVersion: request.contextVersion });
      } finally { active--; }
    } catch (error) {
      const known = error instanceof ApiError;
      reply(res, known ? error.status : 500, { requestId, error: { code: known ? error.code : 'INTERNAL', message: known ? error.message : '요청을 처리하지 못했어요. 다시 시도해 주세요.' } });
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createApiServer();
  server.listen(Number(process.env.AI_PORT || 8787), '127.0.0.1', () => console.log('SLOW API ready on loopback. API keys and conversations are never logged.'));
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'AI_PORT is already in use.' : 'SLOW API could not start.'); process.exitCode = 1; });
}
