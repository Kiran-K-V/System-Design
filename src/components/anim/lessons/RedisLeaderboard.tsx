import { useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { ranked, revRank, zadd, zincrby, type Zset } from './redisZset';

const START: Zset = { alice: 120, bob: 95, carol: 95, dave: 70, erin: 40 };
/** Players who join later, one per click of the "ZADD new player" button. */
const NEWCOMERS: [string, number][] = [['frank', 100], ['gina', 95], ['hank', 10]];

const KEY = 'lb';

export default function RedisLeaderboard() {
  const [z, setZ] = useState<Zset>(START);
  const [joined, setJoined] = useState(0);
  const [cmd, setCmd] = useState('Press a button to send a command.');
  const [watch, setWatch] = useState('dave');

  const rows = ranked(z);
  const rank = revRank(z, watch);

  const bump = (m: string, d: number) => {
    setZ((s) => zincrby(s, m, d));
    setCmd(`ZINCRBY ${KEY} ${d} ${m}`);
  };
  const addNext = () => {
    if (joined >= NEWCOMERS.length) return;
    const [m, s] = NEWCOMERS[joined];
    setZ((cur) => zadd(cur, m, s));
    setJoined(joined + 1);
    setCmd(`ZADD ${KEY} ${s} ${m}`);
  };
  const reset = () => {
    setZ(START);
    setJoined(0);
    setCmd('Press a button to send a command.');
  };

  return (
    <CacheWidgetFrame
      title="Live leaderboard in a sorted set"
      hint="every button sends one command"
      caption={
        <>
          The list is <code>ZRANGE {KEY} 0 4 REV WITHSCORES</code>. Tied scores come out in reverse alphabetical order, so with 95 and 95, <b>carol</b> ranks above <b>bob</b>. Press +60 on dave, and watch a row jump. The set re-sorts as part of the write, so a read is just a slice.
        </>
      }
    >
      <MotionConfig reducedMotion="user">
        <div className="mb-3 rounded-lg bg-surface px-3 py-2 font-mono text-[13px]" aria-live="polite">
          &gt; {cmd}
        </div>
        <ul className="space-y-1.5" aria-label="Top of the leaderboard">
          {rows.slice(0, 5).map((r, i) => (
            <motion.li
              key={r.member}
              layout
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm"
            >
              <span className="w-6 text-muted tabular-nums">{i + 1}</span>
              <span className="w-16 font-medium">{r.member}</span>
              <span className="w-12 tabular-nums">{r.score}</span>
              <span className="ml-auto flex gap-1.5">
                <button type="button" onClick={() => bump(r.member, 10)} className="rounded-md border border-line px-2 py-1 text-xs hover:bg-surface">
                  +10
                </button>
                <button type="button" onClick={() => bump(r.member, 60)} className="rounded-md border border-line px-2 py-1 text-xs hover:bg-surface">
                  +60
                </button>
              </span>
            </motion.li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={addNext}
            disabled={joined >= NEWCOMERS.length}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            ZADD new player
          </button>
          <button type="button" onClick={reset} className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-surface">
            Reset
          </button>
          <label className="ml-auto flex items-center gap-2 text-xs text-muted">
            Rank of
            <select value={watch} onChange={(e) => setWatch(e.target.value)} className="rounded-md border border-line bg-bg px-2 py-1 text-fg">
              {rows.map((r) => (
                <option key={r.member} value={r.member}>
                  {r.member}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          <code>ZREVRANK {KEY} {watch}</code> returns <span className="tabular-nums text-fg">{rank ?? 'nil'}</span> (zero-based). Only the top 5 of {rows.length} players are shown.
        </p>
      </MotionConfig>
    </CacheWidgetFrame>
  );
}
