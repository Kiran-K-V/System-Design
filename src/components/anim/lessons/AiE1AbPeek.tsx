import { useMemo, useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { runTest, usersTotal } from './AiE1AbLogic';

const BASE = 0.05;
const BATCH = 1000;
const LOOKS = 20;
const fmt = (n: number) => n.toLocaleString('en-US');

/** Two-arm test that grows batch by batch. Every batch is a "peek". Seeded, so a run repeats. */
export default function AiE1AbPeek() {
  const [lift, setLift] = useState<number>(0);
  const [seed, setSeed] = useState(11);
  const [looks, setLooks] = useState(1);
  const all = useMemo(() => runTest(seed, BASE, lift / 100, BATCH, LOOKS), [seed, lift]);
  const shown = all.slice(0, looks);
  const cur = shown[shown.length - 1];
  const early = shown.filter((l) => l.p < 0.05).length;
  const need = usersTotal(BASE, lift / 100);

  const W0 = 70;
  const W1 = 690;
  const Y0 = 30;
  const Y1 = 200;
  const lo = -0.012;
  const hi = 0.02;
  const px = (k: number) => W0 + ((k + 0.5) / LOOKS) * (W1 - W0);
  const py = (v: number) => Y1 - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (Y1 - Y0);

  return (
    <CacheWidgetFrame title="A two-arm test, one batch at a time" hint="5% base rate, 1,000 users per arm per batch">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Seg label="True lift" value={lift} options={[{ id: 0, label: 'No real change (A/A)' }, { id: 10, label: '+10% real' }, { id: 20, label: '+20% real' }]} onChange={(v) => { setLift(v); setLooks(1); }} />
        <button type="button" onClick={() => setLooks((k) => Math.min(LOOKS, k + 1))} disabled={looks >= LOOKS} className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">
          Add 1,000 users per arm
        </button>
        <button type="button" onClick={() => { setSeed((s) => s + 7); setLooks(1); }} className="rounded-md border border-line px-3 py-1.5 text-xs">
          New random run
        </button>
      </div>
      <SketchSvg width={720} height={240} label="Interval for the difference between arms after each batch. The dashed line is zero.">
        <HandText x={W0} y={14} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
          95% interval for the lift, after each batch
        </HandText>
        <SketchArrow points={[[W0, py(0)], [W1, py(0)]]} head="none" seed={seedOf('ap-zero')} stroke="var(--muted)" dashed />
        <HandText x={W0 - 8} y={py(0)} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">
          0
        </HandText>
        {shown.map((l, k) => {
          const excludesZero = l.lo > 0 || l.hi < 0;
          const col = excludesZero ? 'var(--bad)' : 'var(--muted)';
          const last = k === shown.length - 1;
          return (
            <g key={k}>
              <SketchArrow points={[[px(k), py(l.lo)], [px(k), py(l.hi)]]} head="none" seed={seedOf(`ap-i${k}`)} stroke={last ? 'var(--accent)' : col} strokeWidth={last ? 2.2 : 1.4} />
              <SketchBox cx={px(k)} cy={py(l.diff)} w={8} h={8} r={4} seed={seedOf(`ap-d${k}`)} stroke={last ? 'var(--accent)' : col} fill={last ? 'var(--accent)' : col} />
            </g>
          );
        })}
        <HandText x={(W0 + W1) / 2} y={228} size={TEXT_SIZES.note} color="var(--muted)">
          batches so far (red: that peek would have declared a winner)
        </HandText>
      </SketchSvg>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3" aria-live="polite">
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Users so far</p>
          <p className="mt-1 font-mono text-lg">{fmt(cur.n * 2)}</p>
          <p className="mt-1 text-muted">both arms</p>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: cur.p < 0.05 ? 'var(--bad)' : 'var(--border)' }}>
          <p className="text-xs uppercase tracking-wide text-muted">p-value now</p>
          <p className="mt-1 font-mono text-lg">{cur.p.toFixed(3)}</p>
          <p className="mt-1 text-muted">{`Interval: ${(cur.lo * 100).toFixed(2)} to ${(cur.hi * 100).toFixed(2)} points`}</p>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: early > 0 && lift === 0 ? 'var(--bad)' : 'var(--border)' }}>
          <p className="text-xs uppercase tracking-wide text-muted">Peeks that said "winner"</p>
          <p className="mt-1 font-mono text-lg">{`${early} of ${shown.length}`}</p>
          <p className="mt-1 text-muted">{lift === 0 && early > 0 ? 'False alarm: nothing changed.' : lift === 0 ? 'Nothing changed. Keep adding batches.' : 'A real lift exists.'}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        {lift === 0
          ? 'With no real change, a fixed-size test is wrong about 1 time in 20. A team that checks after every batch and stops at the first winner is wrong far more often. Press "New random run" several times and add all 20 batches each time.'
          : `Planned size from the published rule (95% confidence, 90% power): about ${fmt(Math.round(need))} users in total. This run stops at 40,000. Early peeks on a real lift can still look flat.`}{' '}
        Source for the rule: the KDD 2007 guide named in the lesson. The widget uses a seeded generator, so a run repeats.
      </p>
    </CacheWidgetFrame>
  );
}
