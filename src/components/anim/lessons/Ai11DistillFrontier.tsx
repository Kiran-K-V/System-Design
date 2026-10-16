import { HandText, SketchArrow, SketchBox, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { R1_POINTS, bf16GB } from './Ai11DistillLogic';

const X0 = 90;
const W = 590;
const Y0 = 270;
const H = 210;
const sx = (gb: number) => X0 + (Math.log(gb / 2) / Math.log(80)) * W;
const sy = (v: number) => Y0 - (v / 80) * H;

/** Offsets for labels so close points do not collide. */
const LABEL: Record<string, [number, number, 'start' | 'middle' | 'end']> = {
  'Qwen 1.5B': [0, -20, 'middle'],
  'Qwen 7B': [-12, -16, 'end'],
  'Llama 8B': [-12, 20, 'end'],
  'Qwen 14B': [0, -20, 'middle'],
  'Qwen 32B': [0, -20, 'middle'],
  'Llama 70B': [0, 24, 'middle'],
};

/** Static chart: real scores of the distilled models against the memory their weights need. */
export default function Ai11DistillFrontier() {
  return (
    <figure className="not-prose my-8">
      <SketchSvg width={720} height={330} label="Score on a hard math test against model size, for six small models trained on a large teacher's answers">
        <SketchArrow points={[[X0, Y0], [X0 + W, Y0]]} head="none" seed={seedOf('fr-x')} stroke="var(--muted)" />
        <SketchArrow points={[[X0, Y0], [X0, Y0 - H - 10]]} head="none" seed={seedOf('fr-y')} stroke="var(--muted)" />
        <HandText x={X0 + W / 2} y={Y0 + 40} size={TEXT_SIZES.note} color="var(--muted)">
          memory for the weights in bf16 (GB), log scale
        </HandText>
        <HandText x={24} y={34} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
          AIME 2024 score (% solved)
        </HandText>
        {[3, 14, 64, 140].map((gb) => (
          <HandText key={gb} x={sx(gb)} y={Y0 + 18} size={TEXT_SIZES.note} color="var(--muted)" mono>
            {String(gb)}
          </HandText>
        ))}
        {[0, 40, 80].map((v) => (
          <HandText key={v} x={X0 - 12} y={sy(v)} anchor="end" size={TEXT_SIZES.note} color="var(--muted)" mono>
            {String(v)}
          </HandText>
        ))}
        <SketchArrow points={[[X0, sy(63.6)], [X0 + W, sy(63.6)]]} head="none" seed={seedOf('fr-o1')} stroke="var(--warn)" dashed />
        <HandText x={X0 + W - 4} y={sy(63.6) - 14} anchor="end" size={TEXT_SIZES.note} color="var(--warn)">
          o1-mini: 63.6
        </HandText>
        {R1_POINTS.map((p) => {
          const x = sx(bf16GB(p.params));
          const y = sy(p.aime);
          const [dx, dy, anchor] = LABEL[p.name];
          return (
            <g key={p.name}>
              <SketchEllipse cx={x} cy={y} w={14} h={14} seed={seedOf(`fr-${p.name}`)} stroke="var(--accent)" fill="var(--accent)" strokeWidth={2.2} />
              <HandText x={x + dx} y={y + dy} anchor={anchor} size={TEXT_SIZES.note}>
                {`${p.name}: ${p.aime}`}
              </HandText>
            </g>
          );
        })}
        <SketchBox cx={sx(bf16GB(32))} cy={sy(47)} w={14} h={14} r={3} seed={seedOf('fr-zero')} stroke="var(--bad)" fill="var(--bad)" strokeWidth={2.2} />
        <HandText x={sx(bf16GB(32))} y={sy(47) + 26} anchor="middle" size={TEXT_SIZES.note} color="var(--bad)">
          32B, no teacher (RL only): 47.0
        </HandText>
      </SketchSvg>
    </figure>
  );
}
