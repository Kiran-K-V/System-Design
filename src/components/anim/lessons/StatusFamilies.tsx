import { HandText, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: the status code families and the codes an API uses most. */

interface Family {
  range: string;
  title: string;
  hint: string;
  color: string;
  codes: [string, string][];
}

const FAMILIES: Family[] = [
  {
    range: '2xx',
    title: 'It worked',
    hint: 'Client moves on',
    color: 'var(--ok)',
    codes: [
      ['200', 'ok, body included'],
      ['201', 'created a new thing'],
      ['204', 'ok, no body'],
    ],
  },
  {
    range: '3xx',
    title: 'Look elsewhere',
    hint: 'Client follows or reuses',
    color: 'var(--accent)',
    codes: [
      ['301', 'moved for good'],
      ['302', 'moved for now'],
      ['304', 'use your cached copy'],
    ],
  },
  {
    range: '4xx',
    title: 'Client is wrong',
    hint: 'Do not retry unchanged',
    color: 'var(--warn)',
    codes: [
      ['400', 'bad request shape'],
      ['401', 'not logged in'],
      ['403', 'not allowed'],
      ['404', 'no such resource'],
      ['409', 'clashes with state'],
      ['422', 'fails validation'],
      ['429', 'slow down'],
    ],
  },
  {
    range: '5xx',
    title: 'Server is wrong',
    hint: 'Retry may help',
    color: 'var(--bad)',
    codes: [
      ['500', 'server bug'],
      ['502', 'bad upstream reply'],
      ['503', 'overloaded or down'],
      ['504', 'upstream too slow'],
    ],
  },
];

const W = 216;
const GAP = 12;

export default function StatusFamilies() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg">
      <div className="border-b border-line bg-surface px-4 py-2 text-sm font-medium">Status code families</div>
      <div className="px-2 py-4 sm:px-4">
        <SketchSvg width={900} height={330} label="HTTP status code families 2xx, 3xx, 4xx and 5xx with the common codes in each">
          {FAMILIES.map((f, i) => {
            const cx = 6 + W / 2 + i * (W + GAP);
            const x0 = cx - W / 2;
            return (
              <g key={f.range}>
                <SketchBox cx={cx} cy={165} w={W} h={316} seed={seedOf(f.range)} stroke={f.color} />
                <HandText x={x0 + 16} y={38} size={34} anchor="start" weight={700} color={f.color}>
                  {f.range}
                </HandText>
                <HandText x={x0 + 16} y={72} size={17} anchor="start">
                  {f.title}
                </HandText>
                <HandText x={x0 + 16} y={94} size={13} anchor="start" color="var(--muted)">
                  {f.hint}
                </HandText>
                {f.codes.map(([code, meaning], k) => (
                  <g key={code}>
                    <HandText x={x0 + 16} y={128 + k * 25} size={15} anchor="start" mono weight={700}>
                      {code}
                    </HandText>
                    <HandText x={x0 + 58} y={128 + k * 25} size={14} anchor="start">
                      {meaning}
                    </HandText>
                  </g>
                ))}
              </g>
            );
          })}
        </SketchSvg>
      </div>
    </figure>
  );
}
