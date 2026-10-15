import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { chainSuccess, stepWithVerifier } from './ai0Math';

const N = 10;
const verified = stepWithVerifier(0.95, 0.9, 1);

interface Step {
  caption: string;
  k: number;
  p: number;
  label: string;
}

const steps: Step[] = [
  { caption: 'One step that is right 95% of the time. The end-to-end success is 95%. That looks fine.', k: 1, p: 0.95, label: '1 step at 95%' },
  { caption: 'Chain three such steps. Each must be right, so the chance is 0.95 x 0.95 x 0.95, about 85.7%. The agent already fails one run in seven.', k: 3, p: 0.95, label: '3 steps at 95%' },
  { caption: 'Five steps: 0.95 to the power 5, about 77.4%. Each added step multiplies the success rate by 0.95. Errors compound.', k: 5, p: 0.95, label: '5 steps at 95%' },
  { caption: 'Ten steps: about 59.9%. A system built from components that are each "95% good" fails four runs in ten.', k: 10, p: 0.95, label: '10 steps at 95%' },
  { caption: 'Make each step slightly worse, 90%, and ten steps give about 34.9%. A 5 point drop per step costs 25 points end to end.', k: 10, p: 0.9, label: '10 steps at 90%' },
  {
    caption: `Add a check after each step. A verifier catches 90% of bad answers, and the step retries once. Per-step success rises from 95% to about ${(verified * 100).toFixed(1)}%, and ten steps give about ${(chainSuccess(verified, 10) * 100).toFixed(0)}%. Assumes independent attempts. Checks cost latency and money.`,
    k: 10,
    p: verified,
    label: '10 steps, verifier and 1 retry',
  },
];

const X0 = 40;
const BW = 52;
const GAP = 14;

export default function Ai0ChainWalk() {
  return (
    <AnimFrame title="Error compounding in a chain" steps={steps}>
      {(_, s) => {
        const e2e = chainSuccess(s.p, s.k);
        const tone = e2e >= 0.8 ? 'var(--ok)' : e2e >= 0.5 ? 'var(--warn)' : 'var(--bad)';
        const barW = Math.max(e2e * 640, 6);
        return (
          <SketchSvg width={720} height={250} label={`${s.label}: end to end success ${(e2e * 100).toFixed(1)} percent`}>
            <HandText x={X0} y={22} size={TEXT_SIZES.heading} anchor="start" color="var(--muted)">
              {s.label}
            </HandText>
            {Array.from({ length: N }, (_, i) => {
              const on = i < s.k;
              const cx = X0 + BW / 2 + i * (BW + GAP);
              return (
                <g key={i}>
                  <SketchBox cx={cx} cy={80} w={BW} h={44} r={8} seed={seedOf(`ch${i}`)} stroke={on ? 'var(--accent)' : 'var(--muted)'} fill={on ? 'var(--accent)' : undefined} dashed={!on} />
                  <HandText x={cx} y={80} size={TEXT_SIZES.label} color={on ? 'var(--fg)' : 'var(--muted)'}>
                    {String(i + 1)}
                  </HandText>
                </g>
              );
            })}
            <HandText x={X0} y={145} size={TEXT_SIZES.label} anchor="start">
              End-to-end success
            </HandText>
            <SketchBox cx={X0 + 320} cy={185} w={640} h={30} r={6} seed={seedOf('track')} stroke="var(--muted)" dashed />
            <SketchBox cx={X0 + barW / 2} cy={185} w={barW} h={30} r={6} seed={seedOf(`bar${s.k}${s.p}`)} stroke={tone} fill={tone} strokeWidth={2.2} />
            <HandText x={X0 + 320} y={228} size={TEXT_SIZES.display} color={tone}>
              {`${(e2e * 100).toFixed(1)}%`}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
