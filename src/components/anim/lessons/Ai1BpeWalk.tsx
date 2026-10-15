import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { trainBpe } from './Ai1BpeLogic';

const TEXT = 'hug pug pun bun hugs';
const SNAPS = trainBpe(TEXT, 3);

type Phase = 'start' | 'count' | 'merge' | 'end';
interface Step {
  caption: string;
  snap: number;
  phase: Phase;
}

const steps: Step[] = [
  {
    caption:
      'We train a tiny tokenizer on one string: "hug pug pun bun hugs". Start with single characters. Real byte-level BPE (GPT-2, Llama 3) starts from the 256 raw bytes, so any input can be encoded and no "unknown" token is needed. Here: 16 symbols across 5 words.',
    snap: 0,
    phase: 'start',
  },
  {
    caption: 'Count every adjacent pair inside each word. The pair u+g occurs 3 times (hug, pug, hugs). No other pair beats 2. This is a frequency table, like a GROUP BY on neighbors.',
    snap: 0,
    phase: 'count',
  },
  {
    caption: 'Merge the most frequent pair into one new symbol, "ug". It gets the next free id, 256, because ids 0 to 255 are the raw bytes (the minbpe rule). Now 3 symbols fewer: 13.',
    snap: 1,
    phase: 'merge',
  },
  {
    caption: 'Count again on the merged words. h+ug and u+n tie at 2. Ties break by first occurrence in the text, so h+ug wins. The counts change after every merge, so BPE must recount each round.',
    snap: 1,
    phase: 'count',
  },
  {
    caption: 'Merge h+ug into "hug", id 257. "hug" is now one symbol in two words. 11 symbols left.',
    snap: 2,
    phase: 'merge',
  },
  {
    caption: 'Count once more. u+n occurs 2 times (pun, bun). Every other pair occurs once.',
    snap: 2,
    phase: 'count',
  },
  {
    caption: 'Merge u+n into "un", id 258. 9 symbols left. Three merges give a vocabulary of 256 + 3 = 259 tokens. Real tokenizers stop at a target size: about 100K for GPT-4-era tokenizers and 128K for Llama 3.',
    snap: 3,
    phase: 'merge',
  },
  {
    caption:
      'Result: 16 characters became 9 tokens, about 1.8 characters per token on this toy string. Common pieces became single tokens. Rare words stay split into many pieces. That is why rare words, numbers, and other scripts cost more tokens.',
    snap: 3,
    phase: 'end',
  },
];

const tokW = (t: string) => 22 + 12 * t.length;

export default function Ai1BpeWalk() {
  return (
    <AnimFrame title="Byte-pair encoding: three merges on a real string" steps={steps} interval={4800}>
      {(_, s) => {
        const snap = SNAPS[s.snap];
        const lastMerged = s.phase === 'merge' ? snap.merged : undefined;
        const prev = s.phase === 'merge' ? SNAPS[s.snap - 1] : snap;
        const top = prev.counts[0];
        const showBars = s.phase !== 'start' && s.phase !== 'end';
        const mergedToken = s.phase === 'merge' ? prev.merged!.token : null;
        const count = snap.words.flat().length;
        void lastMerged;
        return (
          <SketchSvg width={720} height={340} label="Words split into symbols, with pair counts">
            <HandText x={24} y={22} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
              Words as symbols
            </HandText>
            {showBars && (
              <HandText x={420} y={22} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
                {s.phase === 'merge' ? 'Pair counts (before merge)' : 'Pair counts'}
              </HandText>
            )}
            {snap.words.map((w, r) => {
              let x = 24;
              return (
                <g key={r}>
                  {w.map((t, c) => {
                    const width = tokW(t);
                    const cx = x + width / 2;
                    x += width + 6;
                    const isNew = mergedToken !== null && t === mergedToken;
                    const inPair =
                      s.phase === 'count' &&
                      ((t === top.pair[0] && w[c + 1] === top.pair[1]) || (t === top.pair[1] && w[c - 1] === top.pair[0]));
                    return (
                      <g key={c}>
                        <SketchBox
                          cx={cx}
                          cy={62 + r * 50}
                          w={width}
                          h={36}
                          r={6}
                          seed={seedOf(`bpe-${r}-${c}-${s.snap}-${s.phase}`)}
                          stroke={isNew ? 'var(--accent)' : inPair ? 'var(--warn)' : 'var(--fg)'}
                          strokeWidth={isNew || inPair ? 2.2 : 1.4}
                          fill={isNew ? 'var(--accent)' : inPair ? 'var(--warn)' : undefined}
                        />
                        <HandText x={cx} y={63 + r * 50} size={TEXT_SIZES.label} mono>
                          {t}
                        </HandText>
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {showBars &&
              prev.counts.slice(0, 5).map((c, i) => {
                const isTop = i === 0;
                const tone = isTop ? (s.phase === 'merge' ? 'var(--ok)' : 'var(--accent)') : 'var(--muted)';
                return (
                  <g key={`${c.pair.join('+')}`}>
                    <HandText x={420} y={62 + i * 50} anchor="start" size={TEXT_SIZES.label} mono color={isTop ? tone : 'var(--fg)'}>
                      {`${c.pair[0]}+${c.pair[1]}`}
                    </HandText>
                    <SketchBox cx={520 + (c.n * 56) / 2} cy={62 + i * 50} w={c.n * 56} h={26} r={6} seed={seedOf(`bar-${i}-${c.n}`)} stroke={tone} fill={tone} />
                    <HandText x={520 + c.n * 56 + 14} y={63 + i * 50} anchor="start" size={TEXT_SIZES.label} mono>
                      {String(c.n)}
                    </HandText>
                  </g>
                );
              })}
            <HandText x={24} y={318} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
              {`${count} symbols · vocabulary ${256 + (s.phase === 'merge' ? s.snap : s.phase === 'end' ? 3 : s.snap)} (256 bytes + merges)`}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
