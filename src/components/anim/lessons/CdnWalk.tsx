import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

/**
 * One cacheable object, requested by users in three regions.
 * Edge caches sit near users. A shield cache sits in front of the origin and collapses duplicate fetches.
 */

type Cell = { sub: string; tone?: Tone };

interface Step {
  caption: string;
  note: string;
  noteTone?: Tone;
  packets: FlowPacket[];
  active: string[];
  e1: Cell;
  e2: Cell;
  e3: Cell;
  sh: Cell;
  origin: number;
}

const EMPTY: Cell = { sub: 'empty', tone: 'muted' };
const STORED: Cell = { sub: 'stored', tone: 'ok' };
const MISS: Cell = { sub: 'MISS', tone: 'bad' };
const HIT: Cell = { sub: 'HIT', tone: 'ok' };

const steps: Step[] = [
  {
    caption:
      'One file, /logo.png, with Cache-Control: public, s-maxage=3600. Three groups of users, in Asia, Europe and the US. Each reaches an edge cache close to them. All edges share one shield cache in front of the origin, which holds the real file. At the start every cache is empty.',
    note: 'cold start: all caches empty',
    packets: [],
    active: [],
    e1: EMPTY,
    e2: EMPTY,
    e3: EMPTY,
    sh: EMPTY,
    origin: 0,
  },
  {
    caption: 'A user in Asia asks for /logo.png. DNS or anycast routed her to the nearest edge. The edge builds a cache key from the URL (and any Vary headers) and looks it up. Nothing there: a MISS.',
    note: 'edge Asia: MISS',
    noteTone: 'bad',
    packets: [{ from: 'u1', to: 'e1', label: 'GET' }],
    active: ['e1'],
    e1: MISS,
    e2: EMPTY,
    e3: EMPTY,
    sh: EMPTY,
    origin: 0,
  },
  {
    caption: 'The edge forwards the request to the shield. The shield is empty too, so it goes to the origin. This long trip is the slow path. The origin receives its first request.',
    note: 'shield MISS -> origin request #1',
    noteTone: 'bad',
    packets: [
      { from: 'e1', to: 'sh', label: 'GET' },
      { from: 'sh', to: 'origin', label: 'GET', delay: 0.9 },
    ],
    active: ['sh', 'origin'],
    e1: MISS,
    e2: EMPTY,
    e3: EMPTY,
    sh: MISS,
    origin: 1,
  },
  {
    caption:
      'The origin answers. Each cache on the way back checks the response headers. The response says public with s-maxage=3600, so both the shield and the edge store it. The user gets the file. Only this first user paid the long trip.',
    note: 'response stored at shield and edge',
    noteTone: 'ok',
    packets: [
      { from: 'origin', to: 'sh', label: '200', tone: 'ok' },
      { from: 'sh', to: 'e1', label: '200', tone: 'ok', delay: 0.9 },
      { from: 'e1', to: 'u1', label: '200', tone: 'ok', delay: 1.8 },
    ],
    active: ['e1', 'sh'],
    e1: STORED,
    e2: EMPTY,
    e3: EMPTY,
    sh: STORED,
    origin: 1,
  },
  {
    caption: 'A second user in Asia asks for the same file. The edge finds it, and its age is under 3600 s, so it is fresh. A HIT. The answer comes from nearby. The shield and the origin never hear about this request.',
    note: 'edge Asia: HIT. origin still at 1',
    noteTone: 'ok',
    packets: [
      { from: 'u1', to: 'e1', label: 'GET' },
      { from: 'e1', to: 'u1', label: '200', tone: 'ok', delay: 0.9 },
    ],
    active: ['e1'],
    e1: HIT,
    e2: EMPTY,
    e3: EMPTY,
    sh: STORED,
    origin: 1,
  },
  {
    caption:
      'A user in Europe asks. The European edge is cold, so it misses. But the shield already has the file. The shield answers, and the origin is not touched. The European edge stores its own copy for next time.',
    note: 'edge Europe MISS, shield HIT. origin still 1',
    noteTone: 'ok',
    packets: [
      { from: 'u2', to: 'e2', label: 'GET' },
      { from: 'e2', to: 'sh', label: 'GET', delay: 0.9 },
      { from: 'sh', to: 'e2', label: '200', tone: 'ok', delay: 1.8 },
    ],
    active: ['sh'],
    e1: STORED,
    e2: STORED,
    e3: EMPTY,
    sh: HIT,
    origin: 1,
  },
  {
    caption: 'The same thing happens for the US edge: miss at the edge, hit at the shield, no new origin request.',
    note: 'edge US MISS, shield HIT. origin still 1',
    noteTone: 'ok',
    packets: [
      { from: 'u3', to: 'e3', label: 'GET' },
      { from: 'e3', to: 'sh', label: 'GET', delay: 0.9 },
      { from: 'sh', to: 'e3', label: '200', tone: 'ok', delay: 1.8 },
    ],
    active: ['sh'],
    e1: STORED,
    e2: STORED,
    e3: STORED,
    sh: HIT,
    origin: 1,
  },
  {
    caption:
      'Tally for this one file in one TTL window. Without a shield, each of the 3 edges would have fetched from the origin: 3 origin requests. With the shield: 1. With 100 edges and a hot object, it is up to 100 against 1. When the 3600 s expire, each cache revalidates or refetches, and the cycle repeats.',
    note: 'origin saw 1 request. Without shield: up to 3',
    noteTone: 'ok',
    packets: [],
    active: ['or'],
    e1: STORED,
    e2: STORED,
    e3: STORED,
    sh: STORED,
    origin: 1,
  },
];

export default function CdnWalk() {
  return (
    <AnimFrame title="Edge caches and an origin shield" steps={steps} interval={4200}>
      {(i, s) => {
        const mk = (id: string, x: number, y: number, label: string, c: Cell, w = 120): FlowNode => ({ id, x, y, w, h: 62, label, sub: c.sub, tone: c.tone });
        const nodes: FlowNode[] = [
          { id: 'u1', x: 55, y: 55, w: 90, h: 54, label: 'Users\nAsia' },
          { id: 'u2', x: 55, y: 160, w: 90, h: 54, label: 'Users\nEurope' },
          { id: 'u3', x: 55, y: 265, w: 90, h: 54, label: 'Users\nUS' },
          mk('e1', 220, 55, 'Edge', s.e1),
          mk('e2', 220, 160, 'Edge', s.e2),
          mk('e3', 220, 265, 'Edge', s.e3),
          mk('sh', 400, 160, 'Shield', s.sh, 110),
          { id: 'origin', x: 610, y: 160, w: 140, h: 96, shape: 'db', label: 'Origin', sub: `${s.origin} request${s.origin === 1 ? '' : 's'}`, tone: s.origin > 0 ? 'warn' : 'default' },
        ];
        const edges: FlowEdge[] = [
          { from: 'u1', to: 'e1', head: 'both' },
          { from: 'u2', to: 'e2', head: 'both' },
          { from: 'u3', to: 'e3', head: 'both' },
          { from: 'e1', to: 'sh', head: 'both' },
          { from: 'e2', to: 'sh', head: 'both' },
          { from: 'e3', to: 'sh', head: 'both' },
          { from: 'sh', to: 'origin', head: 'both', label: 'long haul', labelAt: [0, 30] },
        ];
        const notes: FlowNote[] = [{ x: 360, y: 322, text: s.note, anchor: 'middle', size: 16, tone: s.noteTone }];
        return (
          <FlowDiagram
            width={720}
            height={340}
            nodes={nodes}
            edges={edges}
            notes={notes}
            active={s.active.map((a) => (a === 'or' ? 'origin' : a))}
            packets={s.packets}
            stepKey={i}
            label="Users in three regions reach edge caches, which share one shield cache in front of the origin. After the first miss, other regions hit the shield and the origin sees one request."
          />
        );
      }}
    </AnimFrame>
  );
}
