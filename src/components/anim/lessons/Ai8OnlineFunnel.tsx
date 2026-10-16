import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Row {
  key: string;
  label: string;
  denom: string;
  c: number;
  t: number;
}

/** Illustrative counts per 1,000 suggestions shown in each arm. */
const ROWS: Row[] = [
  { key: 'shown', label: 'Shown', denom: 'the denominator', c: 1000, t: 1000 },
  { key: 'acc', label: 'Accepted', denom: 'per shown', c: 250, t: 300 },
  { key: 'edit', label: 'Edited after', denom: 'per accepted', c: 50, t: 120 },
  { key: 'kept', label: 'Kept at 24 h', denom: 'per shown', c: 225, t: 210 },
];

interface Step {
  caption: string;
  /** Rows revealed so far. */
  rows: number;
  verdict?: boolean;
}

const steps: Step[] = [
  { caption: 'Every answer or suggestion starts as one "shown" event. Count it first. It is the denominator for acceptance, and you need it to rebuild any rate later. Numbers here are illustrative, per 1,000 shown in each arm.', rows: 1 },
  { caption: 'Accepted: control 250 (25%), new variant 300 (30%). A dashboard that stops here reports a 20% relative lift (30 / 25 = 1.2). Most teams would ship.', rows: 2 },
  { caption: 'Edited after accepting: control 50 of 250 accepted (20%), new variant 120 of 300 (40%). Edits per accepted suggestion doubled. Each edit is work the user did to fix what the model wrote.', rows: 3 },
  { caption: 'Kept at 24 hours: control 225 (250 x 90%), new variant 210 (300 x 70%). Per 1,000 shown, the new variant leaves 15 fewer suggestions in the code. That is 15 / 225 = 6.7% fewer.', rows: 4 },
  { caption: 'Verdict: the headline signal rose 20% and the end result fell 6.7%. The variant makes users accept longer suggestions that they then repair or delete. Judge acceptance together with edits and survival, never alone.', rows: 4, verdict: true },
];

const X0 = 29;
const BAR_X = 200;
const BAR_W = 400;
const PITCH = 58;
const Y0 = 70;

export default function Ai8OnlineFunnel() {
  return (
    <AnimFrame title="One answer, four signals: where the lift goes" steps={steps} interval={5200}>
      {(_, s) => {
        const last = s.rows - 1;
        return (
          <SketchSvg width={720} height={330} label="Funnel of signals for two arms: shown, accepted, edited, kept at 24 hours.">
            <SketchBox cx={BAR_X + 7} cy={20} w={14} h={14} r={3} seed={seedOf('f-lc')} stroke="var(--muted)" fill="var(--muted)" />
            <HandText x={BAR_X + 20} y={22} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              control
            </HandText>
            <SketchBox cx={BAR_X + 107} cy={20} w={14} h={14} r={3} seed={seedOf('f-lt')} stroke="var(--accent)" fill="var(--accent)" />
            <HandText x={BAR_X + 120} y={22} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              new variant
            </HandText>
            {ROWS.map((r, i) => {
              const on = i < s.rows;
              const active = i === last && !s.verdict;
              const y = Y0 + i * PITCH;
              const wc = (r.c / 1000) * BAR_W;
              const wt = (r.t / 1000) * BAR_W;
              return (
                <g key={r.key}>
                  <HandText x={X0} y={y - 4} anchor="start" size={TEXT_SIZES.label} color={on ? 'var(--fg)' : 'var(--muted)'}>
                    {r.label}
                  </HandText>
                  <HandText x={X0} y={y + 16} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                    {r.denom}
                  </HandText>
                  {on && (
                    <>
                      <SketchBox cx={BAR_X + wc / 2} cy={y - 10} w={wc} h={18} r={6} seed={seedOf(`fc${i}`)} stroke="var(--muted)" fill="var(--muted)" />
                      <HandText x={BAR_X + wc + 8} y={y - 10} anchor="start" size={TEXT_SIZES.note} color="var(--muted)" mono>
                        {String(r.c)}
                      </HandText>
                      <SketchBox cx={BAR_X + wt / 2} cy={y + 14} w={wt} h={18} r={6} seed={seedOf(`ft${i}`)} stroke="var(--accent)" fill="var(--accent)" strokeWidth={active ? 2.2 : 1.4} />
                      <HandText x={BAR_X + wt + 8} y={y + 14} anchor="start" size={TEXT_SIZES.note} color={active ? 'var(--accent)' : 'var(--muted)'} mono>
                        {String(r.t)}
                      </HandText>
                    </>
                  )}
                </g>
              );
            })}
            {s.rows >= 2 && (
              <HandText x={690} y={Y0 + 1 * PITCH + 2} anchor="end" size={TEXT_SIZES.note} color="var(--ok)" mono>
                +20%
              </HandText>
            )}
            {s.rows >= 3 && (
              <HandText x={690} y={Y0 + 2 * PITCH + 2} anchor="end" size={TEXT_SIZES.note} color="var(--bad)" mono>
                rate x2
              </HandText>
            )}
            {s.rows >= 4 && (
              <HandText x={690} y={Y0 + 3 * PITCH + 2} anchor="end" size={TEXT_SIZES.note} color="var(--bad)" mono>
                -6.7%
              </HandText>
            )}
            {s.verdict && (
              <HandText x={360} y={308} size={TEXT_SIZES.label} color="var(--bad)">
                Acceptance up, outcome down: do not ship
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
