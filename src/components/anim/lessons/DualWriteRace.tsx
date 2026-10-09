import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

interface Step {
  caption: string;
  a: string;
  b: string;
  tone?: Tone;
  active: string[];
  packets: FlowPacket[];
  note?: string;
}

const steps: Step[] = [
  {
    caption:
      'Naive copying: the app writes every change to two databases itself. Two clients use the app. Both databases hold x = 0.',
    a: 'x = 0',
    b: 'x = 0',
    active: [],
    packets: [],
  },
  {
    caption:
      'At almost the same moment, client 1 sets x = 1 and client 2 sets x = 2. Each sends its write to both databases. Four messages are now in flight on a network with variable delay.',
    a: 'x = 0',
    b: 'x = 0',
    active: ['c1', 'c2'],
    packets: [
      { from: 'c1', to: 'a', label: 'x=1' },
      { from: 'c1', to: 'b', label: 'x=1', delay: 0.5 },
      { from: 'c2', to: 'a', label: 'x=2', delay: 0.2 },
      { from: 'c2', to: 'b', label: 'x=2', delay: 0 },
    ],
  },
  {
    caption:
      'Database A received x=1 first and x=2 second, so it ends at 2. Database B received x=2 first and x=1 second, so it ends at 1. Nobody made an error. The messages just arrived in a different order.',
    a: '1, then 2 → x = 2',
    b: '2, then 1 → x = 1',
    tone: 'bad',
    active: ['a', 'b'],
    packets: [],
    note: 'same writes, different order',
  },
  {
    caption:
      'The copies now disagree, and they will keep disagreeing. No error was raised and no log shows it. A read returns 2 or 1 depending on which database answers. The fix is one component that decides the order, and everyone follows it: a leader.',
    a: 'x = 2',
    b: 'x = 1',
    tone: 'bad',
    active: [],
    packets: [],
    note: 'permanent divergence',
  },
];

const edges: FlowEdge[] = [
  { from: 'c1', to: 'a' },
  { from: 'c1', to: 'b' },
  { from: 'c2', to: 'a' },
  { from: 'c2', to: 'b' },
];

export default function DualWriteRace() {
  return (
    <AnimFrame title="Writing to two databases from the app" steps={steps} interval={3600}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'c1', x: 90, y: 70, w: 120, h: 58, label: 'Client 1', sub: 'x = 1' },
          { id: 'c2', x: 90, y: 230, w: 120, h: 58, label: 'Client 2', sub: 'x = 2' },
          { id: 'a', x: 580, y: 70, w: 200, h: 86, shape: 'db', label: 'Database A', sub: s.a, tone: s.tone },
          { id: 'b', x: 580, y: 230, w: 200, h: 86, shape: 'db', label: 'Database B', sub: s.b, tone: s.tone },
        ];
        const notes: FlowNote[] = s.note ? [{ x: 340, y: 284, text: s.note, anchor: 'middle', size: 16, tone: s.tone ?? 'warn' }] : [];
        return <FlowDiagram width={720} height={300} nodes={nodes} edges={edges} notes={notes} active={s.active} packets={s.packets} stepKey={i} label="Two clients writing to two databases, messages arrive in different orders" />;
      }}
    </AnimFrame>
  );
}
