import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

/** The read-scaling ladder, one rung per step. Each step shows the whole picture as it stands. */

interface Step {
  caption: string;
  note: string;
  noteTone?: Tone;
  nodes: FlowNode[];
  edges: FlowEdge[];
  packets?: FlowPacket[];
  active?: string[];
}

const users: FlowNode = { id: 'users', x: 48, y: 150, w: 76, h: 50, label: 'Users' };
const cdn: FlowNode = { id: 'cdn', x: 170, y: 150, w: 80, h: 50, label: 'CDN' };
const app: FlowNode = { id: 'app', x: 305, y: 150, w: 100, h: 60, label: 'App\nservers' };
const cache: FlowNode = { id: 'cache', x: 445, y: 250, w: 100, h: 50, label: 'Cache' };
const primary: FlowNode = { id: 'primary', x: 615, y: 55, w: 120, h: 80, label: 'Primary', shape: 'db' };
const replicas: FlowNode = { id: 'replicas', x: 615, y: 250, w: 120, h: 80, label: 'Replicas', sub: 'x3', shape: 'db' };
const lone: FlowNode = { id: 'db', x: 615, y: 150, w: 120, h: 80, label: 'Database', shape: 'db' };

const steps: Step[] = [
  {
    caption: 'One database serves every read and every write. Say it handles ~10,000 simple reads per second (lesson 1.5 gives 10K to 50K+ for one node). Demand is 25,000. The database is the ceiling, so requests queue.',
    note: 'demand 25K/s, ceiling 10K/s',
    noteTone: 'bad',
    nodes: [users, app, { ...lone, tone: 'bad' }],
    edges: [{ from: 'users', to: 'app' }, { from: 'app', to: 'db', tone: 'bad', label: '25K/s' }],
    packets: [{ from: 'app', to: 'db', tone: 'bad' }],
    active: ['db'],
  },
  {
    caption: 'Rung 1: read replicas (lesson 4.6). The primary keeps the writes. Three followers copy its log and answer reads. Capacity for reads is now about 3 x 10K. Writes still go to one machine.',
    note: 'reads spread over 3 replicas',
    nodes: [users, app, primary, { ...replicas, tone: 'ok' }],
    edges: [
      { from: 'users', to: 'app' },
      { from: 'app', to: 'primary', label: 'writes', labelAt: [-30, -16] },
      { from: 'app', to: 'replicas', label: 'reads', labelAt: [-34, 14] },
      { from: 'primary', to: 'replicas', dashed: true, label: 'log', labelAt: [26, 0] },
    ],
    packets: [{ from: 'app', to: 'replicas', tone: 'ok' }],
    active: ['replicas'],
  },
  {
    caption: 'The price is replica lag. A user saves a post (it goes to the primary). The page reloads and the read hits a replica that has not replayed the log yet. The user sees the old data. This is the read-your-writes problem from lesson 4.10.',
    note: 'write lands on primary, read hits a stale replica',
    noteTone: 'bad',
    nodes: [users, app, primary, { ...replicas, tone: 'bad', sub: 'x3, one behind' }],
    edges: [
      { from: 'users', to: 'app' },
      { from: 'app', to: 'primary', label: 'save', labelAt: [-30, -16] },
      { from: 'app', to: 'replicas', label: 'reload: old', labelAt: [-44, 14], tone: 'bad' },
      { from: 'primary', to: 'replicas', dashed: true, label: 'log, late', labelAt: [36, 0] },
    ],
    packets: [
      { from: 'app', to: 'primary', tone: 'ok' },
      { from: 'app', to: 'replicas', tone: 'bad', delay: 0.9 },
    ],
    active: ['replicas'],
  },
  {
    caption: 'Fix: remember who wrote recently. For a short window after a write, send that user\'s reads to the primary. Everyone else keeps reading replicas. The primary carries only the few reads of recent writers. A position token (lesson 4.6) is the exact version of the same idea.',
    note: 'recent writers read the primary',
    noteTone: 'ok',
    nodes: [users, app, { ...primary, tone: 'ok' }, replicas],
    edges: [
      { from: 'users', to: 'app' },
      { from: 'app', to: 'primary', label: 'writes + own reads', labelAt: [-50, -18], tone: 'ok' },
      { from: 'app', to: 'replicas', label: 'everyone else', labelAt: [-46, 16] },
      { from: 'primary', to: 'replicas', dashed: true },
    ],
    packets: [{ from: 'app', to: 'primary', tone: 'ok' }],
    active: ['primary'],
  },
  {
    caption: 'Rung 2: a cache (lessons 5.1 to 5.4) in front of the replicas. At a 90% hit ratio only 1 read in 10 reaches the database, so the same replicas now carry about 10 times the demand. One cache node answers ~100K simple ops per second (lesson 5.1).',
    note: '90% hit: replicas see 10% of reads',
    nodes: [users, app, primary, replicas, { ...cache, tone: 'ok' }],
    edges: [
      { from: 'users', to: 'app' },
      { from: 'app', to: 'primary', label: 'writes', labelAt: [-30, -16] },
      { from: 'app', to: 'cache', label: 'read', labelAt: [-34, 8] },
      { from: 'cache', to: 'replicas', label: 'miss', labelAt: [0, -16] },
      { from: 'primary', to: 'replicas', dashed: true },
    ],
    packets: [{ from: 'app', to: 'cache', label: 'hit', tone: 'ok' }],
    active: ['cache'],
  },
  {
    caption: 'New limit: a hot key. One viral post is one cache key, and one key lives on one cache node. That node saturates while the others idle. Fixes: keep a tiny copy of the hottest keys inside each app server, or store the hot key on several cache nodes and pick one at random. Facebook\'s memcache paper does the second for hot data. Cost: every copy must be invalidated.',
    note: 'one key, one node: it saturates',
    noteTone: 'warn',
    nodes: [users, { ...app, label: 'App', sub: 'hot-key copy', tone: 'ok' }, primary, replicas, { ...cache, tone: 'warn', sub: 'hot key' }],
    edges: [
      { from: 'users', to: 'app' },
      { from: 'app', to: 'primary', label: 'writes', labelAt: [-30, -16] },
      { from: 'app', to: 'cache', label: 'read', labelAt: [-34, 8], tone: 'warn' },
      { from: 'cache', to: 'replicas' },
      { from: 'primary', to: 'replicas', dashed: true },
    ],
    packets: [{ from: 'app', to: 'cache', tone: 'warn' }],
    active: ['cache'],
  },
  {
    caption: 'Rung 3: a CDN (lesson 2.7) for content that is the same for everyone: images, scripts, public pages. Those reads end at the edge and never reach your servers. If the CDN answers half of all reads, everything behind it sees half the demand. This only works for shared, cacheable responses.',
    note: 'CDN answers 50% at the edge',
    nodes: [users, { ...cdn, tone: 'ok' }, app, primary, replicas, cache],
    edges: [
      { from: 'users', to: 'cdn' },
      { from: 'cdn', to: 'app', label: 'miss', labelAt: [0, -16] },
      { from: 'app', to: 'primary', label: 'writes', labelAt: [-30, -16] },
      { from: 'app', to: 'cache', label: 'read', labelAt: [-34, 8] },
      { from: 'cache', to: 'replicas' },
      { from: 'primary', to: 'replicas', dashed: true },
    ],
    packets: [{ from: 'users', to: 'cdn', label: 'hit', tone: 'ok' }],
    active: ['cdn'],
  },
];

export default function ScalingReadsWalk() {
  return (
    <AnimFrame title="Scaling reads: one rung at a time" steps={steps} interval={5200}>
      {(i, s) => (
        <FlowDiagram
          width={720}
          height={310}
          nodes={s.nodes}
          edges={s.edges}
          notes={[{ x: 360, y: 14, text: s.note, anchor: 'middle', size: 16, tone: s.noteTone } as FlowNote]}
          packets={s.packets}
          active={s.active}
          stepKey={i}
          label="Users and app servers in front of a database. Replicas, a cache, and a CDN are added one at a time."
        />
      )}
    </AnimFrame>
  );
}
