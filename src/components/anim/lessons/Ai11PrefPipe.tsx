import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

const STAGES = [
  { name: 'Base model', need: ['next-token', 'prediction'], tone: 'var(--muted)' },
  { name: 'SFT', need: ['demonstrations:', '1 good answer', 'per prompt'], tone: 'var(--accent)' },
  { name: 'Preference tune', need: ['pairs (chosen,', 'rejected) or', 'good/bad labels'], tone: 'var(--accent)' },
  { name: 'Eval gate', need: ['held-out slices,', 'length-controlled', 'judge, pass^k'], tone: 'var(--ok)' },
];
const X = [90, 260, 430, 600];

/** Static infographic: the post-training pipeline and the data each stage needs. */
export default function Ai11PrefPipe() {
  return (
    <figure className="not-prose my-8">
      <SketchSvg width={720} height={250} label="Pipeline: base model, SFT, preference tuning, eval gate, and the data each stage needs">
        {STAGES.map((s, i) => (
          <g key={s.name}>
            <SketchBox cx={X[i]} cy={60} w={140} h={48} r={8} seed={seedOf(`pp${i}`)} stroke={s.tone} fill={i === 3 ? s.tone : undefined} strokeWidth={i === 2 ? 2.2 : 1.4} />
            <HandText x={X[i]} y={60} size={TEXT_SIZES.label}>
              {s.name}
            </HandText>
            <SketchBox cx={X[i]} cy={152} w={150} h={80} r={8} seed={seedOf(`ppd${i}`)} stroke="var(--muted)" dashed />
            <HandText x={X[i]} y={152} size={TEXT_SIZES.note} color="var(--muted)">
              {s.need.join('\n')}
            </HandText>
            {i < 3 && <SketchArrow points={[[X[i] + 74, 60], [X[i + 1] - 74, 60]]} seed={seedOf(`ppa${i}`)} />}
          </g>
        ))}
        <HandText x={360} y={222} size={TEXT_SIZES.note} color="var(--muted)">
          Gate fails: fix the data or the beta, never ship on the training loss.
        </HandText>
      </SketchSvg>
    </figure>
  );
}
