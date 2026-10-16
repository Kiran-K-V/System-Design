import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { judgeStats } from './Ai8JudgeMath';

type Preset = 'always' | 'decent' | 'sharp' | 'custom';

const PRESETS: Record<Exclude<Preset, 'custom'>, { recall: number; spec: number; label: string }> = {
  always: { recall: 0, spec: 1, label: 'Always says pass' },
  decent: { recall: 0.8, spec: 0.95, label: 'Decent judge' },
  sharp: { recall: 0.9, spec: 0.99, label: 'Sharp judge' },
};

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

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function Metric({ name, value, tone, note }: { name: string; value: string; tone?: string; note: string }) {
  return (
    <div className="rounded-lg border border-line p-2.5" style={tone ? { borderColor: tone } : undefined}>
      <p className="text-xs text-muted">{name}</p>
      <p className="mt-0.5 font-mono text-lg tabular-nums" style={tone ? { color: tone } : undefined}>{value}</p>
      <p className="mt-0.5 text-xs text-muted">{note}</p>
    </div>
  );
}

/** Raw agreement versus recall, precision, and kappa for a judge scored against human labels. */
export default function Ai8JudgeAgree() {
  const [bad, setBad] = useState(5);
  const [recall, setRecall] = useState(0);
  const [spec, setSpec] = useState(100);
  const [preset, setPreset] = useState<Preset>('always');
  const n = 1000;
  const st = judgeStats(n, bad / 100, recall / 100, spec / 100);

  const pick = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      setRecall(PRESETS[p].recall * 100);
      setSpec(PRESETS[p].spec * 100);
    }
  };

  const agreeTone = 'var(--ok)';
  const recallTone = st.recall < 0.5 ? 'var(--bad)' : st.recall < 0.8 ? 'var(--warn)' : 'var(--ok)';
  const kappaTone = st.kappa < 0.4 ? 'var(--bad)' : st.kappa < 0.6 ? 'var(--warn)' : 'var(--ok)';
  const precTone = st.tp + st.fp === 0 ? 'var(--muted)' : st.precision < 0.5 ? 'var(--warn)' : 'var(--ok)';

  return (
    <CacheWidgetFrame title="Judge report card: agreement versus recall" hint="1,000 answers labeled by a human. Illustrative judge.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="Judge preset" value={preset} onChange={pick} options={[...(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((id) => ({ id: id as Preset, label: PRESETS[id].label })), { id: 'custom' as Preset, label: 'Custom' }]} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Slider id="a84-b" label="Bad answers (human label)" value={bad} min={1} max={50} step={1} show={`${bad}%`} onChange={setBad} />
        <Slider id="a84-r" label="Judge catches bad answers (recall)" value={recall} min={0} max={100} step={1} show={`${recall}%`} onChange={(v) => { setPreset('custom'); setRecall(v); }} />
        <Slider id="a84-s" label="Judge passes good answers" value={spec} min={50} max={100} step={1} show={`${spec}%`} onChange={(v) => { setPreset('custom'); setSpec(v); }} />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric name="Raw agreement" value={pct(st.agreement)} tone={agreeTone} note="share of answers where judge and human match" />
          <Metric name="Recall on bad" value={pct(st.recall)} tone={recallTone} note="bad answers the judge flags" />
          <Metric name="Precision on bad" value={st.tp + st.fp === 0 ? 'no flags' : pct(st.precision)} tone={precTone} note="flags that are truly bad" />
          <Metric name="Cohen's kappa" value={st.kappa.toFixed(2)} tone={kappaTone} note="agreement beyond chance, 0 to 1" />
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="mb-2 text-xs text-muted">Where the {n.toLocaleString('en-US')} answers land</p>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md text-center font-mono text-[13px]" role="img" aria-label="Confusion matrix">
            <div className="bg-bg p-2"><span className="text-muted">bad, flagged</span><br />{Math.round(st.tp)}</div>
            <div className="bg-bg p-2"><span className="text-muted">bad, passed (missed)</span><br /><span style={{ color: 'var(--bad)' }}>{Math.round(st.fn)}</span></div>
            <div className="bg-bg p-2"><span className="text-muted">good, flagged (false alarm)</span><br /><span style={{ color: 'var(--warn)' }}>{Math.round(st.fp)}</span></div>
            <div className="bg-bg p-2"><span className="text-muted">good, passed</span><br />{Math.round(st.tn)}</div>
          </div>
        </div>
        <p className="text-muted">
          Model: n = 1,000. Bad answers = n x bad share. Recall = share of bad answers flagged. Precision = flagged and bad, over all flagged. Kappa = (observed agreement - chance agreement) / (1 - chance agreement), where chance agreement comes from how often each side says bad. Try the first preset: a judge that never flags anything agrees with the human 95% of the time and catches nothing.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
