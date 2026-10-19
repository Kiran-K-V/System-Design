import { useMemo, useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { HOLD, IN_TOK, OUT_TOK, SURGE_FROM, SURGE_TO, TEAMS, T_END, simulate, type Policy } from './Ai13GatewayQuotaMath';

const W = 720;
const H = 260;
const L = 50;
const R = 16;
const T = 14;
const B = 42;
const COLORS = ['var(--accent)', 'var(--warn)', 'var(--ok)'];
const POLICIES: { id: Policy; label: string }[] = [
  { id: 'shared', label: 'One shared bucket' },
  { id: 'quota', label: 'Bucket per team' },
  { id: 'fair', label: 'Per team + burst credit' },
];

function Slider({ id, label, value, min, max, step, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value.toLocaleString('en-US')}{unit ?? ''}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

/** Quota simulator: three teams share one provider limit. Team B surges. Compare three policies. */
export default function Ai13GatewayQuotaSim() {
  const [policy, setPolicy] = useState<Policy>('shared');
  const [surge, setSurge] = useState(6);
  const [depth, setDepth] = useState(10);
  const [maxTokens, setMaxTokens] = useState(1000);

  const res = useMemo(() => simulate({ policy, surge, depth, maxTokens }), [policy, surge, depth, maxTokens]);

  const yMax = Math.max(60, ...res.demand.flat());
  const px = (t: number) => L + (t / (T_END - 1)) * (W - L - R);
  const py = (v: number) => T + (1 - v / yMax) * (H - T - B);
  const line = (xs: number[]) => xs.map((v, t) => `${t === 0 ? 'M' : 'L'}${px(t).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
  const capRps = TEAMS.reduce((a, t) => a + t.g, 0) / (IN_TOK + OUT_TOK);
  const ticks = [0, 20, 40, 60, 80].filter((v) => v <= yMax);
  const total = res.surgeTotals.reduce((a, t) => a + t.rejected, 0);

  return (
    <CacheWidgetFrame title="Quota simulator: team B surges" hint="fluid model, one-second steps">
      <div className="space-y-4 text-sm">
        <Seg label="Quota policy" value={policy} options={POLICIES} onChange={setPolicy} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Slider id="a13q-s" label="Team B surge (times its base demand)" value={surge} min={1} max={8} step={1} unit="x" onChange={setSurge} />
          <Slider id="a13q-d" label="Bucket depth (seconds of guaranteed rate)" value={depth} min={2} max={30} step={1} unit=" s" onChange={setDepth} />
          <Slider id="a13q-m" label="max_tokens reserved per request" value={maxTokens} min={500} max={8000} step={500} onChange={setMaxTokens} />
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Requests served per second for each team over 80 seconds">
          {ticks.map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={py(v)} y2={py(v)} stroke="var(--border)" />
              <text x={L - 8} y={py(v) + 4} textAnchor="end" fontSize={14} fill="var(--muted)">{v}</text>
            </g>
          ))}
          <rect x={px(SURGE_FROM)} y={T} width={px(SURGE_TO) - px(SURGE_FROM)} height={H - T - B} fill="var(--warn)" opacity={0.08} />
          <line x1={L} x2={W - R} y1={py(capRps)} y2={py(capRps)} stroke="var(--fg)" strokeDasharray="5 4" />
          <text x={W - R} y={py(capRps) - 6} textAnchor="end" fontSize={14} fill="var(--fg)">provider limit, 50 requests per second</text>
          {TEAMS.map((team, i) => (
            <path key={team.id} d={line(res.served[i])} fill="none" stroke={COLORS[i]} strokeWidth={2.2} />
          ))}
          {[0, 20, 40, 60, 80].map((s) => (
            <text key={s} x={px(Math.min(s, T_END - 1))} y={H - B + 18} textAnchor="middle" fontSize={14} fill="var(--muted)">{s} s</text>
          ))}
          <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" fontSize={14} fill="var(--muted)">requests served per second (shaded: team B surge)</text>
        </svg>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {TEAMS.map((team, i) => (
            <li key={team.id} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i] }} />
              Team {team.id}: {team.name}
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-3">
          {res.surgeTotals.map((t) => (
            <div key={t.id} className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Team {t.id}: turned away in the surge</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: t.rejectedShare > 0.005 ? (t.id === 'B' ? 'var(--warn)' : 'var(--bad)') : 'var(--ok)' }} data-testid={`a13q-rej-${t.id}`}>
                {(t.rejectedShare * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted tabular-nums">{Math.round(t.rejected)} of {Math.round(t.demand)} requests</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-line p-3 text-xs text-muted" aria-live="polite">
          Whole run, 80 s: team A turned away {res.totals[0].rejected.toFixed(0)} of {res.totals[0].demand.toFixed(0)} requests ({(res.totals[0].rejectedShare * 100).toFixed(1)}%). Team C turned away {res.totals[2].rejected.toFixed(0)} of {res.totals[2].demand.toFixed(0)}. In the surge window {Math.round(total)} requests were refused in all.
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Model, all illustrative. A request has {IN_TOK.toLocaleString('en-US')} input and {OUT_TOK} output tokens and holds its reservation for {HOLD} s. The gateway takes {IN_TOK.toLocaleString('en-US')} plus max_tokens up front and refunds the unused output tokens when the call ends. Guarantees are 87,500, 52,500, and 35,000 tokens per second for A, B, and C, which is 25, 15, and 10 requests per second and 50 in all. Base demand is 20, 10, and 8 requests per second. With burst credit, a team over its bucket borrows only refill that a full bucket would have thrown away. Requests in the shared bucket interleave evenly. Seconds are whole steps and requests are fractions.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
