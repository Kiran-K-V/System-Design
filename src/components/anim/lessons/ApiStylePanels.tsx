import { HandText, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: REST, GraphQL and RPC side by side. */

interface Panel {
  name: string;
  unit: string;
  code: string[];
  picks: string;
  best: string;
  pain: string;
  color: string;
}

const PANELS: Panel[] = [
  {
    name: 'REST',
    unit: 'unit: a resource',
    code: ['GET /users/7/posts', '    ?limit=3', '', '→ 200 + the shape the', '   server chose'],
    picks: 'Server picks the shape',
    best: 'Public APIs, simple CRUD,\nHTTP caching by URL',
    pain: 'Many round trips,\nover-fetching',
    color: 'var(--accent)',
  },
  {
    name: 'GraphQL',
    unit: 'unit: a graph of types',
    code: ['POST /graphql', '{ user(id: 7) {', '    name', '    posts(first: 3) {', '      text } } }'],
    picks: 'Client picks the fields',
    best: 'Many client types with\ndifferent screens',
    pain: 'N+1 queries, no URL cache,\nquery cost, field-level auth',
    color: 'var(--ok)',
  },
  {
    name: 'RPC / gRPC',
    unit: 'unit: a procedure',
    code: ['rpc GetProfileScreen(', '   ProfileRequest)', '   returns (ProfileScreen);', '', '(protobuf over HTTP/2)'],
    picks: 'Server picks, typed contract',
    best: 'Service to service calls,\nlow latency, generated code',
    pain: 'Tight coupling, weak in\nbrowsers, hard to explore',
    color: 'var(--warn)',
  },
];

const W = 286;
const GAP = 14;

export default function ApiStylePanels() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg">
      <div className="border-b border-line bg-surface px-4 py-2 text-sm font-medium">Three API styles side by side</div>
      <div className="px-2 py-4 sm:px-4">
        <SketchSvg width={900} height={400} label="REST, GraphQL and RPC compared: example call, who picks the shape, best use and main pain">
          {PANELS.map((p, i) => {
            const cx = 6 + W / 2 + i * (W + GAP);
            const x0 = cx - W / 2 + 16;
            return (
              <g key={p.name}>
                <SketchBox cx={cx} cy={200} w={W} h={388} seed={seedOf(p.name)} stroke={p.color} />
                <HandText x={x0} y={34} size={26} anchor="start" weight={700} color={p.color}>
                  {p.name}
                </HandText>
                <HandText x={x0} y={60} size={13} anchor="start" color="var(--muted)">
                  {p.unit}
                </HandText>
                <SketchBox cx={cx} cy={140} w={W - 28} h={106} r={8} seed={seedOf(p.name + 'c')} fill="var(--surface)" fillStyle="solid" stroke="var(--border)" />
                <HandText x={x0 - 4} y={140} size={12.5} anchor="start" mono lineHeight={1.4}>
                  {p.code.map((l) => l.replace(/^ +/, (m) => '\u00a0'.repeat(m.length))).join('\n')}
                </HandText>
                <HandText x={x0} y={218} size={15} anchor="start" weight={700}>
                  {p.picks}
                </HandText>
                <HandText x={x0} y={252} size={13} anchor="start" color="var(--ok)" weight={700}>
                  Best for
                </HandText>
                <HandText x={x0} y={282} size={14} anchor="start">
                  {p.best}
                </HandText>
                <HandText x={x0} y={324} size={13} anchor="start" color="var(--bad)" weight={700}>
                  Watch out
                </HandText>
                <HandText x={x0} y={354} size={14} anchor="start">
                  {p.pain}
                </HandText>
              </g>
            );
          })}
        </SketchSvg>
      </div>
    </figure>
  );
}
