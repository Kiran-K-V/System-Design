import { HandText, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: REST, GraphQL and RPC side by side. Stacked bands, 640 wide, text >= 13px. */

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
    unit: 'a resource',
    code: ['GET /users/7/posts', '  ?limit=3', '', '→ 200 + the shape', '  the server chose'],
    picks: 'Server picks\nthe shape',
    best: 'Public APIs, simple CRUD,\nHTTP caching by URL',
    pain: 'Many round trips,\nover-fetching',
    color: 'var(--accent)',
  },
  {
    name: 'GraphQL',
    unit: 'a graph of types',
    code: ['POST /graphql', '{ user(id: 7) {', '  name', '  posts(first: 3) {', '    text } } }'],
    picks: 'Client picks\nthe fields',
    best: 'Many client types with\ndifferent screens',
    pain: 'N+1 queries, no URL cache,\nquery cost, field-level auth',
    color: 'var(--ok)',
  },
  {
    name: 'RPC',
    unit: 'a procedure (gRPC)',
    code: ['rpc GetProfileScreen(', '  ProfileRequest)', '  returns (ProfileScreen);', '', '(protobuf over HTTP/2)'],
    picks: 'Server picks,\ntyped contract',
    best: 'Service to service calls,\nlow latency, generated code',
    pain: 'Tight coupling, weak in\nbrowsers, hard to explore',
    color: 'var(--warn)',
  },
];

const H = 150;

export default function ApiStylePanels() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg">
      <div className="border-b border-line bg-surface px-4 py-2 text-sm font-medium">Three API styles side by side</div>
      <div className="px-2 py-4 sm:px-4">
        <SketchSvg width={640} height={H * 3 + 12} label="REST, GraphQL and RPC compared: example call, who picks the shape, best use and main pain">
          {PANELS.map((p, i) => {
            const top = 4 + i * (H + 2);
            const cy = top + H / 2;
            return (
              <g key={p.name}>
                <SketchBox cx={320} cy={cy} w={632} h={H - 6} seed={seedOf(p.name)} stroke={p.color} />
                <HandText x={16} y={top + 30} size={24} anchor="start" weight={700} color={p.color}>
                  {p.name}
                </HandText>
                <HandText x={16} y={top + 54} size={13} anchor="start" color="var(--muted)">
                  {p.unit}
                </HandText>
                <HandText x={16} y={top + 96} size={15} anchor="start" weight={700} lineHeight={1.3}>
                  {p.picks}
                </HandText>
                <SketchBox cx={278} cy={cy} w={214} h={118} r={8} seed={seedOf(p.name + 'c')} fill="var(--surface)" fillStyle="solid" stroke="var(--border)" />
                <HandText x={178} y={cy} size={13} anchor="start" mono lineHeight={1.4}>
                  {p.code.join('\n')}
                </HandText>
                <HandText x={402} y={top + 26} size={13} anchor="start" color="var(--ok)" weight={700}>
                  Best for
                </HandText>
                <HandText x={402} y={top + 54} size={13} anchor="start" lineHeight={1.3}>
                  {p.best}
                </HandText>
                <HandText x={402} y={top + 92} size={13} anchor="start" color="var(--bad)" weight={700}>
                  Watch out
                </HandText>
                <HandText x={402} y={top + 120} size={13} anchor="start" lineHeight={1.3}>
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
