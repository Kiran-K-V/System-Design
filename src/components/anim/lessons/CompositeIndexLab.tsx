import { useMemo, useState } from 'react';
import { WidgetFrame } from '../data-kit';
import { plan, makeRows, type Col, type Pred } from './compositeIndex';

const INDEXES: { id: string; cols: Col[]; label: string }[] = [
  { id: 'ca', cols: ['city', 'age'], label: 'index on (city, age)' },
  { id: 'ac', cols: ['age', 'city'], label: 'index on (age, city)' },
  { id: 'c', cols: ['city'], label: 'index on (city)' },
];

const QUERIES: { id: string; sql: string; preds: Pred[] }[] = [
  { id: 'city', sql: "city = 'Oslo'", preds: [{ col: 'city', op: '=', value: 'Oslo' }] },
  { id: 'age', sql: 'age = 30', preds: [{ col: 'age', op: '=', value: 30 }] },
  {
    id: 'both',
    sql: "city = 'Oslo' AND age = 30",
    preds: [
      { col: 'city', op: '=', value: 'Oslo' },
      { col: 'age', op: '=', value: 30 },
    ],
  },
  {
    id: 'eqrange',
    sql: "city = 'Oslo' AND age > 40",
    preds: [
      { col: 'city', op: '=', value: 'Oslo' },
      { col: 'age', op: '>', value: 40 },
    ],
  },
  {
    id: 'rangeeq',
    sql: "city > 'Lima' AND age = 30",
    preds: [
      { col: 'city', op: '>', value: 'Lima' },
      { col: 'age', op: '=', value: 30 },
    ],
  },
];

const W = 600;
const N = 200;
const CELL = W / N;

export default function CompositeIndexLab() {
  const rows = useMemo(() => makeRows(), []);
  const [ix, setIx] = useState('ca');
  const [q, setQ] = useState('age');
  const index = INDEXES.find((i) => i.id === ix)!;
  const query = QUERIES.find((x) => x.id === q)!;
  const p = useMemo(() => plan(index.cols, rows, query.preds), [index, query, rows]);

  const names = index.cols.join(', ');
  let why: string;
  if (p.narrowing.length === 0) {
    why = `The first index column is ${index.cols[0]}, and the query has no condition on it. The entries are sorted by ${index.cols[0]} first, so matching entries are scattered across the whole index. The engine must read every entry (or skip the index and scan the table).`;
  } else if (p.narrowing.length === index.cols.length) {
    why = `Every index column has a condition, and each one narrows the range. The matching entries sit side by side in one block, so the engine reads only that block.`;
  } else {
    const stop = index.cols[p.narrowing.length];
    const last = query.preds.find((x) => x.col === p.narrowing[p.narrowing.length - 1])!;
    why =
      last.op === '>'
        ? `The condition on ${last.col} is a range. Entries inside a range are sorted by ${last.col}, not by ${stop}, so ${stop} cannot shrink the range further. It only filters entries the engine has already read.`
        : `The engine narrows with ${p.narrowing.join(', ')}. The query has no condition on ${stop}, so it stops there and reads every entry that shares the prefix.`;
  }

  const hitSet = new Set(p.hits);
  return (
    <WidgetFrame
      title="Composite index lab: which columns can narrow the scan?"
      caption={
        <>
          <span aria-live="polite">
            <strong>{p.scanned}</strong> of {N} index entries read, <strong>{p.returned}</strong> returned.{' '}
            {p.narrowing.length ? `Narrowing columns: ${p.narrowing.join(' then ')}.` : 'No column narrows the range.'} {why}
          </span>
          <span className="mt-1 block text-xs text-muted">
            Table: {N} rows of (city, age) with 5 cities and ages 18 to 67. Entries in the index are sorted by {names}.
          </span>
        </>
      }
    >
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <fieldset>
          <legend className="mb-1 font-medium">Index</legend>
          {INDEXES.map((i) => (
            <label key={i.id} className="mb-1 flex items-center gap-2">
              <input type="radio" name="ci-index" checked={ix === i.id} onChange={() => setIx(i.id)} />
              <span className="font-mono">{i.label}</span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend className="mb-1 font-medium">Query: WHERE ...</legend>
          {QUERIES.map((x) => (
            <label key={x.id} className="mb-1 flex items-center gap-2">
              <input type="radio" name="ci-query" checked={q === x.id} onChange={() => setQ(x.id)} />
              <span className="font-mono">{x.sql}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <svg viewBox={`0 0 ${W} 74`} className="mt-4 h-auto w-full" role="img" aria-label={`Index of ${N} entries. ${p.scanned} are read and ${p.returned} match.`}>
        {Array.from({ length: N }, (_, i) => {
          const inSlice = i >= p.from && i <= p.to && p.from >= 0;
          const fill = hitSet.has(i) ? 'var(--ok)' : inSlice ? 'var(--accent)' : 'var(--border)';
          return <rect key={i} x={i * CELL} y={hitSet.has(i) ? 6 : 14} width={Math.max(CELL - 0.6, 1)} height={hitSet.has(i) ? 36 : 28} fill={fill} opacity={inSlice || hitSet.has(i) ? 1 : 0.7} />;
        })}
        <text x={0} y={64} fontSize={13} fill="var(--muted)">
          first entry
        </text>
        <text x={W} y={64} fontSize={13} fill="var(--muted)" textAnchor="end">
          last entry
        </text>
        <text x={W / 2} y={64} fontSize={13} fill="var(--muted)" textAnchor="middle">
          blue: read and discarded  |  green: returned  |  grey: never read
        </text>
      </svg>
    </WidgetFrame>
  );
}
