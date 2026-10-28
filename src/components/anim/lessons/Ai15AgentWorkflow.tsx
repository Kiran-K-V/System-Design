import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Stage {
  who: string;
  name: string;
  artifact: string;
}

const STAGES: Stage[] = [
  { who: 'You', name: 'Write the spec', artifact: 'SPEC.md: goal and done check' },
  { who: 'You', name: 'Approve the plan', artifact: 'plan: files, steps, open risks' },
  { who: 'Agent', name: 'Build', artifact: 'own branch, own folder' },
  { who: 'Agent', name: 'Verify', artifact: 'a check that says pass or fail' },
  { who: 'You', name: 'Review', artifact: 'the diff plus command output' },
  { who: 'You', name: 'Merge and learn', artifact: 'one new rule, if it slipped' },
];

const steps = [
  { caption: 'Start with the spec. You write what "done" means, as a check the agent can run. Without it the agent has only its own sense of "looks done".' },
  { caption: 'The agent reads code and proposes a plan. It changes no file yet. You read the plan and fix the wrong turns now, when a fix costs one sentence.' },
  { caption: 'The agent builds on its own branch, in its own folder (a worktree). Two agents can work at once and never touch the same files.' },
  { caption: 'The agent runs the check. Red means it reads the output, fixes, and runs again. It stops only when the check goes green. You are not in this loop.' },
  { caption: 'You review the diff and the evidence. A second agent session that did not write the code can read it first. Your attention is the scarce part, so spend it here.' },
  { caption: 'Merge. If the agent made a mistake you have seen before, add one line to the instruction file. The next run starts with that line already in place.' },
];

const X_WHO = 24;
const X_BOX = 200;
const X_ART = 326;
const Y0 = 52;
const DY = 58;
const loopX = 698;

export default function Ai15AgentWorkflow() {
  return (
    <AnimFrame title="From spec to merge: who does what" steps={steps} interval={5000}>
      {(idx) => (
        <SketchSvg width={720} height={Y0 + 5 * DY + 40} label="Six stages: spec, plan, build, verify, review, merge. You own four, the agent owns two.">
          {STAGES.map((s, i) => {
            const y = Y0 + i * DY;
            const active = i === idx;
            const done = i < idx;
            const tone = active ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--muted)';
            return (
              <g key={s.name}>
                <HandText x={X_WHO} y={y} anchor="start" size={TEXT_SIZES.label} color={s.who === 'You' ? 'var(--fg)' : 'var(--muted)'}>
                  {s.who}
                </HandText>
                <SketchBox
                  cx={X_BOX}
                  cy={y}
                  w={190}
                  h={44}
                  r={8}
                  seed={seedOf(`wf${i}`)}
                  stroke={tone}
                  fill={active || done ? tone : undefined}
                  strokeWidth={active ? 2.2 : 1.4}
                  dashed={!active && !done}
                />
                <HandText x={X_BOX} y={y} size={TEXT_SIZES.label} color="var(--fg)">
                  {s.name}
                </HandText>
                <HandText x={X_ART} y={y} anchor="start" size={TEXT_SIZES.note} mono color={active ? 'var(--fg)' : 'var(--muted)'}>
                  {s.artifact}
                </HandText>
                {i < STAGES.length - 1 && (
                  <SketchArrow points={[[X_BOX, y + 28], [X_BOX, y + DY - 28]]} seed={seedOf(`wa${i}`)} stroke="var(--muted)" />
                )}
              </g>
            );
          })}
          {idx === 3 && (
            <HandText x={X_ART} y={Y0 + 3 * DY + 22} anchor="start" size={TEXT_SIZES.note} color="var(--warn)">
              red: read output, fix, run again
            </HandText>
          )}
          {idx === 5 && (
            <SketchArrow
              points={[[loopX - 12, Y0 + 5 * DY], [loopX, Y0 + 5 * DY], [loopX, Y0 + DY], [loopX - 12, Y0]]}
              seed={seedOf('wfloop')}
              stroke="var(--accent)"
              dashed
            />
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
