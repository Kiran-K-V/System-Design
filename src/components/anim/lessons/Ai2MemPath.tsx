import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

const NODES = [
  { label: 'Disk', note: 'weight files' },
  { label: 'HBM', note: '80 GB' },
  { label: 'SRAM', note: 'tiny' },
  { label: 'Tensor Core', note: '989 TFLOPS' },
];
const X = [80, 260, 440, 620];
const HOPS = ['once, at load', '3.35 TB/s', 'on-chip', ''];

interface Step {
  caption: string;
  active: number;
  readout: string;
  second?: boolean;
  /** The HBM to SRAM hop is the active one. */
  stream?: boolean;
}

const steps: Step[] = [
  {
    caption:
      'Start at the disk. A 70B model in BF16 is 140 GB of files. The server copies them into GPU memory once, when it starts. That load is a one-time cost, like warming a cache. It is not paid per request.',
    active: 0,
    readout: '70B x 2 bytes = 140 GB of weights',
  },
  {
    caption:
      'HBM (high bandwidth memory) is the large memory on the GPU card. An H100 SXM has 80 GB. The weights must live here, because every step needs them. 140 GB does not fit in 80 GB, so one H100 cannot hold a 70B BF16 model.',
    active: 1,
    readout: '140 GB of weights > 80 GB of HBM',
  },
  {
    caption:
      'On every decode step the GPU streams every weight from HBM toward the compute units. H100 HBM runs at 3.35 TB/s. Reading a full 80 GB takes 80 / 3,350 = 23.9 ms. That time is a floor you cannot beat, however fast the math is.',
    active: 1,
    readout: '80 GB / 3.35 TB/s = 23.9 ms',
    stream: true,
  },
  {
    caption:
      'SRAM (static RAM) is tiny, fast memory inside the chip. Data is pulled in small tiles, used, and dropped. Its size and speed are not in our sources, so we draw it small and unlabeled. Kernel design (such as FlashAttention) is about keeping tiles here.',
    active: 2,
    readout: 'tiles pass through; size not sourced',
  },
  {
    caption:
      'The Tensor Cores do the matrix math. NVIDIA lists 1,979 TFLOPS for BF16 on the H100 page, marked "with sparsity". Dense math, which is what normal models use, is half: about 989 TFLOPS. Each weight byte brings only a few FLOPs of work. So the cores wait for memory. Lesson A2.2 shows by how much.',
    active: 3,
    readout: '989 TFLOPS dense (1,979 is the sparse figure)',
  },
  {
    caption:
      'Fix for the size problem: two GPUs joined by NVLink (900 GB/s on the H100 page). Tensor parallelism splits each weight matrix, so each GPU holds 70 GB and reads only its half. 70 GB / 3.35 TB/s = 20.9 ms per step, ignoring the traffic between the GPUs.',
    active: 1,
    readout: '2 x H100: 70 GB each, 20.9 ms per read',
    second: true,
  },
];

export default function Ai2MemPath() {
  return (
    <AnimFrame title="From disk to Tensor Core" steps={steps} interval={5600}>
      {(_, s) => (
        <SketchSvg width={720} height={300} label="Data path from disk through HBM and SRAM to the Tensor Core, with bandwidth labels">
          {NODES.map((n, k) => {
            const on = s.active === k;
            const done = k < s.active;
            const stroke = on ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--muted)';
            return (
              <g key={n.label}>
                <SketchBox cx={X[k]} cy={90} w={116} h={60} r={8} seed={seedOf(`mp-${k}`)} stroke={stroke} strokeWidth={on ? 2.2 : 1.4} fill={on ? 'var(--accent)' : done ? 'var(--ok)' : undefined} dashed={!on && !done} />
                <HandText x={X[k]} y={80} size={TEXT_SIZES.label} color={on || done ? 'var(--fg)' : 'var(--muted)'}>
                  {n.label}
                </HandText>
                <HandText x={X[k]} y={102} size={TEXT_SIZES.note} mono color="var(--muted)">
                  {n.note}
                </HandText>
                {k < 3 && (
                  <>
                    <SketchArrow points={[[X[k] + 64, 90], [X[k + 1] - 64, 90]]} seed={seedOf(`mpa-${k}`)} stroke={s.stream && k === 1 ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--muted)'} />
                    <HandText x={(X[k] + X[k + 1]) / 2} y={52} size={TEXT_SIZES.note} mono color={s.stream && k === 1 ? 'var(--accent)' : 'var(--muted)'}>
                      {HOPS[k]}
                    </HandText>
                  </>
                )}
              </g>
            );
          })}
          {s.second && (
            <>
              <SketchBox cx={260} cy={200} w={116} h={60} r={8} seed={seedOf('mp-gpu2')} stroke="var(--ok)" fill="var(--ok)" />
              <HandText x={260} y={190} size={TEXT_SIZES.label}>
                HBM, GPU 2
              </HandText>
              <HandText x={260} y={212} size={TEXT_SIZES.note} mono color="var(--muted)">
                80 GB
              </HandText>
              <SketchArrow points={[[260, 124], [260, 164]]} head="both" seed={seedOf('mp-nvl')} stroke="var(--accent)" strokeWidth={2.2} />
              <HandText x={278} y={144} anchor="start" size={TEXT_SIZES.note} mono color="var(--accent)">
                NVLink 900 GB/s
              </HandText>
            </>
          )}
          <SketchBox cx={360} cy={268} w={560} h={44} r={8} seed={seedOf('mp-read')} fill="var(--accent-soft)" />
          <HandText x={360} y={269} size={TEXT_SIZES.label} mono color="var(--accent)">
            {s.readout}
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
