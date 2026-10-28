import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

// Illustrative: ten 30-second buckets. Units are "replicas worth of traffic".
const DEMAND = [10, 10, 24, 24, 24, 24, 24, 24, 24, 24];
const CAP_COLD = [12, 12, 12, 12, 12, 12, 26, 26, 26, 26];
const CAP_WARM = [12, 12, 12, 26, 26, 26, 26, 26, 26, 26];
const STAGES = ['find a GPU node', 'pull the image', 'load the weights', 'warm up, join'];
const X0 = 70;
const STEP = 60;
const BASE = 230;
const PXU = 5.6;

interface Step {
  caption: string;
  upTo: number; // buckets drawn
  cap: number[];
  stage: number; // -1 none
  warm?: boolean;
}

const steps: Step[] = [
  { caption: 'A steady day. Demand (dashed outline) is below capacity (solid fill) in every 30-second bucket. Units are made up: one unit is the traffic one replica serves. The fleet has 12.', upTo: 2, cap: CAP_COLD, stage: -1 },
  { caption: 'Traffic more than doubles within one bucket, for example after a launch post. Capacity is still 12. The autoscaler has not seen it, because metrics are collected and averaged over a window first. Excess demand has nowhere to go: it queues or is dropped.', upTo: 3, cap: CAP_COLD, stage: -1 },
  { caption: 'The autoscaler sees the queue and asks for new replicas. A new replica is not ready yet. First the cluster must find a GPU node and start the container. That alone can take a while when GPUs are scarce.', upTo: 4, cap: CAP_COLD, stage: 0 },
  { caption: 'The server pulls its container image, then reads the weights from disk or the network into GPU memory. For a 70B model in 16-bit that is about 140 GB. Disk or network speed sets this time: bytes divided by bytes per second. Meanwhile capacity stays at 12.', upTo: 6, cap: CAP_COLD, stage: 2 },
  { caption: 'The replicas warm up and join the load balancer. Capacity jumps to 26, but the gap lasted four buckets. Users saw slow answers or errors for about two minutes, and the spike had already been going on for that long. Scaling on a late signal cannot fix this.', upTo: 10, cap: CAP_COLD, stage: 3 },
  { caption: 'Replay with a warm pool: a few extra replicas already hold the weights in memory and only need a server start. Capacity rises in the very next bucket. You pay for idle GPUs to buy that speed, and the simulator below prices it.', upTo: 10, cap: CAP_WARM, stage: -1, warm: true },
];

export default function AiE3ColdStartTimeline() {
  return (
    <AnimFrame title="A traffic spike meets a cold start" steps={steps} interval={6500}>
      {(_, s) => (
        <SketchSvg width={720} height={400} label="Bars of demand and capacity over ten time buckets with a gap until new replicas finish loading weights">
          <HandText x={24} y={28} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">{s.warm ? 'With a warm pool' : 'Cold start'}</HandText>
          {DEMAND.slice(0, s.upTo).map((d, i) => {
            const c = s.cap[i];
            const gap = d > c;
            const cx = X0 + i * STEP;
            return (
              <g key={i}>
                <SketchBox cx={cx} cy={BASE - (c * PXU) / 2} w={38} h={c * PXU} r={6} seed={seedOf(`e3c-c${i}${s.warm ? 'w' : ''}`)} stroke="var(--ok)" fill="var(--ok)" />
                <SketchBox cx={cx + 0} cy={BASE - (d * PXU) / 2} w={46} h={d * PXU} r={6} seed={seedOf(`e3c-d${i}`)} stroke={gap ? 'var(--bad)' : 'var(--accent)'} dashed />
                {gap && <HandText x={cx} y={BASE - d * PXU - 12} size={TEXT_SIZES.note} color="var(--bad)">short</HandText>}
              </g>
            );
          })}
          <line x1={X0 - 30} x2={X0 + 9 * STEP + 30} y1={BASE + 2} y2={BASE + 2} stroke="var(--border)" strokeWidth={1.4} />
          <HandText x={X0 - 30} y={BASE + 22} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">time, 30 s per bar</HandText>
          <HandText x={X0 + 9 * STEP + 30} y={BASE + 22} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">solid: capacity. dashed: demand.</HandText>

          <HandText x={24} y={292} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">A new replica on the way up</HandText>
          {STAGES.map((name, i) => {
            const cx = 98 + i * 175;
            const active = s.stage === i;
            const done = s.stage > i;
            return (
              <g key={name}>
                <SketchBox cx={cx} cy={346} w={156} h={44} r={8} seed={seedOf(`e3c-s${i}`)} stroke={active ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--muted)'} strokeWidth={active ? 2.2 : 1.4} fill={active ? 'var(--accent)' : done ? 'var(--ok)' : undefined} dashed={s.warm && i < 3} />
                <HandText x={cx} y={347} size={TEXT_SIZES.label} color="var(--fg)">{name}</HandText>
              </g>
            );
          })}
          {s.warm && <HandText x={360} y={384} size={TEXT_SIZES.note} color="var(--muted)">dashed stages are already done in a warm replica</HandText>}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
