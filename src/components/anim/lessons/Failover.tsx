import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

interface NodeView {
  label: string;
  sub: string;
  tone?: Tone;
}

interface Step {
  caption: string;
  l: NodeView;
  f1: NodeView;
  f2: NodeView;
  /** Which replication and client edges are live. */
  links: { appL?: boolean; appF1?: boolean; lF1?: boolean; lF2?: boolean; f1F2?: boolean };
  active: string[];
  packets: FlowPacket[];
  note?: { x: number; y: number; text: string; tone: Tone };
}

const steps: Step[] = [
  {
    caption:
      'A healthy cluster. The leader is on epoch 7 and holds log records up to 42. Follower 1 has all 42. Follower 2 lags by one record: it has 41. The app writes to the leader.',
    l: { label: 'Leader', sub: 'epoch 7 · log 42' },
    f1: { label: 'Follower 1', sub: 'log 42' },
    f2: { label: 'Follower 2', sub: 'log 41 (lag 1)' },
    links: { appL: true, lF1: true, lF2: true },
    active: ['l'],
    packets: [],
  },
  {
    caption:
      'The leader stops answering. It may have crashed, or only the network to it is slow. A follower cannot tell which. Followers wait for a timeout. Short timeouts cause false alarms. Long ones extend the outage.',
    l: { label: 'Leader', sub: 'no heartbeat', tone: 'bad' },
    f1: { label: 'Follower 1', sub: 'log 42' },
    f2: { label: 'Follower 2', sub: 'log 41' },
    links: { appL: true },
    active: [],
    packets: [],
    note: { x: 300, y: 128, text: 'writes fail now', tone: 'bad' },
  },
  {
    caption:
      'The timeout passes. Someone must choose the new leader. The safe choice is the follower with the longest log. Follower 1 has record 42. If we promote follower 2, record 42 is lost.',
    l: { label: 'Leader', sub: 'declared dead', tone: 'bad' },
    f1: { label: 'Follower 1', sub: 'log 42 ← longest', tone: 'ok' },
    f2: { label: 'Follower 2', sub: 'log 41' },
    links: {},
    active: ['f1', 'f2'],
    packets: [],
  },
  {
    caption:
      'Follower 1 is promoted and takes a new, higher epoch number: 8. Follower 2 now copies its log from follower 1. The app is pointed at the new leader. Writes work again.',
    l: { label: 'Old leader', sub: 'epoch 7 · down', tone: 'bad' },
    f1: { label: 'New leader', sub: 'epoch 8 · log 42', tone: 'ok' },
    f2: { label: 'Follower 2', sub: 'log 41 → 42' },
    links: { appF1: true, f1F2: true },
    active: ['f1'],
    packets: [
      { from: 'app', to: 'f1', label: 'x=6' },
      { from: 'f1', to: 'f2', label: 'rec 42', delay: 0.9, tone: 'ok' },
    ],
  },
  {
    caption:
      'The old leader comes back. It was only frozen, so it still believes it is the leader of epoch 7. A client with a stale address writes to it. Two machines accept writes. This is split brain: their data now diverges.',
    l: { label: 'Old leader', sub: 'thinks: leader, epoch 7', tone: 'bad' },
    f1: { label: 'New leader', sub: 'epoch 8 · log 43', tone: 'ok' },
    f2: { label: 'Follower 2', sub: 'log 43' },
    links: { appL: true, appF1: true, f1F2: true },
    active: ['l', 'f1'],
    packets: [{ from: 'app', to: 'l', label: 'x=9', tone: 'bad' }],
    note: { x: 300, y: 128, text: 'two leaders', tone: 'bad' },
  },
  {
    caption:
      'Fencing stops it. Every request carries an epoch. Followers and storage reject epoch 7 because 8 is newer. The old leader learns it is deposed and becomes a follower. Its extra write was never replicated, so it is discarded. But who hands out epoch numbers and who agrees on them? That needs consensus (lesson 4.11).',
    l: { label: 'Old leader', sub: 'rejected: epoch 7 < 8', tone: 'warn' },
    f1: { label: 'New leader', sub: 'epoch 8 · log 43', tone: 'ok' },
    f2: { label: 'Follower 2', sub: 'log 43' },
    links: { appF1: true, f1F2: true, lF1: true },
    active: ['f1'],
    packets: [{ from: 'l', to: 'f1', label: 'epoch 7', tone: 'bad' }],
    note: { x: 300, y: 128, text: 'x=9 discarded', tone: 'warn' },
  },
];

export default function Failover() {
  return (
    <AnimFrame title="Leader failure and failover" steps={steps} interval={4000}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'app', x: 62, y: 170, w: 84, h: 58, label: 'App' },
          { id: 'l', x: 300, y: 62, w: 190, h: 86, shape: 'db', label: s.l.label, sub: s.l.sub, tone: s.l.tone },
          { id: 'f1', x: 300, y: 266, w: 190, h: 86, shape: 'db', label: s.f1.label, sub: s.f1.sub, tone: s.f1.tone },
          { id: 'f2', x: 630, y: 166, w: 170, h: 86, shape: 'db', label: s.f2.label, sub: s.f2.sub, tone: s.f2.tone },
        ];
        const e: FlowEdge[] = [];
        if (s.links.appL) e.push({ from: 'app', to: 'l', head: 'both', tone: s.l.tone === 'bad' && i === 1 ? 'bad' : 'default', dashed: i === 1 });
        if (s.links.appF1) e.push({ from: 'app', to: 'f1', head: 'both' });
        if (s.links.lF1) e.push({ from: 'l', to: 'f1', head: 'end', dashed: true, tone: i === 5 ? 'bad' : 'default' });
        if (s.links.lF2) e.push({ from: 'l', to: 'f2', head: 'end', dashed: true, label: 'log', labelAt: [14, -16] });
        if (s.links.f1F2) e.push({ from: 'f1', to: 'f2', head: 'end', dashed: true, label: 'log', labelAt: [14, 18] });
        const notes: FlowNote[] = s.note ? [{ x: s.note.x, y: s.note.y, text: s.note.text, anchor: 'middle', tone: s.note.tone, size: 16 }] : [];
        return <FlowDiagram width={720} height={330} nodes={nodes} edges={e} notes={notes} active={s.active} packets={s.packets} stepKey={i} label="Failover of a replicated database after the leader fails" />;
      }}
    </AnimFrame>
  );
}
