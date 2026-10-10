import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type Tone } from '../FlowDiagram';
import { call, start, stateAt, type Breaker, type BreakerState, type Config } from './relBreaker';

/**
 * Walk through a circuit breaker. The script is a list of calls with the time and whether the dependency would answer well.
 * The breaker logic runs in relBreaker.ts. Each step shows the state after the calls up to that step.
 * Threshold 5 matches the example in Martin Fowler's article. The reset time of 10 s is our example value.
 */

const CFG: Config = { threshold: 5, resetSec: 10 };

interface Ev {
  t: number;
  ok: boolean;
}

const EVENTS: Ev[] = [
  { t: 0, ok: true },
  { t: 1, ok: true },
  { t: 2, ok: false },
  { t: 3, ok: true },
  { t: 4, ok: false },
  { t: 5, ok: false },
  { t: 6, ok: false },
  { t: 7, ok: false },
  { t: 8, ok: false },
  { t: 9, ok: true },
  { t: 12, ok: true },
  { t: 20, ok: false },
  { t: 22, ok: true },
  { t: 30, ok: true },
];

/** Step i shows the world after EVENTS[0 .. upto). Step 0 is the empty start. */
const STEPS: { upto: number; now: number; caption: string }[] = [
  { upto: 0, now: 0, caption: 'A service calls a dependency through a circuit breaker. The breaker counts failures. It trips at 5 failures in a row (the value in Fowler\'s example code). Once tripped, it waits 10 s (our example) before it lets one call through to test the dependency. It starts closed: calls pass through.' },
  { upto: 2, now: 1, caption: 'Two calls at t = 0 s and t = 1 s succeed. The breaker is closed and the failure count is 0.' },
  { upto: 3, now: 2, caption: 'The call at t = 2 s fails. The count goes to 1. One failure is not a reason to stop. The breaker stays closed.' },
  { upto: 4, now: 3, caption: 'The call at t = 3 s succeeds. A success resets the count to 0. The breaker counts failures in a row, so a lone blip never builds up.' },
  { upto: 8, now: 7, caption: 'The dependency now fails four calls in a row, at t = 4, 5, 6 and 7 s. The count is 4. One more and the breaker trips.' },
  { upto: 9, now: 8, caption: 'The call at t = 8 s fails. The count reaches the threshold of 5. The breaker opens. It records the time, 8 s.' },
  { upto: 11, now: 12, caption: 'Calls at t = 9 s and t = 12 s are rejected at once. The dependency is not called. The caller gets an error immediately instead of waiting on a timeout, and the sick dependency gets time to recover.' },
  { upto: 11, now: 18, caption: 'At t = 18 s the 10 s timeout has passed. The breaker shows half-open: ready for one trial call. Nothing happens until a call arrives.' },
  { upto: 12, now: 20, caption: 'The call at t = 20 s is the trial. The dependency is still down, so the trial fails. The breaker goes back to open and restarts the 10 s timer from t = 20 s.' },
  { upto: 13, now: 22, caption: 'The call at t = 22 s arrives while the breaker is open again. It is rejected at once.' },
  { upto: 13, now: 30, caption: 'At t = 30 s the timeout has passed. The breaker is half-open again.' },
  { upto: 14, now: 30, caption: 'The trial call at t = 30 s succeeds. The breaker closes and the failure count goes back to 0. Calls flow again. The whole cycle was automatic.' },
];

const STATE_TONE: Record<BreakerState, Tone> = { closed: 'ok', open: 'bad', 'half-open': 'warn' };
const STATE_LABEL: Record<BreakerState, string> = { closed: 'Closed', open: 'Open', 'half-open': 'Half-open' };

interface Row {
  ev: Ev;
  outcome: 'ok' | 'failed' | 'rejected';
  trial: boolean;
}

function replay(upto: number): { b: Breaker; rows: Row[] } {
  let b = start();
  const rows: Row[] = [];
  for (const ev of EVENTS.slice(0, upto)) {
    const r = call(b, CFG, ev.t, ev.ok);
    b = r.breaker;
    rows.push({ ev, outcome: r.outcome, trial: r.trial });
  }
  return { b, rows };
}

const POS = {
  closed: { x: 120, y: 92 },
  open: { x: 600, y: 92 },
  half: { x: 360, y: 218 },
};

export default function RelBreakerWalk() {
  return (
    <AnimFrame title="Circuit breaker: closed, open, half-open" steps={STEPS} interval={3600}>
      {(_, st) => {
        const { b, rows } = replay(st.upto);
        const shown = stateAt(b, CFG, st.now);
        const nodes: FlowNode[] = (
          [
            ['closed', 'closed', POS.closed],
            ['open', 'open', POS.open],
            ['half-open', 'half-open', POS.half],
          ] as const
        ).map(([id, s, p]) => ({
          id,
          x: p.x,
          y: p.y,
          w: 150,
          h: 60,
          label: STATE_LABEL[s],
          sub: s === 'closed' ? `failures: ${b.failures} of ${CFG.threshold}` : s === 'open' ? 'calls fail at once' : 'one trial call',
          tone: shown === s ? STATE_TONE[s] : 'muted',
        }));
        const edges: FlowEdge[] = [
          { from: 'closed', to: 'open', label: '5 failures in a row', labelAt: [0, -16], tone: shown === 'closed' ? 'default' : 'muted' },
          { from: 'open', to: 'half-open', label: '10 s pass', labelAt: [40, -10], bend: 36, tone: shown === 'open' ? 'default' : 'muted' },
          { from: 'half-open', to: 'closed', label: 'trial ok', labelAt: [-34, 4], tone: shown === 'half-open' ? 'ok' : 'muted' },
          { from: 'half-open', to: 'open', label: 'trial fails', labelAt: [-6, 20], bend: 36, tone: shown === 'half-open' ? 'bad' : 'muted' },
        ];
        const notes: FlowNote[] = [{ x: 24, y: 24, anchor: 'start', size: 14, text: `time: ${st.now} s` }];
        return (
          <>
            <FlowDiagram width={720} height={270} nodes={nodes} edges={edges} notes={notes} active={[shown]} label={`Circuit breaker state: ${shown}`} />
            <div className="mt-2 flex flex-wrap items-center gap-1.5 px-2 text-xs">
              <span className="mr-1 text-muted">Calls:</span>
              {rows.length === 0 && <span className="text-muted">none yet</span>}
              {rows.map((r, k) => (
                <span
                  key={k}
                  title={`t = ${r.ev.t} s`}
                  className={`rounded border px-1.5 py-0.5 font-mono tabular-nums ${
                    r.outcome === 'ok' ? 'border-ok text-ok' : r.outcome === 'failed' ? 'border-bad text-bad' : 'border-dashed border-line text-muted'
                  }`}
                >
                  {r.ev.t}s {r.outcome === 'ok' ? 'ok' : r.outcome === 'failed' ? 'failed' : 'rejected'}
                  {r.trial ? ' (trial)' : ''}
                </span>
              ))}
            </div>
          </>
        );
      }}
    </AnimFrame>
  );
}
