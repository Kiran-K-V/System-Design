import { DesignCompare, type CompareVariant } from '../DesignBuild';
import type { FlowEdge, FlowNode } from '../FlowDiagram';

/** One hot key, three designs. Per-node capacity of 20,000 operations per second is an assumption. */

const app: FlowNode = { id: 'app', x: 90, y: 160, w: 120, label: 'App servers' };

const naiveNodes: FlowNode[] = [
  app,
  { id: 'a', x: 420, y: 60, w: 150, label: 'Node A', sub: 'about 5k/s' },
  { id: 'b', x: 420, y: 160, w: 150, label: 'Node B', sub: 'owns hot key' },
  { id: 'c', x: 420, y: 260, w: 150, label: 'Node C', sub: 'about 5k/s' },
];
const naiveEdges: FlowEdge[] = [
  { from: 'app', to: 'a', dashed: true },
  { from: 'app', to: 'b', label: '60k reads/s', labelAt: [0, -16] },
  { from: 'app', to: 'c', dashed: true },
];

const four = (sub: string[]): FlowNode[] => [
  app,
  ...[0, 1, 2, 3].map((i) => ({ id: `n${i}`, x: 420, y: 45 + i * 80, w: 170, label: `Node ${i + 1}`, sub: sub[i] })),
];
const fourEdges = (): FlowEdge[] =>
  [0, 1, 2, 3].map((i) => ({ from: 'app', to: `n${i}` }));

const rate = (t: string) => [0, 1, 2, 3].map((i) => ({ x: 530, y: 51 + i * 80, text: t, size: 16, tone: 'ok' as const }));

const variants: CompareVariant[] = [
  {
    id: 'naive',
    label: 'Naive: one copy',
    nodes: naiveNodes,
    edges: naiveEdges,
    notes: [{ x: 24, y: 24, text: 'Assume a node serves 20k operations a second.', size: 16 }],
    steps: [
      { caption: 'A celebrity post becomes one hot key. Assume it gets 60,000 reads a second. Assume a node serves about 20,000 operations a second. Every other node carries about 5,000.', active: ['b'] },
      { caption: 'All 60,000 reads hash to the same key, so they go to the same node. Adding more nodes to the ring does not change that: one key still lives on one node.', packets: [{ from: 'app', to: 'b', label: '60k' }], tones: { b: 'bad' } },
      { caption: 'Node B is at three times its capacity. Its requests queue and time out. The slow replies break the 10 ms target for every key that Node B owns, not only the hot one.', tones: { b: 'bad', a: 'ok', c: 'ok' } },
    ],
  },
  {
    id: 'reads',
    label: 'Fix reads: copies under new keys',
    nodes: four(['hot#0', 'hot#1', 'hot#2', 'hot#3']),
    edges: fourEdges(),
    steps: [
      { caption: 'Store the hot value under four key names: hot#0 to hot#3. A key name decides the node, so four names land on four different nodes (with high probability).', active: ['n0', 'n1', 'n2', 'n3'] },
      { caption: 'Each reader picks one name at random. The 60,000 reads spread to about 15,000 per node. Each node stays under its 20,000 limit.', packets: [{ from: 'app', to: 'n0', label: '15k' }, { from: 'app', to: 'n1', label: '15k', delay: 0.2 }, { from: 'app', to: 'n2', label: '15k', delay: 0.4 }, { from: 'app', to: 'n3', label: '15k', delay: 0.6 }], notes: rate('15k/s'), tones: { n0: 'ok', n1: 'ok', n2: 'ok', n3: 'ok' } },
      { notes: rate('15k/s'), caption: 'The price: a write must update all four copies, or delete them all. Copies can briefly disagree, which an eventually consistent cache allows. Detect hot keys by counting requests per key on each node, and copy only those.', tones: { n0: 'warn', n1: 'warn', n2: 'warn', n3: 'warn' } },
    ],
  },
  {
    id: 'writes',
    label: 'Fix writes: split the key',
    nodes: four(['views#0', 'views#1', 'views#2', 'views#3']),
    edges: fourEdges(),
    steps: [
      { caption: 'A view counter for one video takes 40,000 increments a second. Copies do not help here: four copies of a counter would each need every increment.', active: ['app'] },
      { caption: 'Split the counter into four sub-keys: views#0 to views#3. Each increment picks one at random. Each node takes about 10,000 increments a second.', packets: [{ from: 'app', to: 'n0', label: '10k' }, { from: 'app', to: 'n1', label: '10k', delay: 0.2 }, { from: 'app', to: 'n2', label: '10k', delay: 0.4 }, { from: 'app', to: 'n3', label: '10k', delay: 0.6 }], notes: rate('10k/s'), tones: { n0: 'ok', n1: 'ok', n2: 'ok', n3: 'ok' } },
      { notes: rate('10k/s'), caption: 'A read fetches all four sub-keys and adds them. Reads cost four lookups, which is fine because writes were the problem. The total is only as fresh as the slowest sub-key.', tones: { n0: 'warn', n1: 'warn', n2: 'warn', n3: 'warn' } },
    ],
  },
];

export default function DistributedCacheCompare() {
  return <DesignCompare title="One hot key" prompt="Design:" variants={variants} height={340} label="One hot key on one node versus read copies and split write keys" />;
}
