import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { SPANS, ms, type TraceSpan } from './Ai9TraceMath';

interface Step {
  caption: string;
  /** Number of spans visible. */
  shown: number;
  focus: string | null;
  /** Highlight the slowest model call in the final steps. */
  verdict?: boolean;
}

const steps: Step[] = [
  { caption: 'A customer asks a support bot: "Where is my refund for order 8841?" The bot starts a trace. Time runs left to right, from 0 to 4,300 ms. No work has been recorded yet. All numbers in this picture are made up for teaching.', shown: 0, focus: null },
  { caption: 'The agent run opens the first span. It is the root: the whole job, from question to answer. It has no parent, and its bar will be as long as the whole request.', shown: 1, focus: 'run' },
  { caption: 'The bot first searches the help docs. That is a tool call, so it gets its own span, a child of the run. It took 390 ms.', shown: 2, focus: 'docs' },
  { caption: 'Now the first model call. The span records the tokens sent in (3,120) and the tokens written back (210). It also records why the model stopped: it asked to use a tool, so the run is not finished.', shown: 3, focus: 'm1' },
  { caption: 'The bot runs the tool the model asked for: it looks up order 8841. That took 600 ms. The result goes back to the model as new text.', shown: 4, focus: 'order' },
  { caption: 'The second model call sees more text now: 4,810 tokens in, because the docs and the order result were added. It wrote 380 tokens and stopped because the answer was complete. It took 1,950 ms.', shown: 5, focus: 'm2' },
  { caption: 'Read the trace. Two model calls took 3,150 ms of 4,300 ms, which is 73%. The two tools took 990 ms. The slowest single span is model call 2. A request-level number could never show this.', shown: 5, focus: 'm2', verdict: true },
  { caption: 'The trace also gives the bill. Tokens in: 3,120 + 4,810 = 7,930. Tokens out: 210 + 380 = 590. At $2 per million in and $10 per million out, that is $0.0159 + $0.0059 = $0.0218 for this one run, with no caching.', shown: 5, focus: 'run', verdict: false },
];

const LABEL_X = 20;
const T0 = 330;
const T1 = 690;
const ROW0 = 78;
const ROW = 44;
const MAX_MS = 4400;
const xOf = (t: number) => T0 + (t / MAX_MS) * (T1 - T0);

function attrLine(s: TraceSpan): string {
  if (s.kind === 'model') return `in ${s.tokensIn?.toLocaleString('en-US')}  out ${s.tokensOut}  stopped: ${s.stop}`;
  if (s.kind === 'tool') return `tool call, ${ms(s).toLocaleString('en-US')} ms`;
  return `whole request, ${ms(s).toLocaleString('en-US')} ms`;
}

export default function Ai9TraceWalk() {
  return (
    <AnimFrame title="One agent run, recorded span by span" steps={steps} interval={4200}>
      {(_, st) => {
        const shown = SPANS.slice(0, st.shown);
        const focus = st.focus ? SPANS.find((s) => s.id === st.focus)! : null;
        const h = ROW0 + SPANS.length * ROW + 40;
        return (
          <SketchSvg width={720} height={h} label="Waterfall of the spans in one support-bot run">
            <HandText x={LABEL_X} y={22} size={TEXT_SIZES.heading} anchor="start" color="var(--muted)">
              {st.shown === 0 ? 'trace (no spans yet)' : 'trace for one request'}
            </HandText>
            <HandText x={T1} y={22} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">ms</HandText>
            {[0, 1000, 2000, 3000, 4000].map((t) => (
              <g key={t}>
                <SketchArrow points={[[xOf(t), 46], [xOf(t), ROW0 + SPANS.length * ROW - 14]]} head="none" dashed stroke="var(--border)" strokeWidth={1} seed={seedOf(`g9${t}`)} />
                <HandText x={xOf(t)} y={40} size={TEXT_SIZES.note} color="var(--muted)">{t.toLocaleString('en-US')}</HandText>
              </g>
            ))}
            {shown.map((s, k) => {
              const y = ROW0 + k * ROW;
              const isFocus = st.focus === s.id;
              const slow = st.verdict === true && s.id === 'm2';
              const stroke = slow ? 'var(--bad)' : isFocus ? 'var(--accent)' : 'var(--muted)';
              const w = Math.max(10, xOf(s.end) - xOf(s.start));
              return (
                <g key={s.id}>
                  <HandText x={LABEL_X + s.depth * 18} y={y} size={TEXT_SIZES.label} anchor="start" color={isFocus ? 'var(--accent)' : 'var(--fg)'}>
                    {s.label}
                  </HandText>
                  <HandText x={LABEL_X + s.depth * 18} y={y + 16} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
                    {`${ms(s).toLocaleString('en-US')} ms`}
                  </HandText>
                  <SketchBox cx={xOf(s.start) + w / 2} cy={y + 4} w={w} h={22} r={6} seed={seedOf(`sp9${s.id}`)} stroke={stroke} strokeWidth={isFocus ? 2.2 : 1.4} fill={slow ? 'var(--bad)' : isFocus ? 'var(--accent)' : 'var(--muted)'} fillStyle="solid" />
                </g>
              );
            })}
            {focus && (
              <HandText x={LABEL_X} y={h - 16} size={TEXT_SIZES.label} anchor="start" mono color="var(--muted)">
                {`${focus.label}: ${attrLine(focus)}`}
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
