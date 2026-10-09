/** base64url helpers (RFC 4648 section 5, no padding), plus SHA-256 and HMAC through WebCrypto. */

export function bytesToB64u(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64uToBytes(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export const textToB64u = (t: string) => bytesToB64u(new TextEncoder().encode(t));
export const b64uToText = (s: string) => new TextDecoder().decode(b64uToBytes(s));

export async function sha256B64u(text: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return bytesToB64u(new Uint8Array(d));
}

export async function hmacSha256B64u(key: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data));
  return bytesToB64u(new Uint8Array(sig));
}

/** RFC 7636 section 4.1: 43 to 128 characters from [A-Z a-z 0-9 - . _ ~]. */
export const validVerifier = (v: string) => /^[A-Za-z0-9\-._~]{43,128}$/.test(v);
