import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

interface Panel {
  x0: number;
  title: string;
  sub: string;
  color: string;
  lines: string[];
}

const panels: Panel[] = [
  {
    x0: 5,
    title: 'Layer 4 load balancer',
    sub: 'reads the outer envelopes: connections',
    color: 'var(--accent)',
    lines: [
      'sees: IP addresses and ports only',
      'picks a server once per connection',
      'does not open the letter inside',
      'encrypted bytes pass straight through',
      'fast, works for any protocol',
    ],
  },
  {
    x0: 365,
    title: 'Layer 7 load balancer',
    sub: 'opens the letter: HTTP requests',
    color: 'var(--ok)',
    lines: [
      'sees: path, headers, cookies',
      'picks a server per request',
      'can end TLS itself (decrypts here)',
      'routes by path, retries failed requests',
      'costs CPU: it parses every request',
    ],
  },
];

/** Static comparison of L4 and L7 load balancers. */
export default function LayerFourSeven() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={720} height={310} label="Layer 4 load balancer routes whole connections. Layer 7 load balancer reads each HTTP request and routes it.">
        {panels.map((p) => {
          const lb = p.x0 + 160;
          return (
            <g key={p.title}>
              <HandText x={p.x0 + 170} y={20} size={17} color={p.color} weight={700}>
                {p.title}
              </HandText>
              <HandText x={p.x0 + 170} y={42} size={13} color="var(--muted)">
                {p.sub}
              </HandText>
              <SketchBox cx={p.x0 + 36} cy={105} w={64} h={40} seed={seedOf(p.title + 'c')} />
              <HandText x={p.x0 + 36} y={105} size={14}>
                Client
              </HandText>
              <SketchBox cx={lb} cy={105} w={80} h={64} stroke={p.color} seed={seedOf(p.title + 'lb')} />
              <HandText x={lb} y={105} size={17}>
                LB
              </HandText>
              {[80, 130].map((y, k) => (
                <g key={y}>
                  <SketchBox cx={p.x0 + 292} cy={y} w={84} h={38} seed={seedOf(p.title + 's' + k)} />
                  <HandText x={p.x0 + 292} y={y} size={14}>
                    {`Server ${k + 1}`}
                  </HandText>
                  <SketchArrow points={[[lb + 46, 105 + (k ? 10 : -10)], [p.x0 + 246, y]]} stroke={p.color} seed={seedOf(p.title + 'a' + k)} />
                </g>
              ))}
              <SketchArrow points={[[p.x0 + 74, 105], [lb - 46, 105]]} stroke={p.color} seed={seedOf(p.title + 'in')} />
              {p.lines.map((l, k) => (
                <HandText key={l} x={p.x0 + 6} y={180 + k * 27} size={14} anchor="start">
                  {`- ${l}`}
                </HandText>
              ))}
            </g>
          );
        })}
        <line x1={360} x2={360} y1={10} y2={300} stroke="var(--border)" strokeDasharray="5 6" />
      </SketchSvg>
    </figure>
  );
}
