import { useEffect, useRef, useState } from 'react';
import { motion, MotionConfig, AnimatePresence } from 'motion/react';
import { HandText, SketchArrow, SketchBox } from '../sketch';

/** Service rate: the server finishes 10 requests per second on average (100 ms each). */
const MU = 10;
/** Simulated seconds per real second. Slow enough to watch single requests. */
const SIM_SPEED = 0.3;
const MAX_DOTS = 22;

interface Req {
  id: number;
  arrived: number;
}

interface Sim {
  t: number;
  nextId: number;
  nextArrival: number;
  queue: Req[];
  serving: (Req & { end: number }) | null;
  responses: number[];
}

const expSample = (rate: number) => -Math.log(1 - Math.random()) / rate;

function freshSim(lambda: number): Sim {
  return { t: 0, nextId: 0, nextArrival: expSample(lambda), queue: [], serving: null, responses: [] };
}

function advance(sim: Sim, dt: number, lambda: number) {
  const until = sim.t + dt;
  for (;;) {
    const nextDone = sim.serving ? sim.serving.end : Infinity;
    const next = Math.min(sim.nextArrival, nextDone);
    if (next > until) break;
    sim.t = next;
    if (next === nextDone && sim.serving) {
      sim.responses.push(sim.t - sim.serving.arrived);
      if (sim.responses.length > 300) sim.responses.shift();
      sim.serving = null;
    } else {
      sim.queue.push({ id: sim.nextId++, arrived: sim.t });
      sim.nextArrival = sim.t + expSample(lambda);
    }
    if (!sim.serving && sim.queue.length) {
      const r = sim.queue.shift()!;
      sim.serving = { ...r, end: sim.t + expSample(MU) };
    }
  }
  sim.t = until;
}

const theory = (rho: number) => 1 / (MU * (1 - rho));

export default function QueueSim() {
  const [rho, setRho] = useState(0.5);
  const [running, setRunning] = useState(false);
  const [, setTick] = useState(0);
  const rhoRef = useRef(rho);
  const sim = useRef<Sim>(freshSim(MU * rho));
  rhoRef.current = rho;

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000) * SIM_SPEED;
      last = now;
      advance(sim.current, dt, MU * rhoRef.current);
      setTick((x) => x + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const s = sim.current;
  const measured = s.responses.length ? s.responses.reduce((a, b) => a + b, 0) / s.responses.length : null;
  const shown = s.queue.slice(0, MAX_DOTS);
  const hidden = s.queue.length - shown.length;

  const changeRho = (v: number) => {
    setRho(v);
    s.responses = [];
  };

  return (
    <MotionConfig reducedMotion="user">
      <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
        <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2">
          <span className="text-sm font-medium">One server, one queue</span>
          <span className="text-xs text-muted">Live simulation · slowed down 3x</span>
        </div>

        <div className="px-2 py-4 sm:px-4">
          <svg viewBox="0 0 640 130" className="h-auto w-full" role="img" aria-label="Queue of requests in front of one server">
            <HandText x={8} y={30} size={14} anchor="start" color="var(--muted)">
              {'requests arrive\nat random →'}
            </HandText>
            <SketchArrow points={[[40, 82], [478, 82]]} head="none" seed={11} stroke="var(--muted)" />
            <HandText x={470} y={108} size={14} anchor="end" color="var(--muted)">
              {`queue: ${s.queue.length}`}
            </HandText>
            {hidden > 0 && (
              <text x={64} y={72} fontSize={12} fontWeight={600} fill="var(--bad)">
                +{hidden}
              </text>
            )}
            <AnimatePresence>
              {shown.map((r, k) => (
                <motion.circle
                  key={r.id}
                  r={7}
                  cx={0}
                  cy={66}
                  fill="var(--accent)"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 460 - k * 18, opacity: 1 }}
                  exit={{ x: 520, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                />
              ))}
            </AnimatePresence>

            <motion.rect
              x={493}
              y={39}
              width={84}
              height={54}
              rx={10}
              fill="var(--accent-soft)"
              animate={{ opacity: s.serving ? 1 : 0 }}
            />
            <SketchBox cx={535} cy={66} w={90} h={60} seed={21} stroke={s.serving ? 'var(--accent)' : 'var(--fg)'} />
            <HandText x={535} y={58} size={17}>
              Server
            </HandText>
            <HandText x={535} y={78} size={13} color="var(--muted)">
              {s.serving ? 'busy' : 'idle'}
            </HandText>
            {s.serving && <circle cx={535} cy={36} r={6} fill="var(--ok)" />}
            <SketchArrow points={[[584, 66], [632, 66]]} seed={31} />
            <HandText x={608} y={50} size={13} color="var(--muted)">
              done
            </HandText>
          </svg>

          <div className="mt-2 grid gap-4 px-2 sm:grid-cols-[1fr_15rem]">
            <Curve rho={rho} measured={measured} />
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="flex justify-between">
                  <span>Utilization</span>
                  <span className="font-mono tabular-nums">{Math.round(rho * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={0.1}
                  max={0.97}
                  step={0.01}
                  value={rho}
                  onChange={(e) => changeRho(+e.target.value)}
                  className="mt-1 w-full accent-[var(--accent)]"
                />
                <span className="text-xs text-muted">
                  {(MU * rho).toFixed(1)} req/s arrive · server does {MU} req/s
                </span>
              </label>
              <dl className="grid grid-cols-2 gap-y-1 text-xs">
                <dt className="text-muted">Work per request</dt>
                <dd className="text-right font-mono">100 ms</dd>
                <dt className="text-muted">Theory: response</dt>
                <dd className="text-right font-mono">{Math.round(theory(rho) * 1000)} ms</dd>
                <dt className="text-muted">Measured: response</dt>
                <dd className="text-right font-mono">{measured === null ? '—' : `${Math.round(measured * 1000)} ms`}</dd>
              </dl>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRunning((r) => !r)}
                  className="h-8 rounded-md bg-accent px-3 text-sm font-medium text-white hover:opacity-90"
                >
                  {running ? 'Pause' : 'Run'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sim.current = freshSim(MU * rho);
                    setTick((x) => x + 1);
                  }}
                  className="h-8 rounded-md border border-line px-3 text-sm hover:bg-surface"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <figcaption className="border-t border-line px-4 py-3 text-[0.95rem] leading-relaxed">
          Press Run. Start at 50%, then drag to 80%, 90%, and 95%. The work per request never changes. Only the wait in
          the queue grows, and it grows faster the closer you get to 100%.
        </figcaption>
      </figure>
    </MotionConfig>
  );
}

function Curve({ rho, measured }: { rho: number; measured: number | null }) {
  const W = 360;
  const H = 170;
  const P = { l: 40, r: 10, t: 10, b: 30 };
  const yMax = 3; // seconds
  const x = (r: number) => P.l + r * (W - P.l - P.r);
  const y = (sec: number) => H - P.b - (Math.min(sec, yMax) / yMax) * (H - P.t - P.b);
  const pts: string[] = [];
  for (let r = 0; r <= 0.967; r += 0.01) pts.push(`${x(r).toFixed(1)},${y(theory(r)).toFixed(1)}`);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Response time versus utilization">
      {[0, 1, 2, 3].map((s) => (
        <g key={s}>
          <line x1={P.l} x2={W - P.r} y1={y(s)} y2={y(s)} stroke="var(--border)" />
          <text x={P.l - 6} y={y(s) + 4} textAnchor="end" fontSize={13} fill="var(--muted)">
            {s}s
          </text>
        </g>
      ))}
      {[0, 0.5, 1].map((r) => (
        <text key={r} x={x(r)} y={H - P.b + 16} textAnchor="middle" fontSize={13} fill="var(--muted)">
          {r * 100}%
        </text>
      ))}
      <text x={(W + P.l) / 2} y={H - 2} textAnchor="middle" fontSize={13} fill="var(--muted)">
        utilization
      </text>
      <polyline points={pts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth={2} />
      <line x1={x(rho)} x2={x(rho)} y1={P.t} y2={H - P.b} stroke="var(--muted)" strokeDasharray="3 3" />
      <circle cx={x(rho)} cy={y(theory(rho))} r={5} fill="var(--accent)" />
      {measured !== null && <circle cx={x(rho)} cy={y(measured)} r={5} fill="none" stroke="var(--bad)" strokeWidth={2} />}
    </svg>
  );
}
