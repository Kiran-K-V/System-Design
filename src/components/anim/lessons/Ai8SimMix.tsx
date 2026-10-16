import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { PERSONAS, RATE, normalize, overall, type Mix, type Persona } from './Ai8SimMath';

const PRESETS: Record<string, { label: string; mix: Mix }> = {
  sim: { label: 'Simulator default (mostly cooperative)', mix: { cooperative: 80, vague: 15, hostile: 5 } },
  real: { label: 'Real traffic (illustrative)', mix: { cooperative: 50, vague: 30, hostile: 20 } },
};

const NAME: Record<Persona, string> = { cooperative: 'Cooperative', vague: 'Vague', hostile: 'Hostile' };

/** One agent, three personas, two traffic mixes. Shows how a too-nice simulator inflates the headline number. */
export default function Ai8SimMix() {
  const [preset, setPreset] = useState<string>('sim');
  const [mix, setMix] = useState<Mix>(PRESETS.sim.mix);
  const share = normalize(mix);
  const val = overall(mix);
  const real = overall(PRESETS.real.mix);
  const simv = overall(PRESETS.sim.mix);

  const pick = (p: string) => {
    setPreset(p);
    if (PRESETS[p]) setMix(PRESETS[p].mix);
  };

  return (
    <CacheWidgetFrame title="Same agent, different user mix" hint="Illustrative pass rates. Not measured.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="Traffic mix" value={preset} onChange={pick} options={[...Object.entries(PRESETS).map(([id, p]) => ({ id, label: p.label })), { id: 'custom', label: 'Custom' }]} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {PERSONAS.map((p) => (
          <div key={p}>
            <label htmlFor={`a86-${p}`} className="mb-1 flex justify-between text-xs text-muted">
              <span>{NAME[p]} users in the test mix</span>
              <span className="tabular-nums text-fg">{Math.round(share[p] * 100)}%</span>
            </label>
            <input id={`a86-${p}`} type="range" min={0} max={100} step={5} value={mix[p]} onChange={(e) => { setPreset('custom'); setMix({ ...mix, [p]: +e.target.value }); }} className="w-full accent-[var(--accent)]" />
          </div>
        ))}
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="mb-2 text-xs text-muted">Pass rate of the agent for each persona (fixed, illustrative)</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {PERSONAS.map((p) => (
              <div key={p} className="rounded-md bg-bg p-2">
                <p className="text-xs text-muted">{NAME[p]}</p>
                <p className="font-mono text-lg tabular-nums">{Math.round(RATE[p] * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--accent)' }}>
          <p className="text-xs text-muted">Headline pass rate with this mix</p>
          <p className="font-mono text-2xl tabular-nums" style={{ color: 'var(--accent)' }}>{(val * 100).toFixed(1)}%</p>
          <p className="mt-1 text-muted">
            Simulator default: {(simv * 100).toFixed(1)}%. Real traffic mix: {(real * 100).toFixed(1)}%. The nice simulator reports {((simv - real) * 100).toFixed(1)} points too high, and the agent did not change.
          </p>
        </div>
        <p className="text-muted">
          Model: headline = sum over personas of (share of that persona x pass rate of that persona). The pass rates 90%, 70%, and 45% are made up to show the effect. The size of the real gap depends on your agent and your users.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
