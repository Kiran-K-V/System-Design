import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

type S = 'ok' | 'dead' | 'out';

interface Step {
  caption: string;
  s2: S;
  packets: FlowPacket[];
  note: string;
  noteTone?: Tone;
  active: string[];
}

const steps: Step[] = [
  {
    caption: 'Clients know one address: the load balancer (LB). Behind it, three identical servers share the work. The LB also sends each server a small health probe, such as GET /health, on a timer.',
    s2: 'ok',
    packets: [],
    note: 'pool: server 1, server 2, server 3',
    active: ['lb'],
  },
  {
    caption: 'Three requests arrive. The LB picks a server for each. Here it takes turns: 1, 2, 3 (round robin). Each client sees one fast, normal answer.',
    s2: 'ok',
    packets: [
      { from: 'client', to: 'lb', label: 'req' },
      { from: 'lb', to: 's1', label: 'r1', delay: 0.9 },
      { from: 'lb', to: 's2', label: 'r2', delay: 1.1 },
      { from: 'lb', to: 's3', label: 'r3', delay: 1.3 },
    ],
    note: 'pool: server 1, server 2, server 3',
    active: ['lb'],
  },
  {
    caption: 'Server 2 crashes. The LB does not know yet. Its next turn still points at server 2. That request fails, or hangs until a timeout. The client sees an error. About one request in three fails until the LB notices.',
    s2: 'dead',
    packets: [
      { from: 'client', to: 'lb', label: 'req' },
      { from: 'lb', to: 's2', label: 'r5', tone: 'bad', delay: 0.9 },
    ],
    note: 'LB still thinks the pool has 3 servers',
    noteTone: 'bad',
    active: ['lb'],
  },
  {
    caption: 'The next health probe to server 2 fails. One failure could be a blip, so the LB does not act yet. It waits for a set number of consecutive failures (the unhealthy threshold).',
    s2: 'dead',
    packets: [{ from: 'lb', to: 's2', label: 'GET /health', tone: 'warn' }],
    note: 'probe failed: 1 of 2',
    noteTone: 'warn',
    active: ['lb'],
  },
  {
    caption: 'A second probe fails. The threshold is reached. The LB marks server 2 unhealthy and removes it from the pool. Detection time was about threshold x interval. With AWS ALB defaults that is 2 x 30 s = 60 s, and every second of it costs errors.',
    s2: 'out',
    packets: [{ from: 'lb', to: 's2', label: 'GET /health', tone: 'bad' }],
    note: 'probe failed: 2 of 2 -> removed',
    noteTone: 'bad',
    active: ['lb'],
  },
  {
    caption: 'Traffic now flows to servers 1 and 3 only. Users see no errors. The two servers carry 50% each instead of 33%, so you must keep spare capacity: N+1.',
    s2: 'out',
    packets: [
      { from: 'client', to: 'lb', label: 'req' },
      { from: 'lb', to: 's1', label: 'r6', delay: 0.9 },
      { from: 'lb', to: 's3', label: 'r7', delay: 1.2 },
    ],
    note: 'pool: server 1, server 3',
    noteTone: 'ok',
    active: ['lb'],
  },
  {
    caption: 'The LB keeps probing the removed server. After it restarts and passes several probes in a row (ALB default: 5), the LB puts it back. Many LBs then ramp traffic up slowly so a cold server is not flooded.',
    s2: 'ok',
    packets: [{ from: 'lb', to: 's2', label: 'GET /health', tone: 'ok' }],
    note: 'passed 5 of 5 -> back in the pool',
    noteTone: 'ok',
    active: ['lb', 's2'],
  },
];

const base: FlowNode[] = [
  { id: 'client', x: 60, y: 150, w: 100, label: 'Clients' },
  { id: 'lb', x: 255, y: 150, w: 160, h: 80, label: 'Load balancer', sub: 'one address' },
  { id: 's1', x: 620, y: 45, w: 150, label: 'Server 1' },
  { id: 's2', x: 620, y: 150, w: 150, label: 'Server 2' },
  { id: 's3', x: 620, y: 255, w: 150, label: 'Server 3' },
];

export default function LbFailover() {
  return (
    <AnimFrame title="A server fails and the load balancer reacts" steps={steps} interval={3200}>
      {(i, step) => {
        const nodes = base.map((n) => {
          if (n.id !== 's2') return n;
          if (step.s2 === 'dead') return { ...n, tone: 'bad' as const, sub: 'crashed' };
          if (step.s2 === 'out') return { ...n, tone: 'muted' as const, sub: 'removed from pool' };
          return { ...n, sub: i === 6 ? 'back' : undefined };
        });
        const edges: FlowEdge[] = [
          { from: 'client', to: 'lb', head: 'both' },
          { from: 'lb', to: 's1', head: 'both' },
          { from: 'lb', to: 's2', head: 'both', dashed: step.s2 !== 'ok', tone: step.s2 === 'ok' ? 'default' : step.s2 === 'dead' ? 'bad' : 'muted' },
          { from: 'lb', to: 's3', head: 'both' },
        ];
        const notes: FlowNote[] = [{ x: 250, y: 16, text: step.note, anchor: 'middle', size: 14, tone: step.noteTone }];
        return (
          <FlowDiagram
            width={720}
            height={300}
            nodes={nodes}
            edges={edges}
            notes={notes}
            active={step.active}
            packets={step.packets}
            stepKey={i}
            label="A load balancer in front of three servers. Server 2 fails and is removed after failed health checks."
          />
        );
      }}
    </AnimFrame>
  );
}
