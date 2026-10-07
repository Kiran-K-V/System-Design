import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket } from '../FlowDiagram';

const lb: FlowNode = { id: 'lb', x: 70, y: 170, w: 110, h: 64, label: 'Load\nbalancer' };
const db: FlowNode = { id: 'db', x: 710, y: 250, w: 110, h: 100, shape: 'db', label: 'Database' };
const app = (n: 1 | 2 | 3, tone?: FlowNode['tone'], sub?: string): FlowNode => ({
  id: `a${n}`,
  x: 300,
  y: 60 + (n - 1) * 110,
  w: 170,
  h: 66,
  label: `App ${n}`,
  sub,
  tone,
});
const redis: FlowNode = { id: 'redis', x: 560, y: 70, w: 130, h: 70, label: 'Redis', sub: 'one shared copy' };

const lbEdges: FlowEdge[] = [1, 2, 3].map((n) => ({ from: 'lb', to: `a${n}` }));
const dbEdges: FlowEdge[] = [1, 2, 3].map((n) => ({ from: `a${n}`, to: 'db', dashed: true }));
const redisEdges: FlowEdge[] = [1, 2, 3].map((n) => ({ from: `a${n}`, to: 'redis', head: 'both' as const }));

interface Scene {
  caption: string;
  shared: boolean;
  copies: [string, string, string];
  tones: [FlowNode['tone'], FlowNode['tone'], FlowNode['tone']];
  packets: FlowPacket[];
  active: string[];
  sharedNote?: { text: string; tone?: FlowNote['tone'] };
}

const SCENES: Scene[] = [
  {
    caption: 'Design 1: each app server keeps an in-process cache. All three hold user:7 = "Ana", the same as the database. So far so good.',
    shared: false,
    copies: ['Ana', 'Ana', 'Ana'],
    tones: [undefined, undefined, undefined],
    packets: [],
    active: [],
  },
  {
    caption: 'The user renames herself to "Bea". The load balancer sends the write to App 2. App 2 updates the database.',
    shared: false,
    copies: ['Ana', 'Ana', 'Ana'],
    tones: [undefined, 'ok', undefined],
    packets: [
      { from: 'lb', to: 'a2', label: 'rename' },
      { from: 'a2', to: 'db', label: 'UPDATE', delay: 1 },
    ],
    active: ['a2', 'db'],
  },
  {
    caption: 'App 2 refreshes its own copy. App 1 and App 3 do not know. Nobody told them. Their copies are now stale (out of date).',
    shared: false,
    copies: ['Ana', 'Bea', 'Ana'],
    tones: ['bad', 'ok', 'bad'],
    packets: [],
    active: ['a2'],
  },
  {
    caption: 'The user refreshes the page. The balancer picks App 1. She sees "Ana" again, her old name. A refresh later it may be "Bea". This flicker is the classic bug of per-server caches. It lasts until the TTL ends or the entry is evicted.',
    shared: false,
    copies: ['Ana', 'Bea', 'Ana'],
    tones: ['bad', 'ok', 'bad'],
    packets: [{ from: 'lb', to: 'a1', label: 'GET user:7' }],
    active: ['a1'],
  },
  {
    caption: 'Design 2: one shared Redis. Every server reads and writes the same copy. The rename updates the database and the one cached entry.',
    shared: true,
    copies: ['', '', ''],
    tones: [undefined, 'ok', undefined],
    packets: [
      { from: 'a2', to: 'db', label: 'UPDATE' },
      { from: 'a2', to: 'redis', label: 'SET "Bea"', delay: 1 },
    ],
    active: ['a2', 'redis'],
    sharedNote: { text: 'user:7 = Bea', tone: 'ok' },
  },
  {
    caption: 'Now any server returns "Bea". There is one copy, so there is nothing to disagree with. The price: every read pays a ~0.5 ms network hop instead of a ~1 µs memory read, and Redis is one more thing that can fail.',
    shared: true,
    copies: ['', '', ''],
    tones: [undefined, undefined, undefined],
    packets: [
      { from: 'lb', to: 'a1', label: 'GET' },
      { from: 'a1', to: 'redis', label: 'get', delay: 1 },
    ],
    active: ['a1', 'redis'],
    sharedNote: { text: 'user:7 = Bea', tone: 'ok' },
  },
];

export default function LocalVsSharedCache() {
  return (
    <AnimFrame title="In-process caches disagree. A shared cache does not." steps={SCENES.map((s) => ({ caption: s.caption }))} interval={3200}>
      {(i) => {
        const s = SCENES[i];
        const sub = (k: number) => (s.shared ? undefined : `local copy: ${s.copies[k]}`);
        const nodes: FlowNode[] = [lb, app(1, s.tones[0], sub(0)), app(2, s.tones[1], sub(1)), app(3, s.tones[2], sub(2)), db, ...(s.shared ? [redis] : [])];
        const edges: FlowEdge[] = [...lbEdges, ...(s.shared ? redisEdges : []), ...dbEdges];
        const dbText = s.shared ? 'DB: Bea' : i >= 2 ? 'DB: Bea' : i === 1 ? 'DB: Bea (just now)' : 'DB: Ana';
        const notes: FlowNote[] = [{ x: 710, y: 318, text: dbText, anchor: 'middle', size: 17, tone: dbText.includes('Bea') ? 'ok' : undefined }];
        if (s.shared) notes.push({ x: 640, y: 72, text: s.sharedNote?.text ?? '', size: 17, tone: s.sharedNote?.tone });
        return (
          <FlowDiagram
            width={800}
            height={340}
            nodes={nodes}
            edges={edges}
            notes={notes}
            packets={s.packets}
            active={s.active}
            stepKey={i}
            label="Load balancer, three app servers, database, and optionally a shared Redis."
          />
        );
      }}
    </AnimFrame>
  );
}
