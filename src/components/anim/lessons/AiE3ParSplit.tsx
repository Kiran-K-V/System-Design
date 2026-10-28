import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { LAYOUTS, layoutStats, tpStep } from './AiE3ParLogic';

const USERS = 16;
const MAXMS = tpStep(2).totalMs;
const BAR_X = 60;
const BAR_W = 600;
const f1 = (v: number) => v.toFixed(1);

interface Step {
  caption: string;
  n: number;
  layouts?: boolean;
}

const s2 = tpStep(2);
const s4 = tpStep(4);
const s8 = tpStep(8);

const steps: Step[] = [
  {
    caption: `Two GPUs hold a 70B model in 16-bit numbers. Each holds half of every weight matrix, and each reads only its half. The step is mostly reading weights. After each half-matrix is done, the GPUs must add their partial results. That adds a small sync cost. Model: ${f1(s2.readMs)} ms of reading, ${f1(s2.commMs)} ms of syncing. (Illustrative.)`,
    n: 2,
  },
  {
    caption: `Four GPUs. Each reads a quarter, so reading time halves to ${f1(s4.readMs)} ms. But there are the same number of syncs, now among more GPUs, so sync time grows to ${f1(s4.commMs)} ms. The step falls from ${f1(s2.totalMs)} to ${f1(s4.totalMs)} ms. Cost: twice the GPUs.`,
    n: 4,
  },
  {
    caption: `Eight GPUs. Reading falls again to ${f1(s8.readMs)} ms, but sync is now a large share: ${f1(s8.commMs)} ms. The step is ${f1(s8.totalMs)} ms. Doubling the GPUs bought about ${((1 - s8.totalMs / s4.totalMs) * 100).toFixed(0)}% less time, not 50%. Databricks measured the same shape: on Llama2-70B, going from 4 to 8 GPUs cut latency only to about 0.7x at small batch sizes (vendor blog).`,
    n: 8,
  },
  {
    caption: 'Same eight GPUs, three layouts. One 8-way group has the fastest step for one user. Splitting into two groups of 4 or four groups of 2 gives each user a slower step but serves more users in total. Pick by your latency target, not by habit. Numbers come from the illustrative model with 16 users per group.',
    n: 8,
    layouts: true,
  },
];

function Gpu({ cx, cy, label, seed }: { cx: number; cy: number; label: string; seed: string }) {
  return (
    <g>
      <SketchBox cx={cx} cy={cy} w={66} h={44} r={8} seed={seedOf(seed)} stroke="var(--fg)" />
      <HandText x={cx} y={cy + 1} size={TEXT_SIZES.label} color="var(--fg)">
        {label}
      </HandText>
    </g>
  );
}

export default function AiE3ParSplit() {
  return (
    <AnimFrame title="One model over 2, 4, and 8 GPUs" steps={steps} interval={7000}>
      {(_, s) => {
        if (s.layouts) {
          return (
            <SketchSvg width={720} height={380} label="Three layouts of eight GPUs and their illustrative speed per user and total speed">
              <HandText x={24} y={28} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
                Eight GPUs, three layouts (illustrative)
              </HandText>
              {LAYOUTS.map((l, r) => {
                const y = 100 + r * 100;
                const st = layoutStats(l, USERS);
                const groupW = l.tp * 28;
                return (
                  <g key={r}>
                    <HandText x={24} y={y - 36} anchor="start" size={TEXT_SIZES.label} color="var(--fg)">
                      {`${l.replicas} group${l.replicas > 1 ? 's' : ''} of ${l.tp} GPUs`}
                    </HandText>
                    {Array.from({ length: l.replicas }, (_, g) => (
                      <g key={g}>
                        {Array.from({ length: l.tp }, (_, k) => {
                          const cx = 40 + g * (groupW + 16) + k * 28 + 12;
                          return <SketchBox key={k} cx={cx} cy={y} w={24} h={34} r={6} seed={seedOf(`l-${r}-${g}-${k}`)} stroke={g === 0 ? 'var(--accent)' : 'var(--muted)'} />;
                        })}
                      </g>
                    ))}
                    <HandText x={440} y={y - 10} anchor="start" size={TEXT_SIZES.label} mono color="var(--fg)">
                      {`${st.perUserTokS.toFixed(0)} tok/s per user`}
                    </HandText>
                    <HandText x={440} y={y + 14} anchor="start" size={TEXT_SIZES.label} mono color="var(--ok)">
                      {`${st.totalTokS.toFixed(0)} tok/s in total`}
                    </HandText>
                  </g>
                );
              })}
              <HandText x={24} y={350} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                Model: 70B in 16-bit, 16 users per group, KV cache limits ignored. Not a measurement.
              </HandText>
            </SketchSvg>
          );
        }
        const st = tpStep(s.n);
        const gap = 84;
        const x0 = 360 - ((s.n - 1) * gap) / 2;
        const readW = (st.readMs / MAXMS) * BAR_W;
        const commW = (st.commMs / MAXMS) * BAR_W;
        return (
          <SketchSvg width={720} height={380} label={`A model split over ${s.n} GPUs with a bar for read time and sync time`}>
            <HandText x={24} y={28} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
              {`${s.n} GPUs, each holds 1/${s.n} of every layer`}
            </HandText>
            {Array.from({ length: s.n }, (_, i) => (
              <Gpu key={i} cx={x0 + i * gap} cy={100} label={`GPU ${i + 1}`} seed={`g-${s.n}-${i}`} />
            ))}
            <SketchArrow points={[[x0 - 30, 160], [x0 + (s.n - 1) * gap + 30, 160]]} head="both" seed={seedOf(`bus-${s.n}`)} stroke="var(--warn)" />
            <HandText x={360} y={184} size={TEXT_SIZES.note} color="var(--warn)">
              they add partial results twice per layer
            </HandText>
            <HandText x={24} y={236} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
              One decode step
            </HandText>
            <SketchBox cx={BAR_X + readW / 2} cy={284} w={readW} h={44} r={8} seed={seedOf(`r-${s.n}`)} stroke="var(--ok)" fill="var(--ok)" />
            <SketchBox cx={BAR_X + readW + commW / 2 + 2} cy={284} w={Math.max(commW, 8)} h={44} r={6} seed={seedOf(`c-${s.n}`)} stroke="var(--warn)" fill="var(--warn)" />
            <HandText x={BAR_X} y={332} anchor="start" size={TEXT_SIZES.note} mono color="var(--ok)">
              {`read ${f1(st.readMs)} ms`}
            </HandText>
            <HandText x={BAR_X + BAR_W} y={332} anchor="end" size={TEXT_SIZES.note} mono color="var(--warn)">
              {`sync ${f1(st.commMs)} ms, total ${f1(st.totalMs)} ms`}
            </HandText>
            <HandText x={696} y={236} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
              illustrative model
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
