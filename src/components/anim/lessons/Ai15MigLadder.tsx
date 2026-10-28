import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Ten steps of the migration playbook. The diagram is narrow (380) so text stays readable on a phone. */
interface Stage {
  label: string;
  out: string;
  stop: string;
  caption: string;
}

const STAGES: Stage[] = [
  {
    label: 'Trigger',
    out: 'A dated go or stay decision',
    stop: 'No owner, or no deadline',
    caption: 'A notice arrives or a better model ships. As of 2026-10-28, Anthropic lists claude-sonnet-4-5-20250929 as retiring on November 30, 2026. That is 33 days away. Subtract the time for steps 4 to 9, and you have your real deadline.',
  },
  {
    label: 'Inventory',
    out: 'Every call site, prompt, setting',
    stop: 'A caller nobody can find',
    caption: 'List everything that touches the model: code, config, notebooks, eval jobs, and the judge. A usage export by API key and model finds callers that a code search misses.',
  },
  {
    label: 'Read guide',
    out: 'Hard breaks and silent shifts',
    stop: 'A change no one has read',
    caption: 'Read the vendor guide and sort it into two lists. A hard break returns an error, such as an assistant prefill. A silent shift returns an answer, such as thinking that is on by default.',
  },
  {
    label: 'Replay',
    out: 'Old and new scores, same set',
    stop: 'Old model not re-run today',
    caption: 'Run the old and the new model on the same frozen set, with the prompt unchanged. This is the baseline. It shows what the model changed, before you change anything.',
  },
  {
    label: 'Slice diff',
    out: 'Per-slice table, old vs new',
    stop: 'Only a total, no slices',
    caption: 'Compare old and new per slice, with the case count for each. The overall score may match while a small slice falls. A slice that fell is a reading list for the next step.',
  },
  {
    label: 'Read flips',
    out: 'Flipped cases, cause in words',
    stop: 'A drop nobody can explain',
    caption: 'Open the cases that flipped between old and new, in both directions. Write the cause of each group in words. Give every row one action: fix prompt, fix code, accept, or block.',
  },
  {
    label: 'Re-tune',
    out: 'One prompt change per run, logged',
    stop: 'Dev score up, held-out down',
    caption: 'Now change the prompt. Make one change per run and log it. Tune on one part of the set. Check on a part you did not tune on.',
  },
  {
    label: 'Cost check',
    out: 'Tokens, p95, cost per request',
    stop: 'A number beyond the agreed limit',
    caption: 'Count tokens with the new model, not the old one. Compare input tokens, output tokens, p95 latency, and cost per request on the same set.',
  },
  {
    label: 'Roll out',
    out: 'Shadow, staged share, switch',
    stop: 'Any gate fails: switch back',
    caption: 'First shadow: copy live requests to the new model, grade them, and stub every write tool. Then move a growing share of users in stages, with gates and one switch that sends all traffic back.',
  },
  {
    label: 'Retire',
    out: 'Old path deleted, data archived',
    stop: 'Old deployment still running',
    caption: 'When the new model holds at 100%, delete the old path. Confirm the old deployment is gone. Add fresh traces to the golden set for the next migration.',
  },
];

const W = 380;
const COL_X = [104, 276];
const BW = 160;
const BH = 38;
const ROW0 = 36;
const DY = 50;
const PANEL_Y = 328;

export default function Ai15MigLadder() {
  return (
    <AnimFrame title="The migration playbook, step by step" steps={STAGES.map((s) => ({ caption: s.caption }))} interval={5200}>
      {(index) => {
        const st = STAGES[index];
        return (
          <div className="mx-auto w-full max-w-[460px] [&>svg]:min-w-0!">
            <SketchSvg width={W} height={398} label={`Ten steps of a model migration. Step ${index + 1} is ${st.label}.`}>
              {STAGES.map((s, i) => {
                const col = i < 5 ? 0 : 1;
                const row = i % 5;
                const cx = COL_X[col];
                const cy = ROW0 + row * DY;
                const active = i === index;
                const done = i < index;
                return (
                  <g key={s.label}>
                    <SketchBox
                      cx={cx}
                      cy={cy}
                      w={BW}
                      h={BH}
                      r={8}
                      seed={seedOf(`lad${i}`)}
                      stroke={active ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--muted)'}
                      fill={active ? 'var(--accent)' : done ? 'var(--ok)' : undefined}
                      dashed={!active && !done}
                      strokeWidth={active ? 2.2 : 1.4}
                    />
                    <HandText x={cx} y={cy} size={TEXT_SIZES.label} color={active || done ? 'var(--fg)' : 'var(--muted)'}>
                      {`${i + 1} ${s.label}`}
                    </HandText>
                  </g>
                );
              })}
              <SketchBox cx={W / 2} cy={PANEL_Y + 22} w={W - 32} h={92} r={8} seed={seedOf('lad-panel')} stroke="var(--accent)" fill="var(--accent-soft)" strokeWidth={2.2} />
              <HandText x={W / 2} y={PANEL_Y + 2} size={TEXT_SIZES.label} color="var(--accent)">
                {`Step ${index + 1}: ${st.label}`}
              </HandText>
              <HandText x={W / 2} y={PANEL_Y + 26} size={TEXT_SIZES.note}>
                {`Output: ${st.out}`}
              </HandText>
              <HandText x={W / 2} y={PANEL_Y + 48} size={TEXT_SIZES.note} color="var(--bad)">
                {`Stop if: ${st.stop}`}
              </HandText>
            </SketchSvg>
          </div>
        );
      }}
    </AnimFrame>
  );
}
