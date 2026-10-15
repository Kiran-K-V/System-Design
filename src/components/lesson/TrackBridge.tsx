import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../anim/sketch';

/** Static infographic: backend modules feed the AI modules built on them. Rendered at build time, no hooks. */

const backend = ['One machine', 'Caching', 'Networking', 'Async', 'Data', 'Reliability'];
const ai = ['Serving', 'LLM apps', 'RAG', 'LLMOps'];

const BX = 150;
const AX = 610;
const BY = (i: number) => 52 + i * 62;
const AY = (i: number) => 90 + i * 80;

/** Which backend modules each AI module builds on. Shared with the text fallback on the hub. */
export const bridges: { ai: string; from: string[] }[] = [
  { ai: 'Serving', from: ['One machine', 'Caching', 'Networking'] },
  { ai: 'LLM apps', from: ['Networking', 'Async'] },
  { ai: 'RAG', from: ['Data'] },
  { ai: 'LLMOps', from: ['Reliability'] },
];

// Both columns are ordered so links run roughly parallel and never cross.
const edges: [number, number][] = bridges.flatMap((b) => b.from.map((f) => [backend.indexOf(f), ai.indexOf(b.ai)] as [number, number]));
/** Spread the ends of one box's links over its edge so arrowheads and tails do not pile up. */
const spread = (n: number, k: number) => (n === 1 ? 0 : (k - (n - 1) / 2) * 14);

export default function TrackBridge() {
  return (
    <SketchSvg width={760} height={400} label="Backend modules on the left feed the AI modules on the right">
      <HandText x={BX} y={18} size={18} color="var(--c-backend)">
        Backend
      </HandText>
      <HandText x={AX} y={18} size={18} color="var(--c-ai)">
        AI
      </HandText>

      {edges.map(([b, a]) => {
        const outs = edges.filter(([x]) => x === b);
        const ins = edges.filter(([, y]) => y === a);
        const y1 = BY(b) + spread(outs.length, outs.findIndex(([, y]) => y === a));
        const y2 = AY(a) + spread(ins.length, ins.findIndex(([x]) => x === b));
        return (
          <SketchArrow
            key={`${b}-${a}`}
            points={[
              [BX + 94, y1],
              [AX - 94, y2],
            ]}
            stroke="var(--edge)"
            seed={seedOf(`edge-${b}-${a}`)}
          />
        );
      })}

      {backend.map((m, i) => (
        <g key={m}>
          <SketchBox cx={BX} cy={BY(i)} w={176} h={44} r={8} stroke="var(--c-backend)" seed={seedOf(`b-${m}`)} />
          <HandText x={BX} y={BY(i)} size={16}>
            {m}
          </HandText>
        </g>
      ))}
      {ai.map((m, i) => (
        <g key={m}>
          <SketchBox cx={AX} cy={AY(i)} w={176} h={44} r={8} stroke="var(--c-ai)" seed={seedOf(`a-${m}`)} />
          <HandText x={AX} y={AY(i)} size={16}>
            {m}
          </HandText>
        </g>
      ))}
    </SketchSvg>
  );
}
