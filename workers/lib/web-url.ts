import type { Env } from '../types';

/**
 * Base URL for the web app (frontend) used in email links (reset password, verify email).
 * Uses NEXT_PUBLIC_WEB_URL when set; otherwise infers from request host so production
 * API (api.micropaywall.app) always gets https://micropaywall.app, not localhost.
 */
export function getWebBaseUrl(env: Env, requestUrl: string): string {
  if (env.NEXT_PUBLIC_WEB_URL) return env.NEXT_PUBLIC_WEB_URL;
  try {
    const host = new URL(requestUrl).hostname;
    if (host === 'api.micropaywall.app' || host.endsWith('.micropaywall.app')) {
      return 'https://micropaywall.app';
    }
  } catch {
    // ignore
  }
  return 'http://localhost:3000';
}
