import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Compaction of a 200K window. Trigger 150K and summary 8K match the spec's own example; the trigger default is from Anthropic's compaction docs (as of 2026-10-16). */
const WINDOW = 200000;
const TRIGGER = 150000;
const X0 = 30;
const W = 660;
const sx = (n: number) => (n / WINDOW) * W;

type Tone = 'accent' | 'warn' | 'ok' | 'muted' | 'bad';
interface Seg {
  tokens: number;
  tone: Tone;
  label: string;
  dashed?: boolean;
}
interface Step {
  caption: string;
  segs: Seg[];
  lines: { t: string; tone?: Tone }[];
}
const col = (t: Tone) => `var(--${t})`;

const steps: Step[] = [
  {
    caption: 'A long chat has run for 20 turns at about 6K tokens each. History is 120K tokens in a 200K window. The compaction trigger is set at 150K input tokens, which is Anthropic\'s default. The dashed line marks it.',
    segs: [{ tokens: 120000, tone: 'accent', label: '20 turns, 120K' }],
    lines: [{ t: 'trigger: input_tokens >= 150,000' }, { t: 'status: below trigger, nothing happens', tone: 'muted' }],
  },
  {
    caption: 'Turn 25 brings the input to 150K tokens. The trigger fires. Before the next reply, the server must make room.',
    segs: [{ tokens: 150000, tone: 'warn', label: '25 turns, 150K' }],
    lines: [{ t: 'input_tokens = 150,000 >= trigger', tone: 'warn' }, { t: 'status: compaction starts', tone: 'warn' }],
  },
  {
    caption: 'The model reads the whole history and writes a summary. This is one extra model call. It bills input and output tokens, and it adds latency to this turn. The summary here is 8K tokens.',
    segs: [{ tokens: 150000, tone: 'warn', label: 'being summarized' }],
    lines: [{ t: 'extra call: reads 150K, writes 8K', tone: 'warn' }, { t: 'summary keeps: decisions, open bugs, key details' }],
  },
  {
    caption: 'The API drops every block before the compaction block. The window now holds the 8K summary. The 150K of raw turns is gone from the prompt. Keep the raw log in your own storage if you may need it.',
    segs: [{ tokens: 8000, tone: 'ok', label: '' }],
    lines: [{ t: 'window: 8,000 / 200,000', tone: 'ok' }, { t: 'prompt prefix changed: the prompt cache restarts', tone: 'warn' }],
  },
  {
    caption: 'You may also keep the last turns word for word. The docs show how: pause after the summary, then add the last three messages back after the compaction block. Here that is 8K of summary plus 3 turns of 6K.',
    segs: [
      { tokens: 8000, tone: 'ok', label: '' },
      { tokens: 18000, tone: 'accent', label: '3 recent' },
    ],
    lines: [{ t: 'window: 26,000 / 200,000', tone: 'ok' }, { t: 'recent turns stay exact; old turns become prose' }],
  },
  {
    caption: 'What did the summary lose? Anything it did not write down. A file path read at turn 4, an exact error string, an early rule from the user. Anthropic advises tuning for recall first, then precision. Persistent rules belong in a file such as CLAUDE.md.',
    segs: [{ tokens: 8000, tone: 'bad', label: '' }],
    lines: [{ t: 'kept: decisions, unresolved bugs', tone: 'ok' }, { t: 'at risk: exact paths, early instructions, raw output', tone: 'bad' }],
  },
  {
    caption: 'The chat goes on. From 8K the context climbs at 6K per turn and reaches the 150K trigger again after about 24 turns: (150,000 - 8,000) / 6,000 = 23.7. Without a trigger the window would fill after (200,000 - 8,000) / 6,000 = 32 turns.',
    segs: [{ tokens: 8000, tone: 'ok', label: '' }, { tokens: 144000, tone: 'accent', label: '24 new turns', dashed: false }],
    lines: [{ t: 'next compaction: about 24 turns later' }, { t: 'a long task is a saw-tooth, not a line', tone: 'muted' }],
  },
];

export default function Ai4CompactWalk() {
  return (
    <AnimFrame title="Compaction replaces old turns with a summary" steps={steps} interval={4400}>
      {(i, s) => {
        let x = X0;
        return (
          <SketchSvg width={720} height={250} label={`Step ${i + 1} of the compaction walk`}>
            <HandText x={X0} y={20} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              0
            </HandText>
            <HandText x={X0 + W} y={20} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
              200K
            </HandText>
            <SketchBox cx={X0 + W / 2} cy={70} w={W + 6} h={54} r={8} seed={seedOf('cw-frame')} stroke="var(--muted)" />
            {s.segs.map((g, k) => {
              const w = sx(g.tokens);
              const cx = x + w / 2;
              x += w;
              return (
                <g key={k}>
                  <SketchBox cx={cx} cy={70} w={Math.max(w - 2, 6)} h={44} r={6} seed={seedOf(`cw-${i}-${k}`)} fill={col(g.tone)} stroke={col(g.tone)} dashed={g.dashed} />
                  {g.label && w > 90 && (
                    <HandText x={cx} y={70} size={TEXT_SIZES.note}>
                      {g.label}
                    </HandText>
                  )}
                </g>
              );
            })}
            <SketchArrow points={[[X0 + sx(TRIGGER), 36], [X0 + sx(TRIGGER), 108]]} head="none" seed={seedOf('cw-trig')} stroke="var(--warn)" dashed />
            <HandText x={X0 + sx(TRIGGER)} y={124} size={TEXT_SIZES.note} color="var(--warn)">
              trigger 150K
            </HandText>
            <SketchBox cx={X0 + W / 2} cy={195} w={W} h={86} r={8} seed={seedOf('cw-panel')} stroke="var(--muted)" />
            {s.lines.map((l, k) => (
              <HandText key={k} x={50} y={176 + k * 36} anchor="start" size={TEXT_SIZES.label} mono color={l.tone ? col(l.tone) : 'var(--fg)'}>
                {l.t}
              </HandText>
            ))}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
