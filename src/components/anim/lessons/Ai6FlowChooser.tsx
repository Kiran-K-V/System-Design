import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { NAMES, choose, profile, type Pattern, type Steps } from './Ai6FlowLogic';

const YN = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
];

const ORDER: Pattern[] = ['single', 'chain', 'routing', 'parallel', 'orchestrator', 'evaluator', 'agent'];

function Slider({ id, label, value, min, max, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value}{unit}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

/** Task traits in, pattern out. Then calls and latency for each pattern under stated assumptions. */
export default function Ai6FlowChooser() {
  const [one, setOne] = useState('no');
  const [steps, setSteps] = useState<Steps>('fixed');
  const [cats, setCats] = useState('no');
  const [indep, setIndep] = useState('no');
  const [fb, setFb] = useState('no');
  const [n, setN] = useState(3);
  const [L, setL] = useState(3);
  const [r, setR] = useState(2);

  const pick = choose({ oneCallEnough: one === 'yes', steps, categories: cats === 'yes', independent: indep === 'yes', feedback: fb === 'yes' });
  const q = (label: string, ctl: React.ReactNode) => (
    <div className="space-y-1">
      <p className="text-xs text-muted">{label}</p>
      {ctl}
    </div>
  );

  return (
    <CacheWidgetFrame title="Pattern chooser" hint="Rules from Anthropic's when-to-use text">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          {q('Does one well-prompted call already meet your quality bar?', <Seg label="One call enough" value={one} options={YN} onChange={setOne} />)}
          {q('Can you list the steps before the run?', <Seg label="Steps known" value={steps} options={[{ id: 'fixed' as Steps, label: 'Fixed steps' }, { id: 'listable' as Steps, label: 'A planner can list them' }, { id: 'unknown' as Steps, label: 'No, depends on results' }]} onChange={setSteps} />)}
          {q('Do inputs fall into distinct categories?', <Seg label="Categories" value={cats} options={YN} onChange={setCats} />)}
          {q('Are the subtasks independent of each other?', <Seg label="Independent" value={indep} options={YN} onChange={setIndep} />)}
          {q('Does feedback improve the draft, and can a model give it?', <Seg label="Feedback helps" value={fb} options={YN} onChange={setFb} />)}
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--accent)' }} aria-live="polite">
          <p className="text-xs uppercase tracking-wide text-muted">Pattern to try first</p>
          <p className="mt-1 text-lg font-semibold">{NAMES[pick.pattern]}</p>
          <p className="mt-2">{pick.why}</p>
          <p className="mt-2 text-xs text-muted">The first matching rule wins. Real designs often combine patterns, for example routing into a chain.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Slider id="a6f-n" label="n: steps, branches, workers or turns" value={n} min={2} max={8} onChange={setN} />
        <Slider id="a6f-l" label="Seconds per model call (L)" value={L} min={1} max={10} unit=" s" onChange={setL} />
        <Slider id="a6f-r" label="Evaluator rounds (r)" value={r} min={1} max={4} onChange={setR} />
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <thead className="bg-surface text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Pattern</th>
              <th className="px-3 py-2 font-medium">Model calls</th>
              <th className="px-3 py-2 font-medium">Latency</th>
              <th className="px-3 py-2 font-medium">Shape</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((p) => {
              const pr = profile(p, n, L, r);
              const on = p === pick.pattern;
              return (
                <tr key={p} className={on ? 'bg-accent-soft' : ''}>
                  <td className="px-3 py-1.5 font-medium">{NAMES[p]}</td>
                  <td className="px-3 py-1.5 tabular-nums">{pr.calls}</td>
                  <td className="px-3 py-1.5 tabular-nums">{pr.latency} s</td>
                  <td className="px-3 py-1.5 text-muted">{pr.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        Assumptions: every call takes L seconds, parallel calls run fully in parallel, and code time is zero. Calls are a cost proxy for equal-sized calls. In an agent, each turn also resends the growing history, so real cost grows faster than the call count.
      </p>
    </CacheWidgetFrame>
  );
}
