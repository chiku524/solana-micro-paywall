function bufferToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hash);
}

const PREFIX = 'mp_live_';

export function generateApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${PREFIX}${b64}`;
}

export function parseApiKeyHeader(header: string | undefined): string | null {
  if (!header || !header.trim()) return null;
  return header.trim();
}

export function apiKeyPrefix(fullKey: string): string {
  return fullKey.slice(0, 12);
}
