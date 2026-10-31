import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

type Id = 'app' | 'gw' | 'cache' | 'log' | 'a' | 'b';

interface Step {
  caption: string;
  active: Id;
  tones?: Partial<Record<Id, Tone>>;
  subs?: Partial<Record<Id, string>>;
  packets?: FlowPacket[];
  notes?: FlowNote[];
}

const steps: Step[] = [
  {
    caption:
      'The app calls the gateway with a model alias, "chat-main". The alias is a name you own. The gateway maps it to a real provider and model. Code in the app never names a vendor, so a change of model is a config change.',
    active: 'app',
    subs: { gw: 'alias chat-main' },
    packets: [{ from: 'app', to: 'gw' }],
  },
  {
    caption:
      'The gateway checks the tenant key and the tenant quota. A key is per tenant, not one shared provider key. The tenant is under its quota, so the request goes on. A tenant over its quota would get a 429 here, before any model cost.',
    active: 'gw',
    tones: { gw: 'ok' },
    subs: { gw: 'tenant ok' },
  },
  {
    caption:
      'The gateway looks in its cache. An exact-match cache hashes the whole request. The key must include the tenant, or one tenant could get another tenant’s answer. This is a miss, so the call goes to a model.',
    active: 'cache',
    tones: { gw: 'ok', cache: 'warn' },
    subs: { gw: 'tenant ok', cache: 'miss' },
    packets: [{ from: 'gw', to: 'cache' }],
  },
  {
    caption:
      'The route for "chat-main" lists targets in order. The first is Provider A. The gateway sends the request there and starts a timer.',
    active: 'a',
    tones: { gw: 'ok', cache: 'warn' },
    subs: { gw: 'route: A, then B', cache: 'miss', a: 'primary' },
    packets: [{ from: 'gw', to: 'a' }],
  },
  {
    caption:
      'Provider A answers 529 overloaded. The gateway treats 429, 529, and 5xx as "try the next target". It does not send this error to the app. A 400 (bad request) would not trigger a fallback, because every provider would reject it too.',
    active: 'a',
    tones: { gw: 'warn', cache: 'warn', a: 'bad' },
    subs: { gw: 'A failed', cache: 'miss', a: '529' },
    packets: [{ from: 'a', to: 'gw', tone: 'bad' }],
  },
  {
    caption:
      'The gateway sends the same request to Provider B, the next target. It must translate the request into B’s format first. Message shapes, tool-call shapes, and parameters differ between providers.',
    active: 'b',
    tones: { gw: 'warn', cache: 'warn', a: 'bad' },
    subs: { gw: 'fallback to B', cache: 'miss', a: '529', b: 'fallback' },
    packets: [{ from: 'gw', to: 'b' }],
  },
  {
    caption:
      'Provider B answers 200. The gateway translates the response back to the one internal shape and returns it. The app sees a success. But the prompt was tuned and evaluated on A. Model B may format or reason differently, so B needs its own eval before it is a real fallback.',
    active: 'b',
    tones: { gw: 'ok', cache: 'warn', a: 'bad', b: 'ok' },
    subs: { gw: 'answered by B', cache: 'miss', a: '529', b: '200 OK' },
    packets: [{ from: 'b', to: 'gw', tone: 'ok' }],
    notes: [{ x: 90, y: 232, text: 'app sees 200', tone: 'ok', anchor: 'middle' }],
  },
  {
    caption:
      'The gateway writes one log record: tenant, alias, the model that really answered, token counts, latency, and a "fell back" flag. Without that flag, a quality dip after an outage has no visible cause. Token counts here feed cost metering (the Cost Metering per Request and per Tenant lesson).',
    active: 'log',
    tones: { gw: 'ok', cache: 'warn', a: 'bad', b: 'ok', log: 'ok' },
    subs: { gw: 'answered by B', cache: 'miss', a: '529', b: '200 OK', log: 'fell_back' },
    packets: [{ from: 'gw', to: 'log' }],
  },
];

export default function Ai3GwWalk() {
  return (
    <AnimFrame title="One request through an LLM gateway, with a failing provider" steps={steps} interval={5200}>
      {(i, s) => {
        const t = s.tones ?? {};
        const sub = s.subs ?? {};
        const nodes: FlowNode[] = [
          { id: 'app', x: 66, y: 150, w: 96, h: 56, label: 'App', sub: i === 0 ? 'model: chat-main' : undefined, tone: t.app ?? 'default' },
          { id: 'gw', x: 270, y: 150, w: 140, h: 64, label: 'Gateway', sub: sub.gw ?? 'one internal API', tone: t.gw ?? 'default' },
          { id: 'cache', x: 270, y: 44, w: 120, h: 56, label: 'Cache', shape: 'db', sub: sub.cache, tone: t.cache ?? 'default' },
          { id: 'log', x: 270, y: 256, w: 130, h: 68, label: 'Log', shape: 'db', sub: sub.log, tone: t.log ?? 'default' },
          { id: 'a', x: 600, y: 80, w: 130, h: 60, label: 'Provider A', sub: sub.a ?? 'primary', tone: t.a ?? 'default' },
          { id: 'b', x: 600, y: 220, w: 130, h: 60, label: 'Provider B', sub: sub.b ?? 'fallback', tone: t.b ?? 'default' },
        ];
        const edges: FlowEdge[] = [
          { from: 'app', to: 'gw' },
          { from: 'gw', to: 'cache', dashed: true },
          { from: 'gw', to: 'log', dashed: true },
          { from: 'gw', to: 'a' },
          { from: 'gw', to: 'b', dashed: true },
        ];
        return (
          <FlowDiagram
            width={720}
            height={300}
            nodes={nodes}
            edges={edges}
            notes={s.notes}
            packets={s.packets}
            active={[s.active]}
            stepKey={i}
            travel={0.9}
            label="A request enters an LLM gateway, Provider A fails with 529, and the gateway falls back to Provider B"
          />
        );
      }}
    </AnimFrame>
  );
}
