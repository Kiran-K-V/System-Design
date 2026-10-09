import { HandText, SketchBox, SketchSvg, seedOf } from '../sketch';
import { encodeUser, hex } from './protoWire';

/**
 * Static infographic: one unary gRPC call as HTTP/2 frames.
 * Message framing (1 byte compressed flag, 4 byte big-endian length) and the frame order come from
 * https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md
 */

const body = encodeUser({ id: 150, name: 'Ada', active: true }).flatMap((p) => p.bytes);
const bodyHex = body.map(hex).join(' ');
const lenHex = [0, 0, 0, body.length].map(hex).join(' ');

function Frame({ cx, cy, w, h, title, lines, tone }: { cx: number; cy: number; w: number; h: number; title: string; lines: string[]; tone: string }) {
  return (
    <g>
      <SketchBox cx={cx} cy={cy} w={w} h={h} stroke={tone} seed={seedOf(title + cx + cy)} />
      <HandText x={cx} y={cy - h / 2 + 16} size={15} weight={700} color={tone}>
        {title}
      </HandText>
      {lines.map((l, i) => (
        <HandText key={i} x={cx} y={cy - h / 2 + 40 + i * 20} size={14}>
          {l}
        </HandText>
      ))}
    </g>
  );
}

export default function GrpcFrames() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={720} height={360} label="A unary gRPC call as HTTP/2 frames: request HEADERS and DATA, then response HEADERS, DATA and trailing HEADERS carrying grpc-status.">
        <HandText x={10} y={14} size={16} anchor="start" color="var(--muted)">
          Client sends, on one HTTP/2 stream:
        </HandText>
        <Frame cx={130} cy={92} w={250} h={120} title="HEADERS" tone="var(--accent)" lines={[':method = POST', ':path = /users.v1.Users/Get', 'content-type: application/grpc', 'grpc-timeout: 200m']} />
        <Frame cx={485} cy={92} w={440} h={120} title="DATA (end of stream)" tone="var(--accent)" lines={[]} />
        {[
          { x: 285, w: 34, t: '00', sub: 'flag', tone: 'var(--muted)' },
          { x: 372, w: 110, t: lenHex, sub: 'length = 10', tone: 'var(--warn)' },
          { x: 575, w: 260, t: bodyHex, sub: 'protobuf message (10 bytes)', tone: 'var(--ok)' },
        ].map((c, i) => (
          <g key={i}>
            <SketchBox cx={c.x} cy={100} w={c.w + 8} h={32} r={6} stroke={c.tone} seed={seedOf('cell' + i)} />
            <HandText x={c.x} y={100} size={14} mono>
              {c.t}
            </HandText>
            <HandText x={c.x} y={128} size={14} color={c.tone}>
              {c.sub}
            </HandText>
          </g>
        ))}
        <HandText x={10} y={185} size={16} anchor="start" color="var(--muted)">
          Server answers on the same stream:
        </HandText>
        <Frame cx={115} cy={255} w={220} h={100} title="HEADERS" tone="var(--ok)" lines={[':status = 200', 'content-type:', 'application/grpc']} />
        <Frame cx={360} cy={255} w={220} h={100} title="DATA" tone="var(--ok)" lines={['5 byte prefix +', 'protobuf response', 'message']} />
        <Frame cx={605} cy={255} w={220} h={100} title="HEADERS (trailers)" tone="var(--warn)" lines={['grpc-status = 0', 'grpc-message (opt.)', 'end of stream']} />
        <HandText x={360} y={346} size={14} color="var(--muted)">
          Status is in the trailers, after the body, so a server can fail late in a stream.
        </HandText>
      </SketchSvg>
    </figure>
  );
}
