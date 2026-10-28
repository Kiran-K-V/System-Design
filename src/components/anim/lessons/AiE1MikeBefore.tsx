import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Three systems, before and after. Every cell paraphrases the company's own post or paper (see the lesson table). */

const W = 720;
const COLS = [
  { x: 120, name: 'Michelangelo', year: 'Uber, 2017', before: ['One-off serving', 'per team'], after: ['Six-step shared', 'platform'] },
  { x: 360, name: 'Monolith', year: 'ByteDance, 2022', before: ['Batch train,', 'serve apart'], after: ['Sparse update', 'each minute'] },
  { x: 600, name: 'Radar', year: 'Stripe, 2023', before: ['XGBoost plus', 'a neural net'], after: ['Neural net', 'only'] },
];

const steps = [
  { caption: 'Three systems from three companies, each read from its own post or paper. Each column starts with the "before": the design the team says it left behind.' },
  { caption: 'Michelangelo (Uber post, 2017). Company claim: before it, "no established path to deploying a model into production", so teams built a custom serving container per project. After: one platform with a six-step workflow and a shared feature store.' },
  { caption: 'Monolith (ByteDance paper, 2022). Paper claim: general frameworks separate batch training from serving, and use fixed-size tables for IDs that collide. After: a collisionless table, and the touched sparse keys pushed to serving every minute.' },
  { caption: 'Radar (Stripe post, 2023). Company claim: a mid-2022 move from a model that combined XGBoost and a neural net to a neural net alone cut training time by over 85%, to under two hours.' },
];

export default function AiE1MikeBefore() {
  return (
    <AnimFrame title="Three systems, before and after" steps={steps} interval={4200}>
      {(i) => (
        <SketchSvg width={W} height={330} label="Three columns for Michelangelo, Monolith and Radar, each showing a before and an after design">
          {COLS.map((c, k) => {
            const showAfter = i === k + 1 || i > k + 1;
            const active = i === k + 1;
            return (
              <g key={c.name}>
                <HandText x={c.x} y={30} size={TEXT_SIZES.heading} anchor="middle" color={active ? 'var(--accent)' : 'var(--fg)'}>
                  {c.name}
                </HandText>
                <HandText x={c.x} y={54} size={TEXT_SIZES.note} anchor="middle" color="var(--muted)">
                  {c.year}
                </HandText>
                <SketchBox cx={c.x} cy={115} w={200} h={64} seed={seedOf(`mb-${c.name}`)} stroke="var(--bad)" fill="var(--bad)" />
                <HandText x={c.x} y={106} size={TEXT_SIZES.label} anchor="middle">
                  {c.before[0]}
                </HandText>
                <HandText x={c.x} y={128} size={TEXT_SIZES.label} anchor="middle">
                  {c.before[1]}
                </HandText>
                {showAfter && (
                  <g>
                    <SketchArrow points={[[c.x, 153], [c.x, 207]]} seed={seedOf(`ma-${c.name}`)} stroke={active ? 'var(--accent)' : 'var(--muted)'} />
                    <SketchBox cx={c.x} cy={245} w={200} h={64} seed={seedOf(`mc-${c.name}`)} stroke={active ? 'var(--accent)' : 'var(--ok)'} fill="var(--ok)" />
                    <HandText x={c.x} y={236} size={TEXT_SIZES.label} anchor="middle">
                      {c.after[0]}
                    </HandText>
                    <HandText x={c.x} y={258} size={TEXT_SIZES.label} anchor="middle">
                      {c.after[1]}
                    </HandText>
                  </g>
                )}
              </g>
            );
          })}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
