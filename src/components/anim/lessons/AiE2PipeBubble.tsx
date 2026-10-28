import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { bubbleOverIdeal, idleShare, pipelineCells } from './AiE2ParLogic';

const mix = (c: string, pct: number) => `color-mix(in srgb, var(--${c}) ${pct}%, transparent)`;

export default function AiE2PipeBubble() {
  const [p, setP] = useState(4);
  const [m, setM] = useState(4);
  const { cells, total } = pipelineCells(p, m);
  const idle = idleShare(p, m);
  const extra = bubbleOverIdeal(p, m);

  return (
    <CacheWidgetFrame title="The pipeline bubble" hint="illustrative: forward = 1 unit, backward = 2 units">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted">Stages</span>
          <Seg label="Pipeline stages" value={p} onChange={setP} options={[2, 4, 8].map((v) => ({ id: v, label: String(v) }))} />
        </div>
        <label htmlFor="pb-m" className="flex min-w-[12rem] flex-1 items-center gap-2">
          <span className="text-muted">Micro-batches</span>
          <input id="pb-m" type="range" min={1} max={32} step={1} value={m} onChange={(e) => setM(+e.target.value)} className="flex-1 accent-[var(--accent)]" />
          <span className="w-6 tabular-nums" data-testid="pb-m">{m}</span>
        </label>
      </div>

      <div className="space-y-1" role="img" aria-label={`Pipeline timeline with ${p} stages and ${m} micro-batches. Idle share ${(idle * 100).toFixed(0)} percent.`}>
        {Array.from({ length: p }, (_, s) => (
          <div key={s} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[11px] text-muted">stage {s + 1}</span>
            <div className="relative h-5 flex-1 rounded-sm" style={{ background: mix('muted', 12) }}>
              {cells
                .filter((c) => c.stage === s)
                .map((c) => (
                  <span
                    key={`${c.kind}${c.micro}`}
                    className="absolute top-0 h-5 rounded-[2px]"
                    style={{
                      left: `${(c.start / total) * 100}%`,
                      width: `${(c.len / total) * 100}%`,
                      background: mix(c.kind === 'f' ? 'accent' : 'warn', 65),
                      boxShadow: 'inset 0 0 0 1px var(--bg)',
                    }}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-4 pl-16 text-[11px] text-muted">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: mix('accent', 65) }} />forward</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: mix('warn', 65) }} />backward</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: mix('muted', 25) }} />idle (the bubble)</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">GPU time idle</div>
          <div className="text-lg font-semibold tabular-nums text-bad" data-testid="pb-idle">{(idle * 100).toFixed(0)}%</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Extra time over ideal, (p-1)/m</div>
          <div className="text-lg font-semibold tabular-nums text-warn" data-testid="pb-extra">{(extra * 100).toFixed(0)}%</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Model: all forward passes, then all backward passes (the simplest schedule). The idle share is the empty area of the chart. "Extra time over ideal" is the bubble formula from the Megatron-LM paper, where p is the stage count and m the micro-batch count. Real schedules interleave forward and backward passes so each stage stores fewer activations.
      </p>
    </CacheWidgetFrame>
  );
}
