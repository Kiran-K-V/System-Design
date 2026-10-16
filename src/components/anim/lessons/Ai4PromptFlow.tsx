import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Illustrative. A prompt change goes through registry, regression eval, gate, and pinned deploy. The 20-case numbers are made up. */
type Tone = 'idle' | 'accent' | 'ok' | 'bad';
interface Step {
  caption: string;
  active: number;
  tones: Tone[];
  lines: { t: string; tone?: 'ok' | 'bad' | 'muted' }[];
}
const NODES = ['Edit prompt', 'Registry', 'Regression eval', 'Gate', 'Deploy'];
const col = (t: Tone) => (t === 'accent' ? 'var(--accent)' : t === 'ok' ? 'var(--ok)' : t === 'bad' ? 'var(--bad)' : 'var(--muted)');
const lc = (t?: 'ok' | 'bad' | 'muted') => (t === 'ok' ? 'var(--ok)' : t === 'bad' ? 'var(--bad)' : t === 'muted' ? 'var(--muted)' : 'var(--fg)');

const steps: Step[] = [
  {
    caption: 'A developer edits the prompt text to fix one bad answer. The change is a diff in a file, like any code change. It goes to review in a pull request.',
    active: 0,
    tones: ['accent', 'idle', 'idle', 'idle', 'idle'],
    lines: [
      { t: '- Keep answers short.', tone: 'bad' },
      { t: '+ Always answer in the user\'s language, in one line.', tone: 'ok' },
    ],
  },
  {
    caption: 'The registry stores the new text as version v8, with the author and a message. Nothing serves v8 yet. Production is still pinned to v7.',
    active: 1,
    tones: ['ok', 'accent', 'idle', 'idle', 'idle'],
    lines: [
      { t: 'v8  saved, author: kiran, "answer in user language"' },
      { t: 'prod label -> v7 (unchanged)', tone: 'muted' },
    ],
  },
  {
    caption: 'The pipeline runs both versions on the same 20 regression cases. This is a regression eval: a fixed set of inputs with checks. v7 passes 18 of 20. v8 passes 16 of 20 (illustrative).',
    active: 2,
    tones: ['ok', 'ok', 'accent', 'idle', 'idle'],
    lines: [
      { t: 'v7: 18 / 20 pass' },
      { t: 'v8: 16 / 20 pass  (fixes 1, breaks 3)', tone: 'bad' },
    ],
  },
  {
    caption: 'The gate compares the two runs. Rule: no case that passed on v7 may fail on v8. Three cases broke, so the gate blocks the release. The author sees which three cases failed, with the output.',
    active: 3,
    tones: ['ok', 'ok', 'ok', 'bad', 'idle'],
    lines: [
      { t: 'broken: long input, sarcasm, two requests', tone: 'bad' },
      { t: 'gate: BLOCKED. prod stays on v7', tone: 'bad' },
    ],
  },
  {
    caption: 'The author splits the edit into two rules and adds one example. This is v9. It passes 19 of 20 and breaks nothing. The gate passes it.',
    active: 3,
    tones: ['ok', 'ok', 'ok', 'ok', 'idle'],
    lines: [
      { t: 'v9: 19 / 20 pass  (fixes 1, breaks 0)', tone: 'ok' },
      { t: 'gate: PASS', tone: 'ok' },
    ],
  },
  {
    caption: 'The deploy pins production to v9, the way a build pins a library version. The trace log records "v9" on every request. If quality drops in production, move the pin back to v7. That is a rollback with no code change.',
    active: 4,
    tones: ['ok', 'ok', 'ok', 'ok', 'accent'],
    lines: [
      { t: 'prod label -> v9   (v7 kept for rollback)', tone: 'ok' },
      { t: 'every request logs prompt_version = v9' },
    ],
  },
];

export default function Ai4PromptFlow() {
  return (
    <AnimFrame title="A prompt change goes through an eval gate" steps={steps} interval={4200}>
      {(i, s) => (
        <SketchSvg width={720} height={290} label={`Step ${i + 1} of the prompt release pipeline`}>
          {NODES.map((n, k) => {
            const cx = 90 + k * 135;
            const c = col(s.tones[k]);
            return (
              <g key={n}>
                <SketchBox cx={cx} cy={70} w={112} h={60} r={8} seed={seedOf(`pf-${k}`)} fill={s.tones[k] === 'idle' ? undefined : c} stroke={c} strokeWidth={k === s.active ? 2.2 : 1.4} dashed={s.tones[k] === 'idle'} />
                <HandText x={cx} y={70} size={TEXT_SIZES.label} color={s.tones[k] === 'idle' ? 'var(--muted)' : 'var(--fg)'}>
                  {k === 2 ? 'Regression\neval' : n}
                </HandText>
                {k < NODES.length - 1 && <SketchArrow points={[[cx + 62, 70], [cx + 73, 70]]} seed={seedOf(`pfa-${k}`)} stroke={s.tones[k] === 'idle' ? 'var(--muted)' : 'var(--fg)'} />}
              </g>
            );
          })}
          <SketchBox cx={360} cy={200} w={660} h={110} r={8} seed={seedOf('pf-panel')} stroke="var(--muted)" />
          {s.lines.map((l, k) => (
            <HandText key={k} x={50} y={170 + k * 36} anchor="start" size={TEXT_SIZES.label} mono color={lc(l.tone)}>
              {l.t}
            </HandText>
          ))}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
