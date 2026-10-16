import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { GIB, kvBytesPerToken, model } from './ai2MathA';

const M = model('70b');
const PER_TOKEN = kvBytesPerToken(M); // 327,680 bytes = 320 KiB
// 70B BF16 on 4 x H100: 320 GB total, 140 GB weights, 10% reserve -> 148 GB of room.
const ROOM = 320e9 - 140e9 - 32e9;
const ROOM_GIB = ROOM / GIB;

interface Step {
  caption: string;
  /** 'cells' draws the token and K/V rows. 'bar' draws the memory bar. */
  view: 'cells' | 'bar';
  /** K/V cell state per token 1..6: none, stored, redo (recomputed), new (computed now). */
  kv?: ('none' | 'stored' | 'redo' | 'new')[];
  tokens?: number;
  naive?: string;
  cached?: string;
  seqs?: number;
  tokensPer?: number;
  note?: string;
}

const steps: Step[] = [
  {
    caption:
      'Prefill. A 5-token prompt goes through the model. At every layer each token produces a Key and a Value vector. We keep them: the KV cache now holds 5 tokens. At 320 KiB per token (Llama 3 70B, BF16) that is 5 x 320 KiB = 1.56 MiB.',
    view: 'cells',
    tokens: 5,
    kv: ['stored', 'stored', 'stored', 'stored', 'stored', 'none'],
    note: 'cache: 5 tokens = 1.56 MiB',
  },
  {
    caption:
      'Naive decode. To make token 6 the model needs the Keys and Values of tokens 1 to 5. Without a cache it computes them all again, plus the new one: 6 K/V computations to produce one token. The next step recomputes 7. Work per step grows with length.',
    view: 'cells',
    tokens: 6,
    kv: ['redo', 'redo', 'redo', 'redo', 'redo', 'new'],
    naive: '6',
    cached: '',
    note: 'no cache: recompute everything',
  },
  {
    caption:
      'With the cache. Tokens 1 to 5 already have their K and V, so the model only reads them. It computes K and V for the new token and appends them. 1 K/V computation per step, however long the text. Reading is cheap next to recomputing.',
    view: 'cells',
    tokens: 6,
    kv: ['stored', 'stored', 'stored', 'stored', 'stored', 'new'],
    naive: '6',
    cached: '1',
    note: 'cache: compute 1, read 5',
  },
  {
    caption:
      'Over a whole 1,000-token sequence the naive path computes 1 + 2 + ... + 1,000 = 500,500 K/V sets. The cache computes 1,000. Work falls from quadratic to linear. This is the same idea as lesson A1.4: attention reads the past, so keep the past.',
    view: 'cells',
    tokens: 6,
    kv: ['stored', 'stored', 'stored', 'stored', 'stored', 'stored'],
    naive: '500,500',
    cached: '1,000',
    note: 'for n = 1,000 tokens',
  },
  {
    caption:
      'The price is memory. Take Llama 3 70B in BF16 on 4 x H100: 320 GB, minus 140 GB of weights, minus a 10% reserve, leaves 148 GB (137.8 GiB) for KV. One 8,192-token sequence holds 8,192 x 320 KiB = 2.5 GiB of it.',
    view: 'bar',
    seqs: 1,
    tokensPer: 8192,
    note: '1 sequence',
  },
  {
    caption:
      '32 sequences of 8K tokens hold 80 GiB. That fits in 137.8 GiB. It would not fit on 2 x H100, where room after weights is 20 GB (4 GB with the reserve). The cache, not the weights, now limits how many users you serve.',
    view: 'bar',
    seqs: 32,
    tokensPer: 8192,
    note: '32 sequences',
  },
  {
    caption:
      'At 55 sequences of 8K the room is full. The 56th request must wait. Each session owns its slice and releases it when it ends, like a per-session cache in a backend service. Note what a single 128K-token sequence costs: 40 GiB, the room for 16 sequences of 8K.',
    view: 'bar',
    seqs: 55,
    tokensPer: 8192,
    note: '55 sequences = full',
  },
];

const KV_X = [110, 200, 290, 380, 470, 560];
const kvTone = { none: 'var(--muted)', stored: 'var(--ok)', redo: 'var(--warn)', new: 'var(--accent)' } as const;
const kvText = { none: '', stored: 'K V', redo: 'K V redo', new: 'K V new' } as const;

export default function Ai2KvWalk() {
  return (
    <AnimFrame title="Why the KV cache exists, and what it costs" steps={steps} interval={6000}>
      {(_, s) => {
        if (s.view === 'bar') {
          const used = (s.seqs! * s.tokensPer! * PER_TOKEN) / GIB;
          const w = 600;
          const x0 = 60;
          return (
            <SketchSvg width={720} height={300} label="KV cache memory used against the room left after weights">
              <HandText x={x0} y={36} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
                KV room on 4 x H100 (70B, BF16): 137.8 GiB
              </HandText>
              <rect x={x0} y={70} width={w} height={46} rx={8} fill="none" stroke="var(--muted)" strokeWidth={1.4} />
              <rect x={x0} y={70} width={Math.max(3, Math.min(w, (used / ROOM_GIB) * w))} height={46} rx={8} fill={used >= ROOM_GIB - 2.6 ? 'var(--bad)' : 'var(--accent)'} fillOpacity={0.35} stroke={used >= ROOM_GIB - 2.6 ? 'var(--bad)' : 'var(--accent)'} strokeWidth={1.8} />
              <HandText x={x0} y={142} anchor="start" size={TEXT_SIZES.note} mono color="var(--muted)">
                0
              </HandText>
              <HandText x={x0 + w} y={142} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">
                137.8 GiB
              </HandText>
              <HandText x={360} y={198} size={TEXT_SIZES.display} mono color="var(--accent)">
                {`${used.toFixed(1)} GiB`}
              </HandText>
              <HandText x={360} y={236} size={TEXT_SIZES.label} color="var(--fg)">
                {`${s.seqs} x ${s.tokensPer!.toLocaleString('en-US')} tokens x 320 KiB`}
              </HandText>
              <HandText x={360} y={270} size={TEXT_SIZES.label} color="var(--muted)">
                {`${((used / ROOM_GIB) * 100).toFixed(0)}% of the room`}
              </HandText>
            </SketchSvg>
          );
        }
        const n = s.tokens!;
        return (
          <SketchSvg width={720} height={300} label="Tokens and their Key and Value entries, with and without a cache">
            <HandText x={24} y={34} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              tokens
            </HandText>
            {KV_X.map((x, i) =>
              i < n ? (
                <g key={i}>
                  <SketchBox cx={x} cy={64} w={72} h={44} r={8} seed={seedOf(`kt-${i}`)} />
                  <HandText x={x} y={65} size={TEXT_SIZES.label}>{`t${i + 1}`}</HandText>
                </g>
              ) : null,
            )}
            <HandText x={24} y={120} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              K/V entries
            </HandText>
            {KV_X.map((x, i) => {
              const st = s.kv![i];
              if (st === 'none' || i >= n) return null;
              return (
                <g key={i}>
                  <SketchBox cx={x} cy={160} w={80} h={44} r={8} seed={seedOf(`kk-${i}`)} stroke={kvTone[st]} strokeWidth={st === 'new' ? 2.2 : 1.4} fill={kvTone[st]} />
                  <HandText x={x} y={161} size={TEXT_SIZES.note} mono>{kvText[st]}</HandText>
                  {st === 'redo' && <SketchArrow points={[[x, 134], [x, 108]]} seed={seedOf(`kr-${i}`)} stroke="var(--warn)" />}
                </g>
              );
            })}
            {s.naive && (
              <>
                <SketchBox cx={190} cy={244} w={300} h={60} r={8} seed={seedOf('kn')} stroke="var(--warn)" />
                <HandText x={190} y={232} size={TEXT_SIZES.note} color="var(--muted)">no cache: K/V computed</HandText>
                <HandText x={190} y={256} size={TEXT_SIZES.heading} mono color="var(--warn)">{s.naive}</HandText>
              </>
            )}
            {s.cached && (
              <>
                <SketchBox cx={530} cy={244} w={300} h={60} r={8} seed={seedOf('kc')} stroke="var(--ok)" />
                <HandText x={530} y={232} size={TEXT_SIZES.note} color="var(--muted)">with cache: K/V computed</HandText>
                <HandText x={530} y={256} size={TEXT_SIZES.heading} mono color="var(--ok)">{s.cached}</HandText>
              </>
            )}
            {!s.naive && (
              <HandText x={360} y={250} size={TEXT_SIZES.label} mono color="var(--accent)">{s.note ?? ''}</HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
