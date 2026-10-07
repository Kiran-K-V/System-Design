import { motion } from 'motion/react';
import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowGroup, type FlowNode, type FlowNote, type FlowPacket } from '../FlowDiagram';

type Bucket = 'network' | 'kernel' | 'cpu' | 'memory' | 'disk';

interface JourneyStep {
  caption: string;
  active: string[];
  packets: FlowPacket[];
  /** Time this step adds, in microseconds. */
  cost?: { bucket: Bucket; us: number };
}

const nodes: FlowNode[] = [
  { id: 'client', x: 75, y: 160, w: 120, label: 'Browser', sub: 'user' },
  { id: 'nic', x: 265, y: 160, w: 120, label: 'NIC', sub: 'network card' },
  { id: 'kernel', x: 450, y: 160, w: 130, label: 'Kernel', sub: 'TCP stack' },
  { id: 'app', x: 650, y: 160, w: 150, label: 'App process', sub: 'your code on CPU' },
  { id: 'ram', x: 830, y: 55, w: 110, h: 60, label: 'RAM', sub: '~100 ns' },
  { id: 'disk', x: 830, y: 270, w: 100, h: 84, shape: 'db', label: 'SSD', sub: '~100 µs' },
];

const edges: FlowEdge[] = [
  { from: 'client', to: 'nic', label: 'network', labelAt: [-8, -18], head: 'both' },
  { from: 'nic', to: 'kernel', head: 'both' },
  { from: 'kernel', to: 'app', label: 'socket', head: 'both' },
  { from: 'app', to: 'ram', head: 'both', bend: 18 },
  { from: 'app', to: 'disk', head: 'both', bend: -18 },
];

const notes: FlowNote[] = [
  { x: 650, y: 222, text: '1) parse HTTP\n2) run handler\n3) build JSON', anchor: 'middle' },
];

const groups: FlowGroup[] = [{ x: 200, y: 6, w: 695, h: 320, label: 'one server' }];

const steps: JourneyStep[] = [
  {
    caption: 'A browser sends GET /profile/42 to one server. Follow the request through the machine. Watch the time bar below.',
    active: ['client'],
    packets: [],
  },
  {
    caption: 'The request crosses the network as packets. Inside one data center, one way takes about 250 µs. Across a continent it takes 25–75 ms.',
    active: ['nic'],
    packets: [{ from: 'client', to: 'nic', label: 'GET' }],
    cost: { bucket: 'network', us: 250 },
  },
  {
    caption: 'The NIC copies the bytes into memory and signals the CPU. The kernel TCP stack puts packets in order and places the bytes in a socket buffer.',
    active: ['kernel'],
    packets: [{ from: 'nic', to: 'kernel' }],
    cost: { bucket: 'kernel', us: 10 },
  },
  {
    caption: 'Your process reads the socket. One thread parses the HTTP request and runs your handler. This is CPU work: tens of microseconds.',
    active: ['app'],
    packets: [{ from: 'kernel', to: 'app' }],
    cost: { bucket: 'cpu', us: 30 },
  },
  {
    caption: 'The handler looks for user 42 in an in-memory map. A RAM read takes about 100 ns. The user is not there: a cache miss.',
    active: ['app', 'ram'],
    packets: [{ from: 'app', to: 'ram', label: 'lookup', tone: 'warn' }],
    cost: { bucket: 'memory', us: 0.1 },
  },
  {
    caption: 'So it reads the row from SSD. One random SSD read takes about 100 µs. That is 1,000 times slower than RAM.',
    active: ['app', 'disk'],
    packets: [{ from: 'app', to: 'disk', label: 'read' }],
    cost: { bucket: 'disk', us: 100 },
  },
  {
    caption: 'The row comes back. The handler builds a JSON response.',
    active: ['app'],
    packets: [{ from: 'disk', to: 'app', label: 'row', tone: 'ok' }],
    cost: { bucket: 'cpu', us: 20 },
  },
  {
    caption: 'The response goes back down the same path: process, kernel, NIC, network. The network trip back costs another ~250 µs.',
    active: ['client'],
    packets: [
      { from: 'app', to: 'kernel', tone: 'ok' },
      { from: 'kernel', to: 'nic', tone: 'ok', delay: 0.5 },
      { from: 'nic', to: 'client', label: '200 OK', tone: 'ok', delay: 1.0 },
    ],
    cost: { bucket: 'network', us: 260 },
  },
  {
    caption: 'Total: about 0.67 ms. Network is ~75%, disk ~15%, CPU under 10%, RAM almost zero. On one machine, network and disk dominate. CPU rarely does.',
    active: [],
    packets: [],
  },
];

const BUCKETS: { key: Bucket; label: string; color: string }[] = [
  { key: 'network', label: 'Network', color: 'var(--accent)' },
  { key: 'kernel', label: 'Kernel', color: 'var(--muted)' },
  { key: 'cpu', label: 'CPU', color: 'var(--ok)' },
  { key: 'memory', label: 'RAM', color: 'var(--warn)' },
  { key: 'disk', label: 'Disk', color: 'var(--bad)' },
];

const TOTAL = steps.reduce((s, st) => s + (st.cost?.us ?? 0), 0);

function TimeBar({ upTo }: { upTo: number }) {
  const sums = new Map<Bucket, number>();
  for (const st of steps.slice(0, upTo + 1)) {
    if (st.cost) sums.set(st.cost.bucket, (sums.get(st.cost.bucket) ?? 0) + st.cost.us);
  }
  const elapsed = [...sums.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="mt-3 px-2">
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-muted">Where the time went</span>
        <span className="font-mono tabular-nums">{(elapsed / 1000).toFixed(2)} ms</span>
      </div>
      <div className="flex h-4 overflow-hidden rounded bg-surface">
        {BUCKETS.map((b) => (
          <motion.div
            key={b.key}
            style={{ background: b.color }}
            animate={{ width: `${((sums.get(b.key) ?? 0) / TOTAL) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {BUCKETS.map((b) => (
          <span key={b.key} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: b.color }} />
            {b.label} {sums.get(b.key) ? `${sums.get(b.key)! >= 1 ? Math.round(sums.get(b.key)!) : sums.get(b.key)} µs` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RequestJourney() {
  return (
    <AnimFrame title="One request through one machine" steps={steps}>
      {(i, step) => (
        <>
          <FlowDiagram
            width={900}
            height={330}
            nodes={nodes}
            edges={edges}
            notes={notes}
            groups={groups}
            active={step.active}
            packets={step.packets}
            stepKey={i}
          />
          <TimeBar upTo={i} />
        </>
      )}
    </AnimFrame>
  );
}
