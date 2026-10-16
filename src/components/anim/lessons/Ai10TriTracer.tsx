import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { LEGS, LEG_NAME, TOOLS, allowedCombos, assess, type Leg, type Selection } from './Ai10TriLogic';

type Mode = 'off' | 'on' | 'hardened';

const START: Selection = { read_inbox: 'on', search_web: 'on', send_email: 'on', render_images: 'on', read_wiki: 'off', fetch_url: 'off', post_slack: 'off' };

export default function Ai10TriTracer() {
  const [sel, setSel] = useState<Selection>(START);
  const v = assess(sel);
  const { allowed, total } = allowedCombos();
  const set = (id: string, m: Mode) => setSel((cur) => ({ ...cur, [id]: m }));
  const tone = v.trifecta ? 'var(--bad)' : v.present.length === 2 ? 'var(--warn)' : 'var(--ok)';
  const verdict = v.trifecta
    ? 'All three legs are present. One injected instruction can read private data and send it out.'
    : v.present.length === 2
      ? 'Two legs are present. Lower risk, not safe: damage is still possible with the two you have.'
      : v.present.length === 1
        ? 'One leg is present. The agent has little to steal or nowhere to send it.'
        : 'No tools selected.';

  return (
    <CacheWidgetFrame title="Path tracer: which legs does this agent have?" hint="Illustrative mail assistant. Leg labels per tool are a design judgment.">
      <div className="mb-4 space-y-2">
        {TOOLS.map((t) => {
          const m = sel[t.id] ?? 'off';
          const opts: { id: Mode; label: string }[] = [
            { id: 'off', label: 'Off' },
            { id: 'on', label: 'On' },
          ];
          if (t.hardened) opts.push({ id: 'hardened', label: 'Hardened' });
          const legs = m === 'hardened' && t.hardened ? t.hardened.legs : t.legs;
          return (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-2">
              <div className="min-w-0 flex-1 basis-56">
                <p className="text-sm">{m === 'hardened' && t.hardened ? t.hardened.label : t.label}</p>
                <p className="font-mono text-[12px] text-muted">{m === 'off' ? 'no legs' : legs.length ? `legs: ${legs.join(', ')}` : 'legs: none'}</p>
              </div>
              <Seg label={t.label} value={m} options={opts} onChange={(x) => set(t.id, x)} />
            </div>
          );
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-3" aria-live="polite">
        {LEGS.map((leg: Leg) => {
          const on = v.by[leg].length > 0;
          return (
            <div key={leg} className="rounded-lg border p-3 text-sm" style={{ borderColor: on ? tone : 'var(--border)' }}>
              <p className="font-mono text-[12px] uppercase tracking-wide text-muted">
                Leg {leg}: {LEG_NAME[leg]}
              </p>
              <p className="mt-1" style={{ color: on ? 'var(--fg)' : 'var(--muted)' }}>
                {on ? v.by[leg].join('; ') : 'absent'}
              </p>
              {on && <p className="mt-1 text-xs text-muted">To cut: change {v.cutCost[leg]} tool{v.cutCost[leg] === 1 ? '' : 's'}</p>}
            </div>
          );
        })}
      </div>
      <p className="mt-3 rounded-lg border p-3 text-sm" style={{ borderColor: tone }}>
        <span className="font-semibold" style={{ color: tone }}>
          {v.trifecta ? 'Lethal trifecta. ' : v.present.length === 2 ? 'Two of three. ' : 'Fewer than two. '}
        </span>
        {verdict}
      </p>
      <p className="mt-2 text-xs text-muted">
        Meta's Rule of Two forbids only the full set in one session: {allowed} of {total} combinations pass. Pick the leg that costs the fewest tool changes to cut.
      </p>
    </CacheWidgetFrame>
  );
}
