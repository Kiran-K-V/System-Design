import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { CLASSES, PARTS, hitCounts, type Part } from './Ai10ThreatMath';

/** Cell centers for the reference agent. */
const POS: Record<Part, { cx: number; cy: number; w: number; h: number }> = {
  train: { cx: 120, cy: 60, w: 170, h: 44 },
  prompt: { cx: 120, cy: 140, w: 170, h: 44 },
  index: { cx: 120, cy: 220, w: 170, h: 44 },
  model: { cx: 360, cy: 140, w: 130, h: 190 },
  tools: { cx: 600, cy: 60, w: 170, h: 44 },
  render: { cx: 600, cy: 140, w: 170, h: 44 },
  meter: { cx: 600, cy: 220, w: 170, h: 44 },
};

const LINKS: [Part, Part, 'end' | 'both'][] = [
  ['train', 'model', 'end'],
  ['prompt', 'model', 'end'],
  ['index', 'model', 'end'],
  ['model', 'tools', 'both'],
  ['model', 'render', 'end'],
  ['model', 'meter', 'end'],
];

export default function Ai10ThreatOwasp() {
  const [sel, setSel] = useState<string | null>('LLM01');
  const counts = hitCounts();
  const cls = CLASSES.find((c) => c.id === sel) ?? null;
  const lit = new Set<Part>(cls ? cls.hits : []);

  return (
    <CacheWidgetFrame title="OWASP ten on a reference agent" hint="Pick a class. The mapping is this lesson's reading, not an OWASP table.">
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="OWASP LLM Top 10 class">
        {CLASSES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={c.id === sel}
            onClick={() => setSel(c.id === sel ? null : c.id)}
            className={`rounded-md border px-2 py-1 text-xs ${c.id === sel ? 'border-accent bg-accent font-semibold text-white' : 'border-line text-muted hover:bg-surface'}`}
          >
            {c.id.replace('LLM', '')} {c.title}
          </button>
        ))}
      </div>
      <SketchSvg width={720} height={270} label="Reference agent with seven parts. The selected OWASP class lights the parts it hits.">
        {LINKS.map(([a, b, head]) => {
          const A = POS[a];
          const B = POS[b];
          const left = A.cx < B.cx;
          const x1 = left ? A.cx + A.w / 2 + 6 : A.cx - A.w / 2 - 6;
          const x2 = left ? B.cx - B.w / 2 - 6 : B.cx + B.w / 2 + 6;
          const y1 = a === 'model' ? B.cy : A.cy;
          const y2 = b === 'model' ? A.cy : B.cy;
          return <SketchArrow key={`${a}${b}`} points={[[x1, y1], [x2, y2]]} head={head} stroke="var(--muted)" seed={seedOf(`to-${a}${b}`)} />;
        })}
        {PARTS.map((p) => {
          const P = POS[p.id];
          const on = lit.has(p.id);
          return (
            <g key={p.id}>
              <SketchBox cx={P.cx} cy={P.cy} w={P.w} h={P.h} r={8} seed={seedOf(`to-${p.id}`)} stroke={on ? 'var(--accent)' : 'var(--fg)'} fill={on ? 'var(--accent)' : undefined} strokeWidth={on ? 2.2 : 1.4} />
              <HandText x={P.cx} y={p.id === 'model' ? P.cy - 12 : P.cy} size={TEXT_SIZES.label}>{p.id === 'model' ? 'Model' : p.label}</HandText>
              {p.id === 'model' && <HandText x={P.cx} y={P.cy + 12} size={TEXT_SIZES.label}>+ context</HandText>}
              <HandText x={P.cx} y={P.cy + P.h / 2 + 16} size={TEXT_SIZES.note} color="var(--muted)">{`${counts[p.id]} of 10 classes`}</HandText>
            </g>
          );
        })}
      </SketchSvg>
      <div className="mt-2 rounded-lg border border-line bg-surface p-3 text-sm" aria-live="polite">
        {cls ? (
          <>
            <p className="font-medium">{cls.id}:2025 {cls.title}</p>
            <p className="mt-1">{cls.how}</p>
            <p className="mt-1 text-muted">Parts hit: {cls.hits.map((h) => PARTS.find((p) => p.id === h)!.label).join(', ')}.</p>
          </>
        ) : (
          <p className="text-muted">No class selected. The count under each part shows how many of the ten classes touch it. The model and the tools sit at the center of the most classes, so most controls belong there.</p>
        )}
      </div>
    </CacheWidgetFrame>
  );
}
