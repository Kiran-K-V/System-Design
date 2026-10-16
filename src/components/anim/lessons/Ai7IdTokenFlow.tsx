import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

/** Flow follows the MCP authorization spec (OAuth 2.1, PKCE, resource parameter, audience check). Hosts and values are illustrative. */
const ACTORS = ['User', 'App', 'Auth server', 'Agent', 'Tool API', 'Audit log'];

interface Row {
  m: SeqMessage;
  caption: string;
  token?: string;
}

const TOKEN = '{\n  "aud": "https://tickets.example.com",\n  "scope": "tickets:read",\n  "sub": "user-a",\n  "exp": "short-lived"\n}';

const ROWS: Row[] = [
  { m: { from: 'User', to: 'App', label: 'Close ticket T-17' }, caption: 'A user asks the app to do something. The app will run an agent. The agent has no rights of its own. It must borrow the rights of this user.' },
  { m: { from: 'App', to: 'Auth server', label: 'resource + PKCE' }, caption: 'The app sends the user to the authorization server. The request names the target with the resource parameter (RFC 8707) and asks for one scope. It also carries a PKCE code challenge. The spec says the resource parameter MUST be in both the authorization request and the token request.' },
  { m: { from: 'Auth server', to: 'User', label: 'consent: read tickets' }, caption: 'The user sees a consent screen. It lists the app and the scope. The user, not the app, decides. This is the step a shared service account skips.' },
  { m: { from: 'User', to: 'Auth server', label: 'approve', tone: 'ok' }, caption: 'The user approves. The scope on the screen is the scope the token will carry.' },
  { m: { from: 'Auth server', to: 'App', label: 'code' }, caption: 'The authorization server redirects back to the app with a one-time authorization code. The code is not a token. It is useless without the PKCE verifier.' },
  { m: { from: 'App', to: 'Auth server', label: 'code + verifier' }, caption: 'The app trades the code for a token. It sends the PKCE verifier and the resource parameter again.' },
  { m: { from: 'Auth server', to: 'App', label: 'access token', tone: 'ok' }, caption: 'The access token comes back, bound to one audience, with one scope, for one user. The spec says authorization servers SHOULD issue short-lived access tokens. Look at the token card below.', token: TOKEN },
  { m: { from: 'App', to: 'Agent', label: 'run task with token' }, caption: 'The app starts the run and hands the agent this narrow token. It does not hand over the refresh token or the user password. Keep refresh tokens in the app, encrypted.', token: TOKEN },
  { m: { from: 'Agent', to: 'Tool API', label: 'Bearer token' }, caption: 'The agent calls the tool API with the token in the Authorization header. The tool API is the resource server.', token: TOKEN },
  { m: { from: 'Tool API', to: 'Tool API', label: 'aud, scope, tenant ok', note: true, tone: 'ok' }, caption: 'The resource server checks three things in order: the audience is itself, the scope covers the operation, and the record belongs to the token\'s user. All three pass.', token: TOKEN },
  { m: { from: 'Tool API', to: 'Audit log', label: 'user, agent, tool' }, caption: 'The resource server writes an audit record: which user, which agent and run, which tool, and which arguments. Without the user and agent fields you cannot answer who did this after an incident.', token: TOKEN },
  { m: { from: 'Tool API', to: 'Agent', label: 'ticket T-17', tone: 'ok' }, caption: 'The call succeeds. Notice what the agent never held: another user\'s token, an admin token, or any scope the user did not grant.', token: TOKEN },
  { m: { from: 'Agent', to: 'Tool API', label: 'billing token', tone: 'warn' }, caption: 'Now a failure. A prompt-injected agent sends the tool API a token that was issued for a different service (the billing API). The token is real and valid, but not for this resource.', token: TOKEN.replace('tickets.example.com', 'billing.example.com').replace('tickets:read', 'billing:read') },
  { m: { from: 'Tool API', to: 'Tool API', label: 'aud mismatch: 401', note: true, tone: 'bad' }, caption: 'The audience check fails and the call gets HTTP 401. The spec says MCP servers MUST only accept tokens specifically intended for themselves. Without this check, one leaked token opens every service that trusts the same authorization server.', token: TOKEN.replace('tickets.example.com', 'billing.example.com').replace('tickets:read', 'billing:read') },
];

export default function Ai7IdTokenFlow() {
  const steps = ROWS.map((r) => ({ caption: r.caption }));
  return (
    <AnimFrame title="From user consent to a tool call, and a failed replay" steps={steps} interval={4600}>
      {(i) => (
        <div>
          <SequenceDiagram actors={ACTORS} messages={ROWS.map((r) => r.m)} visible={i + 1} width={720} />
          <div className="mt-2 px-2 pb-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted">Token the agent holds (claims are illustrative)</p>
            <pre className="mt-1 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[13px] leading-relaxed">{ROWS[i].token ?? '(no token yet)'}</pre>
          </div>
        </div>
      )}
    </AnimFrame>
  );
}
