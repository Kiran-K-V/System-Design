import AnimFrame from './AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote } from './FlowDiagram';
import SequenceDiagram, { type SeqMessage } from './SequenceDiagram';

/** Reference uses of the kit. Copy these shapes when you build a lesson animation. */

const seqActors = ['Client', 'Server'];
const seqMessages: SeqMessage[] = [
  { from: 'Client', to: 'Server', label: 'SYN' },
  { from: 'Server', to: 'Client', label: 'SYN-ACK' },
  { from: 'Client', to: 'Server', label: 'ACK', tone: 'ok' },
  { from: 'Client', to: 'Server', label: 'data #1', lost: true },
  { from: 'Client', to: 'Client', label: 'timeout → resend', note: true, tone: 'warn' },
  { from: 'Client', to: 'Server', label: 'data #1 (again)', tone: 'ok' },
];

export function SequenceDemo() {
  const steps = [
    { caption: 'Two actors. Nothing sent yet.' },
    ...seqMessages.map((m) => ({ caption: `Message: ${m.label}${m.lost ? ' — lost on the way.' : '.'}` })),
  ];
  return (
    <AnimFrame title="SequenceDiagram demo: TCP handshake and retransmit" steps={steps}>
      {(i) => <SequenceDiagram actors={seqActors} messages={seqMessages} visible={i} />}
    </AnimFrame>
  );
}

const nodes: FlowNode[] = [
  { id: 'client', x: 80, y: 120, w: 100, h: 56, label: 'Client' },
  { id: 'server', x: 360, y: 120, w: 200, h: 80, label: 'Primary Server' },
  { id: 'db', x: 620, y: 120, w: 120, shape: 'circle', label: 'Database' },
];

const edges: FlowEdge[] = [
  { from: 'client', to: 'server', head: 'both', label: 'POST /urls\nGET /{short_code}', labelAt: [0, 36] },
  { from: 'server', to: 'db', head: 'both' },
];

const notes: FlowNote[] = [
  { x: 360, y: 40, text: 'Write: 1) generate short url\n           2) save to DB', anchor: 'middle' },
  { x: 360, y: 200, text: 'Read: 1) look up original url in DB\n          2) return with 302 redirect', anchor: 'middle' },
  { x: 690, y: 70, text: 'Urls\n- short code (or custom alias)\n- original url\n- creationTime\n- expirationTime?\n- createdBy', anchor: 'start' },
];

export function FlowDemo() {
  const steps = [
    { caption: 'Static layout: boxes, a database circle, two-way arrows, and hand-written notes.' },
    { caption: 'A request travels from client to server.' },
    { caption: 'The server reads from the database.' },
    { caption: 'The response returns.' },
  ];
  const packets = [
    [],
    [{ from: 'client', to: 'server', label: 'GET /abc123' }],
    [{ from: 'server', to: 'db', label: 'lookup' }],
    [{ from: 'server', to: 'client', label: '302', tone: 'ok' as const }],
  ];
  const active = [[], ['server'], ['db'], ['client']];
  return (
    <AnimFrame title="FlowDiagram demo: URL shortener" steps={steps}>
      {(i) => (
        <FlowDiagram width={900} height={240} nodes={nodes} edges={edges} notes={notes} packets={packets[i]} active={active[i]} stepKey={i} />
      )}
    </AnimFrame>
  );
}
