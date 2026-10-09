import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

/**
 * Fan-out of a chat message through gateways and a channel server.
 * Layer model follows the public Slack design: gateways hold sockets, one channel server owns each channel.
 */

interface Step {
  caption: string;
  note: string;
  noteTone?: Tone;
  packets: FlowPacket[];
  active: string[];
  gw2?: 'ok' | 'dead';
  cs?: 'ok' | 'dead';
  danTo?: 'gw2' | 'gw1';
}

const steps: Step[] = [
  {
    caption:
      'Three users read channel #general. Each holds one WebSocket to a gateway. A gateway is a server that only holds sockets and knows which channels its users watch. Bob and Carol sit on gateway A, Dan on gateway B.',
    note: 'sockets live on gateways',
    packets: [],
    active: [],
  },
  {
    caption: 'Alice posts a message. That is a normal HTTP request to the API, not a socket write. Writes stay on the stateless path you already know.',
    note: '1. post over HTTP',
    packets: [{ from: 'alice', to: 'api', label: 'msg' }],
    active: ['api'],
  },
  {
    caption:
      'The API must find who owns #general. A hash of the channel id picks one channel server, so all messages of a channel meet in one place and get one order. (Module 4 shows the hash ring that does this.)',
    note: '2. hash(channel) -> one owner',
    packets: [{ from: 'api', to: 'cs', label: 'msg' }],
    active: ['cs'],
  },
  {
    caption:
      'The channel server sends the message to each gateway that has a subscriber. That is 2 sends, not 3. Fan-out is per gateway first, per user second. A channel with a million watchers costs the channel server one send per gateway, not a million.',
    note: '3. one send per gateway',
    packets: [
      { from: 'cs', to: 'gw1', label: 'msg' },
      { from: 'cs', to: 'gw2', label: 'msg', delay: 0.15 },
    ],
    active: ['gw1', 'gw2'],
  },
  {
    caption: 'Each gateway writes the message into the sockets of its own subscribers. All three users see the message. No user polled.',
    note: '4. gateways push to sockets',
    noteTone: 'ok',
    packets: [
      { from: 'gw1', to: 'bob', label: 'msg', tone: 'ok' },
      { from: 'gw1', to: 'carol', label: 'msg', tone: 'ok', delay: 0.15 },
      { from: 'gw2', to: 'dan', label: 'msg', tone: 'ok', delay: 0.3 },
    ],
    active: ['bob', 'carol', 'dan'],
  },
  {
    caption:
      'Failure 1: the channel server dies. Users stay connected, because sockets live on the gateways. A ring manager replaces the owner. Slack reports a replacement ready in under 20 seconds, with only the channels on that host delayed.',
    note: 'channel server down: delay, no disconnects',
    noteTone: 'bad',
    packets: [],
    active: [],
    cs: 'dead',
  },
  {
    caption:
      'Failure 2: gateway B dies. Dan loses his socket. His client waits a random delay, reconnects through the load balancer to any gateway (here A), and sends the last sequence number it saw. The new gateway replays what Dan missed.',
    note: 'gateway down: clients reconnect + resume',
    noteTone: 'warn',
    packets: [{ from: 'dan', to: 'gw1', label: 'resume', tone: 'warn' }],
    active: ['gw1'],
    gw2: 'dead',
    danTo: 'gw1',
  },
];

const base: FlowNode[] = [
  { id: 'alice', x: 55, y: 175, w: 90, label: 'Alice' },
  { id: 'api', x: 175, y: 175, w: 90, label: 'API' },
  { id: 'cs', x: 335, y: 175, w: 130, h: 74, label: 'Channel\nserver' },
  { id: 'gw1', x: 505, y: 85, w: 110, h: 64, label: 'Gateway\nA' },
  { id: 'gw2', x: 505, y: 265, w: 110, h: 64, label: 'Gateway\nB' },
  { id: 'bob', x: 650, y: 40, w: 90, h: 50, label: 'Bob' },
  { id: 'carol', x: 650, y: 125, w: 90, h: 50, label: 'Carol' },
  { id: 'dan', x: 650, y: 265, w: 90, h: 50, label: 'Dan' },
];

export default function SocketFanout() {
  return (
    <AnimFrame title="One chat message reaches three sockets" steps={steps} interval={3800}>
      {(i, s) => {
        const nodes = base.map((n) => {
          if (n.id === 'cs' && s.cs === 'dead') return { ...n, tone: 'bad' as const };
          if (n.id === 'gw2' && s.gw2 === 'dead') return { ...n, tone: 'bad' as const };
          return n;
        });
        const edges: FlowEdge[] = [
          { from: 'alice', to: 'api', head: 'end' },
          { from: 'api', to: 'cs', head: 'end' },
          { from: 'cs', to: 'gw1', head: 'end' },
          { from: 'cs', to: 'gw2', head: 'end', tone: s.gw2 === 'dead' ? 'bad' : 'default', dashed: s.gw2 === 'dead' },
          { from: 'gw1', to: 'bob', head: 'both' },
          { from: 'gw1', to: 'carol', head: 'both' },
          ...(s.danTo === 'gw1'
            ? ([{ from: 'dan', to: 'gw1', head: 'both', tone: 'warn', dashed: true, bend: 40 }] as FlowEdge[])
            : ([{ from: 'gw2', to: 'dan', head: 'both' }] as FlowEdge[])),
        ];
        const notes: FlowNote[] = [{ x: 330, y: 14, text: s.note, anchor: 'middle', size: 16, tone: s.noteTone }];
        return (
          <FlowDiagram
            width={720}
            height={310}
            nodes={nodes}
            edges={edges}
            notes={notes}
            active={s.active}
            packets={s.packets}
            stepKey={i}
            label="Alice's message goes over HTTP to an API, to the channel server that owns the channel, to gateways, then to user sockets."
          />
        );
      }}
    </AnimFrame>
  );
}
