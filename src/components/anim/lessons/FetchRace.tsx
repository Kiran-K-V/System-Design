import { motion } from 'motion/react';
import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/**
 * One screen, three API styles. Same data, same 80 ms round trip.
 * Steps reveal the round trips each style needs, on a shared time axis.
 */

const RTT = 80; // ms, assumed phone-to-server round trip
const X0 = 176;
const PX = 2.2; // pixels per ms
const x = (ms: number) => X0 + ms * PX;

interface Bar {
  lane: 0 | 1 | 2;
  from: number;
  /** stacked parallel calls */
  count?: number;
  label: string;
  note?: string;
  noteTone?: string;
  appearsAt: number;
}

const LANE_Y = [88, 236, 330];

const BARS: Bar[] = [
  { lane: 0, from: 0, label: 'GET /users/7', note: 'sends ~2 KB, we use 2 fields', noteTone: 'var(--bad)', appearsAt: 1 },
  { lane: 0, from: RTT, label: 'GET /users/7/posts', note: 'only author ids, no names', noteTone: 'var(--bad)', appearsAt: 2 },
  { lane: 0, from: 2 * RTT, count: 3, label: 'GET /users/{id} ×3', note: 'one call per author', noteTone: 'var(--bad)', appearsAt: 3 },
  { lane: 1, from: 0, label: 'POST /graphql', appearsAt: 4 },
  { lane: 2, from: 0, label: 'GetProfileScreen(7)', note: 'fixed shape built for this screen', noteTone: 'var(--muted)', appearsAt: 5 },
];

const STATS = [
  { lane: 0, at: 3, lines: '5 requests\n3 round trips\n~240 ms\n~11 KB', color: 'var(--bad)' },
  { lane: 1, at: 4, lines: '1 request\n1 round trip\n~85 ms\n~0.6 KB', color: 'var(--ok)' },
  { lane: 2, at: 5, lines: '1 request\n1 round trip\n~85 ms\n~0.8 KB', color: 'var(--ok)' },
];

const LANES = [
  { name: 'REST', sub: 'one URL per\nresource' },
  { name: 'GraphQL', sub: 'client picks\nthe fields' },
  { name: 'RPC', sub: 'one method\nper need' },
];

const steps = [
  {
    caption:
      'One mobile screen needs: the user name and avatar, plus the last 3 posts, each with its author name and avatar. We compare three API styles. Assume an 80 ms round trip from phone to server, and assume the server answers in a few ms.',
  },
  {
    caption:
      'REST, call 1: GET /users/7. The server returns the whole user object, about 40 fields and ~2 KB (assumed). The screen needs 2 fields. This is over-fetching: the response carries more than the client needs.',
  },
  {
    caption:
      'REST, call 2: GET /users/7/posts. Each post holds only an author_id, not the author name. The client cannot ask for the next calls until it has these ids. This is under-fetching: one call does not return enough.',
  },
  {
    caption:
      'REST, call 3: three requests in parallel, one per author. That is 5 requests in 3 sequential round trips: ~240 ms. Each round trip waits on the one before it. Parallel calls help only inside a wave.',
  },
  {
    caption:
      'GraphQL: one request to /graphql. The query names the exact fields, nested: user, posts, and each post author. The server walks the graph and returns exactly that shape. One round trip, ~0.6 KB.',
  },
  {
    caption:
      'RPC: a method written for this screen, GetProfileScreen. One round trip too. The client does not choose fields. The server team shaped the answer for this one need.',
  },
  {
    caption:
      'Same screen, same data: 3 round trips against 1. The cost did not vanish. GraphQL moves the fan-out into the server, where it can turn into many database queries. RPC moves it into a per-screen method that a team must keep writing.',
  },
];

function Lane({ i, step }: { i: 0 | 1 | 2; step: number }) {
  const y = LANE_Y[i];
  const bars = BARS.filter((b) => b.lane === i && b.appearsAt <= step);
  const stat = STATS.find((s) => s.lane === i && s.at <= step);
  const active = BARS.filter((b) => b.lane === i).some((b) => b.appearsAt === step);
  return (
    <g>
      <HandText x={14} y={y - 10} size={20} anchor="start" weight={700} color={active ? 'var(--accent)' : 'var(--fg)'}>
        {LANES[i].name}
      </HandText>
      <HandText x={14} y={y + 20} size={12} anchor="start" color="var(--muted)">
        {LANES[i].sub}
      </HandText>
      {bars.map((b) => {
        const n = b.count ?? 1;
        const h = n > 1 ? 15 : 30;
        const isNew = b.appearsAt === step;
        return (
          <motion.g
            key={b.label}
            initial={isNew ? { opacity: 0, x: -10 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {Array.from({ length: n }, (_, k) => {
              const cy = y + (k - (n - 1) / 2) * (h + 3) - (n > 1 ? 0 : 0);
              return (
                <g key={k}>
                  <rect x={x(b.from)} y={cy - h / 2} width={RTT * PX} height={h} rx={6} fill="var(--accent-soft)" />
                  <SketchBox cx={x(b.from) + (RTT * PX) / 2} cy={cy} w={RTT * PX} h={h} r={6} seed={seedOf(b.label + k)} stroke={n > 1 ? 'var(--warn)' : 'var(--accent)'} />
                </g>
              );
            })}
            <HandText x={x(b.from) + (RTT * PX) / 2} y={y - (n > 1 ? 32 : 28)} size={13} mono>
              {b.label}
            </HandText>
            {b.note && (
              <HandText x={x(b.from) + (RTT * PX) / 2} y={y + (n > 1 ? 40 : 30)} size={12} color={b.noteTone}>
                {b.note}
              </HandText>
            )}
          </motion.g>
        );
      })}
      {i === 1 && step >= 4 && (
        <motion.g initial={step === 4 ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <HandText x={X0} y={y + 52} size={12} anchor="start" mono color="var(--muted)">
            {'{ user(id: 7) { name avatar posts(first: 3) { text author { name avatar } } } }'}
          </HandText>
        </motion.g>
      )}
      {stat && (
        <motion.g initial={stat.at === step ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <HandText x={768} y={y} size={15} color={stat.color} weight={700}>
            {stat.lines}
          </HandText>
        </motion.g>
      )}
    </g>
  );
}

export default function FetchRace() {
  return (
    <AnimFrame title="One screen, three API styles" steps={steps} interval={3000}>
      {(i) => (
        <SketchSvg width={900} height={420} label="Timeline of round trips for REST, GraphQL and RPC fetching the same profile screen">
          {[1, 2].map((k) => (
            <SketchArrow key={k} points={[[10, [0, 164, 290][k]], [890, [0, 164, 290][k]]]} head="none" dashed stroke="var(--border)" strokeWidth={1} seed={seedOf('sep' + k)} />
          ))}
          <Lane i={0} step={i} />
          <Lane i={1} step={i} />
          <Lane i={2} step={i} />
          <SketchArrow points={[[X0, 392], [x(320), 392]]} head="end" stroke="var(--muted)" strokeWidth={1} seed={seedOf('axis')} />
          {[0, 80, 160, 240].map((t) => (
            <HandText key={t} x={x(t)} y={408} size={12} color="var(--muted)">
              {`${t} ms`}
            </HandText>
          ))}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
