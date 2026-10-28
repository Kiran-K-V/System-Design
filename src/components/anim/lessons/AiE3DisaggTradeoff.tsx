import { useState } from 'react';
import { DECODE_STEP_MS, KV_BYTES_PER_TOKEN, LINKS, PREFILL_MS_PER_TOKEN, chunked, kvBytes, split, whole, type Outcome } from './AiE3DisaggLogic';

const PROMPTS = [1000, 2000, 4000, 8000, 16000, 32000];
const CHUNKS = [128, 256, 512, 1024, 2048];

function Slider({ id, label, value, min, max, onChange, shown }: { id: string; label: string; value: number; min: number; max: number; onChange: (v: number) => void; shown: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{shown}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

function Bar({ frac, ok, text }: { frac: number; ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3.5 flex-1 rounded bg-line/40">
        <span className="block h-3.5 rounded" style={{ width: `${Math.max(2, Math.min(1, frac) * 100)}%`, background: ok ? 'var(--ok)' : 'var(--bad)' }} />
      </span>
      <span className={`w-20 text-right tabular-nums ${ok ? '' : 'text-bad'}`}>{text}</span>
    </div>
  );
}

function fmt(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(0)} ms`;
}

export default function AiE3DisaggTradeoff() {
  const [pi, setPi] = useState(3);
  const [ci, setCi] = useState(2);
  const [li, setLi] = useState(0);
  const [overlap, setOverlap] = useState(false);
  const [tpot, setTpot] = useState(60);
  const [ttft, setTtft] = useState(1000);

  const P = PROMPTS[pi];
  const link = LINKS[li];
  const rows: { name: string; o: Outcome; note: string }[] = [
    { name: 'One GPU, whole prefill', o: whole(P), note: '' },
    { name: `One GPU, chunks of ${CHUNKS[ci]}`, o: chunked(P, CHUNKS[ci]), note: '' },
    { name: 'Split pools', o: split(P, link.gbPerS, overlap), note: `KV wait ${fmt(split(P, link.gbPerS, overlap).transferMs)}` },
  ];
  const maxGap = Math.max(...rows.map((r) => r.o.gapMs), tpot);
  const maxTtft = Math.max(...rows.map((r) => r.o.ttftMs), ttft);
  const gib = kvBytes(P) / 2 ** 30;

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="disagg-sim">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">One long prompt arrives. Who pays?</span>
        <span className="text-xs text-muted">Illustrative model, 70B-class. Not a benchmark.</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider id="dg-p" label="Prompt length (tokens)" value={pi} min={0} max={PROMPTS.length - 1} onChange={setPi} shown={P.toLocaleString('en-US')} />
        <Slider id="dg-c" label="Chunk size (tokens per step)" value={ci} min={0} max={CHUNKS.length - 1} onChange={setCi} shown={String(CHUNKS[ci])} />
        <Slider id="dg-l" label="Link between pools" value={li} min={0} max={LINKS.length - 1} onChange={setLi} shown={link.label} />
        <label className="flex items-end gap-2 text-xs text-muted">
          <input type="checkbox" checked={overlap} onChange={(e) => setOverlap(e.target.checked)} className="accent-[var(--accent)]" />
          Send KV layer by layer while prefill runs (overlap)
        </label>
        <Slider id="dg-sa" label="Gap target between tokens (SLO)" value={tpot} min={30} max={200} onChange={setTpot} shown={`${tpot} ms`} />
        <Slider id="dg-sb" label="Time to first token target (SLO)" value={ttft} min={200} max={3000} onChange={setTtft} shown={`${ttft} ms`} />
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.name} className="rounded-lg border border-line bg-surface p-2.5">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-semibold">{r.name}</span>
              <span className="text-muted">{r.note}</span>
            </div>
            <div className="grid grid-cols-[7rem_1fr] items-center gap-x-2 gap-y-1 text-xs">
              <span className="text-muted">Worst gap, readers</span>
              <Bar frac={r.o.gapMs / maxGap} ok={r.o.gapMs <= tpot} text={fmt(r.o.gapMs)} />
              <span className="text-muted">First token, new user</span>
              <Bar frac={r.o.ttftMs / maxTtft} ok={r.o.ttftMs <= ttft} text={fmt(r.o.ttftMs)} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        Model. A decode step takes {DECODE_STEP_MS} ms. Prefill costs {PREFILL_MS_PER_TOKEN} ms per token. A mixed step costs the decode step plus its prefill piece. KV is {KV_BYTES_PER_TOKEN / 1024} KiB per token (Llama 3 70B, lesson A2.3), so this prompt holds {gib.toFixed(2)} GiB to move. Link speeds are examples from papers and the H100 page. Green bars meet your target, red bars miss it. Other users, queueing, and the decode pool size are left out.
      </p>
    </div>
  );
}
