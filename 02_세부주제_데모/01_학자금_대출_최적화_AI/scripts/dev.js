import { createServer } from 'vite';
import { createApiServer } from '../server/index.js';

const api = createApiServer();
let vite;
try {
  await new Promise((resolve, reject) => {
    api.once('error', reject);
    api.listen(Number(process.env.AI_PORT || 8787), '127.0.0.1', resolve);
  });
  vite = await createServer({ configLoader: 'native' });
  await vite.listen();
  vite.printUrls();
  console.log(process.env.GEMINI_API_KEY?.trim() ? 'SLOW AI: key configured (provider connection not yet verified).' : 'SLOW AI: key not configured; panel preview available.');
} catch (error) {
  api.close();
  await vite?.close();
  console.error(error.code === 'EADDRINUSE' ? 'Port already in use. Check AI_PORT and Vite port.' : 'Development servers could not start.');
  process.exitCode = 1;
}
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await vite?.close();
  api.closeAllConnections();
  api.close();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
