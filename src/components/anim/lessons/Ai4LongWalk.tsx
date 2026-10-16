import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { A, P, chunks, strategyCost } from './Ai4LongMath';

const DOC = 150_000;
const K = chunks(DOC);
const mr = strategyCost('mapreduce', DOC, 1);
const mapIn = K * (A.chunk + A.prompt);
const mapOut = K * A.mapOut;
const redIn = mapOut + A.prompt;

type Tone = 'accent' | 'ok' | 'bad' | 'warn' | 'muted';
interface Step {
  caption: string;
  chunkTone: (c: number) => Tone;
  summaries: boolean;
  summaryTone: (c: number) => Tone;
  reduce: Tone | null;
  note: string;
}
const T_LOST = 16;
const T_NEED = 2;

const steps: Step[] = [
  {
    caption: `One document of ${DOC.toLocaleString('en-US')} tokens. It fits in the 1M window, but suppose we cannot or do not want to send it whole. Map-reduce splits it, summarizes each part, and merges the summaries.`,
    chunkTone: () => 'muted', summaries: false, summaryTone: () => 'muted', reduce: null, note: 'one document, 150,000 tokens',
  },
  {
    caption: `Split into ${K} chunks of ${A.chunk.toLocaleString('en-US')} tokens. The cookbook splits on a delimiter with no overlap between chunks, so a sentence idea that crosses a boundary is cut in two.`,
    chunkTone: () => 'accent', summaries: false, summaryTone: () => 'muted', reduce: null, note: `${K} chunks, no overlap`,
  },
  {
    caption: `Map step: ${K} independent calls, one per chunk. Each reads ${(A.chunk + A.prompt).toLocaleString('en-US')} tokens (chunk plus a ${A.prompt}-token instruction) and writes about ${A.mapOut} tokens. Together that is ${mapIn.toLocaleString('en-US')} input tokens, a little more than the whole document, because every call repeats the instruction. The calls can run in parallel, so latency is one call, not ${K}.`,
    chunkTone: () => 'accent', summaries: true, summaryTone: () => 'ok', reduce: null, note: `${K} calls in parallel`,
  },
  {
    caption: `The ${K} summaries add up to ${mapOut.toLocaleString('en-US')} tokens, 6% of the original. The raw chunks are no longer in play. Only the summaries move on.`,
    chunkTone: () => 'muted', summaries: true, summaryTone: () => 'ok', reduce: null, note: `${mapOut.toLocaleString('en-US')} tokens of summaries`,
  },
  {
    caption: `Reduce step: one call reads all summaries (${redIn.toLocaleString('en-US')} tokens) and writes the answer. Two sequential rounds in all. Cost at Sonnet 5.5 prices: map input ${(mapIn * P.inp / 1e6).toFixed(3)} + map output ${(mapOut * P.out / 1e6).toFixed(3)} + reduce input ${(redIn * P.inp / 1e6).toFixed(4)} + reduce output ${(A.ans * P.out / 1e6).toFixed(3)} = $${mr.total.toFixed(4)} for one question.`,
    chunkTone: () => 'muted', summaries: true, summaryTone: () => 'muted', reduce: 'accent', note: `$${mr.total.toFixed(4)} per question`,
  },
  {
    caption: 'Where it can go wrong (illustrative case). The question needs a fact in chunk 3 and a fact in chunk 17. The summarizer of chunk 17 did not know the question and dropped its fact. The reduce call cannot recover it. The OpenAI cookbook warns that summaries lose detail but gives no loss rate, and we found no sourced number, so we give none.',
    chunkTone: (c) => (c === T_LOST ? 'bad' : c === T_NEED ? 'warn' : 'muted'), summaries: true,
    summaryTone: (c) => (c === T_LOST ? 'bad' : c === T_NEED ? 'warn' : 'muted'), reduce: 'bad', note: 'illustrative: a fact dropped in the map step',
  },
];

const COLS = 15;
const cx = (c: number) => 40 + (c % COLS) * 45;
const cy = (c: number, base: number) => base + Math.floor(c / COLS) * 40;
const tone = (t: Tone) => `var(--${t})`;

export default function Ai4LongWalk() {
  return (
    <AnimFrame title="Map-reduce over 30 chunks" steps={steps} interval={5600}>
      {(i, s) => (
        <SketchSvg width={720} height={330} label={`Step ${i + 1} of a map-reduce walk over ${K} chunks`}>
          <HandText x={20} y={16} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">Chunks</HandText>
          {Array.from({ length: K }, (_, c) => (
            <g key={c}>
              <SketchBox cx={cx(c)} cy={cy(c, 52)} w={36} h={32} r={6} seed={seedOf(`lw-c${c}`)} fill={tone(s.chunkTone(c))} stroke={tone(s.chunkTone(c))} strokeWidth={s.chunkTone(c) === 'muted' ? 1.4 : 2.2} />
              <HandText x={cx(c)} y={cy(c, 52)} size={TEXT_SIZES.note} mono color="var(--muted)">{String(c + 1)}</HandText>
            </g>
          ))}
          {s.summaries && (
            <g>
              <HandText x={20} y={148} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">Summaries</HandText>
              {Array.from({ length: K }, (_, c) => (
                <SketchBox key={c} cx={cx(c)} cy={cy(c, 184)} w={26} h={22} r={6} seed={seedOf(`lw-s${c}`)} fill={tone(s.summaryTone(c))} stroke={tone(s.summaryTone(c))} strokeWidth={s.summaryTone(c) === 'muted' ? 1.4 : 2.2} />
              ))}
            </g>
          )}
          {s.reduce && (
            <g>
              <SketchArrow points={[[360, 252], [360, 266]]} seed={seedOf('lw-ar')} stroke="var(--muted)" />
              <SketchBox cx={360} cy={290} w={260} h={44} r={8} seed={seedOf('lw-red')} fill={tone(s.reduce)} stroke={tone(s.reduce)} strokeWidth={2.2} />
              <HandText x={360} y={290} size={TEXT_SIZES.label}>Reduce: merge, answer</HandText>
            </g>
          )}
          <HandText x={700} y={16} anchor="end" size={TEXT_SIZES.note} color="var(--accent)">{s.note}</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
