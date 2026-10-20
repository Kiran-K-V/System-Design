import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Six parallel fetches. Durations are ILLUSTRATIVE, not measured. F6 is the slow one. */

const DURS = [0.35, 0.45, 0.5, 0.6, 0.85, 2.0];
const DEADLINE = 1.2;
const DUP_DUR = 0.4;
const X0 = 150;
const SCALE = 220;
const LANE0 = 70;
const LANE = 38;
const AXIS_Y = 342;
const xOf = (t: number) => X0 + t * SCALE;
const laneY = (i: number) => LANE0 + i * LANE;

interface Step {
  caption: string;
  /** Time shown so far, in seconds. */
  t: number;
  /** A copy of F6 is sent at the deadline. */
  copy?: boolean;
  /** The original F6 is cancelled at this time (it stops growing). */
  cancelAt?: number;
  /** Where the stage ends, in seconds, and its label. */
  end?: { t: number; label: string; tone: 'bad' | 'ok' | 'warn' };
  line?: boolean;
}

const steps: Step[] = [
  { t: 0.5, caption: 'The lead needs six pages. It sends all six fetches at time 0. They run in parallel, so the stage should take as long as one fetch. The durations here are made up to show the shape. They are not measured.' },
  { t: 0.85, caption: 'By 0.85 s five fetches are done. Five of six sounds like a win, but the stage is not done. The next step, reading the pages, needs all six. The stage waits for the slowest fetch.' },
  { t: 2.0, end: { t: 2.0, label: 'stage ends 2.0 s', tone: 'bad' }, caption: 'F6 hit a slow server and finished at 2.0 s. The stage took 2.0 s, more than twice what the other five needed. The chance that at least one of six fetches lands in its own slowest 5% is 26.5%, so a run meets this often.' },
  { t: DEADLINE, line: true, copy: true, caption: 'Now a fix, called a hedged request. At a deadline equal to one fetch’s own p95 (1.2 s here), the system sends a second copy of any fetch that is still open. The first reply wins. Only about 5% of fetches ever reach the deadline, so it adds about 5% more requests.' },
  { t: DEADLINE + DUP_DUR, line: true, copy: true, cancelAt: DEADLINE + DUP_DUR, end: { t: DEADLINE + DUP_DUR, label: 'stage ends 1.6 s', tone: 'ok' }, caption: 'The copy hit a fast server and answered at 1.6 s. The original F6 is cancelled. The stage took 1.6 s, not 2.0 s. The hedge cannot make a good fetch faster. It cuts the cost of a bad draw.' },
  { t: DEADLINE, line: true, cancelAt: DEADLINE, end: { t: DEADLINE, label: 'stage ends 1.2 s', tone: 'warn' }, caption: 'The other choice is to stop at the deadline and go on with five of six sources. The stage takes 1.2 s. The price is coverage: this answer is built without F6’s page. Use it when speed matters more than the sixth source.' },
];

function Bar({ i, t, s }: { i: number; t: number; s: Step }) {
  const dur = DURS[i];
  const isTail = i === 5;
  const cancelled = isTail && s.cancelAt !== undefined;
  const shownEnd = cancelled ? Math.min(t, s.cancelAt!) : Math.min(t, dur);
  const w = Math.max(shownEnd * SCALE, 8);
  const done = !cancelled && t >= dur;
  const tone = cancelled ? 'var(--muted)' : isTail && t > 0.85 ? 'var(--warn)' : done ? 'var(--ok)' : 'var(--muted)';
  const cy = laneY(i);
  return (
    <g>
      <HandText x={X0 - 14} y={cy} anchor="end" size={TEXT_SIZES.label} color="var(--fg)">{`F${i + 1}`}</HandText>
      <SketchBox cx={X0 + w / 2} cy={cy} w={w} h={22} r={6} seed={seedOf(`rg${i}${cancelled}${done}`)} stroke={tone} fill={tone} dashed={cancelled} />
      {done && (
        <HandText x={X0 + w + 8} y={cy} anchor="start" size={TEXT_SIZES.note} mono color="var(--muted)">{`${dur.toFixed(2)} s`}</HandText>
      )}
      {cancelled && (
        <HandText x={X0 + w + 8} y={cy} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">cancelled</HandText>
      )}
    </g>
  );
}

export default function Ai13ResearchGantt() {
  return (
    <AnimFrame title="Six parallel fetches, one slow (illustrative)" steps={steps} interval={7000}>
      {(_, s) => {
        const copyW = s.copy ? Math.max(Math.min(s.t - DEADLINE, DUP_DUR) * SCALE, 8) : 0;
        const copyDone = s.copy && s.t >= DEADLINE + DUP_DUR;
        return (
          <SketchSvg width={720} height={400} label="Timeline of six parallel fetches. Five finish by 0.85 seconds. The sixth takes 2.0 seconds, or 1.6 seconds with a hedged copy sent at 1.2 seconds.">
            {s.line && (
              <>
                <SketchArrow points={[[xOf(DEADLINE), 44], [xOf(DEADLINE), AXIS_Y - 14]]} head="none" dashed stroke="var(--warn)" seed={seedOf('rg-deadline')} />
                <HandText x={xOf(DEADLINE) + 8} y={36} anchor="start" size={TEXT_SIZES.note} color="var(--warn)">deadline 1.2 s (p95)</HandText>
              </>
            )}
            {DURS.map((_, i) => (
              <Bar key={i} i={i} t={s.t} s={s} />
            ))}
            {s.copy && (
              <g>
                <HandText x={X0 - 14} y={laneY(6)} anchor="end" size={TEXT_SIZES.label} color="var(--fg)">F6 copy</HandText>
                <SketchBox cx={xOf(DEADLINE) + copyW / 2} cy={laneY(6)} w={copyW} h={22} r={6} seed={seedOf(`rgc${copyDone}`)} stroke={copyDone ? 'var(--ok)' : 'var(--accent)'} fill={copyDone ? 'var(--ok)' : 'var(--accent)'} />
                {copyDone && (
                  <HandText x={xOf(DEADLINE) + copyW + 8} y={laneY(6)} anchor="start" size={TEXT_SIZES.note} mono color="var(--muted)">{`${DUP_DUR.toFixed(2)} s`}</HandText>
                )}
              </g>
            )}
            {s.end && (
              <>
                <SketchArrow points={[[xOf(s.end.t), 50], [xOf(s.end.t), AXIS_Y - 14]]} head="none" stroke={`var(--${s.end.tone})`} strokeWidth={2.2} seed={seedOf(`rg-end${s.end.t}`)} />
                <HandText x={xOf(s.end.t) + (s.end.t > 1.7 ? -8 : 8)} y={AXIS_Y - 10} anchor={s.end.t > 1.7 ? 'end' : 'start'} size={TEXT_SIZES.label} color={`var(--${s.end.tone})`}>{s.end.label}</HandText>
              </>
            )}
            {[0, 0.5, 1, 1.5, 2].map((t) => (
              <HandText key={t} x={xOf(t)} y={AXIS_Y + 16} size={TEXT_SIZES.note} mono color="var(--muted)">{t.toFixed(1)}</HandText>
            ))}
            <HandText x={X0} y={AXIS_Y + 44} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">seconds after the fetches start (illustrative)</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
