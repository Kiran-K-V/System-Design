import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { MATURITY } from './AiE1FraudLogic';

/** Label delay: cohorts of payments by age, and how much of each cohort's fraud is labeled yet. Shape is illustrative. */

const W = 720;
const X0 = 150;
const BAR_W = 420;
const ROW = 54;

interface Cohort {
  label: string;
  known: number;
}

const COHORTS: Cohort[] = [...MATURITY].reverse().map((m) => ({ label: `${m.week} wk old`, known: m.known }));

const steps = [
  { caption: 'Each row is a group of payments of one age. The bar is the fraud in that group. Illustrative: after one week, only about 30% of the fraud that will ever be labeled is known. The rest still looks like good traffic.' },
  { caption: 'Fast signals arrive first: an issuer decline, a customer report, a reviewer. Chargebacks come last. Stripe says card networks typically allow cardholders to start a dispute within 120 days, about 17 weeks. A row is fully labeled only after that.' },
  { caption: 'Naive training: use everything up to today. The young rows count their unlabeled fraud as good payments. The model learns that recent traffic is safe, which is the opposite of the truth.' },
  { caption: 'Fix 1: train only on rows old enough to be mostly labeled. The model is a few weeks behind, but its labels are honest. Fast attacks are covered by the rules layer in the meantime.' },
  { caption: 'Fix 2: add fast proxy labels (declines, reviews, reports) so young rows carry some truth. Treat them as noisy, and check them against chargebacks when those arrive.' },
];

export default function AiE1FraudLabels() {
  return (
    <AnimFrame title="Label delay: the fraud you cannot see yet" steps={steps} interval={4200}>
      {(i) => {
        const H = 70 + COHORTS.length * ROW;
        return (
          <SketchSvg width={W} height={H} label="Rows of payment cohorts by age with the share of their fraud labels known so far">
            <HandText x={24} y={26} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
              Share of eventual fraud labels known (illustrative)
            </HandText>
            {COHORTS.map((c, r) => {
              const cy = 70 + r * ROW;
              const young = c.known < 0.8; // 1, 2 and 4 weeks old
              const knownW = Math.max(6, c.known * BAR_W);
              const missW = BAR_W - knownW;
              const dim = i === 3 && young;
              const missTone = i === 2 && young ? 'var(--bad)' : i === 4 && young ? 'var(--warn)' : 'var(--muted)';
              return (
                <g key={c.label} opacity={dim ? 0.35 : 1}>
                  <HandText x={24} y={cy} size={TEXT_SIZES.label} anchor="start">
                    {c.label}
                  </HandText>
                  <SketchBox cx={X0 + knownW / 2} cy={cy} w={knownW} h={30} r={4} seed={seedOf(`lab-k-${c.label}`)} stroke="var(--ok)" fill="var(--ok)" />
                  {missW > 4 && <SketchBox cx={X0 + knownW + missW / 2} cy={cy} w={missW} h={30} r={4} seed={seedOf(`lab-m-${c.label}`)} stroke={missTone} fill={i >= 1 ? missTone : 'var(--surface)'} />}
                  {i >= 2 && (
                    <HandText x={X0 + BAR_W + 14} y={cy} size={TEXT_SIZES.note} anchor="start" color={i === 2 && young ? 'var(--bad)' : 'var(--muted)'}>
                      {i === 2 ? (young ? 'trained as good' : 'trained') : i === 3 ? (young ? 'left out' : 'trained') : young ? 'proxy labels' : 'trained'}
                    </HandText>
                  )}
                </g>
              );
            })}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
