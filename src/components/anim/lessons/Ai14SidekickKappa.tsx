import { HandText, SketchBox, SketchSvg, SketchArrow, STROKE, TEXT_SIZES, seedOf } from '../sketch';

/**
 * Static figure. Every value is from Shopify's post (2025-08-26).
 * Panel A: Cohen's kappa, judge against human labels, and the human baseline.
 * Panel B: a DIFFERENT measure ("LLM judge correlation"), reported later in the GRPO section. Not kappa.
 * The post gives no per-criterion values, so none are drawn.
 */

const X0 = 230; // value 0
const SPAN = 440; // pixels for 1.0
const x = (v: number) => X0 + v * SPAN;

function Bar({ y, label, value, tone, seed }: { y: number; label: string; value: number; tone: string; seed: string }) {
  const w = Math.max(value * SPAN, 6);
  return (
    <g>
      <HandText x={X0 - 14} y={y} size={TEXT_SIZES.label} anchor="end">{label}</HandText>
      <SketchBox cx={X0 + w / 2} cy={y} w={w} h={34} r={6} seed={seedOf(seed)} fill={tone} stroke={tone} />
      {w > 60 ? (
        <HandText x={X0 + w - 10} y={y} size={TEXT_SIZES.label} anchor="end" mono>{value.toFixed(2)}</HandText>
      ) : (
        <HandText x={X0 + w + 10} y={y} size={TEXT_SIZES.label} anchor="start" mono>{value.toFixed(2)}</HandText>
      )}
    </g>
  );
}

export default function Ai14SidekickKappa() {
  return (
    <figure className="not-prose my-8">
      <SketchSvg width={720} height={470} label="Cohen's kappa of Shopify's LLM judge against human labels: 0.02 at first, 0.61 after prompt work, against a human baseline of 0.69. A second panel shows judge correlation rising from 0.66 to 0.75.">
        <HandText x={24} y={22} size={TEXT_SIZES.heading} anchor="start">Panel A. Cohen's kappa, judge against human labels</HandText>
        <Bar y={92} label="Judge, first version" value={0.02} tone="var(--bad)" seed="k-first" />
        <Bar y={146} label="Judge, after prompt work" value={0.61} tone="var(--ok)" seed="k-after" />
        <SketchArrow points={[[x(0.69), 62], [x(0.69), 178]]} seed={seedOf('human')} stroke="var(--fg)" strokeWidth={STROKE.emphasis} dashed head="none" />
        <HandText x={x(0.69) + 8} y={60} size={TEXT_SIZES.note} anchor="start">Human baseline 0.69</HandText>
        <SketchBox cx={X0 + SPAN / 2} cy={206} w={SPAN} h={30} r={6} seed={seedOf('per-criterion')} stroke="var(--muted)" dashed />
        <HandText x={X0 + SPAN / 2} y={206} size={TEXT_SIZES.note} color="var(--muted)">Kappa for each criterion or judge: not published</HandText>
        <HandText x={X0} y={238} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">0 = no better than chance</HandText>
        <HandText x={X0 + SPAN} y={238} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">1 = perfect</HandText>

        <HandText x={24} y={286} size={TEXT_SIZES.heading} anchor="start">Panel B. A different measure: judge correlation (not kappa)</HandText>
        <Bar y={340} label="Before fixes, average" value={0.66} tone="var(--warn)" seed="c-before" />
        <Bar y={394} label="After fixes, average" value={0.75} tone="var(--ok)" seed="c-after" />
        <HandText x={X0} y={440} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">The post does not say which correlation. No human line: 0.69 is a kappa.</HandText>
      </SketchSvg>
    </figure>
  );
}
