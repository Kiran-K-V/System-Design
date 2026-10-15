import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { TOKENS, draw, mulberry32, shape } from './Ai1SampMath';

const XS = TOKENS.map((t) => t.x);

const PRESETS = [
  { id: 'greedy', label: 'Greedy (T = 0)', t: 0, k: 10, p: 1 },
  { id: 'plain', label: 'Plain sampling (T = 1)', t: 1, k: 10, p: 1 },
  { id: 'balanced', label: 'T = 1.5, top-p 0.9', t: 1.5, k: 10, p: 0.9 },
  { id: 'hot', label: 'T = 2, no cut', t: 2, k: 10, p: 1 },
];

function Slider({ id, label, value, min, max, step, shown, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; shown: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{shown}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const pct = (v: number) => (v * 100).toFixed(1) + '%';

export default function Ai1SampBars() {
  const [t, setT] = useState(1);
  const [k, setK] = useState(10);
  const [p, setP] = useState(1);
  const [counts, setCounts] = useState<number[] | null>(null);

  const d = shape(XS, t, k, p);
  const keptN = d.kept.filter(Boolean).length;
  const change = (f: () => void) => {
    f();
    setCounts(null);
  };

  const run = () => {
    const rnd = mulberry32(2026);
    const c = XS.map(() => 0);
    for (let i = 0; i < 1000; i++) c[draw(d.final, rnd())]++;
    setCounts(c);
  };

  return (
    <CacheWidgetFrame title="Sampling lab" hint="Illustrative scores for the next token after “The capital of France is”">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg
          label="Presets"
          value={PRESETS.find((x) => x.t === t && x.k === k && x.p === p)?.id ?? ''}
          options={PRESETS.map((x) => ({ id: x.id, label: x.label }))}
          onChange={(id) => {
            const x = PRESETS.find((q) => q.id === id)!;
            change(() => {
              setT(x.t);
              setK(x.k);
              setP(x.p);
            });
          }}
        />
      </div>
      <div className="grid gap-4 text-sm md:grid-cols-[15rem_1fr]">
        <div className="space-y-3">
          <Slider id="ai1-t" label="Temperature T" value={t} min={0} max={2} step={0.05} shown={t === 0 ? '0 (greedy)' : t.toFixed(2)} onChange={(v) => change(() => setT(v))} />
          <Slider id="ai1-k" label="Top-k" value={k} min={1} max={10} step={1} shown={k >= 10 ? 'off' : String(k)} onChange={(v) => change(() => setK(v))} />
          <Slider id="ai1-p" label="Top-p" value={p} min={0.05} max={1} step={0.05} shown={p >= 1 ? 'off' : p.toFixed(2)} onChange={(v) => change(() => setP(v))} />
          <p className="text-xs leading-relaxed text-muted">
            Order: temperature, then top-k, then top-p. After each cut the kept probabilities are scaled to sum to 1.
          </p>
          <button type="button" onClick={run} className="rounded-md border border-line px-2.5 py-1.5 text-xs hover:bg-surface">
            Draw 1,000 samples
          </button>
        </div>

        <div>
          <div className="space-y-1.5" role="img" aria-label="Next-token probabilities after the temperature, top-k and top-p settings">
            {TOKENS.map((tok, i) => {
              const kept = d.kept[i];
              return (
                <div key={tok.t} className="grid grid-cols-[6.5rem_1fr_9.5rem] items-center gap-2 text-xs">
                  <span className="truncate font-mono" style={{ color: kept ? 'var(--fg)' : 'var(--muted)' }}>
                    {tok.t.trim()}
                  </span>
                  <div className="relative h-5 rounded-sm" style={{ background: 'color-mix(in srgb, var(--muted) 12%, var(--bg))' }}>
                    <div className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${d.base[i] * 100}%`, background: 'color-mix(in srgb, var(--muted) 45%, var(--bg))' }} />
                    <div className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${d.final[i] * 100}%`, background: 'var(--accent)', opacity: 0.85 }} />
                  </div>
                  <span className="tabular-nums text-muted">
                    {kept ? <span className="text-fg">{pct(d.final[i])}</span> : <span>cut</span>}
                    {kept && Math.abs(d.final[i] - d.base[i]) > 0.0005 ? ` (was ${pct(d.base[i])})` : ''}
                    {counts && <span className="text-accent">{` · ${counts[i]}`}</span>}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <span style={{ color: 'var(--accent)' }}>Blue</span>: probability the sampler uses. Grey: probability after temperature, before the cuts. Kept tokens: <span className="text-fg">{keptN}</span>. Mass kept
            before rescaling: <span className="text-fg">{pct(d.keptMass)}</span>.
            {counts && ' The blue count after each dot is how many of 1,000 seeded draws chose that token.'}
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
