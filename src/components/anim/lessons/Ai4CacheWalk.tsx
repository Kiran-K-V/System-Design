import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { rowsCost, type CacheState } from './Ai4CacheMath';

type Tone = 'warn' | 'ok' | 'bad' | 'accent' | 'muted';
interface Row {
  label: string;
  tokens: number;
  state: CacheState;
  /** Visual tone. A rewritten block ("miss") is drawn bad but billed as a write. */
  tone: Tone;
  tag: string;
}
interface Step {
  caption: string;
  request: string;
  rows: Row[];
  bpAfter: number;
}

const r = (label: string, tokens: number, state: CacheState, tone: Tone, tag: string): Row => ({ label, tokens, state, tone, tag });
const W = (label: string, tokens: number): Row => r(label, tokens, 'write', 'warn', 'written, 1.25x');
const H = (label: string, tokens: number): Row => r(label, tokens, 'hit', 'ok', 'cache hit, 0.05x');
const M = (label: string, tokens: number): Row => r(label, tokens, 'write', 'bad', 'miss, rewritten 1.25x');
const N = (label: string, tokens: number): Row => r(label, tokens, 'new', 'muted', 'after breakpoint, 1x');

const steps: Step[] = [
  {
    request: 'Request 1',
    caption: 'Request 1. The prompt is tools, then system rules, then a 148,000-token document, then the question. The breakpoint sits after the document. Nothing is cached yet, so the prefix is written at 1.25 times the input price. The question comes after the breakpoint and pays the plain price.',
    rows: [W('Tools', 1500), W('System rules', 500), W('Document', 148000), N('Question 1', 200)],
    bpAfter: 2,
  },
  {
    request: 'Request 2',
    caption: 'Request 2 has a new question and the same 150,000-token prefix. Every byte before the breakpoint matches, so the prefix is read from the cache. Cost drops from the write price to the read price.',
    rows: [H('Tools', 1500), H('System rules', 500), H('Document', 148000), N('Question 2', 200)],
    bpAfter: 2,
  },
  {
    request: 'Request 3',
    caption: 'Someone adds "Current time: ..." as the first line of the system rules. The tools still match, so they hit. The system block changed, so it misses, and every block after it misses too, even though the document did not change. The prefix is written again.',
    rows: [H('Tools', 1500), M('System + time', 510), M('Document', 148000), N('Question 3', 200)],
    bpAfter: 2,
  },
  {
    request: 'Request 4',
    caption: 'Request 4, one minute later. The time text has changed, so the system block differs again and the whole prefix misses again. The hit rate is now zero on every request. The bill is higher than with no caching, because every write costs 1.25 times the input price.',
    rows: [H('Tools', 1500), M('System + time', 510), M('Document', 148000), N('Question 4', 200)],
    bpAfter: 2,
  },
  {
    request: 'Request 5',
    caption: 'The fix: move the time into the last block, after the breakpoint. The first request after the fix writes the new prefix once, because the old entry no longer matches.',
    rows: [W('Tools', 1500), W('System rules', 500), W('Document', 148000), N('Time + question 5', 220)],
    bpAfter: 2,
  },
  {
    request: 'Request 6',
    caption: 'Request 6. The time changed, but it sits after the breakpoint, so the prefix is untouched and hits again. Rule: whatever changes goes last.',
    rows: [H('Tools', 1500), H('System rules', 500), H('Document', 148000), N('Time + question 6', 220)],
    bpAfter: 2,
  },
  {
    request: 'Request 7',
    caption: 'Someone edits one tool description. Tools come first in the prefix order, so the edit invalidates the tools, the system block, and the messages. Everything is rewritten. A tool change is the most expensive edit you can make.',
    rows: [M('Tools (edited)', 1520), M('System rules', 500), M('Document', 148000), N('Time + question 7', 220)],
    bpAfter: 2,
  },
];

const ROW_Y = (i: number) => 54 + i * 54;
const tone = (t: Tone) => `var(--${t})`;

export default function Ai4CacheWalk() {
  return (
    <AnimFrame title="Seven requests, one prefix" steps={steps} interval={5200}>
      {(i, s) => {
        const cost = rowsCost(s.rows);
        return (
          <SketchSvg width={720} height={300} label={`${s.request} of a cached prompt, cost ${cost.toFixed(4)} dollars`}>
            <HandText x={20} y={20} anchor="start" size={TEXT_SIZES.heading} color="var(--accent)">{s.request}</HandText>
            {s.rows.map((row, k) => (
              <g key={`${row.label}-${k}`}>
                <SketchBox cx={210} cy={ROW_Y(k)} w={380} h={44} r={8} seed={seedOf(`cw-${k}`)} fill={tone(row.tone)} stroke={tone(row.tone)} strokeWidth={row.tone === 'muted' ? 1.4 : 2.2} />
                <HandText x={30} y={ROW_Y(k)} anchor="start" size={TEXT_SIZES.label}>{row.label}</HandText>
                <HandText x={392} y={ROW_Y(k)} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">{`${row.tokens.toLocaleString('en-US')} tok`}</HandText>
                <HandText x={420} y={ROW_Y(k)} anchor="start" size={TEXT_SIZES.note} color={row.tone === 'muted' ? 'var(--muted)' : tone(row.tone)}>{row.tag}</HandText>
              </g>
            ))}
            <SketchArrow points={[[14, ROW_Y(s.bpAfter - 1) + 27], [406, ROW_Y(s.bpAfter - 1) + 27]]} head="none" dashed seed={seedOf('cw-bp')} stroke="var(--accent)" />
            <HandText x={706} y={ROW_Y(s.bpAfter - 1) + 27} anchor="end" size={TEXT_SIZES.note} color="var(--accent)">cache breakpoint</HandText>
            <HandText x={706} y={ROW_Y(3) + 40} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">input cost, Sonnet 5.5</HandText>
            <HandText x={706} y={ROW_Y(3) + 72} anchor="end" size={TEXT_SIZES.display} mono color={cost > 0.2 ? 'var(--bad)' : 'var(--ok)'}>{`$${cost.toFixed(4)}`}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
