import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { REQ_LEN, SLOTS, continuousRuns, makespan, staticRuns, type Run } from './ai2MathA';

const SR = staticRuns();
const CR = continuousRuns();
const T_MAX = makespan(SR); // 18
const X0 = 84;
const PX = 612 / T_MAX;
const x = (t: number) => X0 + t * PX;
const ROW = 32;
const LANE_Y = [58, 248];

const total = REQ_LEN.reduce((a, b) => a + b, 0);

/** Gaps between runs on each slot, up to the lane's own end time. */
function idleSegs(runs: Run[]) {
  const end = makespan(runs);
  const segs: { slot: number; a: number; b: number }[] = [];
  for (let s = 0; s < SLOTS; s++) {
    let at = 0;
    for (const r of runs.filter((q) => q.slot === s).sort((p, q) => p.start - q.start)) {
      if (r.start > at) segs.push({ slot: s, a: at, b: r.start });
      at = r.end;
    }
    if (at < end) segs.push({ slot: s, a: at, b: end });
  }
  return segs;
}
const SI = idleSegs(SR);
const CI = idleSegs(CR);

interface Step {
  caption: string;
  t: number;
  focus?: { lane: 0 | 1; req: number };
}

const steps: Step[] = [
  {
    caption:
      'Six requests, four slots on the GPU. Output lengths in decode steps: R1 3, R2 12, R3 5, R4 4, R5 6, R6 3. Both schedulers start the first four together. Top lane: static batching. Bottom lane: continuous batching.',
    t: 0,
  },
  {
    caption:
      'Step 3: R1 is done. Static batching keeps its slot empty, because the batch ends only when its longest request ends. Continuous batching hands the free slot to R5 at once. This is the same move as a thread pool taking the next job when a worker frees up.',
    t: 3,
    focus: { lane: 1, req: 4 },
  },
  {
    caption: 'Step 4: R4 is done. Static: a second empty slot. Continuous: R6 takes the slot. The scheduler decides again at every step, so the batch changes shape while it runs.',
    t: 4,
    focus: { lane: 1, req: 5 },
  },
  {
    caption:
      'Step 7: R6, a 3-token request, is finished in the continuous lane. In the static lane R6 has not even started. It waits in the queue until the whole first batch ends. A short request stuck behind a long one is the classic static-batching complaint.',
    t: 7,
    focus: { lane: 1, req: 5 },
  },
  {
    caption:
      'Step 12: continuous batching has finished all six requests. Static batching just now sees R2 finish, so only now do R5 and R6 begin. Three of its four slots sat idle for most of the first batch.',
    t: 12,
    focus: { lane: 0, req: 1 },
  },
  {
    caption: `Step 18: static finishes. The same ${total} tokens took 18 steps against 12: 1.5x longer. Slot use: static ${total} / (18 x 4) = ${((total / 72) * 100).toFixed(0)}%, continuous ${total} / (12 x 4) = ${((total / 48) * 100).toFixed(0)}%. The gap grows with the spread of lengths.`,
    t: 18,
  },
];

function Lane({ runs, idle, lane, t, focus, title, seedKey }: { runs: Run[]; idle: { slot: number; a: number; b: number }[]; lane: 0 | 1; t: number; focus?: number; title: string; seedKey: string }) {
  const y0 = LANE_Y[lane];
  const cy = (slot: number) => y0 + slot * (ROW + 6);
  return (
    <g>
      <HandText x={24} y={y0 - 26} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
        {title}
      </HandText>
      {idle.map((s) => {
        const b = Math.min(s.b, t);
        if (b <= s.a) return null;
        return <SketchBox key={`${s.slot}-${s.a}`} cx={x((s.a + b) / 2)} cy={cy(s.slot)} w={(b - s.a) * PX - 3} h={ROW} r={6} seed={seedOf(`${seedKey}-i-${s.slot}-${s.a}`)} stroke="var(--bad)" dashed />;
      })}
      {runs.map((r) => {
        const b = Math.min(r.end, t);
        if (b <= r.start) return null;
        const done = t >= r.end;
        const isFocus = focus === r.req;
        const stroke = isFocus ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--muted)';
        return (
          <g key={r.req}>
            <SketchBox cx={x((r.start + b) / 2)} cy={cy(r.slot)} w={(b - r.start) * PX - 3} h={ROW} r={6} seed={seedOf(`${seedKey}-r-${r.req}`)} stroke={stroke} strokeWidth={isFocus ? 2.2 : 1.4} fill={isFocus ? 'var(--accent)' : done ? 'var(--ok)' : undefined} />
            {(b - r.start) * PX > 40 && (
              <HandText x={x((r.start + b) / 2)} y={cy(r.slot) + 1} size={TEXT_SIZES.note} color="var(--fg)">
                {`R${r.req + 1}`}
              </HandText>
            )}
          </g>
        );
      })}
      {Array.from({ length: SLOTS }, (_, s) => (
        <HandText key={s} x={X0 - 12} y={cy(s) + 1} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">
          {`slot ${s + 1}`}
        </HandText>
      ))}
    </g>
  );
}

const busy = (runs: Run[], t: number) => runs.filter((r) => r.start <= t && t < r.end).length;

export default function Ai2BatTimeline() {
  return (
    <AnimFrame title="Static vs continuous batching, 6 requests" steps={steps} interval={6000}>
      {(_, s) => (
        <SketchSvg width={720} height={420} label="Two timelines of four GPU slots: static batching leaves slots idle, continuous batching refills them">
          <Lane runs={SR} idle={SI} lane={0} t={s.t} focus={s.focus?.lane === 0 ? s.focus.req : undefined} title="Static batching" seedKey="sb" />
          <Lane runs={CR} idle={CI} lane={1} t={s.t} focus={s.focus?.lane === 1 ? s.focus.req : undefined} title="Continuous batching" seedKey="cb" />
          <line x1={x(s.t)} x2={x(s.t)} y1={LANE_Y[0] - 46} y2={LANE_Y[1] + 3 * (ROW + 6) + 22} stroke="var(--accent)" strokeWidth={1.4} strokeDasharray="4 4" />
          <HandText x={x(s.t) + (s.t > 12 ? -6 : 6)} y={LANE_Y[0] - 40} anchor={s.t > 12 ? 'end' : 'start'} size={TEXT_SIZES.note} mono color="var(--accent)">
            {`step ${s.t}`}
          </HandText>
          <HandText x={24} y={406} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
            {`busy slots now: static ${busy(SR, s.t)} of 4, continuous ${busy(CR, s.t)} of 4. Dashed red = idle slot.`}
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
