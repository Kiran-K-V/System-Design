import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { simulate, type Outcome } from './Ai3ToolLogic';

const OUTCOMES: { id: Outcome; label: string }[] = [
  { id: 'ok', label: 'Tokyo tool works' },
  { id: 'instructive', label: 'Fails, clear error' },
  { id: 'vague', label: 'Fails, vague error' },
  { id: 'missing', label: 'Fails, no result sent' },
  { id: 'crash', label: 'Fails, code throws' },
];

const STATUS: Record<string, { label: string; color: string }> = {
  done: { label: 'Finished', color: 'var(--ok)' },
  gave_up: { label: 'Stopped by the loop cap', color: 'var(--warn)' },
  http400: { label: 'Rejected by the API', color: 'var(--bad)' },
  crash: { label: 'Crashed', color: 'var(--bad)' },
};

export default function Ai3ToolSim() {
  const [outcome, setOutcome] = useState<Outcome>('instructive');
  const [cap, setCap] = useState(3);
  const run = simulate(outcome, cap);
  const st = STATUS[run.status];
  const first = run.rounds[0];
  const msg = {
    role: 'user',
    content: first.results.map((r) => (r.is_error ? { type: 'tool_result', tool_use_id: r.tool_use_id, content: r.content, is_error: true } : { type: 'tool_result', tool_use_id: r.tool_use_id, content: r.content })),
  };

  return (
    <CacheWidgetFrame title="Tool failure simulator" hint="Two parallel get_weather calls. Break the Tokyo one. The model's replies are scripted and illustrative.">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Seg label="Tokyo tool" value={outcome} options={OUTCOMES} onChange={setOutcome} />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Seg
          label="Loop cap (max tool rounds)"
          value={cap}
          options={[1, 2, 3, 5].map((n) => ({ id: n, label: `Cap ${n}` }))}
          onChange={setCap}
        />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">What your code sends after round 1</p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[13px] leading-relaxed">
            {first.results.length ? JSON.stringify(msg, null, 2) : '(nothing: no tool_result blocks were sent)'}
          </pre>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: st.color }}>
          <p className="text-xs uppercase tracking-wide text-muted">Outcome</p>
          <p className="mt-1 font-medium" style={{ color: st.color }}>
            {st.label}
          </p>
          <p className="mt-1">{run.final}</p>
          <p className="mt-2 text-muted">{run.note}</p>
          <p className="mt-2 font-mono text-[13px]">
            tool rounds: {run.rounds.length} · model calls served: {run.modelCalls}
          </p>
        </div>
        {run.rounds.length > 1 && (
          <ul className="space-y-1 font-mono text-[13px]">
            {run.rounds.map((r, i) => (
              <li key={i}>
                round {i + 1}: {r.calls.map((c) => `${c.name}(${c.input})`).join(' + ')} {'->'} {r.results.map((x) => (x.is_error ? `error "${x.content}"` : x.content)).join(', ')}
              </li>
            ))}
          </ul>
        )}
      </div>
    </CacheWidgetFrame>
  );
}
