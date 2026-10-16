import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type Tone } from '../FlowDiagram';
import { choices, initial, step, type Choice, type State } from './Ai6GraphLogic';

const LABEL: Record<Choice, string> = {
  call: 'Model asks for a tool',
  answer: 'Model answers in text',
  ok: 'Tool works',
  error: 'Tool returns an error',
};

const LIMIT = 12;

function Slider({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const statusText: Record<State['status'], { t: string; c: string }> = {
  running: { t: 'Running', c: 'var(--accent)' },
  done: { t: 'Finished: the model answered', c: 'var(--ok)' },
  budget: { t: 'Stopped by the guard on steps', c: 'var(--warn)' },
  recursion: { t: 'GraphRecursionError: last-resort limit', c: 'var(--bad)' },
};

/** Run a two-node agent graph by hand. You pick what each node produces. The routing function is real. */
export default function Ai6GraphRun() {
  const [max, setMax] = useState(3);
  const [guard, setGuard] = useState('on');
  const [s, setS] = useState<State>(initial());
  const cfg = { max, guard: guard === 'on', limit: LIMIT };
  const reset = () => setS(initial());
  const act = (c: Choice) => setS((p) => step(p, c, cfg));

  const tone = (id: string): Tone => (s.at === id ? 'accent' : 'default');
  const endTone: Tone = s.status === 'done' ? 'ok' : s.status === 'budget' ? 'warn' : s.status === 'recursion' ? 'bad' : 'default';
  const nodes: FlowNode[] = [
    { id: 'start', x: 60, y: 110, w: 80, h: 44, label: 'START' },
    { id: 'agent', x: 230, y: 110, w: 120, h: 60, label: 'agent', tone: tone('agent') },
    { id: 'tools', x: 460, y: 110, w: 120, h: 60, label: 'tools', tone: tone('tools') },
    { id: 'end', x: 650, y: 110, w: 80, h: 44, label: 'END', tone: endTone },
  ];
  const edges: FlowEdge[] = [
    { from: 'start', to: 'agent' },
    { from: 'agent', to: 'tools', label: 'tool calls?', labelAt: [0, -20] },
    { from: 'tools', to: 'agent', bend: 55, label: 'back', labelAt: [0, 14] },
    { from: 'agent', to: 'end', bend: 85, dashed: true, tone: 'ok', label: 'exit', labelAt: [0, -12] },
  ];
  const opts = choices(s);
  const st = statusText[s.status];

  return (
    <CacheWidgetFrame title="Run the graph by hand" hint="You choose what each node produces. The router reads the state.">
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <Slider id="a6g-max" label="Step budget in the router (max)" value={max} min={2} max={6} onChange={(v) => { setMax(v); reset(); }} />
        <div className="space-y-1">
          <p className="text-xs text-muted">Exit guard on steps</p>
          <Seg label="Guard" value={guard} options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]} onChange={(v) => { setGuard(v); reset(); }} />
        </div>
      </div>
      <FlowDiagram width={720} height={200} nodes={nodes} edges={edges} active={s.status === 'running' ? [s.at] : []} label={`Agent graph. Current node: ${s.at}`} />
      <div className="mt-2 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-muted">State after {s.supersteps} node runs</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[13px]">
            <dt className="text-muted">messages</dt><dd className="tabular-nums">{s.messages}</dd>
            <dt className="text-muted">steps</dt><dd className="tabular-nums">{s.steps}{guard === 'on' ? ` (max ${max})` : ' (no guard)'}</dd>
            <dt className="text-muted">errors</dt><dd className="tabular-nums">{s.errors}</dd>
            <dt className="text-muted">tool calls pending</dt><dd>{String(s.pending)}</dd>
          </dl>
          <p className="mt-3 font-medium" style={{ color: st.c }} aria-live="polite">{st.t}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-muted">{s.status === 'running' ? `Node "${s.at}" runs. Pick its result:` : 'Run ended'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {opts.map((c) => (
              <button key={c} type="button" onClick={() => act(c)} className="rounded-md border border-line bg-bg px-2.5 py-1.5 text-xs hover:bg-accent-soft">
                {LABEL[c]}
              </button>
            ))}
            <button type="button" onClick={reset} className="rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:bg-bg">Reset</button>
          </div>
          <p className="mt-2 text-xs text-muted">Last-resort limit in this demo: {LIMIT} node runs (like recursion_limit; the LangGraph default is 1000).</p>
        </div>
      </div>
      <ol className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-line bg-bg p-3 font-mono text-[12.5px] leading-relaxed">
        {s.log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ol>
    </CacheWidgetFrame>
  );
}
