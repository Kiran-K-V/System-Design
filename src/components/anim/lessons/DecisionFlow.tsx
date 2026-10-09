import { Badge, HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: pick a database shape from the access pattern. Ask the questions top to bottom. */

const ROWS = [
  { q: 'Need joins, multi-row transactions,\nor queries you cannot predict?', a: 'Relational', sub: 'PostgreSQL, MySQL. The default.' },
  { q: 'Is every access "one key in,\none value out"?', a: 'Key-value', sub: 'Redis, DynamoDB. Sessions.' },
  { q: 'Do you read one whole nested\nrecord at a time?', a: 'Document', sub: 'MongoDB. Catalog, profiles.' },
  { q: 'Huge write volume, read by\none key plus a sorted range?', a: 'Wide-column', sub: 'Cassandra. Messages, events.' },
  { q: 'Are the questions paths across\nrelationships, many hops deep?', a: 'Graph', sub: 'Neo4j. Fraud, social paths.' },
];

const QX = 200;
const AX = 560;
const Y0 = 52;
const STEP = 76;

export default function DecisionFlow() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <div>
      <SketchSvg width={700} height={Y0 + STEP * 5 + 30} label="Decision flow. Ask five questions in order: joins and transactions lead to relational, key-to-value access to key-value, whole nested records to document, heavy writes by key and range to wide-column, relationship paths to graph.">
        <HandText x={QX} y={18} size={15} weight={700}>
          Ask in this order
        </HandText>
        <HandText x={AX} y={18} size={15} weight={700}>
          If yes, start with
        </HandText>
        {ROWS.map((r, i) => {
          const y = Y0 + i * STEP;
          return (
            <g key={r.a}>
              <SketchBox cx={QX} cy={y} w={340} h={58} r={10} seed={seedOf(`q${i}`)} fill="var(--surface)" fillStyle="solid" />
              <HandText x={QX} y={y} size={14}>
                {r.q}
              </HandText>
              <Badge cx={QX - 170} cy={y - 18} n={i + 1} seed={seedOf(`dq${i}`)} />
              <SketchArrow points={[[QX + 174, y], [AX - 130, y]]} stroke="var(--ok)" seed={seedOf(`y${i}`)} />
              <HandText x={QX + 192} y={y - 14} size={14} color="var(--ok)" weight={700}>
                yes
              </HandText>
              <SketchBox cx={AX} cy={y} w={250} h={58} r={10} seed={seedOf(`a${i}`)} stroke="var(--ok)" />
              <HandText x={AX} y={y - 10} size={16} weight={700}>
                {r.a}
              </HandText>
              <HandText x={AX} y={y + 13} size={14} color="var(--muted)">
                {r.sub}
              </HandText>
              {i < ROWS.length - 1 && (
                <>
                  <SketchArrow points={[[QX, y + 31], [QX, y + STEP - 31]]} stroke="var(--bad)" seed={seedOf(`n${i}`)} />
                  <HandText x={QX + 22} y={y + STEP / 2} size={14} color="var(--bad)" weight={700}>
                    no
                  </HandText>
                </>
              )}
            </g>
          );
        })}
        <HandText x={350} y={Y0 + STEP * 5 - 10} size={14} color="var(--muted)">
          Then check the number that could break the choice: write rate, data size, hot keys.
        </HandText>
      </SketchSvg>
      </div>
    </figure>
  );
}
