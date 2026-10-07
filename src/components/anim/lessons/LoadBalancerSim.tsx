import { useEffect, useRef, useState } from 'react';

type Algo = 'rr' | 'lc' | 'hash';
interface Req {
  id: number;
  left: number;
  heavy: boolean;
}
interface Srv {
  up: boolean;
  inPool: boolean;
  fail: number;
  pass: number;
  active: Req[];
  served: number;
  failed: number;
}
interface Sim {
  tick: number;
  nextId: number;
  rr: number;
  seed: number;
  srv: Srv[];
}

const NAMES = ['A', 'B', 'C'];
/** Client 0 is a noisy client (40% of traffic). The other 5 share the rest. */
const CLIENT_W = [0.4, 0.12, 0.12, 0.12, 0.12, 0.12];
const ARRIVALS_PER_TICK = 2;
const UNHEALTHY_AFTER = 2;
const HEALTHY_AFTER = 3;
const SLOTS = 12;
const TICK_MS = 450;

const ALGOS: { id: Algo; label: string; blurb: string }[] = [
  { id: 'rr', label: 'Round robin', blurb: 'Takes turns: A, B, C, A, B, C. Ignores how busy each server is.' },
  { id: 'lc', label: 'Least connections', blurb: 'Sends each request to the server with the fewest active requests right now.' },
  { id: 'hash', label: 'Hash of client', blurb: 'The same client always lands on the same server (hash of client ID modulo pool size). Sticky, but blind to load.' },
];

function rand(sim: Sim) {
  // mulberry32: deterministic, so every algorithm sees the same traffic.
  sim.seed = (sim.seed + 0x6d2b79f5) | 0;
  let t = Math.imul(sim.seed ^ (sim.seed >>> 15), 1 | sim.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function fresh(): Sim {
  return {
    tick: 0,
    nextId: 0,
    rr: 0,
    seed: 20240607,
    srv: NAMES.map(() => ({ up: true, inPool: true, fail: 0, pass: 0, active: [], served: 0, failed: 0 })),
  };
}

function hashClient(c: number) {
  let h = 2166136261;
  const s = `client-${c}`;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function pickClient(sim: Sim) {
  let r = rand(sim);
  for (let c = 0; c < CLIENT_W.length; c++) {
    r -= CLIENT_W[c];
    if (r < 0) return c;
  }
  return CLIENT_W.length - 1;
}

function step(sim: Sim, algo: Algo) {
  sim.tick++;
  for (const s of sim.srv) {
    if (s.up) {
      s.active = s.active.filter((r) => {
        r.left--;
        if (r.left <= 0) {
          s.served++;
          return false;
        }
        return true;
      });
    }
  }
  for (let k = 0; k < ARRIVALS_PER_TICK; k++) {
    const client = pickClient(sim);
    const heavy = rand(sim) < 0.2;
    const req: Req = { id: sim.nextId++, heavy, left: heavy ? 8 : 1 + Math.floor(rand(sim) * 2) };
    const pool = sim.srv.map((_, i) => i).filter((i) => sim.srv[i].inPool);
    if (pool.length === 0) continue;
    let pick: number;
    if (algo === 'rr') pick = pool[sim.rr++ % pool.length];
    else if (algo === 'lc') pick = pool.reduce((best, i) => (sim.srv[i].active.length < sim.srv[best].active.length ? i : best), pool[0]);
    else pick = pool[hashClient(client) % pool.length];
    const s = sim.srv[pick];
    if (s.up) s.active.push(req);
    else s.failed++;
  }
  // Health check: one probe per tick, after the arrivals, so a dead server hurts for a tick or two.
  for (const s of sim.srv) {
    if (!s.up) {
      s.pass = 0;
      s.fail++;
      if (s.fail >= UNHEALTHY_AFTER) s.inPool = false;
    } else {
      s.fail = 0;
      s.pass++;
      if (s.pass >= HEALTHY_AFTER) s.inPool = true;
    }
  }
}

export default function LoadBalancerSim() {
  const [algo, setAlgo] = useState<Algo>('rr');
  const [running, setRunning] = useState(false);
  const [, setTick] = useState(0);
  const sim = useRef<Sim>(fresh());
  const algoRef = useRef<Algo>(algo);
  algoRef.current = algo;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      step(sim.current, algoRef.current);
      setTick((x) => x + 1);
    }, TICK_MS);
    return () => clearInterval(t);
  }, [running]);

  const reset = (a: Algo = algo) => {
    sim.current = fresh();
    setAlgo(a);
    setTick((x) => x + 1);
  };
  const manualStep = () => {
    step(sim.current, algo);
    setTick((x) => x + 1);
  };
  const toggle = (i: number) => {
    const s = sim.current.srv[i];
    if (s.up) {
      s.up = false;
      s.failed += s.active.length;
      s.active = [];
    } else {
      s.up = true;
    }
    setTick((x) => x + 1);
  };

  const s = sim.current;
  const totalServed = s.srv.reduce((a, x) => a + x.served, 0);
  const totalFailed = s.srv.reduce((a, x) => a + x.failed, 0);
  const cur = ALGOS.find((a) => a.id === algo)!;

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2">
        <span className="text-sm font-medium">Load balancer lab: same traffic, different algorithm</span>
        <span className="text-xs tabular-nums text-muted">tick {s.tick}</span>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div role="radiogroup" aria-label="Algorithm" className="flex flex-wrap gap-1.5">
          {ALGOS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={a.id === algo}
              onClick={() => reset(a.id)}
              className={`rounded-md border px-3 py-1.5 text-sm ${a.id === algo ? 'border-accent bg-accent-soft font-semibold' : 'border-line hover:bg-surface'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{cur.blurb}</p>

        <div className="grid grid-cols-3 gap-3">
          {s.srv.map((sv, i) => {
            const share = totalServed ? Math.round((sv.served / totalServed) * 100) : 0;
            const overloaded = sv.active.length > SLOTS * 0.66;
            const status = !sv.up ? (sv.inPool ? 'dead, not yet detected' : 'dead, removed') : sv.inPool ? 'healthy' : 'recovering';
            const statusColor = !sv.up ? 'var(--bad)' : sv.inPool ? 'var(--ok)' : 'var(--warn)';
            return (
              <div key={i} className="rounded-lg border p-2.5" style={{ borderColor: overloaded ? 'var(--bad)' : 'var(--border)', opacity: !sv.up ? 0.75 : 1 }}>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">Server {NAMES[i]}</span>
                  <span className="text-xs" style={{ color: statusColor }}>{status}</span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1" aria-label={`${sv.active.length} active requests`}>
                  {Array.from({ length: SLOTS }).map((_, k) => {
                    const r = sv.active[k];
                    return (
                      <div
                        key={k}
                        className="h-4 rounded-sm"
                        style={{ background: r ? (r.heavy ? 'var(--warn)' : 'var(--accent)') : 'var(--surface)', border: '1px solid var(--border)' }}
                      />
                    );
                  })}
                </div>
                <dl className="mt-2 grid grid-cols-2 text-xs">
                  <dt className="text-muted">Active</dt>
                  <dd className="text-right font-mono tabular-nums">{sv.active.length}</dd>
                  <dt className="text-muted">Served</dt>
                  <dd className="text-right font-mono tabular-nums">{sv.served} ({share}%)</dd>
                  <dt className="text-muted">Failed</dt>
                  <dd className="text-right font-mono tabular-nums" style={{ color: sv.failed ? 'var(--bad)' : undefined }}>{sv.failed}</dd>
                </dl>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="mt-2 w-full rounded-md border border-line py-1 text-xs hover:bg-surface"
                >
                  {sv.up ? 'Kill server' : 'Revive server'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setRunning((r) => !r)} className="h-8 rounded-md bg-accent px-3 text-sm font-medium text-white hover:opacity-90">
            {running ? 'Pause' : 'Run'}
          </button>
          <button type="button" onClick={manualStep} disabled={running} className="h-8 rounded-md border border-line px-3 text-sm hover:bg-surface disabled:opacity-40">
            Step 1 tick
          </button>
          <button type="button" onClick={() => reset()} className="h-8 rounded-md border border-line px-3 text-sm hover:bg-surface">
            Reset
          </button>
          <span className="ml-auto text-xs text-muted">
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: 'var(--accent)' }} /> light request
            <span className="mx-1 ml-3 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: 'var(--warn)' }} /> heavy request (8 ticks)
          </span>
        </div>
      </div>

      <p className="border-t border-line px-4 py-3 text-[0.95rem] leading-relaxed">
        Two requests arrive each tick. One request in five is heavy, and one client sends 40% of all traffic. Run each algorithm and compare the Served share.
        Round robin spreads the count evenly but can stack heavy requests on one server. Least connections steers new work away from servers stuck on heavy requests, so
        compare Active as well as Served. Hash is sticky: the noisy client pins one server. Then press Kill server and watch the failed count rise until the health check removes it ({UNHEALTHY_AFTER} failed probes). Total so far: {totalServed} served, {totalFailed} failed.
      </p>
    </figure>
  );
}
