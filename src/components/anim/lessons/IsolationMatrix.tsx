import { HandText, SketchBox, SketchSvg, seedOf } from '../sketch';

/**
 * Static infographic: which anomalies each PostgreSQL isolation level allows.
 * Sources: PostgreSQL docs 13.2 (table, Repeatable Read and Serializable text) and Berenson et al., 1995 (lost update, write skew).
 */

const COLS = ['Dirty\nread', 'Non-\nrepeatable\nread', 'Lost\nupdate', 'Write\nskew', 'Phantom\nread'];
// true = the anomaly can happen
const ROWS: { name: string; sub: string; cells: boolean[] }[] = [
  { name: 'Read committed', sub: 'PostgreSQL default', cells: [false, true, true, true, true] },
  { name: 'Repeatable read', sub: 'one snapshot each', cells: [false, false, false, true, false] },
  { name: 'Serializable', sub: 'as if one at a time', cells: [false, false, false, false, false] },
];

const X0 = 200;
const CW = 100;

export default function IsolationMatrix() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={700} height={376} label="Which anomalies each PostgreSQL isolation level allows. Read committed allows non-repeatable read, lost update, write skew and phantom read. Repeatable read allows only write skew. Serializable allows none.">
        {COLS.map((c, i) => (
          <HandText key={c} x={X0 + i * CW + CW / 2} y={42} size={15} weight={700}>
            {c}
          </HandText>
        ))}
        {ROWS.map((r, ri) => {
          const y = 128 + ri * 76;
          return (
            <g key={r.name}>
              <HandText x={10} y={y - 10} size={17} weight={700} anchor="start">
                {r.name}
              </HandText>
              <HandText x={10} y={y + 14} size={14} anchor="start" color="var(--muted)">
                {r.sub}
              </HandText>
              {r.cells.map((bad, ci) => (
                <g key={ci}>
                  <SketchBox cx={X0 + ci * CW + CW / 2} cy={y} w={90} h={52} r={8} seed={seedOf(`m${ri}${ci}`)} stroke={bad ? 'var(--bad)' : 'var(--ok)'} fill="var(--surface)" fillStyle="solid" />
                  <HandText x={X0 + ci * CW + CW / 2} y={y} size={15} weight={700} color={bad ? 'var(--bad)' : 'var(--ok)'}>
                    {bad ? 'can\nhappen' : 'blocked'}
                  </HandText>
                </g>
              ))}
            </g>
          );
        })}
        <HandText x={350} y={346} size={14} color="var(--muted)">
          {'PostgreSQL treats Read uncommitted as Read committed. Other engines differ.\nRead committed lost update: the app reads, computes, then writes the value.'}
        </HandText>
      </SketchSvg>
    </figure>
  );
}
