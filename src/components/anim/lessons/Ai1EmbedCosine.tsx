import { useState } from 'react';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { POINTS, angleBetween, cosine, dot, norm, toXY } from './Ai1EmbedMath';

const CX = 260;
const CY = 170;
const S = 70;
const px = (p: [number, number]): [number, number] => [CX + p[0] * S, CY - p[1] * S];

export default function Ai1EmbedCosine() {
  const [sel, setSel] = useState<[string, string]>(['refund', 'return']);
  const [scale, setScale] = useState(1);
  const pick = (id: string) => {
    if (id === sel[0] || id === sel[1]) return;
    setSel([sel[1], id]);
    setScale(1);
  };
  const A = POINTS.find((p) => p.id === sel[0])!;
  const B0 = POINTS.find((p) => p.id === sel[1])!;
  const B = { ...B0, len: B0.len * scale };
  const a = toXY(A);
  const b = toXY(B);
  const cos = cosine(a, b);

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="cosine-play">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">Cosine similarity playground (2D)</span>
        <span className="text-xs text-muted">illustrative vectors, not a real model</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <SketchSvg width={720} height={340} label="Phrases drawn as vectors in a 2D plane">
            <SketchArrow points={[[CX - 220, CY], [CX + 250, CY]]} head="none" stroke="var(--border)" seed={seedOf('ax1')} />
            <SketchArrow points={[[CX, CY + 160], [CX, CY - 160]]} head="none" stroke="var(--border)" seed={seedOf('ax2')} />
            <SketchEllipse cx={CX} cy={CY} w={S * 2} h={S * 2} stroke="var(--muted)" dashed seed={seedOf('unit')} />
            {POINTS.map((p) => {
              const on = p.id === sel[0] || p.id === sel[1];
              const [x, y] = px(toXY(p));
              return (
                <g key={p.id} onClick={() => pick(p.id)} style={{ cursor: 'pointer' }} data-pt={p.id}>
                  <SketchEllipse cx={x} cy={y} w={on ? 16 : 12} h={on ? 16 : 12} stroke={p.id === sel[0] ? 'var(--accent)' : p.id === sel[1] ? 'var(--warn)' : 'var(--muted)'} fill={p.id === sel[0] ? 'var(--accent)' : p.id === sel[1] ? 'var(--warn)' : 'var(--muted)'} seed={seedOf(`pt-${p.id}`)} />
                  <HandText x={x + 12} y={y} anchor="start" size={TEXT_SIZES.note} color={on ? 'var(--fg)' : 'var(--muted)'} halo>
                    {p.label}
                  </HandText>
                </g>
              );
            })}
            <SketchArrow points={[[CX, CY], px(a)]} stroke="var(--accent)" strokeWidth={2.2} seed={seedOf('va')} />
            <SketchArrow points={[[CX, CY], px(b)]} stroke="var(--warn)" strokeWidth={2.2} seed={seedOf('vb')} />
            <HandText x={24} y={24} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              dashed circle = length 1
            </HandText>
          </SketchSvg>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Choose phrases">
        {POINTS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => pick(p.id)}
            aria-pressed={p.id === sel[0] || p.id === sel[1]}
            className={`rounded-md border px-2.5 py-1.5 text-xs ${p.id === sel[0] ? 'border-accent bg-accent-soft' : p.id === sel[1] ? 'border-warn bg-surface' : 'border-line hover:bg-surface'}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Click two phrases. The accent vector is A (older pick). The orange vector is B (newest pick).</p>
      <div className="mt-3">
        <label htmlFor="cos-scale" className="mb-1 flex justify-between text-xs text-muted">
          <span>Stretch B (length x)</span>
          <span className="tabular-nums text-fg">{scale.toFixed(2)}</span>
        </label>
        <input id="cos-scale" type="range" min={0.25} max={2} step={0.05} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full accent-[var(--accent)]" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="cos-readout">
        <Card title="Angle between A and B" value={`${angleBetween(a, b).toFixed(1)}°`} />
        <Card title="Cosine similarity" value={cos.toFixed(3)} tone="text-ok" />
        <Card title="Raw dot product" value={dot(a, b).toFixed(2)} note="changes with length" />
        <Card title="Dot of unit vectors" value={(dot(a, b) / (norm(a) * norm(b))).toFixed(3)} note="equals cosine" />
      </div>
      <p className="mt-2 text-xs text-muted">
        Cosine = dot product divided by both lengths. It reads the angle only. Stretch B and the cosine does not move, but the raw dot product does. OpenAI's embedding vectors are normalized to length 1, so for them cosine equals the dot product.
      </p>
    </div>
  );
}

function Card({ title, value, note, tone }: { title: string; value: string; note?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-xs text-muted">{title}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone ?? ''}`}>{value}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </div>
  );
}
