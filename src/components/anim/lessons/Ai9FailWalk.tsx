import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

type Id = 'client' | 'router' | 'primary' | 'fallback';

interface Step {
  caption: string;
  active: Id;
  tones?: Partial<Record<Id, Tone>>;
  subs?: Partial<Record<Id, string>>;
  packets?: FlowPacket[];
  notes?: FlowNote[];
  /** Edge ids drawn dashed (not in use). */
  offEdges?: string[];
}

/** Scores in the notes are illustrative. The error codes and the retry rule follow the provider docs. */
const steps: Step[] = [
  {
    caption:
      'Normal day. The app sends a request to your router. The router sends it to the primary provider, because the primary is the model you tested and tuned the prompt for. The router counts every answer, good or bad. Its switch for the primary is closed, which means traffic flows.',
    active: 'primary',
    tones: { primary: 'ok' },
    subs: { router: 'switch closed', primary: 'answers 200', fallback: 'idle, tested' },
    packets: [{ from: 'client', to: 'router' }, { from: 'router', to: 'primary', delay: 0.9 }],
    offEdges: ['router>fallback'],
  },
  {
    caption:
      'The primary answers 529, "overloaded". The router does not tell the app yet. It waits a short, random time and tries once more. The wait grows each try, and the randomness stops all your servers from retrying at the same instant.',
    active: 'primary',
    tones: { primary: 'bad' },
    subs: { router: 'retry in ~1 s', primary: '529 overloaded', fallback: 'idle, tested' },
    packets: [{ from: 'primary', to: 'router', tone: 'bad' }],
    offEdges: ['router>fallback'],
  },
  {
    caption:
      'The retry fails too, and so do the next few requests. After a set number of failures in a row, the router opens its switch. Open means it stops sending requests to the primary for a while. This protects the primary from your retries and protects your users from long waits.',
    active: 'router',
    tones: { router: 'warn', primary: 'bad' },
    subs: { router: 'switch open', primary: 'skipped', fallback: 'idle, tested' },
    offEdges: ['router>fallback', 'router>primary'],
  },
  {
    caption:
      'The router sends the request to the backup provider. The backup has never seen this long, repeated first part of your prompt, so its prompt cache is empty. The first requests pay the full price for that part. The cost per request jumps, and nothing reports an error.',
    active: 'fallback',
    tones: { router: 'warn', primary: 'bad', fallback: 'warn' },
    subs: { router: 'switch open', primary: 'skipped', fallback: 'cache empty' },
    packets: [{ from: 'router', to: 'fallback' }],
    offEdges: ['router>primary'],
    notes: [{ x: 600, y: 290, text: 'cost per request up', tone: 'warn', anchor: 'middle' }],
  },
  {
    caption:
      'The backup answers 200. The router does not trust a 200 yet. It checks that the answer still has the shape the app needs: valid JSON, the right field names, the right types. The check passes, so the app gets its answer. Quality on the golden set was 0.84 for the backup against 0.90 for the primary (illustrative). That drop is why you measured it before the outage.',
    active: 'fallback',
    tones: { router: 'ok', primary: 'bad', fallback: 'ok', client: 'ok' },
    subs: { router: 'format check ok', primary: 'skipped', fallback: 'answers 200' },
    packets: [{ from: 'fallback', to: 'router', tone: 'ok' }, { from: 'router', to: 'client', tone: 'ok', delay: 0.9 }],
    offEdges: ['router>primary'],
    notes: [{ x: 600, y: 290, text: 'quality 0.84 vs 0.90', tone: 'warn', anchor: 'middle' }],
  },
  {
    caption:
      'Later, the router sends one test request to the primary. It works. The router does not move all traffic back at once: a sudden jump can overload the primary again. It ramps up in small steps, for example 5%, then 25%, then 100%, and watches the error rate at each step.',
    active: 'primary',
    tones: { router: 'accent', primary: 'ok', fallback: 'muted' },
    subs: { router: 'ramp 5% to 100%', primary: 'test request ok', fallback: 'keeps ~5%' },
    packets: [{ from: 'router', to: 'primary', tone: 'ok' }],
    offEdges: [],
  },
];

export default function Ai9FailWalk() {
  return (
    <AnimFrame title="Primary provider fails, router switches, traffic returns" steps={steps} interval={6200}>
      {(i, s) => {
        const t = s.tones ?? {};
        const sub = s.subs ?? {};
        const nodes: FlowNode[] = [
          { id: 'client', x: 70, y: 150, w: 100, h: 56, label: 'App', tone: t.client ?? 'default' },
          { id: 'router', x: 280, y: 150, w: 150, h: 70, label: 'Router', sub: sub.router, tone: t.router ?? 'default' },
          { id: 'primary', x: 600, y: 70, w: 170, h: 66, label: 'Primary', sub: sub.primary, tone: t.primary ?? 'default' },
          { id: 'fallback', x: 600, y: 230, w: 170, h: 66, label: 'Backup', sub: sub.fallback, tone: t.fallback ?? 'default' },
        ];
        const off = new Set(s.offEdges ?? []);
        const edges: FlowEdge[] = [
          { from: 'client', to: 'router' },
          { from: 'router', to: 'primary', dashed: off.has('router>primary') },
          { from: 'router', to: 'fallback', dashed: off.has('router>fallback') },
        ];
        return (
          <FlowDiagram
            width={720}
            height={310}
            nodes={nodes}
            edges={edges}
            notes={s.notes}
            packets={s.packets}
            active={[s.active]}
            stepKey={i}
            travel={0.9}
            label="A router retries a failing primary provider, opens its switch, sends traffic to a backup provider, checks the answer, and later ramps traffic back"
          />
        );
      }}
    </AnimFrame>
  );
}
