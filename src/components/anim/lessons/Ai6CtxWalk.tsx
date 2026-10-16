import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { WINDOW, WALK, walkManaged, walkPlain, type Frame } from './Ai6CtxMath';

/** The same 50-step agent run twice. Left to right: the 200K window. Sizes are illustrative (see lesson text). */
const plain = walkPlain();
const managed = walkManaged();
const X0 = 30;
const W = 660;
const px = (t: number) => (t / WINDOW) * W;

interface Step {
  caption: string;
  call: number;
}
const steps: Step[] = [
  { call: 1, caption: `Call 1. Both runs start with ${WALK.base.toLocaleString('en-US')} tokens: the system prompt, the tool definitions, and the task. Each step will add about ${WALK.out} tokens of model output and ${WALK.tool.toLocaleString('en-US')} tokens of tool result. The second run also appends a short note to a file every 5 steps.` },
  { call: 12, caption: 'Call 12. Both runs look the same, 54,500 tokens in the plain run. The tool results (blue) are most of the growth here, because we set them to 4,000 of the 4,500 tokens added per step. That share is our assumption, not a measured figure.' },
  { call: 22, caption: 'Call 22. The plain run is at 99,500 tokens. The managed run just crossed its 100,000 trigger, so it replaced all but the 3 newest tool results with a short placeholder. It fell from 100,300 to 28,660. The notes file kept the decisions.' },
  { call: 33, caption: 'Call 33. The plain run is at 149,000 and every call re-reads all of it. The managed run climbed back to 78,560 and will clear again at call 38.' },
  { call: 44, caption: 'Call 44. The plain run holds 198,500 tokens, 99% of the window. This is the last call that fits: 5,000 + 43 x 4,500 = 198,500. The managed run is at 64,780.' },
  { call: 45, caption: 'Call 45. The plain run would send 203,000 tokens. That does not fit, so the run fails with 5 steps of work still to do. The managed run cleared a second time at call 38 and carries on.' },
  { call: 50, caption: 'Call 50. The managed run finishes with a peak of 96,760 tokens. Its input tokens total 2.9M against 4.5M for the plain run, which stopped after 44 calls. The price of this: cleared results are gone, so anything the agent needs from them must be in the notes or re-fetched.' },
];

function Bar({ y, label, f, calls, over, id }: { y: number; label: string; f: Frame | undefined; calls: number; over: boolean; id: string }) {
  const ctx = f?.ctx ?? WINDOW;
  const tone = over ? 'var(--bad)' : ctx >= 0.9 * WINDOW ? 'var(--warn)' : 'var(--accent)';
  const segs: { t: number; fill: string; k: string }[] = f
    ? [
        { t: f.base, fill: 'var(--muted)', k: 'base' },
        { t: f.out, fill: 'var(--node)', k: 'out' },
        { t: f.tool, fill: tone, k: 'tool' },
        { t: f.placeholder + f.notes, fill: 'var(--ok)', k: 'ph' },
      ]
    : [{ t: WINDOW, fill: 'var(--bad)', k: 'over' }];
  let x = X0;
  return (
    <g>
      <HandText x={X0} y={y - 34} anchor="start" size={TEXT_SIZES.heading}>
        {label}
      </HandText>
      <HandText x={X0 + W} y={y - 34} anchor="end" size={TEXT_SIZES.label} mono color={tone}>
        {over ? 'failed at call 45: 203,000 > 200,000' : `${ctx.toLocaleString('en-US')} tokens`}
      </HandText>
      <SketchBox cx={X0 + W / 2} cy={y} w={W + 6} h={44} r={8} seed={seedOf(`${id}-frame`)} stroke="var(--muted)" />
      {segs.map((s) => {
        const w = px(s.t);
        const cx = x + w / 2;
        x += w;
        return w >= 4 ? <SketchBox key={s.k} cx={cx} cy={y} w={w - 1} h={34} r={6} seed={seedOf(`${id}-${s.k}`)} fill={s.fill} stroke={s.fill} /> : null;
      })}
    </g>
  );
}

export default function Ai6CtxWalk() {
  return (
    <AnimFrame title="A 50-step agent run, with and without clearing" steps={steps} interval={4600}>
      {(i, s) => {
        const over = s.call > plain.calls;
        const pf = plain.frames[s.call - 1];
        const mf = managed.frames[s.call - 1];
        return (
          <SketchSvg width={720} height={295} label={`Step ${i + 1}: call ${s.call}`}>
            <HandText x={X0} y={20} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              {`Call ${s.call} of 50. Bar = 200,000-token window.`}
            </HandText>
            <Bar y={85} label="Plain run" f={pf} calls={s.call} over={over} id="cw-p" />
            <Bar y={190} label="Clear old results + notes file" f={mf} calls={s.call} over={false} id="cw-m" />
            <HandText x={X0} y={250} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              grey: system and task
            </HandText>
            <HandText x={X0 + 330} y={250} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              neutral: model output
            </HandText>
            <HandText x={X0} y={272} anchor="start" size={TEXT_SIZES.note} color="var(--accent)">
              blue: tool results
            </HandText>
            <HandText x={X0 + 330} y={272} anchor="start" size={TEXT_SIZES.note} color="var(--ok)">
              green: placeholders, notes
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
