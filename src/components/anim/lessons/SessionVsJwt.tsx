import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

/** Session cookie (look it up) versus JWT (verify it). The last steps show revocation, where they differ most. */

interface Step {
  caption: string;
  packets: FlowPacket[];
  left: string;
  right: string;
  leftTone?: Tone;
  rightTone?: Tone;
  storeDeleted?: boolean;
  active: string[];
}

const steps: Step[] = [
  {
    caption:
      'Two ways to remember a logged-in user. On the left, a session: the server keeps the state and the browser holds only a random id in a cookie. On the right, a JWT: the server signs the state into the token and keeps nothing.',
    packets: [],
    left: 'cookie holds an opaque id',
    right: 'token holds signed claims',
    active: [],
  },
  {
    caption:
      'Login, same on both sides: the user proves who they are (password, lesson below). Left: the server makes a random id and stores {id: user 42} in a session store. Right: the server signs {sub: 42, exp: ...} with a key and hands it over. No store write.',
    packets: [
      { from: 'cS', to: 'aS', label: 'login' },
      { from: 'aS', to: 'stS', label: 'save', delay: 0.9 },
      { from: 'cJ', to: 'aJ', label: 'login' },
    ],
    left: 'Set-Cookie: sid=9f2c...',
    right: 'token = header.claims.signature',
    active: ['stS'],
  },
  {
    caption:
      'A later request. Left: the API reads the cookie and must ask the store "who is 9f2c?". That is one extra network call per request. Right: the API checks the signature with its key and reads the claims from the token. No network call.',
    packets: [
      { from: 'cS', to: 'aS', label: 'sid' },
      { from: 'aS', to: 'stS', label: 'lookup', delay: 0.9 },
      { from: 'cJ', to: 'aJ', label: 'token' },
      { from: 'aJ', to: 'key', label: 'verify', delay: 0.9, tone: 'ok' },
    ],
    left: '1 store read per request',
    right: 'local check, 0 store reads',
    leftTone: 'warn',
    rightTone: 'ok',
    active: ['aS', 'aJ'],
  },
  {
    caption:
      'Scale. Add 20 API servers. Left: every server needs the shared store, so the store must be fast and highly available. Right: every server needs only the key. Any server can verify any token. The JWT wins on reads here.',
    packets: [],
    left: 'shared store becomes a dependency',
    right: 'servers are fully stateless',
    leftTone: 'warn',
    rightTone: 'ok',
    active: [],
  },
  {
    caption: 'Now the user\'s account is stolen, and you must log them out. Left: delete the row from the store. The very next request finds nothing and is refused. Done, instantly.',
    packets: [{ from: 'aS', to: 'stS', label: 'delete', tone: 'bad' }],
    left: 'revoked: next request fails',
    right: ' ',
    leftTone: 'ok',
    storeDeleted: true,
    active: ['stS'],
  },
  {
    caption:
      'Right: you cannot delete the token. The server holds no copy. A signed token is valid until its exp time, and the signature check still passes. A stolen JWT works until it expires.',
    packets: [
      { from: 'cJ', to: 'aJ', label: 'token', tone: 'bad' },
      { from: 'aJ', to: 'key', label: 'verify: ok', delay: 0.9, tone: 'bad' },
    ],
    left: 'revoked: next request fails',
    right: 'still valid until exp',
    leftTone: 'ok',
    rightTone: 'bad',
    storeDeleted: true,
    active: ['aJ'],
  },
  {
    caption:
      'The usual repair: make the JWT short-lived and pair it with a refresh token that the server does store and can revoke. Or keep a denylist of revoked token ids that the API checks. A denylist brings back a lookup, which is the cost of the session you left.',
    packets: [],
    left: 'sessions: state, easy to revoke',
    right: 'short exp + revocable refresh token',
    leftTone: 'ok',
    rightTone: 'warn',
    storeDeleted: true,
    active: [],
  },
];

export default function SessionVsJwt() {
  return (
    <AnimFrame title="Session cookie versus JWT" steps={steps} interval={4200}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'cS', x: 90, y: 70, w: 110, h: 56, label: 'Browser' },
          { id: 'aS', x: 340, y: 70, w: 110, h: 56, label: 'API' },
          { id: 'stS', x: 590, y: 70, w: 120, h: 92, shape: 'db', label: 'Session\nstore', tone: s.storeDeleted ? 'bad' : 'default' },
          { id: 'cJ', x: 90, y: 215, w: 110, h: 56, label: 'Browser' },
          { id: 'aJ', x: 340, y: 215, w: 110, h: 56, label: 'API' },
          { id: 'key', x: 590, y: 215, w: 110, h: 56, shape: 'dashed', label: 'Key' },
        ];
        const edges: FlowEdge[] = [
          { from: 'cS', to: 'aS', head: 'both' },
          { from: 'aS', to: 'stS', head: 'both' },
          { from: 'cJ', to: 'aJ', head: 'both' },
          { from: 'aJ', to: 'key', head: 'both', dashed: true },
        ];
        const notes: FlowNote[] = [
          { x: 10, y: 14, text: 'Session: the server remembers', anchor: 'start', size: 18, tone: 'accent' },
          { x: 10, y: 160, text: 'JWT: the token remembers', anchor: 'start', size: 18, tone: 'accent' },
          { x: 360, y: 122, text: s.left, anchor: 'middle', size: 16, tone: s.leftTone },
          { x: 360, y: 268, text: s.right, anchor: 'middle', size: 16, tone: s.rightTone },
        ];
        return (
          <FlowDiagram
            width={720}
            height={290}
            nodes={nodes}
            edges={edges}
            notes={notes}
            active={s.active}
            packets={s.packets}
            stepKey={i}
            label="Left: a session cookie is looked up in a session store on every request. Right: a JWT is verified locally with a key."
          />
        );
      }}
    </AnimFrame>
  );
}
