import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket } from '../FlowDiagram';

const nodes: FlowNode[] = [
  { id: 'app', x: 100, y: 170, w: 150, h: 70, label: 'App server' },
  { id: 'cache', x: 380, y: 170, w: 170, h: 70, label: 'Cache', sub: 'RAM, ~0.5 ms away' },
  { id: 'db', x: 665, y: 175, w: 130, h: 100, shape: 'db', label: 'Database', sub: '~5 ms query' },
];

const edges: FlowEdge[] = [
  { from: 'app', to: 'cache', head: 'both' },
  { from: 'app', to: 'db', head: 'both', bend: 80, dashed: true },
];

interface Scene {
  caption: string;
  packets: FlowPacket[];
  active: string[];
  notes: FlowNote[];
}

const slow: FlowNote = { x: 380, y: 112, text: 'dashed = slow path', anchor: 'middle', size: 14 };

const total = (text: string, tone: 'bad' | 'ok' | 'warn' | 'default' = 'default'): FlowNote => ({
  x: 380,
  y: 280,
  text,
  anchor: 'middle',
  size: 20,
  tone: tone === 'default' ? undefined : tone,
});

const scenes: Scene[] = [
  {
    caption: 'The setup. A read must return the user row. The cache starts empty. The database holds the truth. The dashed line is the slow path.',
    packets: [],
    active: [],
    notes: [{ x: 380, y: 224, text: 'cache: (empty)', anchor: 'middle', size: 17 }],
  },
  {
    caption: 'Read 1, step 1. The app asks the cache first. Asking costs about 0.5 ms: one network round trip inside the data center.',
    packets: [{ from: 'app', to: 'cache', label: 'GET user:7' }],
    active: ['cache'],
    notes: [{ x: 380, y: 224, text: 'cache: (empty)', anchor: 'middle', size: 17 }, total('so far: ~0.5 ms')],
  },
  {
    caption: 'The cache has no copy. That is a miss. The app learns this after one wasted round trip.',
    packets: [{ from: 'cache', to: 'app', label: 'miss', tone: 'bad' }],
    active: ['app'],
    notes: [{ x: 380, y: 224, text: 'cache: (empty)', anchor: 'middle', size: 17 }, total('so far: ~1 ms', 'warn')],
  },
  {
    caption: 'The app queries the database. This is the slow part: about 5 ms for an indexed read. The row comes back.',
    packets: [
      { from: 'app', to: 'db', label: 'SELECT' },
      { from: 'db', to: 'app', label: 'row', delay: 1.1, tone: 'ok' },
    ],
    active: ['db'],
    notes: [{ x: 380, y: 224, text: 'cache: (empty)', anchor: 'middle', size: 17 }, total('so far: ~6 ms', 'bad')],
  },
  {
    caption: 'The app writes the row into the cache, then returns it to the user. This miss cost about 6.5 ms: cache check, database read, cache write.',
    packets: [{ from: 'app', to: 'cache', label: 'SET user:7' }],
    active: ['cache'],
    notes: [{ x: 380, y: 224, text: 'cache: user:7 = {...}', anchor: 'middle', size: 17, tone: 'ok' }, total('miss path total: ~6.5 ms', 'bad')],
  },
  {
    caption: 'Read 2 for the same key. The app asks the cache. The cache has the row. That is a hit. The database never hears about it.',
    packets: [
      { from: 'app', to: 'cache', label: 'GET user:7' },
      { from: 'cache', to: 'app', label: 'hit', delay: 1.1, tone: 'ok' },
    ],
    active: ['cache'],
    notes: [{ x: 380, y: 224, text: 'cache: user:7 = {...}', anchor: 'middle', size: 17, tone: 'ok' }, total('hit path total: ~0.5 ms', 'ok')],
  },
  {
    caption: 'The result. A hit is about 13 times faster than a miss here, and it uses zero database capacity. The rest of this module is about making hits common and keeping them correct.',
    packets: [],
    active: ['cache'],
    notes: [
      { x: 380, y: 224, text: 'cache: user:7 = {...}', anchor: 'middle', size: 17, tone: 'ok' },
      total('hit ~0.5 ms   vs   miss ~6.5 ms', 'default'),
    ],
  },
];

export default function CacheHitMissFlow() {
  return (
    <AnimFrame title="One key: a miss, then a hit" steps={scenes.map((s) => ({ caption: s.caption }))} interval={2800}>
      {(i) => (
        <FlowDiagram
          width={760}
          height={310}
          nodes={nodes}
          edges={edges}
          notes={[...scenes[i].notes, slow]}
          packets={scenes[i].packets}
          active={scenes[i].active}
          stepKey={i}
          label="App server, cache, and database. A first read misses and fills the cache. A second read hits."
        />
      )}
    </AnimFrame>
  );
}
