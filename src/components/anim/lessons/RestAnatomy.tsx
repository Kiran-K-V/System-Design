import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: one HTTP request and its response, with every part labeled. */

interface Line {
  y: number;
  text: string;
  color?: string;
  note?: string;
}

const REQUEST: Line[] = [
  { y: 66, text: 'POST /tweets', color: 'var(--accent)', note: 'verb = the action\npath = the resource (a noun)' },
  { y: 94, text: 'Authorization: Bearer <token>', note: 'header: who is asking' },
  { y: 122, text: 'Content-Type: application/json', note: 'header: format of the body' },
  { y: 168, text: '{ "text": "hello world" }', note: 'body: the data to create' },
];

const RESPONSE: Line[] = [
  { y: 276, text: '201 Created', color: 'var(--ok)', note: 'status code = the outcome' },
  { y: 304, text: 'Location: /tweets/981', note: 'header: address of the new resource' },
  { y: 332, text: 'Content-Type: application/json', note: 'header: format of the body' },
  { y: 378, text: '{ "id": 981, "text": "hello world" }', note: 'body: the resource, as it is now' },
];

function Card({ cy, h, title, lines, seed }: { cy: number; h: number; title: string; lines: Line[]; seed: string }) {
  return (
    <g>
      <SketchBox cx={285} cy={cy} w={530} h={h} seed={seedOf(seed)} fill="var(--surface)" fillStyle="solid" />
      <HandText x={36} y={cy - h / 2 + 18} size={13} anchor="start" color="var(--muted)">
        {title}
      </HandText>
      {lines.map((l) => (
        <g key={l.y}>
          <HandText x={36} y={l.y} size={16} anchor="start" mono color={l.color}>
            {l.text}
          </HandText>
          <SketchArrow points={[[566, l.y], [598, l.y]]} head="none" stroke="var(--muted)" strokeWidth={1} seed={seedOf(seed + l.y)} />
          <HandText x={608} y={l.y} size={14} anchor="start" color="var(--muted)">
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
        <SketchSvg width={900} height={420} label="An HTTP request and response with each part labeled: verb, path, headers, body, status code">
          <Card cy={112} h={180} title="REQUEST  (client → server)" lines={REQUEST} seed="rq" />
          <Card cy={322} h={180} title="RESPONSE  (server → client)" lines={RESPONSE} seed="rs" />
          <SketchArrow points={[[285, 208], [285, 232]]} seed={seedOf('mid')} stroke="var(--muted)" />
        </SketchSvg>
      </div>
    </figure>
  );
}
