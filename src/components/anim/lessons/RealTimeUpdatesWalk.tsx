import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

/** Server side of real-time updates: sockets on connection servers, pub/sub fan-out, a registry, and catch-up after a crash. */

interface Step {
  caption: string;
  note: string;
  noteTone?: Tone;
  tones?: Record<string, Tone>;
  subs?: Record<string, string>;
  edges: FlowEdge[];
  packets?: FlowPacket[];
  active?: string[];
  hide?: string[];
}

const base: FlowNode[] = [
  { id: 'u1', x: 55, y: 55, w: 80, h: 44, label: 'Ann' },
  { id: 'u2', x: 55, y: 150, w: 80, h: 44, label: 'Bo' },
  { id: 'u3', x: 55, y: 245, w: 80, h: 44, label: 'Cy' },
  { id: 'g1', x: 225, y: 100, w: 110, h: 60, label: 'Conn.\nserver 1' },
  { id: 'g2', x: 225, y: 240, w: 110, h: 60, label: 'Conn.\nserver 2' },
  { id: 'bus', x: 410, y: 160, w: 100, h: 56, label: 'Pub/sub' },
  { id: 'reg', x: 410, y: 40, w: 100, h: 44, label: 'Registry' },
  { id: 'api', x: 605, y: 70, w: 90, h: 50, label: 'API' },
  { id: 'log', x: 605, y: 245, w: 100, h: 80, label: 'Log', shape: 'db' },
];

const sockets = (skip: string[] = []): FlowEdge[] =>
  [
    { from: 'u1', to: 'g1', head: 'both' as const },
    { from: 'u2', to: 'g1', head: 'both' as const },
    { from: 'u3', to: 'g2', head: 'both' as const },
  ].filter((e) => !skip.includes(e.from));

const steps: Step[] = [
  {
    caption: 'Three users watch one channel. Each holds a socket (the Real-time Transport lesson) to one connection server. That server is state: it knows these sockets and nobody else does. Each server also writes "who is on me" into a registry with a short expiry, so other parts of the system can find a user.',
    note: 'sockets live on connection servers',
    edges: [...sockets(), { from: 'g1', to: 'reg', dashed: true, label: 'Ann, Bo', labelAt: [-8, -14] }, { from: 'g2', to: 'reg', dashed: true, label: 'Cy', labelAt: [-34, 10] }],
    active: ['reg'],
  },
  {
    caption: 'Ann posts a message. The API first appends it to a durable log and gets sequence number 42. Only after that does it announce the message. The log is the source of truth. The socket path is only a fast notification.',
    note: 'store first: message 42',
    edges: [...sockets(), { from: 'api', to: 'log', label: 'append 42', labelAt: [48, 0] }],
    packets: [{ from: 'api', to: 'log', label: '42', tone: 'ok' }],
    active: ['log'],
  },
  {
    caption: 'The API publishes to a pub/sub channel (the Pub/Sub and Logs lesson). Each connection server subscribes to the channels its own users watch. So the bus sends the message to the 2 servers that have a member, not to every server in the fleet, and not once per user.',
    note: 'one publish, one copy per interested server',
    edges: [...sockets(), { from: 'api', to: 'bus', label: 'publish 42', labelAt: [-8, -24] }, { from: 'bus', to: 'g1' }, { from: 'bus', to: 'g2' }],
    packets: [
      { from: 'api', to: 'bus', label: '42', tone: 'accent' },
      { from: 'bus', to: 'g1', label: '42', tone: 'accent', delay: 0.9 },
      { from: 'bus', to: 'g2', label: '42', tone: 'accent', delay: 1.05 },
    ],
    active: ['bus', 'g1', 'g2'],
  },
  {
    caption: 'Each connection server writes the message into the sockets it holds. Ann and Bo get it from server 1, Cy from server 2. Nobody polled. The slow part of the whole design is this last hop: a server with 100,000 sockets does 100,000 small writes.',
    note: 'servers write to their own sockets',
    noteTone: 'ok',
    tones: { u1: 'ok', u2: 'ok', u3: 'ok' },
    edges: [...sockets().map((e) => ({ ...e, tone: 'ok' as Tone })), { from: 'bus', to: 'g1' }, { from: 'bus', to: 'g2' }],
    packets: [
      { from: 'g1', to: 'u1', label: '42', tone: 'ok' },
      { from: 'g1', to: 'u2', label: '42', tone: 'ok', delay: 0.15 },
      { from: 'g2', to: 'u3', label: '42', tone: 'ok', delay: 0.3 },
    ],
    active: ['u1', 'u2', 'u3'],
  },
  {
    caption: 'A message for one user, such as a private reply to Cy, takes the other path. The API asks the registry which server holds Cy, gets server 2, and sends only to it. Use the registry for targeted delivery and pub/sub for broadcast. An entry that expired or points at a dead server means "not connected": fall back to a push notification or just keep the log entry.',
    note: 'registry lookup: Cy is on server 2',
    edges: [...sockets(), { from: 'api', to: 'reg', label: 'where is Cy?', labelAt: [10, 18] }, { from: 'api', to: 'g2', dashed: true, bend: -60, label: 'send to 2', labelAt: [20, 8] }],
    packets: [{ from: 'api', to: 'reg', tone: 'accent' }],
    active: ['reg'],
  },
  {
    caption: 'Server 2 crashes. Cy\'s socket drops. While Cy is offline, message 43 is posted and published. Pub/sub does not store messages for absent listeners. Redis documents its Pub/Sub as at-most-once: a message is delivered once if at all. Cy simply misses 43 on the live path. The log still has it.',
    note: 'live path loses 43 for Cy',
    noteTone: 'bad',
    tones: { g2: 'bad', u3: 'bad' },
    subs: { u3: 'offline', log: '42, 43' },
    edges: [{ from: 'u1', to: 'g1', head: 'both' }, { from: 'u2', to: 'g1', head: 'both' }, { from: 'u3', to: 'g2', head: 'both', dashed: true, tone: 'bad' }, { from: 'api', to: 'log' }, { from: 'api', to: 'bus' }, { from: 'bus', to: 'g1' }, { from: 'bus', to: 'g2', tone: 'bad', dashed: true }],
    active: ['g2'],
  },
  {
    caption: 'Cy\'s client waits a random delay (a different random wait for each client, so they do not all return at once), reconnects through the load balancer to server 1, and says "my last sequence number was 42". The server asks the log for everything after 42 and replays 43. Then it joins the live path. SSE has the same idea built in: the `id` field sets the last event ID the browser sends back on reconnect.',
    note: 'resume from 42: replay 43, then live',
    noteTone: 'ok',
    tones: { g2: 'bad', u3: 'ok' },
    subs: { u3: 'seq 42', log: '42, 43' },
    edges: [{ from: 'u1', to: 'g1', head: 'both' }, { from: 'u2', to: 'g1', head: 'both' }, { from: 'u3', to: 'g1', head: 'both', tone: 'ok', bend: 36 }, { from: 'g1', to: 'log', dashed: true, bend: -50, label: 'after 42?', labelAt: [-20, -2] }],
    packets: [{ from: 'g1', to: 'u3', label: '43', tone: 'ok', delay: 0.6 }],
    active: ['g1'],
  },
];

export default function RealTimeUpdatesWalk() {
  return (
    <AnimFrame title="Server-side fan-out, a registry, and catch-up" steps={steps} interval={6000}>
      {(i, s) => {
        const nodes = base.map((n) => ({ ...n, tone: s.tones?.[n.id] ?? n.tone, sub: s.subs?.[n.id] ?? n.sub }));
        return (
          <FlowDiagram
            width={720}
            height={322}
            nodes={nodes}
            edges={s.edges}
            notes={[{ x: 360, y: 304, text: s.note, anchor: 'middle', size: 16, tone: s.noteTone } as FlowNote]}
            packets={s.packets}
            active={s.active}
            stepKey={i}
            label="Three users on two connection servers, with a pub/sub bus, a registry, an API, and a message log."
          />
        );
      }}
    </AnimFrame>
  );
}
