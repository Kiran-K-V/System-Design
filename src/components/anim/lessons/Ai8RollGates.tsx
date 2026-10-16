import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Cell = 'pass' | 'wait' | 'fail' | 'idle';

const GATES = ['Quality', 'Latency', 'Cost', 'Refusals'];
const ROWS = [
  { label: 'Shadow', note: '0% of users see it' },
  { label: 'Canary 1%', note: '1,000 requests a day' },
  { label: 'Full rollout', note: '100% of users' },
];

interface Step {
  caption: string;
  cells: Cell[][];
  /** Row that is active. */
  active: number;
  stopped?: boolean;
  bottom?: 'status' | 'timeline';
}

const I: Cell[] = ['idle', 'idle', 'idle', 'idle'];
const P: Cell[] = ['pass', 'pass', 'pass', 'pass'];

const steps: Step[] = [
  { caption: 'Shadow: each live request is also sent to the new version. Its answer is graded and thrown away, so no user sees it. All four gates pass. Quality, latency, cost, and refusals are the four gates defined above.', cells: [P, I, I], active: 0 },
  { caption: 'Canary 1%: real users now get the new version. Latency, cost, and refusals pass within minutes. Quality shows "wait". To see a 4-point drop in pass rate it needs about 490 graded requests, and 1% of 100,000 requests a day is only 1,000 a day.', cells: [P, ['wait', 'pass', 'pass', 'pass'], I], active: 1 },
  { caption: 'About 12 hours later, 490 requests are graded. The quality gate reads 86.0% against 90.0% for the old version, and it fails. The other gates still pass. The rule says: no gate may fail.', cells: [P, ['fail', 'pass', 'pass', 'pass'], I], active: 1 },
  { caption: 'Rollback: one switch points the config back to the previous release. Canary traffic drops to 0% and the full rollout never starts. Only about 490 requests got the worse answers.', cells: [P, ['fail', 'pass', 'pass', 'pass'], I], active: 1, stopped: true, bottom: 'status' },
  { caption: 'Compare the time. With a canary and a gate, the problem was found in about 12 hours. In Anthropic\'s 2025 incident, the first of three bugs went live on August 5 and its first fix shipped on September 4: 30 days.', cells: [P, ['fail', 'pass', 'pass', 'pass'], I], active: 1, stopped: true, bottom: 'timeline' },
];

const CX = [330, 430, 530, 630];
const RY = [90, 144, 198];

const TONE: Record<Cell, string> = { pass: 'var(--ok)', wait: 'var(--warn)', fail: 'var(--bad)', idle: 'var(--muted)' };

export default function Ai8RollGates() {
  return (
    <AnimFrame title="A new model version climbs a ladder of gates" steps={steps} interval={5600}>
      {(_, s) => (
        <SketchSvg width={720} height={380} label="Rollout ladder: shadow, canary one percent, full rollout, with four gates each.">
          {GATES.map((g, c) => (
            <HandText key={g} x={CX[c]} y={40} size={TEXT_SIZES.heading} color="var(--muted)">
              {g}
            </HandText>
          ))}
          {ROWS.map((r, i) => {
            const act = i === s.active;
            return (
              <g key={r.label}>
                <HandText x={29} y={RY[i] - 8} anchor="start" size={TEXT_SIZES.label} color={act ? 'var(--accent)' : 'var(--fg)'}>
                  {r.label}
                </HandText>
                <HandText x={29} y={RY[i] + 14} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                  {s.stopped && i === 1 ? 'stopped by rollback' : r.note}
                </HandText>
                {GATES.map((_, c) => {
                  const st = s.cells[i][c];
                  return (
                    <g key={c}>
                      <SketchBox cx={CX[c]} cy={RY[i]} w={92} h={40} r={8} seed={seedOf(`rg${i}${c}`)} stroke={TONE[st]} fill={st === 'idle' ? undefined : TONE[st]} dashed={st === 'idle'} strokeWidth={act && st !== 'idle' ? 2.2 : 1.4} />
                      <HandText x={CX[c]} y={RY[i]} size={TEXT_SIZES.label} color={st === 'idle' ? 'var(--muted)' : 'var(--fg)'}>
                        {st === 'idle' ? 'not run' : st}
                      </HandText>
                    </g>
                  );
                })}
              </g>
            );
          })}
          {s.bottom === 'status' && (
            <>
              <SketchBox cx={360} cy={300} w={640} h={60} r={8} seed={seedOf('rg-status')} stroke="var(--accent)" fill="var(--accent-soft)" strokeWidth={2.2} />
              <HandText x={360} y={300} size={TEXT_SIZES.label}>
                {'Switch flipped: release 42 off, release 41 serving\nbad answers reached about 490 requests'}
              </HandText>
            </>
          )}
          {s.bottom === 'timeline' && (
            <>
              <HandText x={29} y={262} anchor="start" size={TEXT_SIZES.label}>
                With a canary and a gate
              </HandText>
              <SketchBox cx={60 + 8} cy={288} w={16} h={16} r={4} seed={seedOf('rg-t1')} stroke="var(--ok)" fill="var(--ok)" />
              <HandText x={92} y={288} anchor="start" size={TEXT_SIZES.note} color="var(--ok)">
                about 12 hours
              </HandText>
              <HandText x={29} y={326} anchor="start" size={TEXT_SIZES.label}>
                Waiting for user reports (Anthropic, 2025)
              </HandText>
              <SketchBox cx={60 + 300} cy={352} w={600} h={16} r={4} seed={seedOf('rg-t2')} stroke="var(--bad)" fill="var(--bad)" />
              <HandText x={360} y={352} size={TEXT_SIZES.note} halo>
                30 days
              </HandText>
            </>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
