import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: one HTTP request and its response, with every part labeled. 640 wide so text stays >= 13px. */

interface Line {
  y: number;
  text: string;
  color?: string;
  note?: string;
}

const REQUEST: Line[] = [
  { y: 62, text: 'POST /tweets', color: 'var(--accent)', note: 'verb = the action\npath = the resource (a noun)' },
  { y: 92, text: 'Authorization: Bearer <token>', note: 'header: who is asking' },
  { y: 120, text: 'Content-Type: application/json', note: 'header: format of the body' },
  { y: 166, text: '{ "text": "hello world" }', note: 'body: the data to create' },
];

const RESPONSE: Line[] = [
  { y: 282, text: '201 Created', color: 'var(--ok)', note: 'status code = the outcome' },
  { y: 312, text: 'Location: /tweets/981', note: 'header: where the new\nresource lives' },
  { y: 340, text: 'Content-Type: application/json', note: 'header: format of the body' },
  { y: 386, text: '{ "id": 981, "text": "hi" }', note: 'body: the resource now' },
];

function Card({ cy, h, title, lines, seed }: { cy: number; h: number; title: string; lines: Line[]; seed: string }) {
  return (
    <g>
      <SketchBox cx={166} cy={cy} w={320} h={h} seed={seedOf(seed)} fill="var(--surface)" fillStyle="solid" />
      <HandText x={22} y={cy - h / 2 + 18} size={13} anchor="start" color="var(--muted)">
        {title}
      </HandText>
      {lines.map((l) => (
        <g key={l.y}>
          <HandText x={22} y={l.y} size={14} anchor="start" mono color={l.color}>
            {l.text}
          </HandText>
          <SketchArrow points={[[332, l.y], [354, l.y]]} head="none" stroke="var(--muted)" strokeWidth={1} seed={seedOf(seed + l.y)} />
          <HandText x={362} y={l.y} size={14} anchor="start" color="var(--muted)">
            {l.note ?? ''}
          </HandText>
        </g>
      ))}
    </g>
  );
}

export default function RestAnatomy() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg">
      <div className="border-b border-line bg-surface px-4 py-2 text-sm font-medium">Anatomy of one REST call</div>
      <div className="px-2 py-4 sm:px-4">
        <SketchSvg width={640} height={440} label="An HTTP request and response with each part labeled: verb, path, headers, body, status code">
          <Card cy={108} h={188} title="REQUEST  (client → server)" lines={REQUEST} seed="rq" />
          <Card cy={330} h={188} title="RESPONSE  (server → client)" lines={RESPONSE} seed="rs" />
          <SketchArrow points={[[166, 206], [166, 230]]} seed={seedOf('mid')} stroke="var(--muted)" />
        </SketchSvg>
      </div>
    </figure>
  );
}
