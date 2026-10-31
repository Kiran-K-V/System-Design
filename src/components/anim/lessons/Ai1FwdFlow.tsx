import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { PRESETS, params } from './Ai1FwdMath';

const cfg = PRESETS[0].cfg;
const P = params(cfg);
const G = 1e9;
const attnF = 2 * P.attn;
const mlpF = 2 * P.mlp;
const layerF = attnF + mlpF;
const headF = 2 * P.out;

const NODES = [
  { label: 'token id', shape: 'one id' },
  { label: 'embed', shape: '4,096' },
  { label: 'attention', shape: '4,096' },
  { label: 'MLP', shape: '4,096' },
  { label: '× 31 more', shape: '4,096' },
  { label: 'LM head', shape: '128,000' },
  { label: 'softmax', shape: '128,000' },
];
const X = NODES.map((_, i) => 48 + i * 104);

interface Step {
  caption: string;
  active: number;
  /** Nodes already done. */
  flops: number;
  note: string;
}

const steps: Step[] = [
  {
    caption:
      'One token enters as an integer id. We follow it through Llama 3 8B (32 layers, d_model 4,096, 8.03B parameters). A forward pass is a function: ids in, one probability for each of the 128,000 vocabulary tokens out. Think of it as a very large pure function with fixed weights.',
    active: 0,
    flops: 0,
    note: 'input: 1 integer',
  },
  {
    caption: 'Embedding: the id selects a row of the table (the Embeddings lesson). The token is now a vector of 4,096 numbers. This is a lookup, not a matrix multiply, so it costs about 0 FLOPs even though the table holds 0.52B parameters.',
    active: 1,
    flops: 0,
    note: 'lookup: 0 FLOPs',
  },
  {
    caption:
      'Layer 1, attention. Four weight matrices (query, key, value, output) hold 41.9M parameters. Each parameter does one multiply and one add per token, so 2 × 41.9M = 84 MFLOPs. Attention lets this token read the earlier tokens. The result is added to the vector, not swapped in: that running sum is the residual stream.',
    active: 2,
    flops: attnF,
    note: 'attention: 41.9M params',
  },
  {
    caption:
      'Layer 1, MLP (feed-forward block). Three matrices of 4,096 × 14,336 hold 176.2M parameters, 4.2 times the attention block. It costs 2 × 176.2M = 352 MFLOPs. It works on this token alone. Its output is also added into the residual stream. One layer so far: 436 MFLOPs.',
    active: 3,
    flops: attnF + mlpF,
    note: 'MLP: 176.2M params',
  },
  {
    caption: 'Layers 2 to 32 are the same shape with different weights. 31 more layers at 436 MFLOPs each add 13.5 GFLOPs. The layer stack is where about 87% of the 8.03B parameters sit (6.98B).',
    active: 4,
    flops: 32 * layerF,
    note: '32 layers × 436 MFLOPs',
  },
  {
    caption: 'The output head multiplies the final 4,096-vector by a 4,096 × 128,000 matrix. That gives one score (logit) per vocabulary token. 0.52B parameters, 1.05 GFLOPs: the head is a big matrix too.',
    active: 5,
    flops: 32 * layerF + headF,
    note: 'head: 0.52B params',
  },
  {
    caption:
      'Softmax turns 128,000 scores into probabilities that sum to 1. Sampling picks one token (the Sampling and Decoding lesson). Total: 15.0 GFLOPs for this token. The rule of thumb "2 FLOPs per parameter" gives 2 × 8.03B = 16.1 GFLOPs. The gap is the input table, which is a lookup (2 × 0.52B = 1.05 GFLOPs).',
    active: 6,
    flops: 32 * layerF + headF,
    note: 'total ≈ 15.0 GFLOPs (2N rule: 16.1)',
  },
];

export default function Ai1FwdFlow() {
  return (
    <AnimFrame title="One token through a transformer" steps={steps} interval={5200}>
      {(_, s) => (
        <SketchSvg width={720} height={340} label="A token flowing through embedding, layers, output head, and softmax">
          {NODES.map((n, k) => {
            const isActive = s.active === k;
            const done = k < s.active;
            const stroke = isActive ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--muted)';
            return (
              <g key={n.label}>
                <SketchBox cx={X[k]} cy={70} w={92} h={44} r={8} seed={seedOf(`fwd-${k}`)} stroke={stroke} strokeWidth={isActive ? 2.2 : 1.4} fill={isActive ? 'var(--accent)' : done ? 'var(--ok)' : undefined} dashed={!isActive && !done} />
                <HandText x={X[k]} y={71} size={TEXT_SIZES.label} color={isActive || done ? 'var(--fg)' : 'var(--muted)'}>
                  {n.label}
                </HandText>
                <HandText x={X[k]} y={112} size={TEXT_SIZES.note} mono color="var(--muted)">
                  {n.shape}
                </HandText>
                {k < NODES.length - 1 && <SketchArrow points={[[X[k] + 48, 70], [X[k + 1] - 48, 70]]} seed={seedOf(`fa-${k}`)} stroke={done ? 'var(--ok)' : 'var(--muted)'} />}
              </g>
            );
          })}
          <HandText x={24} y={146} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
            numbers per token between stages (illustrative of shape, not of values)
          </HandText>
          {s.active >= 2 && s.active <= 4 && (
            <>
              <SketchArrow points={[[X[2] - 30, 164], [X[4] + 30, 164]]} stroke="var(--accent)" strokeWidth={2.2} seed={seedOf('resid')} />
              <HandText x={(X[2] + X[4]) / 2} y={186} size={TEXT_SIZES.label} color="var(--accent)">
                residual stream: each block adds to it
              </HandText>
            </>
          )}
          <SketchBox cx={180} cy={266} w={300} h={86} r={8} seed={seedOf('ctr')} fill="var(--accent-soft)" />
          <HandText x={180} y={244} size={TEXT_SIZES.note} color="var(--muted)">
            FLOPs spent on this token
          </HandText>
          <HandText x={180} y={274} size={TEXT_SIZES.display} mono color="var(--accent)">
            {`${(s.flops / G).toFixed(2)} G`}
          </HandText>
          <HandText x={500} y={266} size={TEXT_SIZES.label} color="var(--fg)">
            {s.note}
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
