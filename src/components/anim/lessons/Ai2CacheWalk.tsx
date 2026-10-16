import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { CACHE_MODELS } from './Ai2CacheMath';

const M = CACHE_MODELS.find((m) => m.id === 'sonnet55')!;
const PREFIX = 20000;
const UNIT = (PREFIX * M.input) / 1e6; // $0.04: one uncached prefix
const READ_MULT = M.read / M.input; // 0.05 for Sonnet 5.5
const money = (v: number) => `$${v.toFixed(3)}`;

type Kind = 'idle' | 'write' | 'hit' | 'rewrite';
interface Step {
  caption: string;
  rows: [Kind, Kind, Kind, Kind];
}

const mult = (k: Kind) => (k === 'write' || k === 'rewrite' ? M.write5 : k === 'hit' ? READ_MULT : 0);
const tone = (k: Kind) => (k === 'write' ? 'var(--warn)' : k === 'hit' ? 'var(--ok)' : k === 'rewrite' ? 'var(--bad)' : 'var(--muted)');
const status = (k: Kind) => (k === 'write' ? 'miss, write 1.25x' : k === 'hit' ? 'hit, read 0.05x' : k === 'rewrite' ? 'expired, write 1.25x' : 'waiting');

const steps: Step[] = [
  {
    caption: `A 20,000-token system prompt and tool list starts every request. A new question of a few hundred tokens follows. Without caching, each call pays full price for the 20,000: ${money(UNIT)} at $${M.input} per million (Sonnet 5.5). Dashed bars mark that uncached price.`,
    rows: ['idle', 'idle', 'idle', 'idle'],
  },
  {
    caption: `Request 1 finds nothing stored. The provider computes the prefix and keeps its KV entries. This write costs 1.25x: ${money(UNIT * M.write5)}, which is ${money(UNIT * (M.write5 - 1))} more than no caching. You pay a small premium to open the cache.`,
    rows: ['write', 'idle', 'idle', 'idle'],
  },
  {
    caption: `Request 2 arrives 2 minutes later, inside the 5-minute window. Its first 20,000 tokens match the stored prefix byte for byte, so the provider skips the prefix prefill and reads the stored KV. A read on Sonnet 5.5 costs 0.05x: ${money(UNIT * READ_MULT)}. The use also refreshes the timer.`,
    rows: ['write', 'hit', 'idle', 'idle'],
  },
  {
    caption: `Request 3 hits too: ${money(UNIT * READ_MULT)} again. The new question is not cached and is billed as normal input, but it is small. Most of the bill now sits in the part that repeats.`,
    rows: ['write', 'hit', 'hit', 'idle'],
  },
  {
    caption: `Three calls: ${money(UNIT * (M.write5 + 2 * READ_MULT))} cached against ${money(UNIT * 3)} uncached, a ${Math.round((1 - (M.write5 + 2 * READ_MULT) / 3) * 100)}% saving on the prefix. The write premium of ${money(UNIT * 0.25)} was repaid by the first hit. Most other models read at 0.1x; the shape is the same.`,
    rows: ['write', 'hit', 'hit', 'idle'],
  },
  {
    caption: `Now the user leaves for 6 minutes. The 5-minute entry expires. Request 4 misses and pays the 1.25x write again. Latency also returns to its first-request value. Cache hits depend on traffic spacing, not only on the prompt.`,
    rows: ['write', 'hit', 'hit', 'rewrite'],
  },
];

const ROW_Y = [62, 124, 186, 248];
const BAR_X = 392;
const PX = 200; // pixels for one uncached prefix

export default function Ai2CacheWalk() {
  return (
    <AnimFrame title="A cache write, then reads, over 4 requests" steps={steps} interval={4800}>
      {(i, s) => {
        const cached = s.rows.reduce((a, k) => a + mult(k) * UNIT, 0);
        const n = s.rows.filter((k) => k !== 'idle').length;
        const plain = n * UNIT;
        return (
          <SketchSvg width={720} height={330} label={`Step ${i + 1}: cache write and reads over four requests`}>
            <HandText x={225} y={20} size={TEXT_SIZES.note} color="var(--muted)">prompt</HandText>
            <HandText x={560} y={20} size={TEXT_SIZES.note} color="var(--muted)">prefix cost (dashed = uncached)</HandText>
            {s.rows.map((k, r) => {
              const y = ROW_Y[r];
              const active = k !== 'idle';
              const latest = r === s.rows.map((x) => x !== 'idle').lastIndexOf(true) && i !== 4;
              const c = tone(k);
              const w = Math.max(6, mult(k) * PX);
              return (
                <g key={r}>
                  <SketchBox cx={62} cy={y} w={100} h={44} r={8} seed={seedOf(`cw-l${r}`)} stroke={latest ? 'var(--accent)' : active ? 'var(--fg)' : 'var(--muted)'} strokeWidth={latest ? 2.2 : 1.4} dashed={!active} />
                  <HandText x={62} y={y} size={TEXT_SIZES.label} color={active ? 'var(--fg)' : 'var(--muted)'}>{`Request ${r + 1}`}</HandText>
                  <SketchBox cx={215} cy={y} w={170} h={44} r={8} seed={seedOf(`cw-p${r}`)} fill={active ? c : undefined} stroke={c} dashed={!active} />
                  <HandText x={215} y={y - 8} size={TEXT_SIZES.label} color={active ? 'var(--fg)' : 'var(--muted)'}>20K prefix</HandText>
                  <HandText x={215} y={y + 11} size={TEXT_SIZES.note} color={active ? c : 'var(--muted)'}>{status(k)}</HandText>
                  <SketchBox cx={327} cy={y} w={44} h={44} r={6} seed={seedOf(`cw-n${r}`)} stroke="var(--muted)" dashed={!active} />
                  <HandText x={327} y={y} size={TEXT_SIZES.note} color="var(--muted)">new</HandText>
                  <SketchBox cx={BAR_X + PX / 2} cy={y} w={PX} h={26} r={6} seed={seedOf(`cw-d${r}`)} stroke="var(--muted)" dashed />
                  {active && <SketchBox cx={BAR_X + w / 2} cy={y} w={w} h={26} r={6} seed={seedOf(`cw-c${r}-${k}`)} fill={c} stroke={c} strokeWidth={2.2} />}
                  <HandText x={BAR_X + PX + 70} y={y} size={TEXT_SIZES.note} mono color={active ? c : 'var(--muted)'}>{active ? money(mult(k) * UNIT) : '-'}</HandText>
                </g>
              );
            })}
            <HandText x={360} y={304} size={TEXT_SIZES.label} mono color="var(--fg)">
              {n === 0 ? 'cached $0.000 | uncached $0.000' : `cached ${money(cached)} | uncached ${money(plain)}`}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
