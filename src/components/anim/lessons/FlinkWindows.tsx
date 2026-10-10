import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { Arr, Cell, tv, type TT } from './TechParts';

/** Event times (in seconds) in the order the events reach Flink. */
const ARRIVALS = [3, 7, 12, 9, 16, 8, 25];
const SIZE = 10;
const OUT_OF_ORDER = 5;

interface Seen {
  ts: number;
  win: number;
  late: boolean;
}

/** Pure replay of the first n arrivals: watermark = max timestamp seen minus 5 s. A window fires when the watermark reaches its last second. */
function replay(n: number) {
  const events: Seen[] = [];
  const fired = new Set<number>();
  let max = -Infinity;
  let wm = -OUT_OF_ORDER;
  for (let k = 0; k < n; k++) {
    const ts = ARRIVALS[k];
    const win = Math.floor(ts / SIZE);
    events.push({ ts, win, late: fired.has(win) });
    max = Math.max(max, ts);
    wm = max - OUT_OF_ORDER;
    for (let w = 0; w < 3; w++) if (wm >= (w + 1) * SIZE - 1) fired.add(w);
  }
  return { events, fired, wm };
}

const captions = [
  'Each event carries the time it happened: its event time. We count events in tumbling windows of 10 seconds: [0,10), [10,20), [20,30). The watermark says how far event time has come. Here it is the largest timestamp seen minus 5 seconds, so we accept events up to 5 seconds out of order. The bottom row is the order in which events arrive.',
  'The first event has timestamp 3. It goes into window [0,10). The watermark is 3 − 5 = −2. Nothing is complete yet.',
  'Timestamp 7 arrives. Same window. The watermark is 7 − 5 = 2.',
  'Timestamp 12 arrives and opens window [10,20). The watermark is 12 − 5 = 7. That is below the last second of window [0,10), which is 9. The first window stays open because earlier events may still come.',
  'Timestamp 9 arrives after 12. It is out of order, but window [0,10) is still open, so it counts. The watermark does not move back. It stays at 7, because the largest timestamp is still 12.',
  'Timestamp 16 arrives. The watermark becomes 16 − 5 = 11. It has passed the end of window [0,10), so that window fires: count 3 (events 3, 7, 9). Flink says "no more events with timestamp 9 or less" and trusts that promise.',
  'Timestamp 8 arrives now. Its window already fired. Allowed lateness is 0 by default, so Flink drops the late event. You can keep late events by setting allowed lateness, at the cost of holding window state longer.',
  'Timestamp 25 arrives. The watermark becomes 20. Window [10,20) fires with count 2 (events 12 and 16). Window [20,30) holds 25 and waits. Results depend on event times and the watermark, not on how fast the machine ran.',
].map((caption) => ({ caption }));

const x = (ts: number) => 80 + ts * 18;

export default function FlinkWindows() {
  return (
    <AnimFrame title="Flink: event time, watermarks, and tumbling windows" steps={captions} interval={4800}>
      {(i) => {
        const r = replay(i);
        const last = i > 0 ? r.events[i - 1] : null;
        const counts = [0, 1, 2].map((w) => r.events.filter((e) => e.win === w && !e.late).length);
        const wmX = Math.max(52, Math.min(648, x(r.wm)));
        return (
          <SketchSvg width={720} height={380} label="Events placed on an event-time axis, with a watermark and three tumbling windows">
            <HandText x={360} y={18} size={TEXT_SIZES.label} color="var(--accent)">
              {i === 0 ? 'Window size 10 s. Watermark = max timestamp − 5 s.' : `Event with timestamp ${ARRIVALS[i - 1]} arrives. Watermark = ${r.wm}.`}
            </HandText>
            {[0, 1, 2].map((w) => {
              const done = r.fired.has(w);
              const cx = 170 + w * 180;
              return (
                <g key={w}>
                  <SketchBox cx={cx} cy={145} w={170} h={90} r={8} seed={seedOf(`fw${w}`)} stroke={done ? 'var(--ok)' : 'var(--fg)'} dashed={!done} fill={done ? 'var(--ok)' : undefined} fillStyle="solid" />
                  <HandText x={cx} y={116} size={TEXT_SIZES.note} color="var(--muted)">{`[${w * 10}, ${w * 10 + 10})`}</HandText>
                  {done && (
                    <HandText x={cx} y={176} size={TEXT_SIZES.label} color="var(--ok)">{`fired: count ${counts[w]}`}</HandText>
                  )}
                </g>
              );
            })}
            {r.events.map((e, k) => {
              if (e.late) return null;
              const isNew = k === i - 1;
              const tone: TT = r.fired.has(e.win) ? 'ok' : isNew ? 'accent' : 'fg';
              return <Cell key={k} cx={x(e.ts)} cy={146} w={30} h={30} label={String(e.ts)} tone={tone} sk={`fe${k}`} />;
            })}
            {last?.late && (
              <g>
                <Cell cx={x(last.ts)} cy={66} w={30} h={30} label={String(last.ts)} tone="bad" dashed sk="fe-late" />
                <HandText x={x(last.ts) + 24} y={66} size={TEXT_SIZES.note} anchor="start" color="var(--bad)">
                  late: window already fired, dropped
                </HandText>
              </g>
            )}
            <Arr from={[80, 222]} to={[640, 222]} tone="muted" sk="fw-axis" />
            {[0, 10, 20, 30].map((t) => (
              <HandText key={t} x={x(t)} y={238} size={TEXT_SIZES.note} color="var(--muted)">{`${t} s`}</HandText>
            ))}
            <Arr from={[wmX, 290]} to={[wmX, 250]} tone="accent" sk={`fw-wm-${i}`} />
            <HandText x={wmX} y={306} size={TEXT_SIZES.note} color={tv('accent')}>{`watermark ${r.wm}`}</HandText>
            <HandText x={360} y={332} size={TEXT_SIZES.note} color="var(--muted)">Arrival order (event time of each event)</HandText>
            {ARRIVALS.map((ts, k) => (
              <Cell key={k} cx={110 + k * 83} cy={358} w={60} h={30} label={`ts ${ts}`} tone={k === i - 1 ? (r.events[k].late ? 'bad' : 'accent') : 'fg'} dashed={k >= i} sk={`fa${k}`} />
            ))}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
