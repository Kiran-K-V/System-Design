import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: forward proxy versus reverse proxy. The question is whose side the proxy stands on. */

interface Panel {
  x0: number;
  title: string;
  sub: string;
  color: string;
  left: string[];
  right: string[];
  groupLabel: string;
  groupSide: 'left' | 'right';
  lines: string[];
}

const PANELS: Panel[] = [
  {
    x0: 5,
    title: 'Forward proxy',
    sub: 'stands in for the clients',
    color: 'var(--accent)',
    left: ['Laptop', 'Laptop'],
    right: ['Any site', 'Any site'],
    groupLabel: 'company network',
    groupSide: 'left',
    lines: ['client knows it and is set up to use it', 'server sees the proxy, not the client', 'filter, log, cache, hide client IPs', 'example: office web gateway'],
  },
  {
    x0: 365,
    title: 'Reverse proxy',
    sub: 'stands in for the servers',
    color: 'var(--ok)',
    left: ['Browser', 'Phone'],
    right: ['App 1', 'App 2'],
    groupLabel: 'your data center',
    groupSide: 'right',
    lines: ['client thinks it is the real server', 'client never sees the real servers', 'TLS, load balancing, cache, auth, compress', 'examples: nginx, CDN edge, API gateway'],
  },
];

export default function ProxyKinds() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={720} height={320} label="Forward proxy acts for clients and hides them from servers. Reverse proxy acts for servers and hides them from clients.">
        {PANELS.map((p) => {
          const cx = p.x0 + 175;
          const gx = p.groupSide === 'left' ? p.x0 + 4 : p.x0 + 222;
          return (
            <g key={p.title}>
              <HandText x={cx} y={16} size={18} weight={700} color={p.color}>
                {p.title}
              </HandText>
              <HandText x={cx} y={38} size={14} color="var(--muted)">
                {p.sub}
              </HandText>
              {/* dashed boundary around the side the proxy belongs to */}
              <SketchBox cx={gx + 66} cy={112} w={132} h={134} r={14} dashed stroke="var(--muted)" seed={seedOf(p.title + 'g')} />
              <HandText x={gx + 66} y={58} size={14} color="var(--muted)">
                {p.groupLabel}
              </HandText>
              {p.left.map((l, k) => (
                <g key={'l' + k}>
                  <SketchBox cx={p.x0 + 48} cy={90 + k * 52} w={80} h={38} seed={seedOf(p.title + 'l' + k)} />
                  <HandText x={p.x0 + 48} y={90 + k * 52} size={14}>
                    {l}
                  </HandText>
                  <SketchArrow points={[[p.x0 + 92, 90 + k * 52], [cx - 40, 112 + (k ? 10 : -10)]]} stroke={p.color} seed={seedOf(p.title + 'a' + k)} />
                </g>
              ))}
              <SketchBox cx={cx} cy={112} w={72} h={60} stroke={p.color} seed={seedOf(p.title + 'p')} />
              <HandText x={cx} y={112} size={16}>
                Proxy
              </HandText>
              {p.right.map((r, k) => (
                <g key={'r' + k}>
                  <SketchBox cx={p.x0 + 302} cy={90 + k * 52} w={80} h={38} seed={seedOf(p.title + 'r' + k)} />
                  <HandText x={p.x0 + 302} y={90 + k * 52} size={14}>
                    {r}
                  </HandText>
                  <SketchArrow points={[[cx + 40, 112 + (k ? 10 : -10)], [p.x0 + 258, 90 + k * 52]]} stroke={p.color} seed={seedOf(p.title + 'b' + k)} />
                </g>
              ))}
              {p.lines.map((l, k) => (
                <HandText key={l} x={p.x0 + 4} y={205 + k * 26} size={14} anchor="start">
                  {`- ${l}`}
                </HandText>
              ))}
            </g>
          );
        })}
        <line x1={360} x2={360} y1={10} y2={310} stroke="var(--border)" strokeDasharray="5 6" />
      </SketchSvg>
    </figure>
  );
}
