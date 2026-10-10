import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

/** Replication factor 3. Three replicas of one row, x. The coordinator is the node the client talks to. */

interface Rep {
  sub: string;
  tone?: Tone;
}

interface Step {
  caption: string;
  a: Rep;
  b: Rep;
  c: Rep;
  active: string[];
  packets: FlowPacket[];
  note: string;
  noteTone?: Tone;
}

const steps: Step[] = [
  {
    caption: 'Replication factor 3: three replicas hold the row x. All three have x = 1. The client talks to any node. That node becomes the coordinator for this request. It forwards the work to the replicas that own the key. The consistency level says how many replicas must answer before the coordinator replies.',
    a: { sub: 'x = 1' },
    b: { sub: 'x = 1' },
    c: { sub: 'x = 1' },
    active: ['coord'],
    packets: [],
    note: 'RF = 3',
  },
  {
    caption: 'Write x = 2 at consistency ONE. The coordinator sends the write to all three replicas. ONE means only a single replica must respond. Replica A answers first, so the coordinator tells the client OK at once. The messages to B and C are still on the way.',
    a: { sub: 'x = 2', tone: 'ok' },
    b: { sub: 'x = 1', tone: 'warn' },
    c: { sub: 'x = 1', tone: 'warn' },
    active: ['coord'],
    packets: [
      { from: 'coord', to: 'a', label: 'x=2' },
      { from: 'coord', to: 'b', label: 'x=2', delay: 0.1 },
      { from: 'coord', to: 'c', label: 'x=2', delay: 0.2 },
      { from: 'a', to: 'coord', label: 'ack', tone: 'ok', delay: 1.0 },
      { from: 'coord', to: 'client', label: 'OK', tone: 'ok', delay: 1.9 },
    ],
    note: 'write at ONE: 1 ack needed',
    noteTone: 'ok',
  },
  {
    caption: 'Read x at consistency ONE. The coordinator asks one replica. It happens to pick C, which has not applied the write yet. C answers x = 1. The write was acknowledged, and the read still returned the old value. W + R = 1 + 1 = 2, which is not more than 3, so a read can miss the write.',
    a: { sub: 'x = 2' },
    b: { sub: 'x = 1', tone: 'warn' },
    c: { sub: 'x = 1', tone: 'bad' },
    active: ['coord'],
    packets: [
      { from: 'client', to: 'coord', label: 'read' },
      { from: 'coord', to: 'c', label: '?', delay: 0.9 },
      { from: 'c', to: 'coord', label: 'x=1', tone: 'bad', delay: 1.8 },
      { from: 'coord', to: 'client', label: 'x=1', tone: 'bad', delay: 2.7 },
    ],
    note: 'read at ONE: stale answer',
    noteTone: 'bad',
  },
  {
    caption: 'The delayed writes arrive. B and C apply x = 2. Now all three agree. This is eventual consistency: if no new writes come, all replicas end up the same. How long it takes depends on the network and on node load. For now, we want a guarantee instead of a hope.',
    a: { sub: 'x = 2' },
    b: { sub: 'x = 2', tone: 'ok' },
    c: { sub: 'x = 2', tone: 'ok' },
    active: [],
    packets: [],
    note: 'all replicas agree again',
    noteTone: 'ok',
  },
  {
    caption: 'Switch to QUORUM for reads and writes. QUORUM means a majority of the replicas: n/2 + 1, which is 2 of 3. Write x = 3. The coordinator sends it to all three and waits for two acks. A and B answer, so it tells the client OK. C is still behind.',
    a: { sub: 'x = 3', tone: 'ok' },
    b: { sub: 'x = 3', tone: 'ok' },
    c: { sub: 'x = 2', tone: 'warn' },
    active: ['coord'],
    packets: [
      { from: 'coord', to: 'a', label: 'x=3' },
      { from: 'coord', to: 'b', label: 'x=3', delay: 0.1 },
      { from: 'coord', to: 'c', label: 'x=3', delay: 0.2 },
      { from: 'a', to: 'coord', label: 'ack', tone: 'ok', delay: 1.0 },
      { from: 'b', to: 'coord', label: 'ack', tone: 'ok', delay: 1.1 },
      { from: 'coord', to: 'client', label: 'OK', tone: 'ok', delay: 2.0 },
    ],
    note: 'write at QUORUM: 2 acks needed',
    noteTone: 'ok',
  },
  {
    caption: 'Read x at QUORUM. The coordinator asks two replicas. It could ask any two. Here it asks B and C: B has x = 3, C has x = 2. The coordinator keeps the version with the newest write timestamp and returns x = 3. Any two replicas must include one of the two that took the write, because W + R = 2 + 2 = 4 is more than 3.',
    a: { sub: 'x = 3' },
    b: { sub: 'x = 3', tone: 'ok' },
    c: { sub: 'x = 2', tone: 'warn' },
    active: ['coord'],
    packets: [
      { from: 'client', to: 'coord', label: 'read' },
      { from: 'coord', to: 'b', label: '?', delay: 0.9 },
      { from: 'coord', to: 'c', label: '?', delay: 1.0 },
      { from: 'b', to: 'coord', label: 'x=3', tone: 'ok', delay: 1.9 },
      { from: 'c', to: 'coord', label: 'x=2', tone: 'warn', delay: 2.0 },
      { from: 'coord', to: 'client', label: 'x=3', tone: 'ok', delay: 2.9 },
    ],
    note: 'read at QUORUM: newest timestamp wins',
    noteTone: 'ok',
  },
];

const edges: FlowEdge[] = [
  { from: 'client', to: 'coord', head: 'both' },
  { from: 'coord', to: 'a', head: 'both' },
  { from: 'coord', to: 'b', head: 'both' },
  { from: 'coord', to: 'c', head: 'both' },
];

export default function CassConsistency() {
  return (
    <AnimFrame title="Tunable consistency: ONE then QUORUM" steps={steps} interval={4200}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'client', x: 55, y: 150, w: 84, h: 56, label: 'Client' },
          { id: 'coord', x: 215, y: 150, w: 130, h: 64, label: 'Coordinator' },
          { id: 'a', x: 520, y: 55, w: 160, h: 64, label: 'Replica A', sub: s.a.sub, tone: s.a.tone },
          { id: 'b', x: 520, y: 150, w: 160, h: 64, label: 'Replica B', sub: s.b.sub, tone: s.b.tone },
          { id: 'c', x: 520, y: 245, w: 160, h: 64, label: 'Replica C', sub: s.c.sub, tone: s.c.tone },
        ];
        const notes: FlowNote[] = [{ x: 215, y: 296, text: s.note, anchor: 'middle', tone: s.noteTone }];
        return (
          <FlowDiagram
            width={640}
            height={310}
            nodes={nodes}
            edges={edges}
            notes={notes}
            active={s.active}
            packets={s.packets}
            stepKey={i}
            label="A coordinator sending a write to three replicas, then reading from one or two of them"
          />
        );
      }}
    </AnimFrame>
  );
}
