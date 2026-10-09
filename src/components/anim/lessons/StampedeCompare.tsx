import { motion } from 'motion/react';
import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchCylinder, SketchSvg, seedOf } from '../sketch';

/** Three ways to handle the same hot-key expiry, side by side. */

type Tone = 'ok' | 'warn' | 'bad' | 'muted';
const COLOR: Record<Tone, string> = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', muted: 'var(--muted)' };

interface Col {
  req: string;
  /** Text next to the arrow from readers to the cache. */
  wait?: string;
  cache: string;
  cacheTone: Tone;
  /** Text on the arrow from the cache to the database. */
  toDb?: string;
  db: number;
  dbTone: Tone;
  out: string;
  outTone: Tone;
}

interface CStep {
  caption: string;
  cols: [Col, Col, Col];
}

const TITLES = ['No protection', 'Lease / single-flight', 'Stale-while-revalidate'];

const steps: CStep[] = [
  {
    caption:
      'One hot key, read about 5,000 times a second, cached with a TTL. Rebuilding it takes about 200 ms. These numbers are an example. Three caches face the same moment, each with a different rule. Right now every read is a hit and the database sees nothing.',
    cols: [0, 1, 2].map(() => ({ req: 'readers', cache: 'v1, fresh', cacheTone: 'ok' as Tone, db: 0, dbTone: 'muted' as Tone, out: 'every read is a hit', outTone: 'ok' as Tone })) as [Col, Col, Col],
  },
  {
    caption:
      'The TTL runs out. Columns 1 and 2 delete the value: the key is gone. Column 3 keeps the old value but marks it stale, as the Cache-Control directive stale-while-revalidate allows.',
    cols: [
      { req: 'readers', cache: 'EMPTY (TTL up)', cacheTone: 'bad', db: 0, dbTone: 'muted', out: 'next read will miss', outTone: 'warn' },
      { req: 'readers', cache: 'EMPTY (TTL up)', cacheTone: 'bad', db: 0, dbTone: 'muted', out: 'next read will miss', outTone: 'warn' },
      { req: 'readers', cache: 'v1, stale', cacheTone: 'warn', db: 0, dbTone: 'muted', out: 'v1 still servable', outTone: 'warn' },
    ],
  },
  {
    caption:
      'In the 200 ms it takes to rebuild, about 1,000 reads arrive (5,000 per second x 0.2 s). Column 1: all of them miss and all query the database, 1,000 identical queries for one value. Column 2: the first reader gets a lease and queries. The other 999 are told to wait. Column 3: the first reader starts a refresh in the background. The other 999 get v1 at once.',
    cols: [
      { req: '1,000 reads', cache: 'EMPTY', cacheTone: 'bad', toDb: '1,000 queries', db: 1000, dbTone: 'bad', out: 'all go to the database', outTone: 'bad' },
      { req: '1,000 reads', wait: '999 wait', cache: 'EMPTY, lease out', cacheTone: 'warn', toDb: '1 query', db: 1, dbTone: 'ok', out: '1 rebuilds, 999 wait', outTone: 'warn' },
      { req: '1,000 reads', wait: '999 get v1', cache: 'v1, stale', cacheTone: 'warn', toDb: '1 refresh', db: 1, dbTone: 'ok', out: '1 refreshes, 999 served', outTone: 'ok' },
    ],
  },
  {
    caption:
      'The rebuild finishes. Column 1: the database took 1,000 queries instead of 1. If it cannot take that, every query slows down, readers time out, and timeouts leave the key empty longer. Column 2: the lease holder fills the cache and the waiters retry and hit. Column 3: the refresh replaces v1 with v2. Nobody waited.',
    cols: [
      { req: '1,000 reads', cache: 'v2, set 1,000x', cacheTone: 'warn', db: 1000, dbTone: 'bad', out: 'slow or failed reads', outTone: 'bad' },
      { req: '999 retry', cache: 'v2, set by holder', cacheTone: 'ok', db: 1, dbTone: 'ok', out: 'waiters hit the cache', outTone: 'ok' },
      { req: 'readers', cache: 'v2, fresh', cacheTone: 'ok', db: 1, dbTone: 'ok', out: 'nobody waited', outTone: 'ok' },
    ],
  },
  {
    caption:
      'The score. Database queries: 1,000, 1, 1. Reader cost: column 1 risks an outage. Column 2 makes waiters pause for about one rebuild (here 200 ms). Column 3 never blocks a reader, but readers saw data up to one rebuild old. Pick by what your users tolerate: slow, or slightly old.',
    cols: [
      { req: 'readers', cache: 'v2', cacheTone: 'ok', db: 1000, dbTone: 'bad', out: 'risk: outage', outTone: 'bad' },
      { req: 'readers', cache: 'v2', cacheTone: 'ok', db: 1, dbTone: 'ok', out: 'cost: a short wait', outTone: 'warn' },
      { req: 'readers', cache: 'v2', cacheTone: 'ok', db: 1, dbTone: 'ok', out: 'cost: briefly stale', outTone: 'warn' },
    ],
  },
];

const W = 720;
const CX = [120, 360, 600];
const CW = 214;

export default function StampedeCompare() {
  return (
    <AnimFrame title="A hot key expires: three ways to handle it" steps={steps} interval={4200}>
      {(i, s) => (
        <SketchSvg width={W} height={420} label="Three columns show the same hot key expiring. Without protection the database gets 1,000 queries. With a lease or with stale-while-revalidate it gets one.">
          {s.cols.map((c, k) => {
            const cx = CX[k];
            const miss = i === 2 || i === 3;
            return (
              <g key={k}>
                <HandText x={cx} y={20} size={16} weight={700}>
                  {`${k + 1}  ${TITLES[k]}`}
                </HandText>
                <SketchBox cx={cx} cy={78} w={150} h={44} r={10} seed={seedOf(`req${k}`)} stroke={c.req.includes(',') ? 'var(--accent)' : 'var(--muted)'} />
                <HandText x={cx} y={78} size={15}>
                  {c.req}
                </HandText>
                <SketchArrow points={[[cx, 102], [cx, 140]]} seed={seedOf(`a${k}`)} stroke="var(--muted)" />
                {c.wait && (
                  <HandText x={cx + 10} y={122} size={15} anchor="start" color="var(--warn)">
                    {c.wait}
                  </HandText>
                )}
                <SketchBox cx={cx} cy={170} w={CW} h={56} r={10} seed={seedOf(`cache${k}`)} stroke={COLOR[c.cacheTone]} strokeWidth={2} />
                <HandText x={cx} y={170} size={15} color={COLOR[c.cacheTone]}>
                  {c.cache}
                </HandText>
                <HandText x={cx - CW / 2 + 4} y={211} size={15} anchor="start" color="var(--muted)">
                  cache
                </HandText>

                {c.toDb && (
                  <motion.g key={`db${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    <SketchArrow points={[[cx, 198], [cx, 252]]} seed={seedOf(`b${k}${i}`)} stroke={miss && c.db > 100 ? 'var(--bad)' : 'var(--accent)'} strokeWidth={c.db > 100 ? 3.2 : 1.6} />
                    <HandText x={cx + 10} y={226} size={15} anchor="start" color={c.db > 100 ? 'var(--bad)' : 'var(--ok)'}>
                      {c.toDb}
                    </HandText>
                  </motion.g>
                )}
                <SketchCylinder cx={cx} cy={292} w={90} h={66} seed={seedOf(`db${k}`)} stroke={COLOR[c.dbTone]} />
                <HandText x={cx} y={296} size={15} color="var(--muted)">
                  DB
                </HandText>
                <HandText x={cx} y={344} size={17} weight={700} color={COLOR[c.dbTone]}>
                  {`queries: ${c.db.toLocaleString('en-US')}`}
                </HandText>
                <SketchBox cx={cx} cy={386} w={CW} h={40} r={9} seed={seedOf(`out${k}`)} stroke={COLOR[c.outTone]} />
                <HandText x={cx} y={386} size={15} color={COLOR[c.outTone]}>
                  {c.out}
                </HandText>
              </g>
            );
          })}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
