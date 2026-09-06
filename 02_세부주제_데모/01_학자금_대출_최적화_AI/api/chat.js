import { createApiHandler } from '../server/index.js';

export const config = { maxDuration: 60 };
export default createApiHandler({ hosting: 'vercel' });
