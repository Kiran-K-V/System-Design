import { motion } from 'motion/react';
import AnimFrame from '../AnimFrame';
import { HandText, SketchSvg } from '../sketch';

/** Server events happen at these times (seconds). Illustrative. */
const EVENTS = [2.5, 5.5, 8.5];
const POLLS = [1, 3, 5, 7, 9];
const PUSH_DELAY = 0.1;

const X0 = 135;
const PX = 56;
const x = (t: number) => X0 + t * PX;
const ROW = { events: 38, poll: 98, long: 158, sse: 218, ws: 278 };

/** For short polling: the first poll at or after each event delivers it. */
const pollDelivery = EVENTS.map((e) => POLLS.find((p) => p >= e)!);
const emptyPolls = POLLS.filter((p) => !pollDelivery.includes(p));

/** Long polling: each held request ends when its event arrives, and the next starts at once. */
const longBars: { from: number; to: number | null }[] = [];
{
  let start = 0;
  for (const e of EVENTS) {
    longBars.push({ from: start, to: e + PUSH_DELAY });
    start = e + PUSH_DELAY;
  }
  longBars.push({ from: start, to: null });
}

const steps = [
  { caption: 'The server has news at three moments (circles on the top row). How does each approach get that news to the browser? Step forward one second at a time. Watch the delay between each event and its delivery, and count the requests.' },
  { caption: 't = 1 s. Short polling: the browser asks "anything new?" every 2 seconds. This first poll finds nothing, so it was wasted: a full HTTP request and response for no data. Long polling, SSE and WebSocket hold one connection open and wait.' },
  { caption: 't = 2 s. Nothing yet. Short polling is silent between polls. The other three just wait.' },
  { caption: 't = 3 s. The server event happened at 2.5 s. Long polling, SSE and WebSocket delivered it at once (a held request answers). Short polling only learns of it now, at its next poll: 0.5 s late. The delay can be up to a full poll interval.' },
  { caption: 't = 4 s. Long polling answered, so its client immediately sent a new request. That is a new HTTP request and a full set of headers every time, but never an empty one.' },
  { caption: 't = 5 s. Short polling asks again: empty again. At a 2 second interval, a quiet system still sends 1,800 requests per hour per user.' },
  { caption: 't = 6 s. Event 2 occurred at 5.5 s. Three approaches delivered it at once. Short polling still waits for t = 7.' },
  { caption: 't = 7 s. Short polling delivers event 2, 1.5 s late. That is the worst case for this schedule: the event came right after a poll.' },
  { caption: 't = 8 s. Quiet. SSE and WebSocket spend nothing while idle: one open connection, no new requests. The cost is server memory for each open connection.' },
  { caption: 't = 9 s. Event 3 occurred at 8.5 s. Short polling gets it at 9 s, 0.5 s late.' },
  { caption: 'Tally. Short polling: 5 requests, 2 empty, delay 0.5 to 1.5 s. Long polling: 4 requests, 0 empty, delay ~one-way latency. SSE: 1 request, same delay. WebSocket: 1 upgrade request, same delay, and the browser can also send over the same connection.' },
];

function Dot({ cx, cy, color, hollow }: { cx: number; cy: number; color: string; hollow?: boolean }) {
  return <circle cx={cx} cy={cy} r={7} fill={hollow ? 'var(--bg)' : color} stroke={color} strokeWidth={2.2} />;
}

function laneLabel(y: number, name: string, stat: string) {
  return (
    <g>
      <HandText x={8} y={y - 8} size={15} anchor="start" weight={700}>
        {name}
      </HandText>
      <HandText x={8} y={y + 11} size={13} anchor="start" color="var(--muted)">
        {stat}
      </HandText>
    </g>
  );
}

export default function RealtimeLanes() {
  return (
    <AnimFrame title="Four ways to get server news to a browser" steps={steps} interval={2600}>
      {(i) => {
        const t = i;
        const shownEvents = EVENTS.filter((e) => e <= t);
        const polls = POLLS.filter((p) => p <= t);
        const empties = emptyPolls.filter((p) => p <= t);
        const longReqs = longBars.filter((b) => b.from <= t);
        const delivered = EVENTS.filter((e) => e + PUSH_DELAY <= t).length;
        return (
          <SketchSvg width={720} height={345} label="Timeline of four delivery methods over 10 seconds, with server events on the top row">
            {/* time axis */}
            {[0, 2, 4, 6, 8, 10].map((s) => (
              <g key={s}>
                <line x1={x(s)} x2={x(s)} y1={56} y2={304} stroke="var(--border)" strokeDasharray="3 5" />
                <text x={x(s)} y={326} textAnchor="middle" fontSize={13} fill="var(--muted)">{`${s} s`}</text>
              </g>
            ))}
            {/* now marker */}
            <line x1={x(t)} x2={x(t)} y1={52} y2={306} stroke="var(--accent)" strokeWidth={2} />

            {laneLabel(ROW.events, 'Server events', `${shownEvents.length} so far`)}
            {shownEvents.map((e, k) => (
              <g key={e}>
                <Dot cx={x(e)} cy={ROW.events} color="var(--warn)" />
                <text x={x(e)} y={ROW.events - 14} textAnchor="middle" fontSize={13} fill="var(--warn)">{`e${k + 1}`}</text>
              </g>
            ))}

            {laneLabel(ROW.poll, 'Short polling', `${polls.length} req, ${empties.length} empty`)}
            {polls.map((p) => {
              const ev = EVENTS.findIndex((e, k) => pollDelivery[k] === p);
              const empty = ev === -1;
              return (
                <g key={p}>
                  {!empty && <line x1={x(EVENTS[ev])} x2={x(p)} y1={ROW.poll + 14} y2={ROW.poll + 14} stroke="var(--warn)" strokeWidth={3} />}
                  <Dot cx={x(p)} cy={ROW.poll} color={empty ? 'var(--bad)' : 'var(--ok)'} hollow={empty} />
                </g>
              );
            })}

            {laneLabel(ROW.long, 'Long polling', `${longReqs.length} req, 0 empty`)}
            {longReqs.map((b, k) => {
              const end = b.to === null ? t : Math.min(b.to, t);
              const done = b.to !== null && b.to <= t;
              return (
                <g key={k}>
                  <rect x={x(b.from)} y={ROW.long - 6} width={Math.max(0, x(end) - x(b.from))} height={12} rx={4} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
                  {done && <Dot cx={x(b.to!)} cy={ROW.long} color="var(--ok)" />}
                </g>
              );
            })}

            {laneLabel(ROW.sse, 'SSE', `1 req, ${delivered} delivered`)}
            <rect x={x(0)} y={ROW.sse - 4} width={x(t) - x(0)} height={8} rx={4} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
            {EVENTS.filter((e) => e + PUSH_DELAY <= t).map((e) => (
              <Dot key={e} cx={x(e + PUSH_DELAY)} cy={ROW.sse} color="var(--ok)" />
            ))}

            {laneLabel(ROW.ws, 'WebSocket', `1 req, ${delivered} delivered`)}
            <rect x={x(0)} y={ROW.ws - 4} width={x(t) - x(0)} height={8} rx={4} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
            {EVENTS.filter((e) => e + PUSH_DELAY <= t).map((e) => (
              <Dot key={e} cx={x(e + PUSH_DELAY)} cy={ROW.ws} color="var(--ok)" />
            ))}

            <motion.g initial={false} animate={{ opacity: 1 }}>
              <HandText x={X0 + 6 * PX + 20} y={346} size={13} color="var(--muted)">
                {''}
              </HandText>
            </motion.g>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
