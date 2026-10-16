import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** 30 installed skills. One task. Sizes are illustrative, except the "about 100 tokens" metadata figure from the spec. */
const COLS = 10;
const CW = 62;
const CH = 30;
const X0 = 30;
const Y0 = 62;
const MATCH = 17;
const BAR_X = 30;
const BAR_W = 660;
const SCALE = BAR_W / 8000; // 8,000 tokens fill the bar

interface Step {
  caption: string;
  meta: boolean;
  match: boolean;
  body: boolean;
  ref: boolean;
  script: boolean;
  all: boolean;
}
const OFF = { meta: false, match: false, body: false, ref: false, script: false, all: false };
const steps: Step[] = [
  { ...OFF, caption: 'An agent has 30 skills installed. Each is a folder on disk with a SKILL.md file. Nothing is in the context yet. The grid shows the folders.' },
  { ...OFF, meta: true, caption: 'At startup the agent loads only the name and description of each skill into its system prompt. The spec puts this at about 100 tokens per skill, so 30 x 100 = 3,000 tokens. The bodies stay on disk.' },
  { ...OFF, meta: true, match: true, caption: 'A task arrives: "Fill in this PDF form". The model compares it with the 30 descriptions and picks skill 17, pdf-forms. A vague description such as "Helps with PDFs" would make this match unreliable.' },
  { ...OFF, meta: true, match: true, body: true, caption: 'The agent reads the SKILL.md body of skill 17. Illustrative size: 1,300 tokens. The context is now 3,000 + 1,300 = 4,300. The other 29 bodies are still on disk.' },
  { ...OFF, meta: true, match: true, body: true, ref: true, caption: 'The body points to forms.md. The agent reads it only because this task needs it. Illustrative size: 2,000 tokens, so the context is 6,300. A different task would never load this file.' },
  { ...OFF, meta: true, match: true, body: true, ref: true, script: true, caption: 'The body says to run scripts/fill_form.py. The agent runs it. Only the printed output enters the context, illustratively 200 tokens: 6,500 in all. Anthropic: Claude "can run this script without loading either the script or the PDF into context".' },
  { ...OFF, meta: true, match: true, body: true, ref: true, script: true, all: true, caption: 'For comparison: with all 30 procedures pasted in the system prompt at 1,300 tokens each, every request starts at 39,000 tokens, used or not. Skills give 6,500 here, and 3,000 for a request that uses no skill.' },
];

export default function Ai6SkillWalk() {
  return (
    <AnimFrame title="Progressive disclosure: metadata, body, script" steps={steps} interval={4800}>
      {(i, s) => {
        const segs = [
          { t: s.meta ? 3000 : 0, fill: 'var(--muted)', k: 'meta' },
          { t: s.body ? 1300 : 0, fill: 'var(--accent)', k: 'body' },
          { t: s.ref ? 2000 : 0, fill: 'var(--accent)', k: 'ref' },
          { t: s.script ? 200 : 0, fill: 'var(--ok)', k: 'out' },
        ];
        const total = segs.reduce((a, b) => a + b.t, 0);
        let x = BAR_X;
        return (
          <SketchSvg width={720} height={300} label={`Step ${i + 1}`}>
            <HandText x={X0} y={24} anchor="start" size={TEXT_SIZES.heading}>
              30 installed skills (folders on disk)
            </HandText>
            {Array.from({ length: 30 }, (_, n) => {
              const id = n + 1;
              const hit = s.match && id === MATCH;
              return (
                <g key={id}>
                  <SketchBox cx={X0 + (n % COLS) * (CW + 4) + CW / 2} cy={Y0 + Math.floor(n / COLS) * (CH + 6)} w={CW} h={CH} r={6} seed={seedOf(`sk-${id}`)} stroke={hit ? 'var(--accent)' : s.meta ? 'var(--fg)' : 'var(--muted)'} fill={hit ? 'var(--accent)' : undefined} dashed={!s.meta} />
                  <HandText x={X0 + (n % COLS) * (CW + 4) + CW / 2} y={Y0 + Math.floor(n / COLS) * (CH + 6)} size={TEXT_SIZES.note} color={hit ? 'var(--accent)' : 'var(--muted)'}>
                    {String(id)}
                  </HandText>
                </g>
              );
            })}
            <HandText x={X0} y={175} anchor="start" size={TEXT_SIZES.heading}>
              Context
            </HandText>
            <HandText x={BAR_X + BAR_W} y={175} anchor="end" size={TEXT_SIZES.label} mono color={s.all ? 'var(--bad)' : 'var(--accent)'}>
              {s.all ? `${total.toLocaleString('en-US')} here, 39,000 in one big prompt` : `${total.toLocaleString('en-US')} tokens`}
            </HandText>
            <SketchBox cx={BAR_X + BAR_W / 2} cy={212} w={BAR_W + 6} h={40} r={8} seed={seedOf('sk-frame')} stroke="var(--muted)" dashed={false} />
            {segs.map((g) => {
              const w = g.t * SCALE;
              const cx = x + w / 2;
              x += w;
              return w >= 4 ? <SketchBox key={g.k} cx={cx} cy={212} w={w - 1} h={30} r={6} seed={seedOf(`sk-${g.k}`)} fill={g.fill} stroke={g.fill} /> : null;
            })}
            <HandText x={BAR_X} y={256} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              grey: metadata
            </HandText>
            <HandText x={BAR_X + 150} y={256} anchor="start" size={TEXT_SIZES.note} color="var(--accent)">
              blue: body, reference
            </HandText>
            <HandText x={BAR_X + 330} y={256} anchor="start" size={TEXT_SIZES.note} color="var(--ok)">
              green: script output
            </HandText>
 <HandText x={BAR_X} y={278} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              bar = 8,000 tokens. Sizes illustrative.
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
