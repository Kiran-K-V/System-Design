import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { DEFAULTS, PRESETS, fmt, stages, total, type Kind, type LeakIn } from './Ai13RagLeakMath';

const COLORS = ['var(--warn)', 'var(--accent)', 'var(--bad)'];

function Slider({ id, label, value, min, max, step, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between gap-2 text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value.toLocaleString('en-US')} {unit}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const KINDS: { id: Kind; label: string }[] = [
  { id: 'doc', label: 'Doc unshared' },
  { id: 'member-live', label: 'User leaves group, groups read live' },
  { id: 'member-expanded', label: 'User leaves group, ACL expanded at index' },
];

/** ACL leak-window simulator. Worst case after a revoke is the sum of every stage that still holds the old permission. */
export default function Ai13RagLeak() {
  const [s, setS] = useState<LeakIn>(DEFAULTS);
  const [ask, setAsk] = useState(30);
  const set = (p: Partial<LeakIn>) => setS((x) => ({ ...x, ...p }));
  const st = stages(s);
  const sum = total(st);
  const leak = ask * 60 < sum;
  const tone = leak ? 'var(--bad)' : 'var(--ok)';
  const askMax = 1500;
  const scale = Math.max(sum, ask * 60, 1) * 1.05;
  let start = 0;
  const showPoll = s.kind !== 'member-live' && !s.finalCheck && s.detect === 'poll';
  const showHook = s.kind !== 'member-live' && !s.finalCheck && s.detect === 'webhook';

  return (
    <CacheWidgetFrame title="ACL leak-window simulator" hint="Revoke at 10:00. Worst case = sum of stages.">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Revoke:</span>
        <Seg label="Revoke kind" value={s.kind} options={KINDS} onChange={(kind) => set({ kind })} />
      </div>
      {s.kind !== 'member-live' && !s.finalCheck && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted">Change detection:</span>
          <Seg
            label="Detection preset"
            value={PRESETS.find((p) => Object.entries(p.patch).every(([k, v]) => (s as unknown as Record<string, unknown>)[k] === v))?.id ?? 'custom'}
            options={PRESETS.map((p) => ({ id: p.id, label: p.label }))}
            onChange={(id) => set(PRESETS.find((p) => p.id === id)!.patch)}
          />
        </div>
      )}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {showPoll && <Slider id="a13lk-poll" label="Poll interval (illustrative)" value={s.pollMin} min={1} max={1440} step={1} unit="min" onChange={(v) => set({ pollMin: v })} />}
        {showHook && <Slider id="a13lk-del" label="Webhook worst delivery (Graph max is 360)" value={s.deliverMin} min={1} max={360} step={1} unit="min" onChange={(v) => set({ deliverMin: v })} />}
        {showHook && <Slider id="a13lk-gap" label="Channel dead before renewal (illustrative)" value={s.renewGapMin} min={0} max={120} step={1} unit="min" onChange={(v) => set({ renewGapMin: v })} />}
        {s.kind === 'member-expanded' && !s.finalCheck && <Slider id="a13lk-docs" label="Docs whose ACL rows change (illustrative)" value={s.docs} min={100} max={100000} step={100} unit="docs" onChange={(v) => set({ docs: v })} />}
        {s.kind !== 'member-live' && !s.finalCheck && <Slider id="a13lk-rate" label="ACL rows rewritten per second (illustrative)" value={s.ratePerSec} min={50} max={2000} step={50} unit="/s" onChange={(v) => set({ ratePerSec: v })} />}
        {s.kind === 'member-live' && !s.finalCheck && <Slider id="a13lk-grp" label="Group list cache TTL (illustrative)" value={s.groupTtlSec} min={0} max={3600} step={10} unit="s" onChange={(v) => set({ groupTtlSec: v })} />}
        {!s.finalCheck && <Slider id="a13lk-ans" label="Answer cache TTL (illustrative)" value={s.answerTtlMin} min={0} max={1440} step={5} unit="min" onChange={(v) => set({ answerTtlMin: v })} />}
        {s.finalCheck && <Slider id="a13lk-rl" label="Permission service lag (illustrative)" value={s.recheckLagSec} min={0} max={60} step={1} unit="s" onChange={(v) => set({ recheckLagSec: v })} />}
      </div>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={s.answerRechecks} disabled={s.finalCheck} onChange={(e) => set({ answerRechecks: e.target.checked })} className="accent-[var(--accent)]" />
          Cache hit re-checks its sources
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={s.finalCheck} onChange={(e) => set({ finalCheck: e.target.checked })} className="accent-[var(--accent)]" />
          Final check of top chunks against the permission service
        </label>
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: tone }} aria-live="polite">
        <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-medium" style={{ color: tone }} data-testid="lk-verdict">
            {leak ? `The ex-member can still read it at 10:00 + ${fmt(ask * 60)}` : `Blocked at 10:00 + ${fmt(ask * 60)}`}
          </span>
          <span className="font-semibold tabular-nums" data-testid="lk-total">
            Worst-case window: {fmt(sum)}
          </span>
        </div>
        <div className="relative h-7 rounded bg-line" role="img" aria-label={`Worst-case leak window ${fmt(sum)}. The ex-member asks ${fmt(ask * 60)} after the revoke.`}>
          {st.map((x, k) => {
            const left = (start / scale) * 100;
            start += x.sec;
            return <div key={x.id} className="absolute h-full" style={{ left: `${left}%`, width: `${Math.max((x.sec / scale) * 100, x.sec > 0 ? 0.6 : 0)}%`, background: COLORS[k % COLORS.length], opacity: 0.85 }} title={`${x.label}: ${fmt(x.sec)}`} />;
          })}
          <div className="absolute top-[-4px] h-9 border-l-2 border-dashed" style={{ left: `${Math.min((ask * 60 / scale) * 100, 100)}%`, borderColor: 'var(--fg)' }} title="Time the ex-member asks" />
        </div>
        <ul className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
          {st.map((x, k) => (
            <li key={x.id} className="flex items-center gap-1.5" data-testid={`lk-stage-${x.id}`}>
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: COLORS[k % COLORS.length] }} />
              {x.label}: <span className="tabular-nums text-fg">{fmt(x.sec)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Slider id="a13lk-ask" label="The ex-member asks this long after the revoke" value={ask} min={0} max={askMax} step={1} unit="min" onChange={setAsk} />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: after the revoke at 10:00, each stage still serves the old permission until it catches up, and the worst case adds them. Sourced inputs: Graph driveItem webhook latency averages under 1 minute and is at most 6 hours; a Drive channel lasts 1 hour by default and is never renewed for you. Every other input is made up. Poll wait uses the full interval because a change just after a run waits for the next one. The final check replaces the whole chain with the lag of the permission service itself.
      </p>
    </CacheWidgetFrame>
  );
}
