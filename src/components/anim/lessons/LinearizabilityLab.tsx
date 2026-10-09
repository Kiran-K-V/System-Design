import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { READ_LEN, WRITES, allowedValues, judge, type Scenario } from './linearizability';

const AXIS = 12;

const PRESETS: { id: string; label: string; s: Scenario }[] = [
  { id: 'stale', label: 'Stale read after a write finished', s: { r1Start: 4, r2Start: 6, r1: 0, r2: 1 } },
  { id: 'flip', label: 'New value, then old (quorum read mid-write)', s: { r1Start: 6, r2Start: 8, r1: 2, r2: 1 } },
  { id: 'good', label: 'Reads during the write: old, then new', s: { r1Start: 6, r2Start: 8, r1: 1, r2: 2 } },
  { id: 'late', label: 'Read long after the last write', s: { r1Start: 10, r2Start: 11, r1: 2, r2: 2 } },
];

const pos = (t: number) => `${(t / AXIS) * 100}%`;

function Bar({ start, end, label, tone }: { start: number; end: number; label: string; tone: 'accent' | 'ok' | 'bad' | 'warn' }) {
  const color = { accent: 'var(--accent)', ok: 'var(--ok)', bad: 'var(--bad)', warn: 'var(--warn)' }[tone];
  return (
    <div className="absolute top-0" style={{ left: pos(start), width: pos(end - start) }}>
      <div className="h-5 rounded border-2 transition-colors" style={{ borderColor: color, background: `color-mix(in srgb, ${color} 18%, transparent)` }} />
      <div className="mt-0.5 whitespace-nowrap text-xs font-medium" style={{ color }}>
        {label}
      </div>
    </div>
  );
}

function Verdict({ name, ok, note }: { name: string; ok: boolean; note: string }) {
  return (
    <div className={`rounded-lg border p-2.5 ${ok ? 'border-ok/50 bg-ok/10' : 'border-bad/50 bg-bad/10'}`}>
      <div className="text-xs text-muted">{name}</div>
      <div className={`text-lg font-semibold ${ok ? 'text-ok' : 'text-bad'}`}>{ok ? 'Allowed' : 'Violated'}</div>
      <div className="text-xs text-muted">{note}</div>
    </div>
  );
}

function ValuePick({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-muted">{label}</span>
      <Seg label={label} value={value} onChange={onChange} options={[0, 1, 2].map((v) => ({ id: v, label: String(v) }))} />
    </div>
  );
}

const fmt = (v: number[]) => (v.length ? v.join(', ') : 'none: the other read already breaks it');

export default function LinearizabilityLab() {
  const [s, setS] = useState<Scenario>(PRESETS[0].s);
  const v = judge(s);

  const setR1Start = (n: number) => setS((p) => ({ ...p, r1Start: n, r2Start: Math.max(p.r2Start, n + 1) }));
  const setR2Start = (n: number) => setS((p) => ({ ...p, r2Start: Math.max(n, p.r1Start + 1) }));

  const toneOf = (id: 'R1' | 'R2') => (v.badAlone.includes(id) ? 'bad' : !v.linearizable ? 'warn' : 'ok');
  const r1 = { start: s.r1Start, end: s.r1Start + READ_LEN };
  const r2 = { start: s.r2Start, end: s.r2Start + READ_LEN };

  let why: string;
  if (v.linearizable) {
    why = 'Some single order of the four operations respects the clock and makes every read correct. This history is linearizable, so it is also allowed by every weaker model below it.';
  } else if (v.badAlone.length > 0 && v.sequential) {
    why = `${v.badAlone.join(' and ')} returned an old value even though the write that replaced it had already finished. The clock forbids that. Sequential consistency ignores the clock, so it allows it: B just reads "from the past".`;
  } else if (!v.sequential) {
    why = 'B saw the new value and then the old one. No order of the writes can explain that and still keep each client’s own order. Reads went backward in time.';
  } else {
    why = 'Each read is fine alone, but together no single order fits the clock. One read saw the write and a later read did not.';
  }

  return (
    <CacheWidgetFrame title="Which histories does each model allow?" hint="client A writes, client B reads twice">
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setS(p.s)}
            className="rounded-md border border-line px-2.5 py-1.5 text-left text-xs hover:bg-surface"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-surface p-3">
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <span className="w-20 shrink-0 pt-0.5 text-xs text-muted">Client A</span>
            <div className="relative h-12 flex-1">
              <Bar start={WRITES[0].start} end={WRITES[0].end} label="write x=1" tone="accent" />
              <Bar start={WRITES[1].start} end={WRITES[1].end} label="write x=2" tone="accent" />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-20 shrink-0 pt-0.5 text-xs text-muted">Client B</span>
            <div className="relative h-12 flex-1">
              <Bar start={r1.start} end={r1.end} label={`R1 → ${s.r1}`} tone={toneOf('R1')} />
              <Bar start={r2.start} end={r2.end} label={`R2 → ${s.r2}`} tone={toneOf('R2')} />
            </div>
          </div>
        </div>
        <div className="ml-[5.5rem] mt-1 flex justify-between border-t border-line pt-1 text-[11px] tabular-nums text-muted">
          {Array.from({ length: AXIS / 2 + 1 }, (_, i) => (
            <span key={i}>{i * 2}</span>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">Time runs left to right. x starts at 0. A bar is one operation, from the moment the client sends it to the moment it gets the answer.</p>
      </div>

      <div className="mt-3 grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="r1s" className="mb-1 flex justify-between text-xs text-muted">
              <span>R1 starts at</span>
              <span className="tabular-nums text-fg">{s.r1Start}</span>
            </label>
            <input id="r1s" type="range" min={0} max={10} step={1} value={s.r1Start} onChange={(e) => setR1Start(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="r2s" className="mb-1 flex justify-between text-xs text-muted">
              <span>R2 starts at (after R1)</span>
              <span className="tabular-nums text-fg">{s.r2Start}</span>
            </label>
            <input id="r2s" type="range" min={1} max={11} step={1} value={s.r2Start} onChange={(e) => setR2Start(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <ValuePick label="R1 returned" value={s.r1} onChange={(n) => setS((p) => ({ ...p, r1: n }))} />
          <ValuePick label="R2 returned" value={s.r2} onChange={(n) => setS((p) => ({ ...p, r2: n }))} />
        </div>
        <div className="rounded-lg border border-line p-3 text-xs leading-relaxed text-muted">
          <div className="mb-1 font-semibold text-fg">Values a linearizable system may return</div>
          <div>
            R1: <span className="tabular-nums text-fg">{fmt(allowedValues(s, 'R1', 'lin'))}</span> (with your R2)
          </div>
          <div>
            R2: <span className="tabular-nums text-fg">{fmt(allowedValues(s, 'R2', 'lin'))}</span> (with your R1)
          </div>
          <div className="mb-1 mt-2 font-semibold text-fg">Values a sequentially consistent system may return</div>
          <div>
            R1: <span className="tabular-nums text-fg">{fmt(allowedValues(s, 'R1', 'seq'))}</span>, R2: <span className="tabular-nums text-fg">{fmt(allowedValues(s, 'R2', 'seq'))}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <Verdict name="Linearizable" ok={v.linearizable} note="respects the clock" />
        <Verdict name="Sequential" ok={v.sequential} note="ignores the clock" />
        <Verdict name="Monotonic reads" ok={v.monotonic} note="B never goes back" />
        <Verdict name="Eventual" ok note="only promises convergence" />
      </div>
      <p className="mt-3 rounded-lg border border-line p-2.5 text-xs leading-relaxed text-muted">{why}</p>
    </CacheWidgetFrame>
  );
}
