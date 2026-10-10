import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

interface Step {
  caption: string;
  tones?: Partial<Record<'client' | 'auth' | 'limit' | 'route' | 'orders', Tone>>;
  subs?: Partial<Record<'client' | 'auth' | 'limit' | 'route' | 'orders', string>>;
  active: string;
  packets?: FlowPacket[];
  notes?: FlowNote[];
}

const steps: Step[] = [
  {
    caption:
      'A client sends GET /orders/42 with a bearer token over HTTPS. The request lands on the API gateway, the one entry point for outside traffic. The gateway ends TLS here, so every check below reads plain HTTP. It runs a fixed chain of steps in order.',
    active: 'client',
    packets: [{ from: 'client', to: 'auth' }],
  },
  {
    caption: 'Step 1, authentication. The gateway checks the token: signature, expiry, and audience (lesson 3.5). The token is valid, so the request carries the caller’s identity forward. The gateway can reject a bad request here without touching any backend.',
    tones: { auth: 'ok' },
    subs: { auth: 'token valid' },
    active: 'auth',
    packets: [{ from: 'auth', to: 'limit' }],
  },
  {
    caption: 'Step 2, rate limiting (lesson 7.4). The gateway looks up this caller’s bucket and takes one token. The bucket has tokens left, so the request passes. The limit lives in the gateway so that no backend has to count requests.',
    tones: { auth: 'ok', limit: 'ok' },
    subs: { auth: 'token valid', limit: '37 tokens left' },
    active: 'limit',
    packets: [{ from: 'limit', to: 'route' }],
  },
  {
    caption: 'Step 3, routing. The path /orders/* maps to the Orders service. /users/* would map to the Users service. The gateway picks a healthy instance and forwards the request. It can also rewrite headers or paths on the way.',
    tones: { auth: 'ok', limit: 'ok', route: 'ok' },
    subs: { auth: 'token valid', limit: '36 tokens left', route: '/orders/*' },
    active: 'route',
    packets: [{ from: 'route', to: 'orders' }],
  },
  {
    caption: 'The response travels back through the gateway. The gateway may cache it, transform it, or add headers before it reaches the client. One client request became one backend call, and the client never learned the backend’s address.',
    tones: { auth: 'ok', limit: 'ok', route: 'ok', orders: 'ok' },
    subs: { auth: 'token valid', limit: '36 tokens left', route: '/orders/*', orders: '200 OK' },
    active: 'orders',
    packets: [{ from: 'orders', to: 'route', tone: 'ok' }],
  },
  {
    caption: 'Failure 1: a bad token. The gateway answers 401 at step 1. The rate limiter, router, and Orders service never see the request. Cheap rejection at the edge protects everything behind it.',
    tones: { auth: 'bad', limit: 'muted', route: 'muted', orders: 'muted' },
    subs: { auth: '401 rejected' },
    active: 'auth',
    notes: [{ x: 90, y: 232, text: 'client gets 401', tone: 'bad', anchor: 'middle' }],
  },
  {
    caption: 'Failure 2: the bucket is empty. The gateway answers 429 Too Many Requests, usually with a Retry-After header. The token was valid, but this caller has used its share. The backend load stays flat.',
    tones: { auth: 'ok', limit: 'bad', route: 'muted', orders: 'muted' },
    subs: { auth: 'token valid', limit: 'bucket empty' },
    active: 'limit',
    notes: [{ x: 90, y: 232, text: 'client gets 429', tone: 'bad', anchor: 'middle' }],
  },
  {
    caption:
      'Failure 3: a slow backend. A managed gateway has a hard integration timeout: 29 seconds by default on AWS REST APIs, 30 seconds at most on HTTP APIs. If Orders takes longer, the gateway gives up and returns 504 while the work may still run. Long jobs should return a job id at once and finish in the background.',
    tones: { auth: 'ok', limit: 'ok', route: 'warn', orders: 'warn' },
    subs: { auth: 'token valid', limit: '35 tokens left', route: 'waiting 29 s', orders: 'still working' },
    active: 'route',
    notes: [{ x: 90, y: 232, text: 'client gets 504', tone: 'bad', anchor: 'middle' }],
  },
];

export default function GatewayPipeline() {
  return (
    <AnimFrame title="API gateway: auth, rate limit, route" steps={steps} interval={5200}>
      {(i, s) => {
        const t = s.tones ?? {};
        const sub = s.subs ?? {};
        const nodes: FlowNode[] = [
          { id: 'client', x: 62, y: 150, w: 96, h: 56, label: 'Client', tone: t.client ?? 'default' },
          { id: 'auth', x: 215, y: 150, w: 108, label: 'Auth', sub: sub.auth ?? 'check token', tone: t.auth ?? 'default' },
          { id: 'limit', x: 365, y: 150, w: 116, label: 'Rate limit', sub: sub.limit ?? 'take a token', tone: t.limit ?? 'default' },
          { id: 'route', x: 515, y: 150, w: 116, label: 'Route', sub: sub.route ?? 'match path', tone: t.route ?? 'default' },
          { id: 'orders', x: 660, y: 100, w: 108, h: 56, label: 'Orders', sub: sub.orders, tone: t.orders ?? 'default' },
          { id: 'users', x: 660, y: 205, w: 108, h: 56, label: 'Users', tone: 'muted' },
        ];
        const edges: FlowEdge[] = [
          { from: 'client', to: 'auth' },
          { from: 'auth', to: 'limit' },
          { from: 'limit', to: 'route' },
          { from: 'route', to: 'orders' },
          { from: 'route', to: 'users', dashed: true },
        ];
        return (
          <FlowDiagram
            width={720}
            height={270}
            nodes={nodes}
            edges={edges}
            groups={[{ x: 156, y: 78, w: 440, h: 146, label: 'API gateway' }]}
            notes={s.notes}
            packets={s.packets}
            active={[s.active]}
            stepKey={i}
            travel={0.9}
            label="A request passes authentication, rate limiting, and routing inside an API gateway"
          />
        );
      }}
    </AnimFrame>
  );
}
