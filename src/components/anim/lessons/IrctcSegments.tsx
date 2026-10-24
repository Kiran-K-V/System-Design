import { DesignCompare, type CompareVariant } from '../DesignBuild';

type Tone = 'accent' | 'ok' | 'bad' | 'warn' | 'muted';

const people = [
  { id: 'ravi', x: 270, y: 60, w: 130, h: 60, label: 'Ravi\nA to C' },
  { id: 'dev', x: 630, y: 60, w: 130, h: 60, label: 'Dev\nC to D' },
  { id: 'meena', x: 450, y: 330, w: 130, h: 60, label: 'Meena\nB to D' },
];
const stationNotes = [
  { x: 115, y: 152, text: 'A', anchor: 'middle' as const, tone: 'muted' as Tone },
  { x: 275, y: 152, text: 'B', anchor: 'middle' as const, tone: 'muted' as Tone },
  { x: 445, y: 152, text: 'C', anchor: 'middle' as const, tone: 'muted' as Tone },
  { x: 615, y: 152, text: 'D', anchor: 'middle' as const, tone: 'muted' as Tone },
];
const say = (x: number, y: number, text: string, tone: Tone = 'accent') => ({ x, y, text, anchor: 'middle' as const, tone });

const naive: CompareVariant = {
  id: 'naive',
  label: 'Naive: one counter per train',
  nodes: [...people, { id: 'ctr', x: 360, y: 190, w: 170, h: 70, label: 'Seat 12 counter', shape: 'db' }],
  edges: [{ from: 'ravi', to: 'ctr' }, { from: 'dev', to: 'ctr' }, { from: 'meena', to: 'ctr' }],
  steps: [
    { caption: 'Seat 12 is free from A to D. The naive design keeps one number for it: seats left. The number is 1. It knows nothing about stations.', notes: [say(190, 262, 'seats left: 1')] },
    { caption: 'Ravi books A to C. The counter goes from 1 to 0.', packets: [{ from: 'ravi', to: 'ctr' }], tones: { ravi: 'ok', ctr: 'ok' }, notes: [say(190, 262, 'seats left: 0', 'ok')] },
    { caption: 'Dev asks for C to D. The counter says 0, so he is refused. But Ravi leaves at C, so the C to D leg is empty. A paying passenger is turned away and the seat runs half empty.', packets: [{ from: 'dev', to: 'ctr', tone: 'bad' }], tones: { ravi: 'ok', dev: 'bad', ctr: 'warn' }, notes: [say(190, 262, 'Dev refused, C to D is empty', 'bad')] },
    { caption: 'Patch the counter to let Dev in and it also lets Meena in. Meena rides B to D and clashes with Ravi on the B to C leg. One number cannot tell Dev from Meena.', packets: [{ from: 'dev', to: 'ctr' }, { from: 'meena', to: 'ctr', delay: 0.5 }], tones: { ravi: 'ok', dev: 'warn', meena: 'bad', ctr: 'bad' }, notes: [say(190, 262, 'Meena and Ravi share B to C', 'bad')] },
  ],
};

const legNodes = (tones: Record<string, Tone | undefined> = {}) => [
  { id: 'ab', x: 190, y: 190, w: 150, h: 56, label: 'Leg A to B', tone: tones.ab },
  { id: 'bc', x: 360, y: 190, w: 150, h: 56, label: 'Leg B to C', tone: tones.bc },
  { id: 'cd', x: 530, y: 190, w: 150, h: 56, label: 'Leg C to D', tone: tones.cd },
];
const legEdges = [
  { from: 'ravi', to: 'ab' }, { from: 'ravi', to: 'bc' },
  { from: 'dev', to: 'cd' },
  { from: 'meena', to: 'bc' }, { from: 'meena', to: 'cd' },
];
const legState = (a: string, b: string, c: string, tone: Tone = 'muted') => [say(190, 250, a, tone), say(360, 250, b, tone), say(555, 250, c, tone)];

const perLeg: CompareVariant = {
  id: 'leg',
  label: 'Better: claim every leg',
  nodes: [...people, ...legNodes()],
  edges: legEdges,
  notes: stationNotes,
  steps: [
    { caption: 'Seat 12 is three legs, each its own row with a holder. All three are free. A booking from one station to another is a range of legs.', notes: legState('free', 'free', 'free') },
    { caption: 'Ravi books A to C. One transaction claims the A to B and B to C rows together. Both are free, so both are his.', packets: [{ from: 'ravi', to: 'ab' }, { from: 'ravi', to: 'bc', delay: 0.5 }], tones: { ravi: 'ok', ab: 'ok', bc: 'ok' }, notes: legState('Ravi', 'Ravi', 'free', 'ok') },
    { caption: 'Meena asks for B to D on seat 12. She needs B to C and C to D. B to C is taken, so the claim fails as a whole. She does not keep C to D. She tries another seat or joins the waitlist.', packets: [{ from: 'meena', to: 'bc', tone: 'bad' }], tones: { ravi: 'ok', ab: 'ok', bc: 'ok', meena: 'bad' }, notes: legState('Ravi', 'Ravi', 'free', 'ok') },
    { caption: 'Dev asks for C to D. His range does not touch Ravi\'s. The C to D row is free, so Dev gets seat 12 too. One seat now carries two trips with no clash.', packets: [{ from: 'dev', to: 'cd' }], tones: { ravi: 'ok', ab: 'ok', bc: 'ok', dev: 'ok', cd: 'ok' }, notes: [say(190, 250, 'Ravi', 'ok'), say(360, 250, 'Ravi', 'ok'), say(555, 250, 'Dev', 'ok')] },
    { caption: 'Ravi cancels. His two legs free up. Meena\'s B to D trip would still clash with Dev on C to D, so she stays waiting. The freed legs go to whoever fits first, which is the next section.', tones: { ravi: 'muted', ab: 'muted', bc: 'muted', dev: 'ok', cd: 'ok', meena: 'warn' }, notes: legState('free', 'free', 'Dev', 'muted') },
  ],
};

export default function IrctcSegments() {
  return (
    <DesignCompare
      title="One seat, three legs"
      prompt="Inventory design:"
      variants={[naive, perLeg]}
      height={400}
      label="Seat 12 on a train with stations A, B, C, D. A per-train counter refuses a free leg and cannot see a clash. Per-leg rows let A to C and C to D share the seat and block B to D."
    />
  );
}
