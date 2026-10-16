import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { ACTIONS, ALL_CELLS, ROWS, cellState, grantedCount, type CellState } from './Ai10PermLogic';

/** Illustrative support agent. Steps follow the task-scoped, read-only-by-default, approval-for-writes pattern. */
const CAPTIONS = [
  'Start: one shared admin token. The agent can read, write, delete, and send in every tool. That is 13 of 13 cells. A single injected instruction can use any of them.',
  'Step 1: scope to the task. The task is "triage my open tickets", so it needs only Tickets and Email. Billing, Users, and Files are removed from this run. The agent cannot call a tool it was never given.',
  'Step 2: scope to the action. Inside those two tools the task needs three cells: read tickets, write a comment, and send one email to the user. Delete and read-mail are removed. 3 of 13 remain.',
  'Step 3: read-only by default. Reading runs freely. The write and the send now wait for a person ("ask"). The agent can still do its job, but every change leaves a record that someone saw.',
  'Step 4: an injection arrives in a ticket body. It says: delete all tickets and read the billing table. Both cells are outside the grant, so a plain code check refuses them. No model had to notice the attack.',
  'Step 5: the injection also asks to send mail to an outside address. This cell is in the grant, so it reaches the approval prompt with the exact recipient and body. The person sees an unknown address and denies it.',
];

const tone = (s: CellState) => (s === 'granted' ? 'var(--ok)' : s === 'ask' ? 'var(--warn)' : s === 'blocked' || s === 'denied' ? 'var(--bad)' : 'var(--muted)');
const word = (s: CellState) => (s === 'granted' ? 'yes' : s === 'ask' ? 'ask' : s === 'blocked' ? 'blocked' : s === 'denied' ? 'denied' : 'removed');

const COL_X = [270, 380, 490, 600];
const ROW_Y = [112, 160, 208, 256, 304];

export default function Ai10PermMatrix() {
  const steps = CAPTIONS.map((caption) => ({ caption }));
  return (
    <AnimFrame title="Shrinking one agent's permissions, then meeting an injection" steps={steps} interval={5200}>
      {(i) => (
        <SketchSvg width={720} height={350} label={`Permission matrix, step ${i}. ${grantedCount(i)} of ${ALL_CELLS.length} cells granted.`}>
          <HandText x={24} y={24} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
            Tools by action
          </HandText>
          <HandText x={696} y={24} anchor="end" size={TEXT_SIZES.heading} color={i === 0 ? 'var(--bad)' : 'var(--ok)'}>
            {`${grantedCount(i)} of ${ALL_CELLS.length} cells granted`}
          </HandText>
          {ACTIONS.map((a, c) => (
            <HandText key={a} x={COL_X[c]} y={66} size={TEXT_SIZES.heading} color="var(--muted)">
              {a}
            </HandText>
          ))}
          {ROWS.map((r, ri) => (
            <g key={r.id}>
              <HandText x={24} y={ROW_Y[ri]} anchor="start" size={TEXT_SIZES.label} color={ROWS.length && r.actions.every((a) => cellState(i, r.id, a) === 'removed') ? 'var(--muted)' : 'var(--fg)'}>
                {r.label}
              </HandText>
              {ACTIONS.map((a, c) => {
                const s = cellState(i, r.id, a);
                if (s === 'na') return null;
                const hot = s === 'blocked' || s === 'denied';
                return (
                  <g key={a}>
                    <SketchBox cx={COL_X[c]} cy={ROW_Y[ri]} w={96} h={38} r={6} seed={seedOf(`pm${r.id}${a}`)} stroke={tone(s)} fill={s === 'removed' ? undefined : tone(s)} dashed={s === 'removed'} strokeWidth={hot ? 2.2 : 1.4} />
                    <HandText x={COL_X[c]} y={ROW_Y[ri]} size={TEXT_SIZES.label} color={s === 'removed' ? 'var(--muted)' : 'var(--fg)'}>
                      {word(s)}
                    </HandText>
                  </g>
                );
              })}
            </g>
          ))}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
