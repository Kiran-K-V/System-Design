import { DesignCompare, type CompareVariant } from '../DesignBuild';

const baseNodes = [
  { id: 'alice', x: 80, y: 100, w: 100, h: 44, label: 'Alice' },
  { id: 'srv', x: 300, y: 100, w: 140, h: 60, label: 'Chat server', sub: 'holds sockets' },
  { id: 'cara', x: 560, y: 100, w: 110, h: 44, label: 'Cara' },
];

const variants: CompareVariant[] = [
  {
    id: 'naive',
    label: 'Naive: trust the socket',
    nodes: baseNodes,
    edges: [
      { from: 'alice', to: 'srv', label: 'send', labelAt: [0, -16] },
      { from: 'srv', to: 'cara', label: 'push', labelAt: [0, -16] },
    ],
    steps: [
      {
        caption: 'Alice sends. The server forwards the message to Cara’s open socket and keeps nothing else.',
        active: ['srv'],
        packets: [{ from: 'alice', to: 'srv' }, { from: 'srv', to: 'cara', delay: 0.9 }],
      },
      {
        caption: 'The socket write returned without an error. The kernel accepted the bytes into a send buffer. The server takes that as delivered and tells Alice two ticks.',
        active: ['srv'],
        tones: { srv: 'warn' },
        notes: [{ x: 300, y: 190, text: 'write() returned: mark delivered', anchor: 'middle', tone: 'warn' }],
        packets: [{ from: 'srv', to: 'alice' }],
      },
      {
        caption: 'Cara’s phone had just entered a tunnel. No close frame ever arrived, so the server still thinks the socket is open. The bytes sit in a buffer and never reach her.',
        active: ['cara'],
        tones: { cara: 'bad', srv: 'warn' },
        notes: [{ x: 560, y: 190, text: 'no signal, socket looks open', anchor: 'middle', tone: 'bad' }],
      },
      {
        caption: 'She reconnects later. The server has no copy and no record that anything is missing. Alice saw two ticks. Cara never gets the message. This is silent loss.',
        active: ['srv'],
        tones: { cara: 'bad', srv: 'bad', alice: 'bad' },
        notes: [{ x: 300, y: 190, text: 'nothing to replay', anchor: 'middle', tone: 'bad' }],
      },
    ],
  },
  {
    id: 'better',
    label: 'Better: ack, heartbeat, inbox',
    nodes: [...baseNodes, { id: 'inbox', x: 300, y: 250, w: 140, h: 80, label: 'Inbox', sub: 'per device', shape: 'db' as const }],
    edges: [
      { from: 'alice', to: 'srv', label: 'send', labelAt: [0, -16] },
      { from: 'srv', to: 'cara', label: 'push + id', labelAt: [0, -16] },
      { from: 'srv', to: 'inbox', label: 'save first', labelAt: [-52, 0] },
    ],
    steps: [
      {
        caption: 'Alice sends. The server saves the message in Cara’s inbox before it tries a push. Nothing is promised to Alice yet beyond “sent”.',
        active: ['inbox'],
        tones: { inbox: 'warn' },
        packets: [{ from: 'alice', to: 'srv' }, { from: 'srv', to: 'inbox', delay: 0.9 }],
      },
      {
        caption: 'The server pushes the message with its id and waits for an app-level ack from Cara. The inbox entry stays, because delivered means “Cara’s app confirmed it”.',
        active: ['srv'],
        tones: { inbox: 'warn' },
        notes: [{ x: 330, y: 190, text: 'waiting for ack', anchor: 'start', tone: 'warn' }],
        packets: [{ from: 'srv', to: 'cara' }],
      },
      {
        caption: 'Same tunnel, same silence. But now the heartbeat pings go unanswered, and the ack timer runs out. The server closes the socket and clears her entry in the session map. The inbox entry is still there.',
        active: ['cara'],
        tones: { cara: 'bad', inbox: 'warn' },
        notes: [{ x: 560, y: 190, text: 'heartbeat missed: socket dead', anchor: 'middle', tone: 'bad' }],
      },
      {
        caption: 'Cara reconnects and sends the last sequence number she saw for this chat. The server replays every inbox entry after it, in order. A gap in the numbers would also expose a push that was lost on the way.',
        active: ['srv'],
        tones: { inbox: 'warn' },
        notes: [{ x: 330, y: 190, text: 'last_seq = 41, replay 42', anchor: 'start', tone: 'accent' }],
        packets: [{ from: 'cara', to: 'srv' }, { from: 'inbox', to: 'srv', delay: 0.9 }, { from: 'srv', to: 'cara', delay: 1.8 }],
      },
      {
        caption: 'Cara’s app acks message 42. Only now does the server delete the inbox entry and tell Alice two ticks. The cost is a stored copy and one more round trip. The gain is that loss becomes a delay.',
        active: ['srv'],
        tones: { srv: 'ok', cara: 'ok', alice: 'ok', inbox: 'ok' },
        notes: [{ x: 330, y: 190, text: 'ack: delete entry, tell Alice', anchor: 'start', tone: 'ok' }],
        packets: [{ from: 'cara', to: 'srv' }, { from: 'srv', to: 'alice', delay: 0.9 }],
      },
    ],
  },
];

export default function WhatsappAckCompare() {
  return (
    <DesignCompare
      title="Delivery after a dead socket"
      prompt="Design:"
      variants={variants}
      height={310}
      label="Alice, a chat server, Cara, and in the better design an inbox"
    />
  );
}
