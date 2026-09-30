/**
 * Entry point Worker mandiri (alternatif Cloudflare Pages).
 * Melayani API di /api/* dan berkas statis SPA dari binding ASSETS.
 * Deploy: npm run deploy:worker  (memakai wrangler.worker.toml)
 */
import app from './src/app';
import type { Env } from './src/types';
import type { ExecutionContext } from '@cloudflare/workers-types';

interface EnvDenganAset extends Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: EnvDenganAset, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env as unknown as Env, ctx as unknown as any);
    }
    return env.ASSETS.fetch(request);
  },
};
