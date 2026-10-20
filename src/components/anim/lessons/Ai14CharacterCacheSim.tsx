import { useMemo, useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { simulate, SERVERS, type CacheParams, type CacheResult, type Router } from './Ai14CharacterCacheLogic';

const PRESETS = [
  { id: 'roomy', label: 'Roomy cache', dialogues: 8000, slots: 1500, sticky: 99, edit: 3 },
  { id: 'tight', label: 'Cache too small', dialogues: 8000, slots: 600, sticky: 99, edit: 3 },
  { id: 'leaky', label: 'Leaky routing', dialogues: 8000, slots: 1500, sticky: 70, edit: 3 },
] as const;

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Slider({ id, label, value, min, max, step, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value.toLocaleString('en-US')}{unit}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const NAMES: Record<Router, string> = { spread: 'Random server', sticky: 'Sticky sessions' };

/** Inter-turn cache hit simulator. All inputs are illustrative; the logic is in Ai14CharacterCacheLogic.ts. */
export default function Ai14CharacterCacheSim() {
  const [dialogues, setDialogues] = useState(8000);
  const [slots, setSlots] = useState(1500);
  const [sticky, setSticky] = useState(99);
  const [edit, setEdit] = useState(3);
  const p: CacheParams = { dialogues, slots, stickyShare: sticky / 100, editShare: edit / 100 };
  const rs = useMemo(() => ({ spread: simulate('spread', p), sticky: simulate('sticky', p) }) as Record<Router, CacheResult>, [dialogues, slots, sticky, edit]); // eslint-disable-line react-hooks/exhaustive-deps
  const perServer = Math.round(dialogues / SERVERS);
  const rows: { id: string; label: string; show: (r: CacheResult) => string }[] = [
    { id: 'rate', label: 'Cache rate (prompt tokens from cache)', show: (r) => pct(r.cacheRate) },
    { id: 'full', label: 'Turns with no miss and no rewind', show: (r) => pct(r.fullHitTurns) },
    { id: 'pre', label: 'Tokens prefilled per turn', show: (r) => Math.round(r.prefillPerTurn).toLocaleString('en-US') },
    { id: 'work', label: 'Prefill work vs no cache', show: (r) => pct(r.workVsNoCache) },
  ];
  const active = PRESETS.find((x) => x.dialogues === dialogues && x.slots === slots && x.sticky === sticky && x.edit === edit)?.id ?? 'custom';

  return (
    <CacheWidgetFrame title="Inter-turn cache: sticky sessions against random routing" hint="Illustrative model. Move the sliders.">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Presets:</span>
        <Seg
          label="Preset"
          value={active}
          options={PRESETS.map((x) => ({ id: x.id as string, label: x.label }))}
          onChange={(id) => {
            const x = PRESETS.find((q) => q.id === id)!;
            setDialogues(x.dialogues);
            setSlots(x.slots);
            setSticky(x.sticky);
            setEdit(x.edit);
          }}
        />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Slider id="a14c-dial" label={`Open dialogues (${SERVERS} servers, ${perServer.toLocaleString('en-US')} each if sticky)`} value={dialogues} min={4000} max={16000} step={1000} unit="" onChange={setDialogues} />
        <Slider id="a14c-slots" label="Dialogues one server can cache" value={slots} min={200} max={3000} step={100} unit="" onChange={setSlots} />
        <Slider id="a14c-sticky" label="Turns that follow the sticky rule" value={sticky} min={50} max={100} step={1} unit="%" onChange={setSticky} />
        <Slider id="a14c-edit" label="Turns that rewind (edit or regenerate)" value={edit} min={0} max={20} step={1} unit="%" onChange={setEdit} />
      </div>

      <div className="overflow-x-auto" aria-live="polite">
        <table className="w-full text-left text-[13px] sm:text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-1.5 pr-2 font-normal">Measure</th>
              {(['spread', 'sticky'] as Router[]).map((k) => (
                <th key={k} className="px-1 py-1.5 font-normal sm:px-2">{NAMES[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line/60">
                <td className="py-1.5 pr-2 text-muted">{row.label}</td>
                {(['spread', 'sticky'] as Router[]).map((k) => (
                  <td key={k} className="px-1 py-1.5 tabular-nums sm:px-2" data-testid={`cc-${row.id}-${k}`} style={{ color: k === 'sticky' ? 'var(--ok)' : undefined }}>
                    {row.show(rs[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <div className="mb-1 text-xs text-muted">Cache rate against the company claim of 95% (the post does not define "cache rate")</div>
        {(['spread', 'sticky'] as Router[]).map((k) => (
          <div key={k} className="mb-1.5 flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 text-muted sm:w-40">{NAMES[k]}</span>
            <div className="relative h-4 flex-1 rounded bg-line" role="img" aria-label={`${NAMES[k]} cache rate ${pct(rs[k].cacheRate)}, claim 95%`}>
              <div className="h-full rounded" style={{ width: `${rs[k].cacheRate * 100}%`, background: k === 'sticky' ? 'var(--ok)' : 'var(--muted)', opacity: 0.85 }} />
              <div className="absolute top-[-3px] h-[22px] border-l-2 border-dashed" style={{ left: '95%', borderColor: 'var(--fg)' }} title="Company claim: 95%" />
            </div>
            <span className="w-12 shrink-0 text-right tabular-nums">{pct(rs[k].cacheRate)}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted">
        Model, all illustrative: {SERVERS} servers, each with an LRU cache of whole dialogues. A dialogue starts with 20 to 340 messages (mean 180, the post's average) of 50 tokens each. Each turn picks an open dialogue at random, adds a 50-token user message and a 50-token reply, and the reply is cached. A rewind keeps a random part of the cached prefix. Sticky sends a dialogue to its home server (id modulo {SERVERS}) except for the turns that leak. Spread sends every turn to a random server. The cache rate counts the new user message as prompt, so the ceiling is about 99%. We tuned nothing to match 95%. These are our assumptions, not Character.AI data.
      </p>
    </CacheWidgetFrame>
  );
}
