import { useEffect, useState } from 'react';
import { WidgetFrame } from '../data-kit';
import { b64uToText, hmacSha256B64u, textToB64u } from './b64';

/**
 * Widget: a real HS256 JWT (RFC 7519 structure: header.claims.signature, each base64url).
 * The sample token was signed with the key "demo-secret".
 * Tamper with a claim and the old signature no longer matches. Re-sign with the key and it does.
 */

const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiJ1c2VyXzQyIiwiYXVkIjoiYXBpLmV4YW1wbGUuY29tIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDA5MDB9.tvNBmWbyDfqr2YjSxJ9z_ofGpFiH0DkIKTqlidRMBdQ';
const [HEAD, PAY0, SIG0] = TOKEN.split('.');
const CLAIMS0 = JSON.parse(b64uToText(PAY0)) as Record<string, string | number>;

type Verdict = 'checking' | 'valid' | 'invalid' | 'unsupported';

const iso = (s: number) => new Date(s * 1000).toISOString().replace('.000Z', 'Z');

export default function TokenAnatomy() {
  const [claims, setClaims] = useState(CLAIMS0);
  const [sig, setSig] = useState(SIG0);
  const [key, setKey] = useState('demo-secret');
  const [verdict, setVerdict] = useState<Verdict>('checking');

  const pay = textToB64u(JSON.stringify(claims));
  const signingInput = `${HEAD}.${pay}`;

  useEffect(() => {
    let live = true;
    if (!globalThis.crypto?.subtle) {
      setVerdict('unsupported');
      return;
    }
    setVerdict('checking');
    hmacSha256B64u(key, signingInput).then((expected) => {
      if (live) setVerdict(expected === sig ? 'valid' : 'invalid');
    });
    return () => {
      live = false;
    };
  }, [key, signingInput, sig]);

  const reset = () => {
    setClaims(CLAIMS0);
    setSig(SIG0);
    setKey('demo-secret');
  };
  const resign = async () => {
    if (globalThis.crypto?.subtle) setSig(await hmacSha256B64u(key, signingInput));
  };

  const iat = Number(claims.iat);
  const exp = Number(claims.exp);
  const btn = 'rounded-md border border-line px-3 py-1 text-sm hover:bg-surface';

  return (
    <WidgetFrame
      title="Token anatomy: signed, not secret"
      caption={
        <>
          Anyone can decode the middle part: base64url is an encoding, not encryption. The signature only proves nobody changed the bytes after the key holder signed them. Here <code>exp - iat</code> is{' '}
          {exp - iat} s ({(exp - iat) / 60} min).
        </>
      }
    >
      <div className="break-all rounded-lg bg-surface px-3 py-2 font-mono text-xs leading-relaxed" data-testid="token">
        <span style={{ color: 'var(--accent)' }}>{HEAD}</span>.<span style={{ color: 'var(--warn)' }}>{pay}</span>.<span style={{ color: 'var(--ok)' }}>{sig}</span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>HEADER (decoded)</div>
          <pre className="mt-1 overflow-x-auto rounded bg-surface px-3 py-2 font-mono text-xs">{JSON.stringify(JSON.parse(b64uToText(HEAD)), null, 2)}</pre>
        </div>
        <div>
          <div className="text-xs font-semibold" style={{ color: 'var(--warn)' }}>CLAIMS (decoded)</div>
          <pre className="mt-1 overflow-x-auto rounded bg-surface px-3 py-2 font-mono text-xs" data-testid="claims">{JSON.stringify(claims, null, 2)}</pre>
          <div className="mt-1 text-xs text-muted">
            iat = {iso(iat)}, exp = {iso(exp)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => setClaims({ ...claims, sub: 'admin_1' })}>
          Change sub to admin_1
        </button>
        <button type="button" className={btn} onClick={() => setClaims({ ...claims, exp: exp + 86400 })}>
          Extend exp by 1 day
        </button>
        <button type="button" className={btn} onClick={resign}>
          Re-sign with the key below
        </button>
        <button type="button" className={btn} onClick={reset}>
          Reset
        </button>
      </div>

      <label className="mt-3 block text-sm">
        <span className="text-muted">Server's signing key (HS256 secret)</span>
        <input type="text" value={key} onChange={(e) => setKey(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1 font-mono text-xs" />
      </label>

      <div
        className="mt-3 rounded-lg border px-3 py-2 text-sm font-medium"
        data-testid="verdict"
        style={{ borderColor: verdict === 'valid' ? 'var(--ok)' : verdict === 'invalid' ? 'var(--bad)' : 'var(--border)', color: verdict === 'valid' ? 'var(--ok)' : verdict === 'invalid' ? 'var(--bad)' : undefined }}
      >
        {verdict === 'checking' && 'Checking signature...'}
        {verdict === 'valid' && 'Signature valid: the API accepts these claims.'}
        {verdict === 'invalid' && 'Signature invalid: HMAC(key, header.claims) does not match. The API rejects the token.'}
        {verdict === 'unsupported' && 'This browser has no WebCrypto, so the signature cannot be checked here.'}
      </div>
    </WidgetFrame>
  );
}
