import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { pdf, thresholdStats } from './Ai9GuardLogic';

const REQUESTS = 5_000_000;
const BINS = 48;
const LO = -3;
const HI = 8;

function Slider({ id, label, value, min, max, step, show, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{show}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export default function Ai9GuardThresh() {
  const [sep, setSep] = useState(3);
  const [t, setT] = useState(2);
  const [share, setShare] = useState(0.5);
  const s = thresholdStats(sep, t, share / 100, REQUESTS);
  const bw = (HI - LO) / BINS;
  const bins = Array.from({ length: BINS }, (_, i) => {
    const x = LO + (i + 0.5) * bw;
    return { x, a: pdf(x, 0), b: pdf(x, sep) };
  });
  const top = pdf(0, 0);
  return (
    <CacheWidgetFrame title="Where to put the block threshold" hint="Illustrative: two score curves with equal spread.">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Slider id="a9g-s" label="Group separation" value={sep} min={1} max={5} step={0.5} show={`${sep.toFixed(1)}`} onChange={setSep} />
        <Slider id="a9g-t" label="Block when score is at least" value={t} min={-1} max={6} step={0.25} show={t.toFixed(2)} onChange={setT} />
        <Slider id="a9g-h" label="Harmful share of requests" value={share} min={0.1} max={5} step={0.1} show={`${share.toFixed(1)}%`} onChange={setShare} />
      </div>
      <div className="rounded-lg border border-line bg-surface p-3">
        <p className="mb-2 text-xs text-muted">Each bar is a score range. Green: harmless requests. Red: harmful requests. Bars at or right of the line are blocked. Curves are drawn at the same height, so the real counts are far apart.</p>
        <div className="relative flex h-28 items-end gap-px" role="img" aria-label="Score distributions for harmless and harmful requests">
          {bins.map((b, i) => (
            <div key={i} className="relative flex h-full min-w-0 flex-1 items-end" style={{ opacity: b.x >= t ? 1 : 0.45 }}>
              <div className="absolute bottom-0 w-full" style={{ height: `${(b.a / top) * 100}%`, background: 'var(--ok)', opacity: 0.8 }} />
              <div className="absolute bottom-0 w-full" style={{ height: `${(b.b / top) * 100}%`, background: 'var(--bad)', opacity: 0.55 }} />
            </div>
          ))}
          <div className="pointer-events-none absolute top-0 h-full w-0.5 bg-[var(--accent)]" style={{ left: `${((t - LO) / (HI - LO)) * 100}%` }} />
        </div>
      </div>
      <div className="mt-3 space-y-1 text-sm" aria-live="polite">
        <p className="font-mono text-[13px]">
          {fmt(REQUESTS)} requests: {fmt(s.harmful)} harmful, {fmt(s.harmless)} harmless
        </p>
        <p>Harmful requests caught: <strong className="tabular-nums">{fmt(s.caught)}</strong> ({(s.tpr * 100).toFixed(1)}%). Missed: {fmt(s.harmful - s.caught)}.</p>
        <p>Harmless requests blocked by mistake: <strong className="tabular-nums" style={{ color: 'var(--bad)' }}>{fmt(s.falseBlocks)}</strong> ({(s.fpr * 100).toFixed(2)}% of harmless).</p>
        <p>Share of all blocks that were mistakes: <strong className="tabular-nums">{(s.wrongShare * 100).toFixed(0)}%</strong>.</p>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: harmless scores follow a bell curve centered at 0. Harmful scores follow the same curve centered at the separation value. A higher block line misses more harm and blocks fewer harmless requests. Rare harm makes the mistakes dominate, even for a good guard.
      </p>
    </CacheWidgetFrame>
  );
}
