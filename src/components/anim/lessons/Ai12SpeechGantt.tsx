import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { TARGET_P50, firstAudioMs, sequentialBars, streamedBars, type Bar } from './Ai12SpeechMath';

const SEQ = sequentialBars();
const STR = streamedBars();
const SEQ_TOTAL = firstAudioMs(SEQ);
const STR_TOTAL = firstAudioMs(STR);

const X0 = 220;
const SCALE = 480 / 1500;
const ROW = 28;
const SEQ_Y = 62;
const STR_Y = 292;
const fmt = (n: number) => n.toLocaleString('en-US');

interface Step {
  caption: string;
  /** Bars of the sequential run shown so far (count) and the first one that is new. */
  seqShown: number;
  seqNew: number;
  strShown: number;
  strNew: number;
  target?: boolean;
}

const steps: Step[] = [
  {
    caption:
      'The naive pipeline. The user stops talking at time 0. Capture and endpointing (waiting for silence) takes 120 ms. STT then finalizes the transcript in 60 ms. The network adds 60 ms. Each stage waits for the one before it to finish.',
    seqShown: 3,
    seqNew: 0,
    strShown: 0,
    strNew: 0,
  },
  {
    caption: `Now the model and the voice. The LLM must write the whole answer before TTS starts: 250 ms to the first token plus 500 ms for 40 more at 80 tokens per second, so 750 ms. TTS then speaks the whole clip, 400 ms here. The player buffers 80 ms. First audio comes at ${fmt(SEQ_TOTAL)} ms. The answer-length numbers are illustrative.`,
    seqShown: 6,
    seqNew: 3,
    strShown: 0,
    strNew: 0,
  },
  {
    caption: `The streamed pipeline. Each stage passes on its first output at once, so the next stage starts early. The LLM hands over after its first token (250 ms). TTS starts and makes its first audio in 110 ms. The stage numbers are the ElevenLabs P50 values. First audio comes at ${fmt(STR_TOTAL)} ms.`,
    seqShown: 6,
    seqNew: 6,
    strShown: 6,
    strNew: 0,
  },
  {
    caption: `Streaming did not make any stage faster. It cut the work the user waits for. The LLM still writes its 750 ms answer, but that happens while TTS is already speaking (dashed bar). Saved: ${fmt(SEQ_TOTAL - STR_TOTAL)} ms, or ${(SEQ_TOTAL / STR_TOTAL).toFixed(1)} times faster. The dashed line is the ${TARGET_P50} ms vendor target for the P50.`,
    seqShown: 6,
    seqNew: 6,
    strShown: 7,
    strNew: 6,
    target: true,
  },
];

function Row({ bar, i, y0, state, seedKey }: { bar: Bar; i: number; y0: number; state: 'new' | 'old'; seedKey: string }) {
  const cy = y0 + i * ROW;
  const w = Math.max(bar.dur * SCALE, 8);
  const cx = X0 + bar.start * SCALE + w / 2;
  const tone = state === 'new' ? 'var(--accent)' : 'var(--muted)';
  return (
    <g>
      <HandText x={X0 - 12} y={cy} anchor="end" size={TEXT_SIZES.note} color={state === 'new' ? 'var(--fg)' : 'var(--muted)'}>
        {`${bar.label} ${fmt(Math.round(bar.dur))}`}
      </HandText>
      <SketchBox cx={cx} cy={cy} w={w} h={20} r={6} seed={seedOf(`${seedKey}${bar.id}${state}`)} stroke={tone} fill={tone} dashed={bar.tail} strokeWidth={state === 'new' ? 2.2 : 1.4} />
    </g>
  );
}

export default function Ai12SpeechGantt() {
  return (
    <AnimFrame title="One voice turn: stages in sequence against stages streamed" steps={steps} interval={7000}>
      {(_, s) => (
        <SketchSvg width={720} height={520} label={`Timeline of one voice turn. Sequential first audio at ${fmt(SEQ_TOTAL)} milliseconds, streamed at ${fmt(STR_TOTAL)} milliseconds.`}>
          <HandText x={24} y={26} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
            Sequential
          </HandText>
          {s.seqShown >= 6 && (
            <HandText x={696} y={26} anchor="end" size={TEXT_SIZES.label} mono color="var(--warn)">
              {`first audio ${fmt(SEQ_TOTAL)} ms`}
            </HandText>
          )}
          {SEQ.slice(0, s.seqShown).map((b, i) => (
            <Row key={b.id} bar={b} i={i} y0={SEQ_Y} state={i >= s.seqNew && s.seqNew < s.seqShown && s.strShown === 0 ? 'new' : 'old'} seedKey="sq" />
          ))}

          {s.strShown > 0 && (
            <>
              <HandText x={24} y={256} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
                Streamed
              </HandText>
              <HandText x={696} y={256} anchor="end" size={TEXT_SIZES.label} mono color="var(--ok)">
                {`first audio ${fmt(STR_TOTAL)} ms`}
              </HandText>
              {STR.slice(0, s.strShown).map((b, i) => (
                <Row key={b.id} bar={b} i={i} y0={STR_Y} state={s.strNew === 0 || i >= s.strNew ? 'new' : 'old'} seedKey="st" />
              ))}
            </>
          )}

          {s.target && (
            <>
              <SketchArrow points={[[X0 + TARGET_P50 * SCALE, 44], [X0 + TARGET_P50 * SCALE, 478]]} head="none" dashed stroke="var(--ok)" seed={seedOf('gantt-target')} />
              <HandText x={X0 + TARGET_P50 * SCALE + 6} y={494} anchor="start" size={TEXT_SIZES.note} color="var(--ok)">
                {`${TARGET_P50} ms target`}
              </HandText>
            </>
          )}

          {[0, 500, 1000, 1500].map((t) => (
            <HandText key={t} x={X0 + t * SCALE} y={508} size={TEXT_SIZES.note} mono color="var(--muted)">
              {String(t)}
            </HandText>
          ))}
          <HandText x={X0 - 12} y={508} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
            ms after the user stops
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
