import { DesignCompare, type CompareVariant } from '../DesignBuild';
import type { FlowEdge, FlowNode } from '../FlowDiagram';

/** One viral post: index write per like, or index write per milestone. */

const nodes = (mid: string): FlowNode[] => [
  { id: 'users', x: 90, y: 120, w: 120, label: 'Likers', sub: 'one viral post' },
  { id: 'store', x: 290, y: 120, w: 130, label: 'Likes store', sub: mid, h: 80, shape: 'db' },
  { id: 'index', x: 560, y: 120, w: 150, label: 'Search index', sub: 'likes field', h: 80, shape: 'db' },
];

const naiveEdges: FlowEdge[] = [
  { from: 'users', to: 'store', label: 'likes' },
  { from: 'store', to: 'index', label: 'update doc', labelAt: [0, -18] },
];
const betterEdges: FlowEdge[] = [
  { from: 'users', to: 'store', label: 'likes' },
  { from: 'store', to: 'index', label: 'at 1, 2, 4, 8 ...', labelAt: [0, -18], dashed: true },
];

const variants: CompareVariant[] = [
  {
    id: 'every',
    label: 'Naive: index every like',
    nodes: nodes('exact count'),
    edges: naiveEdges,
    steps: [
      { notes: [{ x: 560, y: 176, text: 'index writes: 0', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'One post goes viral and collects 1,000,000 likes in an hour (an assumption for the example). Every like must show up in the sort order. The simple plan: update the index document on every like.', active: ['users'] },
      { notes: [{ x: 560, y: 176, text: 'index writes: 0', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'Likes arrive at the store. The store counts each one correctly. That part is fine and cheap.', packets: [{ from: 'users', to: 'store', label: '+1' }], tones: { store: 'ok' } },
      { notes: [{ x: 560, y: 176, text: 'index writes: one per like', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'Each like also becomes an index update. An update in a search engine rewrites the whole document into a new segment, so each one costs far more than a counter increment.', packets: [{ from: 'store', to: 'index', label: 'update' }], tones: { index: 'warn' } },
      { notes: [{ x: 560, y: 176, text: 'index writes: 1,000,000', anchor: 'middle', size: 16, tone: 'bad' }], caption: 'One post causes 1,000,000 index writes. Across the site that is up to 100,000 a second, on top of 10,000 new posts a second. The index spends its time rewriting documents instead of answering searches.', tones: { store: 'ok', index: 'bad' } },
    ],
  },
  {
    id: 'milestone',
    label: 'Better: index at milestones',
    nodes: nodes('exact count'),
    edges: betterEdges,
    steps: [
      { notes: [{ x: 560, y: 176, text: 'index writes: 0', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'Same viral post. The store keeps the exact count. The index keeps only a rough count that is updated when the exact count crosses 1, 2, 4, 8, and so on (powers of 2).', active: ['users'] },
      { notes: [{ x: 560, y: 176, text: 'index writes: 0', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'Likes arrive and the store counts each one. Most of them send nothing to the index.', packets: [{ from: 'users', to: 'store', label: '+1' }], tones: { store: 'ok' } },
      { notes: [{ x: 560, y: 176, text: 'index writes: 1 (at 2^19)', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'When the count reaches 524,288 (2 to the power 19), the store sends one update. The indexed value is always within a factor of 2 of the true count.', packets: [{ from: 'store', to: 'index', label: '2^19' }], tones: { index: 'ok' } },
      { notes: [{ x: 560, y: 176, text: 'index writes: 20', anchor: 'middle', size: 16, tone: 'ok' }], caption: 'Reaching 1,000,000 likes crossed 20 milestones (2^0 to 2^19). That is 20 index writes for the post, not 1,000,000. At query time the service takes the top results and re-reads their exact counts from the store, so the final order is exact among them.', tones: { store: 'ok', index: 'ok' } },
    ],
  },
];

export default function PostSearchCompare() {
  return <DesignCompare title="One viral post" prompt="Likes path:" variants={variants} height={240} label="Index update per like versus index update per milestone" />;
}
