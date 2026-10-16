import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { RISKY_SHARE, TIER2_SHARE, model, type Policy } from './Ai7HitlLogic';

function Slider({ id, label, value, min, max, step, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

function Bar({ label, value, max, color, show }: { label: string; value: number; max: number; color: string; show: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{show}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded bg-bg">
        <div className="h-full" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Ai7HitlSim() {
  const [actions, setActions] = useState(120);
  const [capacity, setCapacity] = useState(30);
  const [policy, setPolicy] = useState<Policy>('all');
  const o = model(actions, capacity, policy);
  const both = [model(actions, capacity, 'all'), model(actions, capacity, 'tier2')];
  const tone = o.reviewed >= 0.95 ? 'var(--ok)' : o.reviewed >= 0.5 ? 'var(--warn)' : 'var(--bad)';

  return (
    <CacheWidgetFrame title="Approval fatigue model" hint="Illustrative model. Every input is an assumption.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="Gate policy" value={policy} options={[{ id: 'all', label: 'Ask on every action' }, { id: 'tier2', label: 'Ask only on tier 2' }]} onChange={setPolicy} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Slider id="a7h-a" label="Agent actions per hour" value={actions} min={10} max={300} step={10} onChange={setActions} />
        <Slider id="a7h-c" label="Prompts one person can really review per hour" value={capacity} min={5} max={60} step={5} onChange={setCapacity} />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <Bar label="Prompts per hour" value={o.prompts} max={300} color="var(--accent)" show={o.prompts.toFixed(0)} />
        <Bar label="Share of prompts really reviewed" value={o.reviewed} max={1} color={tone} show={`${(o.reviewed * 100).toFixed(0)}%`} />
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Risky actions per hour</div>
            <div className="text-lg font-semibold tabular-nums">{o.risky.toFixed(1)}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Caught</div>
            <div className="text-lg font-semibold tabular-nums text-ok">{o.caught.toFixed(1)}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Missed (approved unseen)</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: o.missed > 0.05 ? 'var(--bad)' : 'var(--ok)' }}>{o.missed.toFixed(1)}</div>
          </div>
        </div>
        <p className="text-muted">
          Compare at these inputs: ask on everything catches {both[0].caught.toFixed(1)} of {both[0].risky.toFixed(1)} risky actions per hour. Ask on tier 2 only catches {both[1].caught.toFixed(1)}.
        </p>
        <p className="text-muted">
          Model: {RISKY_SHARE * 100}% of actions are risky. {TIER2_SHARE * 100}% are tier 2 and include every risky one. A person reviews a prompt carefully only while prompts per hour stay within their capacity. Over capacity, a share of prompts equal to 1 - capacity / prompts is approved without a look. A careful review catches a risky action every time. Real reviewers do not behave this neatly. Anthropic reports that users approve 97% of Claude Code permission prompts.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
