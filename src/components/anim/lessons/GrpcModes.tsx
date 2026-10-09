import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: the four gRPC call types. Each lane is one RPC on one HTTP/2 stream. */

interface Mode {
  title: string;
  proto: string;
  req: number;
  res: number;
  use: string;
}

const MODES: Mode[] = [
  { title: 'Unary', proto: 'rpc Get(Req) returns (Res)', req: 1, res: 1, use: 'look up one user' },
  { title: 'Server streaming', proto: 'returns (stream Res)', req: 1, res: 4, use: 'live price feed' },
  { title: 'Client streaming', proto: 'rpc Up(stream Req)', req: 4, res: 1, use: 'upload in chunks' },
  { title: 'Bidirectional', proto: '(stream Req) returns (stream Res)', req: 4, res: 4, use: 'chat, telemetry' },
];

const colX = (i: number) => 20 + (i % 2) * 350;
const rowY = (i: number) => 10 + Math.floor(i / 2) * 175;

export default function GrpcModes() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={720} height={360} label="The four gRPC call types: unary, server streaming, client streaming and bidirectional streaming, with the number of messages each side sends.">
        {MODES.map((m, i) => {
          const x0 = colX(i);
          const y0 = rowY(i);
          const cx = x0 + 45;
          const sx = x0 + 275;
          return (
            <g key={m.title}>
              <HandText x={x0 + 160} y={y0 + 18} size={18} weight={700}>
                {m.title}
              </HandText>
              <HandText x={x0 + 160} y={y0 + 40} size={14} color="var(--muted)" mono>
                {m.proto}
              </HandText>
              <SketchBox cx={cx} cy={y0 + 100} w={70} h={80} seed={seedOf(m.title + 'c')} />
              <HandText x={cx} y={y0 + 100} size={15}>
                Client
              </HandText>
              <SketchBox cx={sx} cy={y0 + 100} w={70} h={80} seed={seedOf(m.title + 's')} />
              <HandText x={sx} y={y0 + 100} size={15}>
                Server
              </HandText>
              {Array.from({ length: m.req }).map((_, k) => {
                const y = y0 + 100 - 24 + (k - (m.req - 1) / 2) * 11;
                return <SketchArrow key={'q' + k} points={[[cx + 40, y], [sx - 40, y]]} stroke="var(--accent)" seed={seedOf(m.title + 'q' + k)} />;
              })}
              {Array.from({ length: m.res }).map((_, k) => {
                const y = y0 + 100 + 24 + (k - (m.res - 1) / 2) * 11;
                return <SketchArrow key={'r' + k} points={[[sx - 40, y], [cx + 40, y]]} stroke="var(--ok)" seed={seedOf(m.title + 'r' + k)} />;
              })}
              <HandText x={x0 + 160} y={y0 + 158} size={14} color="var(--muted)">
                {`${m.req} request${m.req > 1 ? 's' : ''}, ${m.res} response${m.res > 1 ? 's' : ''}: ${m.use}`}
              </HandText>
            </g>
          );
        })}
        <line x1={360} x2={360} y1={10} y2={350} stroke="var(--border)" strokeDasharray="5 6" />
        <line x1={20} x2={700} y1={180} y2={180} stroke="var(--border)" strokeDasharray="5 6" />
      </SketchSvg>
    </figure>
  );
}
