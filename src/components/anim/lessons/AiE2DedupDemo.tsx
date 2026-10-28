import { useState } from 'react';
import { PAIRS, bits, hamming, jaccard, simhash } from './AiE2DedupLogic';

/** Simhash demo on made-up pairs. Each word votes on 32 bits. Near-identical text gives near-identical fingerprints. */
export default function AiE2DedupDemo() {
  const [pid, setPid] = useState('near');
  const [t, setT] = useState(10);
  const pair = PAIRS.find((p) => p.id === pid) ?? PAIRS[0];
  const ha = simhash(pair.a);
  const hb = simhash(pair.b);
  const d = hamming(ha, hb);
  const ba = bits(ha);
  const bb = bits(hb);
  const dup = d <= t;

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="dedup-demo">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">Near-duplicate check with a fingerprint</span>
        <span className="text-xs text-muted">texts are made up (illustrative)</span>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Pick a pair">
        {PAIRS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPid(p.id)}
            aria-pressed={p.id === pid}
            className={`rounded-lg border px-3 py-1.5 text-xs ${p.id === pid ? 'border-accent bg-accent/10 text-fg' : 'border-line text-muted hover:text-fg'}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <p className="rounded-lg border border-line bg-bg p-2.5 text-[13px] leading-relaxed">{pair.a}</p>
        <p className="rounded-lg border border-line bg-bg p-2.5 text-[13px] leading-relaxed">{pair.b}</p>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg bg-surface p-2.5 font-mono text-[12px] leading-5" aria-label="Fingerprints as 32 bits">
        <div className="whitespace-pre">
          {'A  '}
          {ba.split('').map((c, i) => (
            <span key={i} className={c !== bb[i] ? 'text-bad' : 'text-muted'}>{c}</span>
          ))}
        </div>
        <div className="whitespace-pre">
          {'B  '}
          {bb.split('').map((c, i) => (
            <span key={i} className={c !== ba[i] ? 'text-bad' : 'text-muted'}>{c}</span>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Bits that differ (of 32)</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="dd-dist">{d}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Shared distinct words</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="dd-jac">{Math.round(jaccard(pair.a, pair.b) * 100)}%</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Verdict at your threshold</div>
          <div className={`text-lg font-semibold ${dup ? 'text-bad' : 'text-ok'}`} data-testid="dd-verdict">{dup ? 'Drop as duplicate' : 'Keep both'}</div>
        </div>
      </div>
      <label htmlFor="dd-t" className="mt-3 block text-xs text-muted">
        <span className="flex justify-between"><span>Threshold: call it a duplicate if at most this many bits differ</span><span className="tabular-nums text-fg">{t}</span></span>
        <input id="dd-t" type="range" min={0} max={20} step={1} value={t} onChange={(e) => setT(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
      </label>
      <p className="mt-2 text-xs text-muted">
        Unrelated texts differ in about half the bits, so about 16 of 32. Raise the threshold and you catch more rewrites, but you start to drop pages that only look alike. Real systems use longer fingerprints and tune the threshold on labelled pairs.
      </p>
    </div>
  );
}
