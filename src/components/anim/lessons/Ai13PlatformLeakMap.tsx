import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { EVIDENCE_LABEL, LAYERS, openCount } from './Ai13PlatformLeakData';

const W = 720;
const H = 390;
const AX = 85;
const BX = 635;
const MID = 360;
const BOX_W = 210;
const BOX_H = 40;
const AY = 190;
const layerY = (i: number) => 40 + i * 50;

const btn = 'rounded-md border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface';

/** Tenant-isolation map. Seven layers are shared. Pick one, follow the leak from tenant A to tenant B, then switch its control on. */
export default function Ai13PlatformLeakMap() {
  const [sel, setSel] = useState(0);
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());

  const layer = LAYERS[sel];
  const isClosed = closed.has(layer.id);
  const open = openCount(closed);
  const toggle = (id: string) =>
    setClosed((c) => {
      const n = new Set(c);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const y = layerY(sel);

  return (
    <CacheWidgetFrame title="Tenant-isolation map" hint="click a layer, then switch its control on">
      <div className="space-y-4 text-sm">
        <SketchSvg width={W} height={H} label={`Tenants A and B share seven layers. ${open} of 7 leak paths are open. Selected layer: ${layer.name}, ${isClosed ? 'closed' : 'open'}.`}>
          {/* Tenants */}
          <SketchBox cx={AX} cy={AY} w={120} h={64} seed={seedOf('plat-A')} stroke="var(--accent)" />
          <HandText x={AX} y={AY - 9} size={TEXT_SIZES.heading}>Tenant A</HandText>
          <HandText x={AX} y={AY + 14} size={TEXT_SIZES.note} color="var(--muted)">owns the data</HandText>
          <SketchBox cx={BX} cy={AY} w={120} h={64} seed={seedOf('plat-B')} stroke="var(--accent)" />
          <HandText x={BX} y={AY - 9} size={TEXT_SIZES.heading}>Tenant B</HandText>
          <HandText x={BX} y={AY + 14} size={TEXT_SIZES.note} color="var(--muted)">should not see it</HandText>

          {/* The leak path for the selected layer */}
          <SketchArrow
            points={[[AX + 66, AY + (y - AY) * 0.25], [MID - BOX_W / 2 - 7, y]]}
            stroke={isClosed ? 'var(--muted)' : 'var(--bad)'}
            strokeWidth={2.2}
            seed={seedOf(`plat-in-${layer.id}`)}
          />
          <SketchArrow
            points={[[MID + BOX_W / 2 + 7, y], [BX - 66, AY + (y - AY) * 0.25]]}
            stroke={isClosed ? 'var(--ok)' : 'var(--bad)'}
            strokeWidth={2.2}
            dashed={isClosed}
            seed={seedOf(`plat-out-${layer.id}`)}
          />
          <HandText x={MID + BOX_W / 2 + 62} y={y + (y > AY ? 24 : y < AY ? -24 : -24)} size={TEXT_SIZES.note} color={isClosed ? 'var(--ok)' : 'var(--bad)'}>
            {isClosed ? 'blocked' : 'B reads A'}
          </HandText>

          {/* The shared layers */}
          {LAYERS.map((l, i) => {
            const cy = layerY(i);
            const isSel = i === sel;
            const done = closed.has(l.id);
            return (
              <g
                key={l.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSel}
                aria-label={`${l.name}: leak path ${done ? 'closed' : 'open'}`}
                style={{ cursor: 'pointer', outline: 'none' }}
                onClick={() => setSel(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSel(i);
                  }
                }}
              >
                <rect x={MID - BOX_W / 2 - 4} y={cy - BOX_H / 2 - 4} width={BOX_W + 8} height={BOX_H + 8} fill="transparent" />
                <SketchBox
                  cx={MID}
                  cy={cy}
                  w={BOX_W}
                  h={BOX_H}
                  r={8}
                  seed={seedOf(`plat-layer-${l.id}`)}
                  stroke={done ? 'var(--ok)' : 'var(--bad)'}
                  strokeWidth={isSel ? 2.2 : 1.4}
                  fill={isSel ? 'var(--accent-soft)' : 'var(--bg)'}
                />
                <HandText x={MID} y={cy} size={TEXT_SIZES.label}>{l.name}</HandText>
              </g>
            );
          })}
          <HandText x={MID} y={H - 12} size={TEXT_SIZES.note} color="var(--muted)">shared layers: warm outline = path open, green = control on</HandText>
        </SketchSvg>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btn} onClick={() => setSel((s) => (s + LAYERS.length - 1) % LAYERS.length)}>Previous layer</button>
          <button type="button" className={btn} onClick={() => setSel((s) => (s + 1) % LAYERS.length)}>Next layer</button>
          <button type="button" aria-pressed={isClosed} data-testid="a13lm-toggle" className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${isClosed ? 'border-line text-muted hover:bg-surface' : 'border-[var(--ok)] bg-[var(--ok)] text-white'}`} onClick={() => toggle(layer.id)}>
            {isClosed ? 'Switch the control off' : 'Switch the control on'}
          </button>
          <button type="button" className={btn} onClick={() => setClosed(new Set(LAYERS.map((l) => l.id)))}>Close all</button>
          <button type="button" className={btn} onClick={() => setClosed(new Set())}>Reopen all</button>
          <span className="ml-auto font-semibold tabular-nums" style={{ color: open === 0 ? 'var(--ok)' : 'var(--bad)' }} data-testid="a13lm-open" aria-live="polite">
            Open leak paths: {open} of {LAYERS.length}
          </span>
        </div>

        <div className="rounded-lg border border-line bg-surface p-3" aria-live="polite">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{sel + 1}. {layer.name}</span>
            <span className="text-xs" style={{ color: isClosed ? 'var(--ok)' : 'var(--bad)' }}>{isClosed ? 'control on, path closed' : 'control off, path open'}</span>
          </div>
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[8.5rem_1fr]">
            <dt className="text-xs text-muted">What is shared</dt>
            <dd>{layer.shared}</dd>
            <dt className="text-xs text-muted">How it leaks</dt>
            <dd>{layer.leak}</dd>
            <dt className="text-xs text-muted">Control that closes it</dt>
            <dd style={{ opacity: isClosed ? 1 : 0.75 }}>{layer.control}</dd>
            <dt className="text-xs text-muted">Canary test</dt>
            <dd>{layer.test}</dd>
            <dt className="text-xs text-muted">Source</dt>
            <dd className="text-xs text-muted">{EVIDENCE_LABEL[layer.evidence]}: {layer.source}</dd>
          </dl>
        </div>
        {open === 0 && (
          <p className="text-xs text-muted">All seven paths are closed on paper. A control counts only after its canary test passes in production traffic, every day.</p>
        )}
      </div>
    </CacheWidgetFrame>
  );
}
