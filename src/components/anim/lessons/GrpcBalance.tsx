import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

/** Why a layer 4 load balancer pins a gRPC client to one backend, and two ways out. */

interface Step {
  caption: string;
  note: string;
  noteTone?: Tone;
  lb: string;
  counts: [number, number, number];
  edges: [boolean, boolean, boolean]; // LB (or client) to backend b1..b3 carries traffic
  mode: 'l4' | 'l7' | 'client';
  packets: FlowPacket[];
  active: string[];
}

const steps: Step[] = [
  {
    caption:
      'A gRPC client talks to a service run by three identical backends, behind a load balancer. A gRPC client opens one HTTP/2 connection and keeps it open. That connection carries every call, each on its own stream.',
    note: 'one client, three backends',
    lb: 'L4 LB',
    counts: [0, 0, 0],
    edges: [false, false, false],
    mode: 'l4',
    packets: [],
    active: [],
  },
  {
    caption:
      'The client connects. A layer 4 load balancer (lesson 2.4) picks a backend once, when the TCP connection opens. It chooses backend 1. From now on every byte of this connection goes to backend 1.',
    note: 'L4 picks per connection: backend 1',
    lb: 'L4 LB',
    counts: [0, 0, 0],
    edges: [true, false, false],
    mode: 'l4',
    packets: [{ from: 'client', to: 'lb', label: 'connect' }, { from: 'lb', to: 'b1', label: 'connect', delay: 0.9 }],
    active: ['b1'],
  },
  {
    caption:
      'Now the client makes 9 calls. All 9 are streams on the same connection. The load balancer cannot see them. It forwards bytes. Backend 1 receives every one.',
    note: '9 RPCs, all on one connection',
    lb: 'L4 LB',
    counts: [9, 0, 0],
    edges: [true, false, false],
    mode: 'l4',
    packets: [{ from: 'client', to: 'lb', label: 'rpc' }, { from: 'lb', to: 'b1', label: 'rpc', delay: 0.9 }],
    active: ['b1'],
  },
  {
    caption:
      'The result: backend 1 does 100% of the work and backends 2 and 3 are idle. Adding a fourth backend changes nothing, because the client never opens a new connection. Balanced by connection, but not by load.',
    note: 'adding backends does not help',
    noteTone: 'bad',
    lb: 'L4 LB',
    counts: [9, 0, 0],
    edges: [true, false, false],
    mode: 'l4',
    packets: [],
    active: [],
  },
  {
    caption:
      'Fix 1: a layer 7 proxy (Envoy, nginx, a cloud L7 LB). It ends the HTTP/2 connection, reads each stream, and picks a backend per call. The client still holds one connection, to the proxy. The cost is an extra hop in the data path.',
    note: 'L7 proxy: pick per RPC',
    noteTone: 'ok',
    lb: 'L7 proxy',
    counts: [3, 3, 3],
    edges: [true, true, true],
    mode: 'l7',
    packets: [
      { from: 'lb', to: 'b1', label: 'rpc', tone: 'ok' },
      { from: 'lb', to: 'b2', label: 'rpc', tone: 'ok', delay: 0.15 },
      { from: 'lb', to: 'b3', label: 'rpc', tone: 'ok', delay: 0.3 },
    ],
    active: ['lb'],
  },
  {
    caption:
      'Fix 2: client-side load balancing. The client learns all backend addresses (from DNS or a service registry) and opens a connection to each. It picks a backend for every call. gRPC ships round_robin for this. No extra hop, but every client needs the logic.',
    note: 'client picks per RPC',
    noteTone: 'ok',
    lb: 'registry',
    counts: [3, 3, 3],
    edges: [true, true, true],
    mode: 'client',
    packets: [
      { from: 'client', to: 'b1', label: 'rpc', tone: 'ok' },
      { from: 'client', to: 'b2', label: 'rpc', tone: 'ok', delay: 0.15 },
      { from: 'client', to: 'b3', label: 'rpc', tone: 'ok', delay: 0.3 },
    ],
    active: ['client'],
  },
];

export default function GrpcBalance() {
  return (
    <AnimFrame title="One HTTP/2 connection, three backends" steps={steps} interval={4200}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'client', x: 70, y: 150, w: 110, h: 70, label: 'gRPC\nclient' },
          ...(s.mode === 'client'
            ? ([{ id: 'lb', x: 300, y: 40, w: 130, h: 44, label: 'registry', tone: 'muted' }] as FlowNode[])
            : ([{ id: 'lb', x: 300, y: 150, w: 130, h: 70, label: s.lb }] as FlowNode[])),
          ...[0, 1, 2].map((k) => ({
            id: `b${k + 1}`,
            x: 590,
            y: 45 + k * 105,
            w: 170,
            h: 62,
            label: `Backend ${k + 1}`,
            sub: `${s.counts[k]} RPC${s.counts[k] === 1 ? '' : 's'}`,
            tone: (s.counts[k] === 0 && i > 0 ? 'muted' : s.counts[k] === 9 ? 'warn' : 'default') as Tone,
          })),
        ];
        const edges: FlowEdge[] =
          s.mode === 'client'
            ? [
                { from: 'client', to: 'lb', dashed: true, tone: 'muted', head: 'end' },
                { from: 'client', to: 'b1', head: 'both' },
                { from: 'client', to: 'b2', head: 'both' },
                { from: 'client', to: 'b3', head: 'both' },
              ]
            : [
                { from: 'client', to: 'lb', head: 'both', label: 'one connection', labelAt: [0, -18] },
                ...(['b1', 'b2', 'b3'] as const).map((b, k) => ({ from: 'lb', to: b, head: 'both' as const, dashed: !s.edges[k], tone: (s.edges[k] ? 'default' : 'muted') as Tone })),
              ];
        const notes: FlowNote[] = [{ x: 360, y: 292, text: s.note, anchor: 'middle', size: 16, tone: s.noteTone }];
        return (
          <FlowDiagram
            width={720}
            height={305}
            nodes={nodes}
            edges={edges}
            notes={notes}
            active={s.active}
            packets={s.packets}
            stepKey={i}
            label="A gRPC client with one HTTP/2 connection and three backends behind a load balancer. A layer 4 balancer sends all calls to one backend. A layer 7 proxy or client-side balancing spreads them."
          />
        );
      }}
    </AnimFrame>
  );
}
