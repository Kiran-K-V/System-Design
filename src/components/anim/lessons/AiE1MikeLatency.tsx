import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Latency figures from two company posts. They measure different things and are not a ranking. Monolith publishes none. */

const W = 720;
const X0 = 190;
const MAX_W = 370;
const SCALE = 100; // ms mapped to MAX_W

interface Row {
  label: string;
  ms?: number;
  text: string;
  tone: string;
}

const ROWS: Row[] = [
  { label: 'Uber, no Cassandra', ms: 5, text: 'P95 under 5 ms', tone: 'var(--ok)' },
  { label: 'Uber, with Cassandra', ms: 10, text: 'P95 under 10 ms', tone: 'var(--ok)' },
  { label: 'Stripe Radar', ms: 100, text: 'under 100 ms', tone: 'var(--warn)' },
  { label: 'Monolith', text: 'not published', tone: 'var(--muted)' },
];

const steps = [
  { caption: 'Uber says a model that needs no features from Cassandra, its online store, usually answers at P95 under 5 ms. P95 means 95 of 100 requests are faster.' },
  { caption: 'With features read from Cassandra, Uber says P95 under 10 ms. Our reading: the feature read can double the time, so a feature store is on the critical path of every call.' },
  { caption: 'Stripe says Radar decides in less than 100 ms. That is the whole decision for a payment, with 1,000+ characteristics, and the post gives no percentile. It is a budget, not a measured P95.' },
  { caption: 'Our reading: the three numbers are not a ranking. Uber gives a percentile for one prediction call. Stripe gives a ceiling for a whole decision. The posts do not say where each clock starts. Monolith publishes no latency at all. Its figure is freshness: sparse updates reach serving every minute.' },
];

export default function AiE1MikeLatency() {
  return (
    <AnimFrame title="Published latency, side by side" steps={steps} interval={4200}>
      {(i) => {
        const shown = i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 3 : 4;
        return (
          <SketchSvg width={W} height={250} label="Bars of latency claims: Uber under 5 and 10 milliseconds, Stripe Radar under 100 milliseconds, Monolith not published">
            <HandText x={24} y={24} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
              Milliseconds, company claims. Bars share one scale.
            </HandText>
            {ROWS.slice(0, shown).map((r, k) => {
              const cy = 66 + k * 46;
              const w = r.ms ? Math.max(8, (r.ms / SCALE) * MAX_W) : 0;
              const active = k === shown - 1;
              return (
                <g key={r.label}>
                  <HandText x={24} y={cy} size={TEXT_SIZES.label} anchor="start">
                    {r.label}
                  </HandText>
                  {r.ms ? (
                    <SketchBox cx={X0 + w / 2} cy={cy} w={w} h={28} r={4} seed={seedOf(`ml-${r.label}`)} stroke={active ? 'var(--accent)' : r.tone} fill={r.tone} />
                  ) : (
                    <SketchBox cx={X0 + 70} cy={cy} w={140} h={28} r={4} seed={seedOf('ml-mono')} stroke="var(--muted)" dashed />
                  )}
                  <HandText x={X0 + (r.ms ? w : 140) + 12} y={cy} size={TEXT_SIZES.label} anchor="start" color={r.tone}>
                    {r.text}
                  </HandText>
                </g>
              );
            })}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
