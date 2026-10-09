import { useEffect, useState } from 'react';
import { WidgetFrame } from '../data-kit';
import { sha256B64u, validVerifier } from './b64';
import { EX_CHALLENGE, EX_VERIFIER } from './PkceFlow';

/**
 * Widget: the authorization server stores code_challenge = BASE64URL(SHA256(verifier)) at /authorize.
 * At /token it hashes the verifier it receives and compares (RFC 7636 section 4.6).
 * The first verifier is the legitimate app. The second is what an attacker who stole the code might try.
 */

function Row({ who, v, setV, valid, hash, pass }: { who: string; v: string; setV: (s: string) => void; valid: boolean; hash: string | null; pass: boolean }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{who}</span>
        <span className="font-mono text-xs font-semibold" style={{ color: pass ? 'var(--ok)' : 'var(--bad)' }} data-testid={`res-${who.startsWith('App') ? 'app' : 'att'}`}>
          {pass ? 'tokens issued' : valid ? 'invalid_grant' : 'rejected: not a valid verifier'}
        </span>
      </div>
      <input type="text" value={v} onChange={(e) => setV(e.target.value)} spellCheck={false} className="mt-2 w-full rounded-md border border-line bg-bg px-2 py-1 font-mono text-xs" aria-label={`${who} code_verifier`} />
      <div className="mt-1 text-xs text-muted">
        {v.length} characters {valid ? '(valid length and charset)' : '(must be 43 to 128 of A-Z a-z 0-9 - . _ ~)'}
      </div>
      <div className="mt-1 break-all font-mono text-xs">SHA-256 → {hash ?? '...'}</div>
    </div>
  );
}

export default function PkceLab() {
  const [appV, setAppV] = useState(EX_VERIFIER);
  const [attV, setAttV] = useState('a'.repeat(43));
  const [stored, setStored] = useState(EX_CHALLENGE);
  const [appHash, setAppHash] = useState(EX_CHALLENGE);
  const [attHash, setAttHash] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let live = true;
    if (!globalThis.crypto?.subtle) {
      setErr(true);
      return;
    }
    (async () => {
      const [a, b] = await Promise.all([sha256B64u(appV), sha256B64u(attV)]);
      if (!live) return;
      setStored(a);
      setAppHash(a);
      setAttHash(b);
    })();
    return () => {
      live = false;
    };
  }, [appV, attV]);

  const okApp = validVerifier(appV);
  const okAtt = validVerifier(attV);
  const appPasses = okApp && appHash === stored;
  const attPasses = okAtt && attHash !== null && attHash === stored;

  return (
    <WidgetFrame
      title="PKCE lab: why a stolen code is useless"
      caption={
        err
          ? 'This browser has no WebCrypto, so the hash cannot be computed here.'
          : 'The server stored the challenge from the real app. It hashes whatever verifier arrives at /token and compares. Edit the attacker\'s guess: only the exact secret passes. Edit the app\'s verifier to see the challenge change with it.'
      }
    >
      <div className="rounded-lg bg-surface px-3 py-2 text-sm">
        <span className="text-muted">Challenge stored by the server at /authorize: </span>
        <span className="break-all font-mono text-xs" data-testid="stored">{stored}</span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Row who="App (knows the verifier)" v={appV} setV={setAppV} valid={okApp} hash={appHash} pass={appPasses} />
        <Row who="Attacker (has only the code)" v={attV} setV={setAttV} valid={okAtt} hash={attHash} pass={attPasses} />
      </div>
    </WidgetFrame>
  );
}
