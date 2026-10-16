import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { TOOL_MODELS, toolCost } from './Ai6ToolMath';

const usd = (v: number) => (v >= 1 ? `$${v.toFixed(2)}` : v >= 0.01 ? `$${v.toFixed(3)}` : `$${v.toFixed(4)}`);
const num = (v: number) => v.toLocaleString('en-US');

function Slider({ id, label, value, min, max, step, onChange, suffix = '' }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{num(value)}{suffix}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

export default function Ai6ToolCost() {
  const [n, setN] = useState(30);
  const [t, setT] = useState(300);
  const [calls, setCalls] = useState(8);
  const [perDay, setPerDay] = useState(1000);
  const [mid, setMid] = useState<'sonnet55' | 'opus55' | 'haiku55'>('sonnet55');
  const [cached, setCached] = useState(false);
  const m = TOOL_MODELS.find((x) => x.id === mid)!;
  const c = toolCost(n, t, calls, m);
  const task = cached ? c.taskCached : c.taskUncached;
  return (
    <CacheWidgetFrame title="Tool definition cost calculator" hint="Token sizes and volumes are assumptions. Prices as of 2026-10-16.">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Slider id="a65-n" label="Tools sent with each request" value={n} min={1} max={100} step={1} onChange={setN} />
          <Slider id="a65-t" label="Tokens per tool definition (assumed)" value={t} min={50} max={1500} step={50} onChange={setT} />
          <Slider id="a65-c" label="Model calls per task" value={calls} min={1} max={40} step={1} onChange={setCalls} />
          <Slider id="a65-d" label="Tasks per day" value={perDay} min={100} max={100000} step={100} onChange={setPerDay} />
          <div className="flex flex-wrap gap-2">
            <Seg label="Model" value={mid} onChange={setMid} options={TOOL_MODELS.map((x) => ({ id: x.id, label: x.name }))} />
            <Seg label="Caching" value={cached ? 'on' : 'off'} onChange={(v) => setCached(v === 'on')} options={[{ id: 'off', label: 'No caching' }, { id: 'on', label: 'Prompt caching' }]} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 self-start" aria-live="polite">
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Definition tokens per call</div>
            <div className="text-lg font-semibold tabular-nums">{num(c.perCall)}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Per task, all calls</div>
            <div className="text-lg font-semibold tabular-nums">{num(c.perTask)}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Dollars per task</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>{usd(task)}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Dollars per day</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>{usd(task * perDay)}</div>
          </div>
          <p className="col-span-2 text-xs text-muted">
            {n} tools x {num(t)} tokens = {num(c.perCall)} tokens, resent on each of {calls} calls = {num(c.perTask)}. Price {m.input} per 1M tokens.
            {cached ? ` With caching: one write at ${m.writeMult}x, then ${calls - 1} reads at ${m.readMult}x.` : ' Input tokens only; output and tool results are not counted.'}
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
