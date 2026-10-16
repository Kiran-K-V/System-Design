import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { A, WINDOW, recommend, strategyCost, type Kind, type Strategy } from './Ai4LongMath';

const DOCS = [20_000, 150_000, 500_000, 2_000_000];
const NQ = [1, 5, 20];
const NAMES: Record<Strategy, string> = { stuff: 'Stuff it all in', mapreduce: 'Map-reduce', route: 'Chunk and route', retrieve: 'Retrieval (module A5)' };
const KINDS: { id: Kind; label: string }[] = [
  { id: 'lookup', label: 'One fact' },
  { id: 'multi', label: 'A few passages' },
  { id: 'whole', label: 'Whole document' },
];
const usd = (n: number) => (n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`);

export default function Ai4LongPicker() {
  const [doc, setDoc] = useState(150_000);
  const [n, setN] = useState(20);
  const [kind, setKind] = useState<Kind>('lookup');
  const rec = recommend(kind, doc, n);
  const list = (Object.keys(NAMES) as Strategy[]).map((s) => ({ s, ...strategyCost(s, doc, n) }));

  return (
    <CacheWidgetFrame title="Strategy picker" hint="Sonnet 5.5 prices, 2026-10-16">
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <Seg label="Document size" value={doc} options={DOCS.map((d) => ({ id: d, label: `${d >= 1e6 ? d / 1e6 + 'M' : d / 1e3 + 'K'} tok` }))} onChange={setDoc} />
        <Seg label="Questions" value={n} options={NQ.map((q) => ({ id: q, label: `${q} question${q > 1 ? 's' : ''}` }))} onChange={setN} />
        <Seg label="Question type" value={kind} options={KINDS} onChange={setKind} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm" data-testid="picker-table">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-1.5 pr-2 font-normal">Strategy</th>
              <th className="py-1.5 pr-2 font-normal">Total for {n}</th>
              <th className="py-1.5 pr-2 font-normal">Per question</th>
              <th className="py-1.5 pr-2 font-normal">Rounds</th>
              <th className="py-1.5 font-normal">Decode time</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.s} data-testid={`row-${r.s}`} data-rec={r.s === rec.s ? '1' : '0'} className={`border-b border-line ${r.s === rec.s ? 'bg-ok/10' : ''} ${r.feasible ? '' : 'text-muted line-through'}`}>
                <td className="py-1.5 pr-2">{NAMES[r.s]}{r.s === rec.s ? ' (pick)' : ''}</td>
                <td className="py-1.5 pr-2 tabular-nums" data-testid={`tot-${r.s}`}>{r.feasible ? usd(r.total) : 'does not fit'}</td>
                <td className="py-1.5 pr-2 tabular-nums">{r.feasible ? usd(r.total / n) : '-'}</td>
                <td className="py-1.5 pr-2 tabular-nums">{r.rounds}</td>
                <td className="py-1.5 tabular-nums">{r.decodeS} s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm" data-testid="picker-why"><span className="font-medium text-ok">{NAMES[rec.s]}.</span> {rec.why}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Assumptions (ours): {A.chunk.toLocaleString('en-US')}-token chunks, a {A.q}-token question, a {A.ans}-token answer, {A.mapOut}-token chunk summaries, routing reads {A.routeRead} chunks, retrieval reads {A.ragTop} chunks of {A.ragChunk} tokens. Stuffing uses the prompt cache when it is cheaper and when all questions arrive within 5 minutes; it needs the text to fit in the {(WINDOW / 1e6).toFixed(0)}M window. Retrieval excludes embedding and index cost. Decode time is {A.tpotMs} ms per output token (assumed), with parallel calls counted once; prefill time is not modeled. The pick is a rule of thumb, not a measured result. Cost says nothing about answer quality.
      </p>
    </CacheWidgetFrame>
  );
}
