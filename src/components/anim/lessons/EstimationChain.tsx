import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode } from '../FlowDiagram';

const nodes: FlowNode[] = [
  { id: 'dau', x: 95, y: 80, w: 140, label: '100M', sub: 'daily users', badge: 1 },
  { id: 'day', x: 370, y: 80, w: 150, label: '200M', sub: 'writes / day', badge: 2 },
  { id: 'avg', x: 650, y: 80, w: 150, label: '2K', sub: 'writes / sec (avg)', badge: 3 },
  { id: 'peak', x: 650, y: 260, w: 150, label: '6K', sub: 'writes / sec (peak)', badge: 4 },
  { id: 'reads', x: 370, y: 260, w: 150, label: '600K', sub: 'reads / sec (peak)', badge: 5 },
  { id: 'store', x: 95, y: 260, w: 140, label: '1 PB', sub: '5 yr × 3 copies', badge: 6 },
];

const edges: FlowEdge[] = [
  { from: 'dau', to: 'day', label: '× 2 posts each' },
  { from: 'day', to: 'avg', label: '÷ 100K sec' },
  { from: 'avg', to: 'peak', label: '× 3 peak', labelAt: [44, 0] },
  { from: 'peak', to: 'reads', label: '× 100 reads' },
  { from: 'day', to: 'store', label: '× 1 KB × 365\n× 5 yr × 3', labelAt: [-70, 10], bend: 30, dashed: true },
];

const order = ['dau', 'day', 'avg', 'peak', 'reads', 'store'];

const steps = [
  { caption: 'Start with users. Assume 100 million daily active users (DAU). State the number out loud so anyone can correct it.' },
  { caption: 'Each user posts 2 times a day. 100M × 2 = 200M writes per day.' },
  {
    caption:
      'A day has 86,400 seconds. Round to 100,000 so the math stays in your head. 200M ÷ 100K = 2,000 writes per second on average.',
  },
  { caption: 'Traffic is not flat. Evenings and events spike. Multiply by a peak factor, here 3x. Peak writes: 6,000 per second.' },
  {
    caption:
      'Each post is read about 100 times. Peak reads: 600,000 per second. Now the design question is clear: this is read-heavy, so caching is the main problem.',
  },
  {
    caption:
      'Storage: 200M × 1 KB = 200 GB per day. × 365 × 5 years × 3 copies ≈ 1 PB. Too big for one machine, so the data must be sharded.',
  },
];

export default function EstimationChain() {
  return (
    <AnimFrame title="From users to a design decision" steps={steps}>
      {(i) => (
        <FlowDiagram
          width={740}
          height={320}
          nodes={nodes.map((n) => ({ ...n, tone: order.indexOf(n.id) > i ? 'muted' : 'default' }))}
          edges={edges.map((e) => ({ ...e, tone: order.indexOf(e.to) > i ? 'muted' : 'default' }))}
          active={[order[i]]}
          packets={i > 0 ? [{ from: order[i] === 'store' ? 'day' : order[i - 1], to: order[i] }] : []}
          stepKey={i}
        />
      )}
    </AnimFrame>
  );
}
