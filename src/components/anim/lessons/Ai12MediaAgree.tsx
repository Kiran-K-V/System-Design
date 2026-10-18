import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { SLICES, overallAgree } from './Ai12MediaMath';

type Who = 'clip' | 'pref' | 'vlm';
const WHO: { id: Who; label: string }[] = [
  { id: 'clip', label: 'Text-match score' },
  { id: 'pref', label: 'Preference scorer' },
  { id: 'vlm', label: 'VLM pairwise judge' },
];

/** Illustrative judge-human agreement by slice. All numbers made up for teaching. */
export default function Ai12MediaAgree() {
  const [who, setWho] = useState<Who>('clip');
  const overall = overallAgree(SLICES, who);
  return (
    <CacheWidgetFrame title="Does the automatic score pick the same winner as people?" hint="ILLUSTRATIVE data, not measured">
      <div className="mb-3">
        <Seg label="Automatic scorer" value={who} options={WHO} onChange={setWho} />
      </div>
      <p className="mb-3 text-sm text-muted">
        For 100 image pairs per slice, humans voted and the scorer also picked a winner. Each bar is the share of pairs where both picked the same one. 50% is a coin flip. All figures are made up for this lesson.
      </p>
      <div className="space-y-3">
        {SLICES.map((s) => {
          const v = s.agree[who];
          const tone = v < 60 ? 'var(--bad)' : v < 75 ? 'var(--warn)' : 'var(--ok)';
          return (
            <div key={s.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{s.name} <span className="text-muted">({Math.round(s.share * 100)}% of traffic)</span></span>
                <span className="font-mono tabular-nums" style={{ color: tone }}>{v}%</span>
              </div>
              <div className="relative h-3 rounded bg-surface" role="img" aria-label={`${s.name}: ${v} percent agreement`}>
                <div className="h-3 rounded" style={{ width: `${v}%`, background: tone, opacity: 0.6 }} />
                <div className="absolute top-0 h-3 border-l border-dashed border-fg" style={{ left: '50%' }} title="coin flip" />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm" aria-live="polite">
        Traffic-weighted agreement: <span className="font-mono tabular-nums">{overall.toFixed(1)}%</span>. The average hides the slices near 50%, where the scorer is guessing.
      </p>
    </CacheWidgetFrame>
  );
}
