import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { headroom, inputTokens, turnsLeft, type Budget } from './Ai4BudgetMath';

const PER_TURN = 6000;
const PARTS: { key: keyof Omit<Budget, 'window' | 'reserve'>; label: string; fill: string }[] = [
  { key: 'system', label: 'System prompt', fill: 'var(--muted)' },
  { key: 'tools', label: 'Tool definitions', fill: 'var(--ok)' },
  { key: 'examples', label: 'Examples', fill: 'var(--warn)' },
  { key: 'docs', label: 'Retrieved documents', fill: 'var(--accent)' },
  { key: 'history', label: 'Chat history', fill: 'var(--surface)' },
];
const k = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n));
const X0 = 30;
const W = 660;

/** Stacked bar of the context window. Drag a slider to change one section. The output reservation turns red when it is squeezed. */
export default function Ai4BudgetBar() {
  const [win, setWin] = useState(200000);
  const [b, setB] = useState<Budget>({ window: 200000, system: 3000, tools: 9000, examples: 4000, docs: 40000, history: 30000, reserve: 16000 });
  const cur = { ...b, window: win };
  const used = inputTokens(cur);
  const room = headroom(cur);
  const squeezed = room < 0;
  const left = Math.max(0, win - used);
  const set = (key: keyof Budget, v: number) => setB((p) => ({ ...p, [key]: v }));
  const sx = (n: number) => (n / win) * W;
  const cap = Math.round(win * 0.8);
  const step = win >= 1000000 ? 5000 : 1000;

  let x = X0;
  const segs = PARTS.map((p) => {
    const w = Math.min(sx(cur[p.key]), X0 + W - x);
    const s = { ...p, x, w: Math.max(0, w) };
    x += w;
    return s;
  });
  const reserveW = sx(cur.reserve);
  const reserveX = X0 + W - reserveW;

  return (
    <CacheWidgetFrame title="Context window budget" hint="sizes are illustrative; 200K is a round window, not one model">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Seg label="Window size" value={win} options={[{ id: 200000, label: '200K window' }, { id: 1000000, label: '1M window' }]} onChange={setWin} />
      </div>
      <SketchSvg width={720} height={140} label="Stacked bar of what fills the context window">
        <HandText x={X0} y={20} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
          0
        </HandText>
        <HandText x={X0 + W} y={20} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
          {`${k(win)} tokens`}
        </HandText>
        <SketchBox cx={X0 + W / 2} cy={70} w={W} h={50} r={8} seed={seedOf('bb-frame')} stroke="var(--muted)" />
        {segs.map((s) =>
          s.w > 0 ? (
            <g key={s.key}>
              <SketchBox cx={s.x + s.w / 2} cy={70} w={s.w} h={44} r={6} seed={seedOf(`bb-${s.key}`)} fill={s.fill} stroke={s.fill === 'var(--surface)' ? 'var(--accent)' : s.fill} />
              {s.w > 52 && (
                <HandText x={s.x + s.w / 2} y={70} size={TEXT_SIZES.note} mono>
                  {k(cur[s.key])}
                </HandText>
              )}
            </g>
          ) : null,
        )}
        {reserveW > 0 && (
          <g>
            <SketchBox cx={reserveX + reserveW / 2} cy={70} w={reserveW} h={44} r={6} seed={seedOf('bb-res')} fill={squeezed ? 'var(--bad)' : undefined} stroke={squeezed ? 'var(--bad)' : 'var(--ok)'} dashed={!squeezed} strokeWidth={squeezed ? 2.2 : 1.4} />
            {reserveW > 52 && (
              <HandText x={reserveX + reserveW / 2} y={70} size={TEXT_SIZES.note} mono color={squeezed ? 'var(--bad)' : 'var(--ok)'}>
                {k(cur.reserve)}
              </HandText>
            )}
          </g>
        )}
        <HandText x={X0} y={118} anchor="start" size={TEXT_SIZES.label} color={squeezed ? 'var(--bad)' : 'var(--ok)'}>
          {squeezed ? `Squeezed: only ${k(left)} left for the reply (wanted ${k(cur.reserve)})` : `Headroom ${k(room)} after a ${k(cur.reserve)} reply reserve`}
        </HandText>
      </SketchSvg>
      <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        {[...PARTS.map((p) => ({ key: p.key as keyof Budget, label: p.label, fill: p.fill })), { key: 'reserve' as keyof Budget, label: 'Output reservation', fill: 'var(--ok)' }].map((p) => (
          <div key={p.key}>
            <label htmlFor={`a43-${p.key}`} className="mb-1 flex justify-between text-xs text-muted">
              <span>
                <span aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm border border-line align-middle" style={{ background: `color-mix(in srgb, ${p.fill} 35%, var(--bg))` }} />
                {p.label}
              </span>
              <span className="tabular-nums text-fg">{k(cur[p.key])}</span>
            </label>
            <input id={`a43-${p.key}`} type="range" min={0} max={cap} step={step} value={Math.min(cur[p.key], cap)} onChange={(e) => set(p.key, +e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3" aria-live="polite">
        <div className="rounded-lg border border-line p-2">
          <div className="text-xs text-muted">Input so far</div>
          <div data-testid="used" className="font-mono text-lg">{used.toLocaleString('en-US')}</div>
        </div>
        <div className="rounded-lg border border-line p-2">
          <div className="text-xs text-muted">Headroom after reserve</div>
          <div data-testid="room" className="font-mono text-lg" style={{ color: squeezed ? 'var(--bad)' : undefined }}>{room.toLocaleString('en-US')}</div>
        </div>
        <div className="rounded-lg border border-line p-2">
          <div className="text-xs text-muted">Turns of {k(PER_TURN)} that still fit</div>
          <div data-testid="turns" className="font-mono text-lg">{turnsLeft(cur, PER_TURN)}</div>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
