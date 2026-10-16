import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { NODES, simulate, type Mode } from './Ai7DurLogic';

const MODES: { id: Mode; label: string }[] = [
  { id: 'scratch', label: 'Restart from scratch' },
  { id: 'resume', label: 'Resume from checkpoint' },
  { id: 'replay', label: 'Replay from checkpoint 2' },
];

function Card({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg font-semibold tabular-nums" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
    </div>
  );
}

export default function Ai7DurSim() {
  const [mode, setMode] = useState<Mode>('resume');
  const [crashAt, setCrashAt] = useState(3);
  const [afterSend, setAfterSend] = useState(true);
  const [idem, setIdem] = useState(false);
  const after = crashAt === 5 && afterSend;
  const o = simulate({ mode, crashAt, afterSend: after, idemKey: idem });
  const dup = o.delivered > 1;

  return (
    <CacheWidgetFrame title="Crash and recovery counter" hint="5-node run, 3 LLM calls, 1 email. Illustrative.">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Seg label="Recovery" value={mode} options={MODES} onChange={setMode} />
      </div>
      {mode !== 'replay' && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Seg label="Worker dies during node" value={crashAt} options={NODES.map((n, i) => ({ id: i + 1, label: `${i + 1} ${n.name}` }))} onChange={setCrashAt} />
          {crashAt === 5 && <Seg label="Crash timing" value={afterSend ? 1 : 0} options={[{ id: 0, label: 'Before send' }, { id: 1, label: 'After send, before checkpoint' }]} onChange={(v) => setAfterSend(v === 1)} />}
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Seg label="Mail call" value={idem ? 1 : 0} options={[{ id: 0, label: 'No idempotency key' }, { id: 1, label: 'With idempotency key' }]} onChange={(v) => setIdem(v === 1)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-4" aria-live="polite">
        <Card label="LLM calls fired" value={`${o.llmCalls} (${o.extraLlm >= 0 ? '+' : ''}${o.extraLlm})`} tone={o.extraLlm > 0 ? 'var(--warn)' : 'var(--ok)'} />
        <Card label="Extra LLM cost" value={`$${o.extraCost.toFixed(3)}`} />
        <Card label="Mail calls sent" value={String(o.sends)} />
        <Card label="Emails delivered" value={String(o.delivered)} tone={dup ? 'var(--bad)' : 'var(--ok)'} />
      </div>
      <p className="mt-3 text-sm text-muted">
        {dup
          ? 'The customer got the email more than once. The recovery re-ran a node that had already sent it.'
          : o.sends > 1
            ? 'The mail API saw two calls with the same key and delivered one email.'
            : 'No duplicate side effect.'}
        {' '}Assumptions: each LLM node uses 8,000 input and 1,000 output tokens at Sonnet 5.5 list price ($2 and $10 per million tokens), so one call costs 8,000 x $2 / 1M + 1,000 x $10 / 1M = $0.026. A run with no crash fires 3 calls. In replay mode the first run completes, then nodes 3 to 5 run again.
      </p>
    </CacheWidgetFrame>
  );
}
