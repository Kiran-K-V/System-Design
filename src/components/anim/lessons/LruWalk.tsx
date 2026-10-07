import { motion } from 'motion/react';
import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, seedOf } from '../sketch';
import { hitRate, simulate } from './cacheSim';

const TRACE = ['A', 'B', 'C', 'A', 'D', 'B', 'A', 'E'];
const CAP = 3;

const SLOT_W = 108;
const SLOT_GAP = 22;
const X0 = 64;
const slotX = (i: number) => X0 + i * (SLOT_W + SLOT_GAP) + SLOT_W / 2;

function caption(k: number): string {
  const s = simulate('lru', TRACE, CAP, k);
  if (k === 0) {
    return 'An LRU cache (least recently used) holds 3 keys. The rule: every access moves its key to the front. When the cache is full, the key at the back, the one used longest ago, is evicted. Below, the access sequence runs along the top.';
  }
  const l = s.last!;
  if (l.hit) return `Access ${l.key}: hit. The key is already cached. LRU moves it to the front because it is now the most recently used. The others shift back by one.`;
  if (l.evicted) {
    return `Access ${l.key}: miss. The cache is full, so it must drop a key. LRU drops ${l.evicted}, the tail: nobody asked for it for the longest time. ${l.key} enters at the front.${
      k === TRACE.length ? ` Final tally: ${s.hits} hits in ${k} accesses, a ${Math.round(hitRate(s) * 100)}% hit rate. A real LRU uses a hash map plus a doubly linked list, so every access costs O(1).` : ''
    }`;
  }
  return `Access ${l.key}: miss. The key is loaded from the database and put at the front. There is still room, so nothing is evicted.`;
}

export default function LruWalk() {
  const steps = Array.from({ length: TRACE.length + 1 }, (_, k) => ({ caption: caption(k) }));
  return (
    <AnimFrame title="LRU cache, capacity 3" steps={steps} interval={3200}>
      {(k) => {
        const s = simulate('lru', TRACE, CAP, k);
        const prev = simulate('lru', TRACE, CAP, Math.max(0, k - 1));
        return (
          <SketchSvg width={660} height={290} label="An LRU cache with three slots. The accessed key moves to the front. The last key is evicted when a new key arrives.">
            <HandText x={18} y={16} size={15} anchor="start" color="var(--muted)">
              accesses, in order:
            </HandText>
            {TRACE.map((key, i) => {
              const cx = 40 + i * 58;
              const done = i < k;
              const now = i === k - 1;
              return (
                <g key={i} opacity={done ? 1 : 0.45}>
                  {now && <rect x={cx - 22} y={32} width={44} height={40} rx={9} fill="var(--accent-soft)" />}
                  <SketchBox cx={cx} cy={52} w={44} h={40} r={8} seed={seedOf(`t${i}`)} stroke={now ? 'var(--accent)' : 'var(--fg)'} strokeWidth={now ? 2.2 : 1.4} />
                  <HandText x={cx} y={52} size={20} weight={now ? 700 : 400}>
                    {key}
                  </HandText>
                </g>
              );
            })}

            <HandText x={18} y={112} size={15} anchor="start" color="var(--muted)">
              cache (front = most recently used):
            </HandText>
            {Array.from({ length: CAP }, (_, i) => (
              <SketchBox key={i} cx={slotX(i)} cy={168} w={SLOT_W} h={70} r={10} dashed stroke="var(--muted)" seed={seedOf(`slot${i}`)} />
            ))}
            {s.cache.map((e, i) => {
              const justIn = s.last && !s.last.hit && e.key === s.last.key;
              const justHit = s.last && s.last.hit && e.key === s.last.key;
              const wasAt = prev.cache.findIndex((p) => p.key === e.key);
              return (
                <motion.g
                  key={e.key}
                  initial={{ x: slotX(wasAt >= 0 ? wasAt : 0), opacity: wasAt >= 0 ? 1 : 0 }}
                  animate={{ x: slotX(i), opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  {(justHit || justIn) && <rect x={-(SLOT_W - 12) / 2} y={168 - 29} width={SLOT_W - 12} height={58} rx={8} fill={justHit ? 'var(--ok)' : 'var(--accent)'} opacity={0.2} />}
                  <SketchBox cx={0} cy={168} w={SLOT_W - 8} h={62} r={9} seed={seedOf(`k${e.key}`)} stroke={justHit ? 'var(--ok)' : justIn ? 'var(--accent)' : 'var(--fg)'} strokeWidth={justHit || justIn ? 2.4 : 1.4} />
                  <text x={0} y={168} textAnchor="middle" dominantBaseline="middle" fontSize={30} fill="var(--fg)" style={{ fontFamily: 'var(--font-hand)' }}>
                    {e.key}
                  </text>
                </motion.g>
              );
            })}
            <HandText x={slotX(0)} y={222} size={14} color="var(--muted)">
              front: newest use
            </HandText>
            <HandText x={slotX(2)} y={222} size={14} color="var(--bad)">
              back: evicted next
            </HandText>

            {s.last && (
              <HandText x={330} y={262} size={19} weight={700} color={s.last.hit ? 'var(--ok)' : 'var(--warn)'}>
                {s.last.hit
                  ? `${s.last.key}: HIT`
                  : s.last.evicted
                    ? `${s.last.key}: MISS, evicts ${s.last.evicted}`
                    : `${s.last.key}: MISS, room left`}
              </HandText>
            )}
            <HandText x={642} y={262} size={15} anchor="end" color="var(--muted)">
              {`hits ${s.hits} / ${s.hits + s.misses}`}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
