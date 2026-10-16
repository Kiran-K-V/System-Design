import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';
import { NEXT, acceptsMessages, kind, short, type TaskState } from './Ai7ProtoLogic';

/** Layout of the eight states. Names are from the A2A v1.0.0 spec. The arrows are a typical path, not quoted from the spec. */
const POS: Record<TaskState, [number, number]> = {
  TASK_STATE_SUBMITTED: [90, 110],
  TASK_STATE_WORKING: [300, 110],
  TASK_STATE_INPUT_REQUIRED: [300, 230],
  TASK_STATE_AUTH_REQUIRED: [300, 330],
  TASK_STATE_COMPLETED: [600, 50],
  TASK_STATE_FAILED: [600, 135],
  TASK_STATE_CANCELED: [600, 220],
  TASK_STATE_REJECTED: [90, 260],
};
const W = 150;
const H = 44;

export default function Ai7ProtoStates() {
  const [cur, setCur] = useState<TaskState>('TASK_STATE_SUBMITTED');
  const [log, setLog] = useState<TaskState[]>(['TASK_STATE_SUBMITTED']);
  const opts = NEXT[cur];
  const go = (s: TaskState) => {
    setCur(s);
    setLog((l) => [...l, s]);
  };
  const reset = () => {
    setCur('TASK_STATE_SUBMITTED');
    setLog(['TASK_STATE_SUBMITTED']);
  };
  const color = (s: TaskState) => (s === cur ? 'var(--accent)' : kind(s) === 'terminal' ? (s === 'TASK_STATE_COMPLETED' ? 'var(--ok)' : 'var(--bad)') : kind(s) === 'interrupted' ? 'var(--warn)' : 'var(--fg)');
  const all = Object.keys(POS) as TaskState[];

  return (
    <CacheWidgetFrame title="A2A task state machine" hint="State names: A2A v1.0.0. Arrows: a typical path.">
      <SketchSvg width={720} height={380} label="A2A task states">
        {all.flatMap((a) =>
          NEXT[a].map((b) => {
            const [ax, ay] = POS[a];
            const [bx, by] = POS[b];
            const dx = bx - ax;
            const dy = by - ay;
            const len = Math.hypot(dx, dy);
            const t = Math.min(W / 2 / Math.max(Math.abs(dx) / len, 0.001), H / 2 / Math.max(Math.abs(dy) / len, 0.001)) + 6;
            const on = a === cur;
            return (
              <SketchArrow
                key={`${a}>${b}`}
                points={[
                  [ax + (dx / len) * t, ay + (dy / len) * t],
                  [bx - (dx / len) * t, by - (dy / len) * t],
                ]}
                stroke={on ? 'var(--accent)' : 'var(--muted)'}
                strokeWidth={on ? 2.2 : 1.4}
                seed={seedOf(`${a}>${b}`)}
              />
            );
          }),
        )}
        {all.map((s) => {
          const [x, y] = POS[s];
          return (
            <g key={s}>
              <SketchBox cx={x} cy={y} w={W} h={H} r={8} seed={seedOf(s)} stroke={color(s)} strokeWidth={s === cur ? 2.2 : 1.4} fill={s === cur ? 'var(--accent-soft)' : 'var(--bg)'} dashed={kind(s) === 'interrupted'} />
              <HandText x={x} y={y} size={16} color={color(s)}>
                {short(s)}
              </HandText>
            </g>
          );
        })}
        <HandText x={600} y={300} size={14} color="var(--muted)">
          {'terminal: red or green\ninterrupted: dashed'}
        </HandText>
      </SketchSvg>
      <div className="mt-3 text-sm" aria-live="polite">
        <p className="mb-2">
          Current state: <span className="font-mono font-semibold">{cur}</span> ({kind(cur)})
        </p>
        <div className="flex flex-wrap gap-2">
          {opts.map((o) => (
            <button key={o} type="button" onClick={() => go(o)} className="rounded-md border border-line px-2.5 py-1.5 font-mono text-[13px] hover:border-accent hover:bg-accent-soft">
              {'->'} {short(o)}
            </button>
          ))}
          <button type="button" onClick={reset} className="rounded-md border border-line px-2.5 py-1.5 text-[13px] text-muted hover:text-fg">
            {kind(cur) === 'terminal' ? 'Start a new task' : 'Reset'}
          </button>
        </div>
        {kind(cur) === 'terminal' ? (
          <p className="mt-2" style={{ color: 'var(--bad)' }}>
            Terminal. The spec says this task cannot restart. {acceptsMessages(cur) ? 'It takes more messages.' : 'A message sent to it is rejected.'} A follow-up is a new task in the same contextId.
          </p>
        ) : kind(cur) === 'interrupted' ? (
          <p className="mt-2" style={{ color: 'var(--warn)' }}>
            Interrupted. The task waits for the client. {cur === 'TASK_STATE_AUTH_REQUIRED' ? 'The spec says an agent MUST NOT treat this transition alone as authorization for any operation.' : 'The client sends the extra input and the task goes back to WORKING.'}
          </p>
        ) : null}
        <p className="mt-2 font-mono text-[13px] text-muted">path: {log.map(short).join(' -> ')}</p>
      </div>
    </CacheWidgetFrame>
  );
}
