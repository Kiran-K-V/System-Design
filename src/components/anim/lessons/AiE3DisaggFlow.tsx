import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Kind = 'D' | 'P' | 'K';
interface Blk {
  kind: Kind;
  w: number;
}

const D = (n: number): Blk[] => Array.from({ length: n }, () => ({ kind: 'D', w: 20 }));
const P = (w: number): Blk => ({ kind: 'P', w });
const K = (w: number): Blk => ({ kind: 'K', w });

// Panel 1: one GPU, whole prefill. Panel 2: one GPU, chunked. Panel 3: two pools.
const WHOLE: Blk[] = [...D(5), P(150), ...D(10)];
const STEADY: Blk[] = D(25);
const CHUNK: Blk[] = [...D(5), ...[0, 1, 2, 3].flatMap((): Blk[] => [P(34), ...D(1)]), ...D(10)];
const PREFILL_POOL: Blk[] = [P(150)];
const DECODE_POOL: Blk[] = D(23);

const X0 = 24;
const GAP = 4;
const BH = 26;
const ROW = { whole: 92, chunk: 192, pre: 292, dec: 336 };

interface Step {
  caption: string;
  whole: 'hidden' | 'steady' | 'stall';
  chunk: boolean;
  pools: boolean;
  kv: 'none' | 'fast' | 'slow';
}

const steps: Step[] = [
  {
    caption: 'One GPU serves users who are already reading a streamed answer. Each small box is one decode step: one new token for every user in the batch. The gap between boxes is the time between tokens that each user feels. It is steady.',
    whole: 'steady', chunk: false, pools: false, kv: 'none',
  },
  {
    caption: 'A new request arrives with a long prompt. The GPU must run its prefill (the wide orange box). Prefill is compute-bound and long, and the same GPU does the decode steps. So every user who was reading now waits for the whole prefill. That wait shows up as one huge gap between tokens.',
    whole: 'stall', chunk: false, pools: false, kv: 'none',
  },
  {
    caption: 'Fix 1: chunked prefill. Cut the prompt into pieces. Each step carries one piece plus the decode steps. The gaps shrink to the size of a piece, so users keep streaming. The price: the prompt now needs many more steps, so its own time to first token grows. The two phases still share one GPU and one setup.',
    whole: 'stall', chunk: true, pools: false, kv: 'none',
  },
  {
    caption: 'Fix 2: disaggregation. Give prefill its own GPUs and decode its own GPUs. The decode lane never sees a prefill, so its steps stay steady. Each pool can have its own batch size and its own split of the model over GPUs. The prefill box still takes its time on its own lane.',
    whole: 'stall', chunk: true, pools: true, kv: 'none',
  },
  {
    caption: 'The decode GPU needs the prompt\'s KV cache to continue. The prefill GPU computed it, so it must travel over a link. On a fast link the move is short. This is the cost of the design. (Box widths are illustrative.)',
    whole: 'stall', chunk: true, pools: true, kv: 'fast',
  },
  {
    caption: 'On a slow link the same move takes long, and the user waits for it before the second token. A split only pays off when the link is fast enough, or when the move overlaps with the prefill itself. The next widget lets you change the link.',
    whole: 'stall', chunk: true, pools: true, kv: 'slow',
  },
];

function Row({ blocks, y, keyPrefix, x0 = X0 }: { blocks: Blk[]; y: number; keyPrefix: string; x0?: number }) {
  let x = x0;
  return (
    <g>
      {blocks.map((b, i) => {
        const cx = x + b.w / 2;
        x += b.w + GAP;
        const stroke = b.kind === 'P' ? 'var(--warn)' : b.kind === 'K' ? 'var(--accent)' : 'var(--ok)';
        return <SketchBox key={`${keyPrefix}-${i}`} cx={cx} cy={y} w={b.w} h={BH} r={6} seed={seedOf(`${keyPrefix}-${i}`)} stroke={stroke} fill={b.kind === 'D' ? undefined : stroke} />;
      })}
    </g>
  );
}

function width(blocks: Blk[]) {
  return blocks.reduce((a, b) => a + b.w + GAP, 0);
}

export default function AiE3DisaggFlow() {
  return (
    <AnimFrame title="Mixed batch, chunked prefill, split pools" steps={steps} interval={6500}>
      {(_, s) => {
        const slow = s.kv === 'slow';
        const kvBlock = s.kv === 'none' ? [] : [K(slow ? 150 : 28)];
        const preBlocks = [...PREFILL_POOL, ...kvBlock];
        const stallStart = X0 + width(WHOLE.slice(0, 5));
        return (
          <SketchSvg width={720} height={400} label="Timelines of GPU steps. Decode steps are small green boxes, prefill is a wide orange box, KV transfer is an accent box.">
            <HandText x={24} y={34} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
              One GPU, whole prefill
            </HandText>
            <Row blocks={s.whole === 'steady' ? STEADY : WHOLE} y={ROW.whole} keyPrefix={`w${s.whole}`} />
            {s.whole === 'stall' && (
              <g>
                <SketchArrow points={[[stallStart, ROW.whole + 32], [stallStart + 150, ROW.whole + 32]]} head="both" seed={seedOf('stallarrow')} stroke="var(--bad)" />
                <HandText x={stallStart + 75} y={ROW.whole + 52} size={TEXT_SIZES.note} color="var(--bad)">
                  every reader waits
                </HandText>
              </g>
            )}
            {s.chunk && (
              <g>
                <HandText x={24} y={ROW.chunk - 46} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
                  One GPU, chunked prefill
                </HandText>
                <Row blocks={CHUNK} y={ROW.chunk} keyPrefix="c" />
                <HandText x={24} y={ROW.chunk + 30} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                  short gaps, but the prompt needs more steps
                </HandText>
              </g>
            )}
            {s.pools && (
              <g>
                <HandText x={24} y={ROW.pre - 40} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
                  Two pools
                </HandText>
                <HandText x={X0} y={ROW.pre - 18} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                  prefill pool
                </HandText>
                <Row blocks={preBlocks} y={ROW.pre} keyPrefix={`p${s.kv}`} />
                <HandText x={X0} y={ROW.dec - 22} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                  decode pool
                </HandText>
                <Row blocks={DECODE_POOL} y={ROW.dec} keyPrefix="dp" />
                {s.kv !== 'none' && (
                  <g>
                    <SketchArrow points={[[X0 + 150 + 20, ROW.pre + 16], [X0 + 150 + 60, ROW.dec - 16]]} seed={seedOf('kvarrow')} stroke="var(--accent)" strokeWidth={2.2} />
                    <HandText x={X0 + 150 + 80} y={(ROW.pre + ROW.dec) / 2 + 6} anchor="start" size={TEXT_SIZES.note} color="var(--accent)">
                      {slow ? 'KV cache moves (slow link)' : 'KV cache moves (fast link)'}
                    </HandText>
                  </g>
                )}
              </g>
            )}
            <HandText x={696} y={34} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
              green: decode step, orange: prefill, blue: KV move
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
