import { useState } from 'react';
import { WidgetFrame } from '../data-kit';
import { deliveryOutcome, type AckPolicy, type Progress, type Verdict } from './asyncSim';

/**
 * Pick when the consumer acks and when it crashes. The widget shows what the broker does next
 * and how many times the effect (a credit of $10) happens. Logic lives in asyncSim.ts.
 */

const POLICIES: { id: AckPolicy; name: string; short: string }[] = [
  { id: 'ack-first', name: 'Ack first, then work', short: 'at most once' },
  { id: 'ack-after', name: 'Work first, then ack', short: 'at least once' },
  { id: 'ack-after-dedupe', name: 'Work first, then ack, with a dedupe table', short: 'effectively once' },
];
const CRASHES: { id: Progress; name: string }[] = [
  { id: 0, name: 'Crash before step 1' },
  { id: 1, name: 'Crash between the steps' },
  { id: 2, name: 'No crash' },
];
const VERDICT: Record<Verdict, { text: string; color: string }> = {
  once: { text: 'Credited once', color: 'var(--ok)' },
  lost: { text: 'Lost: credited 0 times', color: 'var(--bad)' },
  duplicate: { text: 'Duplicate: credited twice', color: 'var(--warn)' },
};
const STEP_NAME = { receive: 'receive', ack: 'ack', process: 'credit $10' } as const;

function explain(policy: AckPolicy, progress: Progress): string {
  const o = deliveryOutcome(policy, progress);
  if (progress === 2) return 'No crash, so every step finishes and the broker deletes the message.';
  if (o.verdict === 'lost') return 'The ack went out first, so the broker deleted the message. Then the consumer crashed before the credit. Nobody will send it again. The work is lost.';
  if (o.verdict === 'duplicate') return 'The credit finished, but the consumer crashed before the ack. The broker saw no ack and sent the message again. The new consumer credited again.';
  if (policy === 'ack-after-dedupe' && progress === 1) return 'The credit and the id were saved together before the crash. The broker resent the message. The consumer found the id, skipped the credit, and acked.';
  return 'The crash came before any effect. The broker saw no ack and resent the message. The second try did the work once.';
}

export default function AsyncCrashMatrix() {
  const [sel, setSel] = useState<{ p: AckPolicy; c: Progress }>({ p: 'ack-after', c: 1 });
  const o = deliveryOutcome(sel.p, sel.c);
  const firstRun = o.steps.slice(0, 1 + sel.c);
  const crashed = sel.c < 2;

  return (
    <WidgetFrame
      title="Where the crash lands decides the result"
      caption={<>Click any cell. Each row is a different ack rule. The bottom row is the only one that is safe on every crash.</>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-separate border-spacing-1.5 text-left text-sm">
          <thead>
            <tr>
              <th className="font-normal text-muted"></th>
              {CRASHES.map((c) => (
                <th key={c.id} className="font-normal text-muted">{c.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {POLICIES.map((p) => (
              <tr key={p.id}>
                <th className="pr-2 align-middle font-normal">
                  {p.name}
                  <span className="block text-xs text-muted">{p.short}</span>
                </th>
                {CRASHES.map((c) => {
                  const v = deliveryOutcome(p.id, c.id).verdict;
                  const on = sel.p === p.id && sel.c === c.id;
                  return (
                    <td key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSel({ p: p.id, c: c.id })}
                        aria-pressed={on}
                        className="w-full rounded-md border px-2 py-2 text-left text-[13px]"
                        style={{
                          borderColor: on ? 'var(--accent)' : VERDICT[v].color,
                          borderWidth: on ? 2 : 1,
                          background: `color-mix(in srgb, ${VERDICT[v].color} 14%, var(--bg))`,
                        }}
                      >
                        {VERDICT[v].text}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-surface p-3 text-sm">
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Timeline">
          {firstRun.map((s, i) => (
            <span key={i} className="rounded-md border border-line bg-bg px-2 py-1 font-mono text-xs">{STEP_NAME[s]}</span>
          ))}
          {crashed && <span className="rounded-md border border-bad px-2 py-1 text-xs text-bad">crash</span>}
          {o.redelivered && (
            <>
              <span className="px-1 text-muted">then</span>
              <span className="rounded-md border border-warn px-2 py-1 text-xs text-warn">broker resends</span>
              {o.steps.map((s, i) => (
                <span key={`r${i}`} className="rounded-md border border-line bg-bg px-2 py-1 font-mono text-xs">{s === 'process' && sel.p === 'ack-after-dedupe' && sel.c === 1 ? 'id found: skip' : STEP_NAME[s]}</span>
              ))}
            </>
          )}
        </div>
        <p className="mt-3 leading-relaxed">
          <strong style={{ color: VERDICT[o.verdict].color }}>{VERDICT[o.verdict].text}.</strong> {explain(sel.p, sel.c)}
        </p>
      </div>
    </WidgetFrame>
  );
}
