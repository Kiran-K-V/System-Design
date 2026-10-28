import { useMemo, useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { hops, KEEP } from './AiE1PymkHopsLogic';

const W = 720;
const H = 230;
const L = 70;
const R = 20;
const T = 14;
const B = 40;
const LO = 1;
const HI = 7;
const TARGET = 3000;

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

const fmt = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : `${Math.round(v)}`);

/** Candidate-count explosion by hop, on a log scale, with the candidate budget marked. */
export default function AiE1PymkHops() {
  const [friends, setFriends] = useState(200);
  const [overlap, setOverlap] = useState(60);
  const [mutual, setMutual] = useState(1);
  const hs = useMemo(() => hops(friends, overlap / 100, mutual), [friends, overlap, mutual]);
  const px = (v: number) => L + ((Math.log10(Math.max(v, 10)) - LO) / (HI - LO)) * (W - L - R);
  const rowH = (H - T - B) / hs.length;

  return (
    <CacheWidgetFrame title="Candidates by hop" hint="illustrative graph model, log scale">
      <div className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <Slider id="e1h-f" label="Connections per member" value={friends} min={50} max={500} step={10} onChange={setFriends} />
          <Slider id="e1h-o" label="Paths that are not new people" value={overlap} min={20} max={90} step={5} unit="%" onChange={setOverlap} />
          <Slider id="e1h-m" label="Mutual connections required" value={mutual} min={1} max={4} step={1} onChange={setMutual} />
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="People reachable at 1, 2 and 3 hops on a log scale, against a budget of a few thousand candidates">
          {[10, 1e3, 1e5, 1e7].map((v) => (
            <g key={v}>
              <line x1={px(v)} x2={px(v)} y1={T} y2={H - B} stroke="var(--border)" />
              <text x={px(v)} y={H - B + 18} textAnchor="middle" fontSize={14} fill="var(--muted)">{fmt(v)}</text>
            </g>
          ))}
          {hs.map((h, k) => (
            <g key={h.hop}>
              <text x={L - 10} y={T + rowH * k + rowH / 2 + 5} textAnchor="end" fontSize={14} fill="var(--fg)">{h.hop} hop{h.hop > 1 ? 's' : ''}</text>
              <rect x={L} y={T + rowH * k + rowH * 0.2} width={Math.max(px(h.candidates) - L, 2)} height={rowH * 0.6} fill={h.candidates > TARGET ? 'var(--bad)' : 'var(--ok)'} opacity={0.75} />
              <text x={Math.min(px(h.candidates) + 8, W - R - 50)} y={T + rowH * k + rowH / 2 + 5} fontSize={14} fill="var(--fg)" data-testid={`e1h-hop${h.hop}`}>{fmt(h.candidates)}</text>
            </g>
          ))}
          <line x1={px(TARGET)} x2={px(TARGET)} y1={T} y2={H - B} stroke="var(--accent)" strokeWidth={2.2} strokeDasharray="5 4" />
          <text x={px(TARGET) + 6} y={T + 12} fontSize={14} fill="var(--accent)">budget: a few thousand</text>
        </svg>
        <div className="rounded-lg border border-line p-3 text-xs text-muted" aria-live="polite">
          {hs[1].candidates > TARGET
            ? `Two hops give ${fmt(hs[1].candidates)} new people, more than the ranker budget. Three hops give ${fmt(hs[2].candidates)}. You must sample, require more mutual connections, or score with a cheap first pass.`
            : `Two hops give ${fmt(hs[1].candidates)} new people, inside the budget. Three hops give ${fmt(hs[2].candidates)}, which is far outside it.`}
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Model, illustrative. A hop-2 path goes from you to a connection to one of their connections. Only the chosen share of paths are new people: the rest lead to you, to existing connections, or to someone counted twice. Each extra mutual connection you require keeps {Math.round(KEEP * 100)}% of the remainder (an assumed value). Hop 3 repeats the step from the new people. The budget line is the &quot;few thousand candidates&quot; that LinkedIn says its first stage returns; the other numbers are ours.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
