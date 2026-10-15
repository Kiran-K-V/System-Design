import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { Slider } from './AdvKit';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { cosine, cosineDistance, dot, l2, type V } from './vecMath';

/** Query A = (1, 0). Candidate C = (3, 0) is fixed. Candidate B is set by angle and length. Shows which candidate each metric prefers. */
const A: V = [1, 0];
const C: V = [3, 0];
const S = 50;
const OX = 360;
const OY = 220;
const px = (x: number) => OX + x * S;
const py = (y: number) => OY - y * S;

export default function VecMetrics() {
  const [angle, setAngle] = useState(45);
  const [len, setLen] = useState(Math.SQRT2);
  const rad = (angle * Math.PI) / 180;
  const B: V = [len * Math.cos(rad), len * Math.sin(rad)];
  const rows = [
    { name: 'Dot product', hint: 'higher is closer', b: dot(A, B), c: dot(A, C), higher: true },
    { name: 'Cosine similarity', hint: 'higher is closer', b: cosine(A, B), c: cosine(A, C), higher: true },
    { name: 'Cosine distance', hint: 'lower is closer', b: cosineDistance(A, B), c: cosineDistance(A, C), higher: false },
    { name: 'L2 distance', hint: 'lower is closer', b: l2(A, B), c: l2(A, C), higher: false },
  ];
  const f = (x: number) => (Math.abs(x) < 0.0005 ? '0.000' : x.toFixed(3));
  return (
    <CacheWidgetFrame title="Three ways to say two vectors are close" hint="query A = (1, 0); candidates B and C = (3, 0)">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Slider id="vm-angle" label="B: angle from A" value={angle} min={0} max={180} step={5} onChange={setAngle} show={`${angle}°`} />
        <Slider id="vm-len" label="B: length" value={len} min={0.5} max={4} step={0.01} onChange={setLen} show={len.toFixed(2)} />
      </div>
      <SketchSvg width={720} height={250} label="Arrows for the query A, the candidate B, and the candidate C from the origin">
        <SketchEllipse cx={px(0)} cy={py(0)} w={8} h={8} seed={seedOf('vm-origin')} stroke="var(--fg)" fill="var(--fg)" fillStyle="solid" />
        <SketchArrow points={[[px(0), py(0)], [px(C[0]) - 4, py(C[1]) - 3]]} stroke="var(--muted)" seed={seedOf('vm-c')} />
        <HandText x={px(C[0]) + 10} y={py(0) + 18} size={TEXT_SIZES.label} color="var(--muted)" anchor="start">
          {'C (3, 0)'}
        </HandText>
        <SketchArrow points={[[px(0), py(0)], [px(B[0]), py(B[1])]]} stroke="var(--ok)" seed={seedOf('vm-b')} />
        <HandText x={px(B[0]) + (B[0] < -2 ? -8 : 10)} y={py(B[1]) - 12} size={TEXT_SIZES.label} color="var(--ok)" anchor={B[0] < -2 ? 'end' : 'start'}>
          {`B (${f(B[0])}, ${f(B[1])})`}
        </HandText>
        <SketchArrow points={[[px(0), py(0) - 6], [px(A[0]), py(A[1]) - 6]]} stroke="var(--accent)" seed={seedOf('vm-a')} />
        <HandText x={px(A[0]) - 4} y={py(0) + 26} size={TEXT_SIZES.label} color="var(--accent)">
          {'A (1, 0)'}
        </HandText>
      </SketchSvg>
      <div className="not-prose mt-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-1 pr-3 font-medium">Measure</th>
              <th className="py-1 pr-3 font-medium">B</th>
              <th className="py-1 pr-3 font-medium">C</th>
              <th className="py-1 font-medium">Closer to A</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const tie = Math.abs(r.b - r.c) < 0.0005;
              const bWins = r.higher ? r.b > r.c : r.b < r.c;
              return (
                <tr key={r.name} className="border-t border-line">
                  <td className="py-1.5 pr-3">
                    {r.name} <span className="text-xs text-muted">({r.hint})</span>
                  </td>
                  <td className="py-1.5 pr-3 tabular-nums">{f(r.b)}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{f(r.c)}</td>
                  <td className={`py-1.5 font-semibold ${tie ? 'text-muted' : bWins ? 'text-ok' : 'text-accent'}`}>{tie ? 'tie' : bWins ? 'B' : 'C'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CacheWidgetFrame>
  );
}
