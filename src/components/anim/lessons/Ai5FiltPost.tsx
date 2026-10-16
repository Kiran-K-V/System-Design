import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

const COLS = 20;
const CELL = 30;
const X0 = 60;
const pass = (i: number) => i % 10 === 3; // illustrative: 10% of candidates match

interface S {
  caption: string;
  count: number;
  filtered: boolean;
  more: boolean;
  label: string;
}

const steps: S[] = [
  { count: 40, filtered: false, more: false, label: 'index scan: ef_search = 40 candidates', caption: 'The HNSW scan finds its 40 nearest candidates (ef_search 40, the pgvector default). The query is "10 nearest products where tenant = A", but the index knows nothing about tenants yet.' },
  { count: 40, filtered: true, more: false, label: 'after the filter: 4 rows left', caption: 'Now the filter runs on those 40. Tenant A owns 10% of rows, so about 40 x 0.10 = 4 candidates pass. The pgvector README says exactly this: "only 4 rows will match on average". The other 36 are thrown away.' },
  { count: 40, filtered: true, more: false, label: 'LIMIT 10 asked, 4 returned', caption: 'You asked for 10 and got 4. No error is raised. The page shows a short result, and the model downstream gets less context than you planned. Which cells pass here is illustrative.' },
  { count: 200, filtered: true, more: true, label: 'iterative scan: keep scanning', caption: 'Fix 1: iterative index scans (pgvector 0.8.0 and later). When too few rows pass, the scan continues from where it stopped. At 10% it needs about 10 / 0.10 = 100 candidates to find 10. It stops at hnsw.max_scan_tuples, 20,000 by default. Shown: 200 cells, the first 100 shaded.' },
];

export default function Ai5FiltPost() {
  return (
    <AnimFrame title="Post-filter truncation and the iterative-scan fix" steps={steps} interval={6500}>
      {(_, s) => {
        const rows = Math.ceil(s.count / COLS);
        const h = 70 + rows * CELL + 70;
        let kept = 0;
        return (
          <SketchSvg width={720} height={Math.max(300, h)} label="Candidates from the index and which survive the filter">
            <HandText x={X0} y={26} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">{s.label}</HandText>
            {Array.from({ length: s.count }, (_, i) => {
              const ok = pass(i);
              if (s.filtered && ok) kept += 1;
              const col = i % COLS;
              const row = Math.floor(i / COLS);
              const live = s.filtered ? ok : true;
              const beyond = s.more && i >= 100;
              const tone = s.filtered ? (ok ? 'var(--ok)' : 'var(--muted)') : 'var(--accent)';
              return (
                <SketchBox key={i} cx={X0 + col * CELL + CELL / 2} cy={60 + row * CELL + CELL / 2} w={CELL - 6} h={CELL - 6} r={6} seed={seedOf(`pf-${i}`)} stroke={tone} fill={live && !beyond ? tone : undefined} dashed={!live || beyond} />
              );
            })}
            <HandText x={X0} y={60 + rows * CELL + 30} anchor="start" size={TEXT_SIZES.label} mono color="var(--ok)">
              {s.filtered ? (s.more ? 'about 10 pass in the first 100 scanned' : `${kept} of 40 pass`) : 'each cell is one candidate row'}
            </HandText>
            <HandText x={X0} y={60 + rows * CELL + 58} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              {s.filtered ? 'green: matches the tenant filter. grey, dashed: dropped.' : 'blue: candidate from the index'}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
