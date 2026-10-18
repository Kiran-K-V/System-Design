import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

/**
 * OAuth 2.0 authorization code flow with PKCE.
 * The example verifier and challenge are a real SHA-256 pair.
 */

export const EX_VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
export const EX_CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

const ACTORS = ['App', 'Auth server', 'API'];

interface Row {
  m: SeqMessage;
  caption: string;
  mem: string;
}

const ROWS: Row[] = [
  {
    m: { from: 'App', to: 'App', label: 'make a random verifier', note: true, tone: 'accent' },
    mem: 'verifier',
    caption:
      'The app (the client) wants to read a user\'s data from the API. Before it does anything, it makes a secret for this one login: the code_verifier. It is a random string, 43 to 128 characters long. It stays in the app and is not sent yet.',
  },
  {
    m: { from: 'App', to: 'App', label: 'make challenge = hash', note: true, tone: 'accent' },
    mem: 'challenge',
    caption:
      'The app hashes the verifier with SHA-256 and base64url-encodes it. That is the code_challenge (the standard method for this). A hash cannot be reversed, so the challenge can travel openly. It is a sealed envelope: the verifier will open it later.',
  },
  {
    m: { from: 'App', to: 'Auth server', label: 'GET /authorize' },
    mem: 'challenge',
    caption:
      'Step A. The app sends the user\'s browser to the authorization server with: client_id, the scope it wants, a redirect URI, a random state value, and the code_challenge. All of this is visible in the browser address bar.',
  },
  {
    m: { from: 'Auth server', to: 'Auth server', label: 'user logs in, says yes', note: true, tone: 'warn' },
    mem: 'challenge',
    caption:
      'Step B. The user signs in at the authorization server and approves the access. The app never sees the password. This is the point of OAuth: access without handing over credentials. The server remembers the challenge with this request.',
  },
  {
    m: { from: 'Auth server', to: 'App', label: 'redirect: code + state' },
    mem: 'challenge',
    caption:
      'Step C. The server redirects the browser back to the app\'s redirect URI with a short-lived, one-time authorization code and the same state. A good server keeps the code valid for 10 minutes at most. The code is in a URL, so it can leak: logs, history, a malicious app on the same phone.',
  },
  {
    m: { from: 'App', to: 'App', label: 'state matches? yes', note: true, tone: 'ok' },
    mem: 'verifier',
    caption:
      'The app checks that the returned state equals the one it sent. That blocks a forged callback (a forged-request attack, called CSRF). A thief with the code still cannot use it yet.',
  },
  {
    m: { from: 'App', to: 'Auth server', label: 'POST /token: code + verifier' },
    mem: 'verifier',
    caption:
      'Step D. The app sends the code to the token endpoint, now together with the original code_verifier. This is a direct call from the app to the server, not through the browser address bar.',
  },
  {
    m: { from: 'Auth server', to: 'Auth server', label: 'hash matches challenge?', note: true, tone: 'warn' },
    mem: 'verifier',
    caption:
      'The server hashes the verifier it just received and compares it with the challenge it stored. They match only if the same app that started the login finishes it. An attacker who stole the code has no verifier, so the server answers invalid_grant.',
  },
  {
    m: { from: 'Auth server', to: 'App', label: 'access token (+ refresh)', tone: 'ok' },
    mem: 'verifier',
    caption:
      'Step E. The server returns an access token. It may also return a refresh token, which is optional and the server\'s choice. The code is now spent. Using it twice is not allowed.',
  },
  {
    m: { from: 'App', to: 'API', label: 'GET /me + access token' },
    mem: 'verifier',
    caption: 'The app calls the API with the access token in the Authorization header of the request. The API is the resource server. It never saw the user\'s password.',
  },
  {
    m: { from: 'API', to: 'App', label: '200 user data', tone: 'ok' },
    mem: 'verifier',
    caption: 'The API checks the token (signature and expiry, or by asking the server) and returns the data the scope allows.',
  },
];

export default function PkceFlow() {
  const steps = [
    { caption: 'Three parties. The user also takes part, through the browser. OAuth 2.0 gives each party a name: resource owner (the user), client (the app), authorization server, and resource server (the API). We follow the authorization code flow with PKCE (pronounced "pixie").' },
    ...ROWS.map((r) => ({ caption: r.caption })),
  ];
  const messages = ROWS.map((r) => r.m);
  return (
    <AnimFrame title="OAuth 2.0 authorization code flow with PKCE" steps={steps} interval={4500}>
      {(i) => {
        const showV = i >= 1;
        const showC = i >= 2;
        return (
          <>
            <SequenceDiagram actors={ACTORS} messages={messages} visible={i} width={640} />
            <div className="mt-3 flex flex-wrap gap-2 px-2 text-xs">
              <span className="rounded-lg border border-line px-3 py-1.5">
                <span className="text-muted">App memory, code_verifier: </span>
                <span className="font-mono">{showV ? `${EX_VERIFIER.slice(0, 10)}...` : 'not made yet'}</span>
              </span>
              <span className="rounded-lg border border-line px-3 py-1.5">
                <span className="text-muted">code_challenge: </span>
                <span className="font-mono">{showC ? `${EX_CHALLENGE.slice(0, 10)}...` : 'not made yet'}</span>
              </span>
            </div>
          </>
        );
      }}
    </AnimFrame>
  );
}
