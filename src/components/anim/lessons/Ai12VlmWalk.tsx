import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { flatLength, patchGrid } from './Ai12VlmMath';

/**
 * Image to patches to tokens. A toy 112 x 84 px image (illustrative) is cut into 28 x 28 px patches: 4 x 3 = 12.
 * The last step scales the same idea to a 1000 x 1000 px image: 36 x 36 = 1,296 tokens, at $2 per million tokens = $2.59 per 1,000 images.
 */

const W = 112;
const H = 84;
const P = 28;
const [COLS, ROWS] = patchGrid(W, H, P);
const N = COLS * ROWS; // 12
const FLAT = flatLength(P); // 2,352
const TEXT_TOKENS = 6; // illustrative question, "What is in this picture?"

interface Step {
  caption: string;
  /** 0 image only, 1 grid, 2 one patch flattened, 3 encoder, 4 projected tokens, 5 joined with text, 6 real size */
  stage: number;
}

const steps: Step[] = [
  {
    stage: 0,
    caption: `A toy image, ${W} x ${H} pixels. The model cannot read pixels one by one: that would be ${(W * H).toLocaleString('en-US')} items for this tiny picture. The size and the 28 pixel patch are illustrative; the cutting rule is the one Anthropic documents.`,
  },
  {
    stage: 1,
    caption: `Step 1: cut the image into square patches, ${P} x ${P} pixels each. ${W} / ${P} = ${COLS} columns, ${H} / ${P} = ${ROWS} rows, so ${COLS} x ${ROWS} = ${N} patches. If a side is not a multiple of ${P}, the count rounds up.`,
  },
  {
    stage: 2,
    caption: `Step 2: take one patch and unroll it into a flat list of numbers. A patch holds ${P} x ${P} pixels with 3 colour values each, so ${P} x ${P} x 3 = ${FLAT.toLocaleString('en-US')} numbers. This is the open Vision Transformer design. Closed models do not publish their exact recipe.`,
  },
  {
    stage: 3,
    caption: `Step 3: the vision encoder, a Transformer trained on pictures, turns the ${N} flat patches into ${N} feature vectors. Each vector now carries what its patch shows and what its neighbours show. There are still ${N} items. The encoder does not change the count.`,
  },
  {
    stage: 4,
    caption: `Step 4: the projector, a small learned layer, maps each feature vector to a vector the same width as a word embedding in the language model. These ${N} vectors are the image tokens. Each patch is now one token.`,
  },
  {
    stage: 5,
    caption: `Step 5: the language model reads the ${N} image tokens followed by the text tokens, as one sequence. ${N} + ${TEXT_TOKENS} = ${N + TEXT_TOKENS} tokens in context (the ${TEXT_TOKENS} text tokens are illustrative). From here it is an ordinary language model: same attention, same price per input token.`,
  },
  {
    stage: 6,
    caption: 'Scale up. A 1000 x 1000 pixel image is ceil(1000 / 28) = 36 columns and 36 rows: 36 x 36 = 1,296 image tokens. At $2 per million input tokens (Sonnet 5.5, as of 2026-10-18), that is 1,296 x $2 / 1,000,000 = $0.0026 per image, or $2.59 per 1,000 images.',
  },
];

const CX0 = 40;
const CY0 = 70;
const CELL = 46;
const PICK = 5; // the patch we flatten in step 2 (row 1, column 1)

export default function Ai12VlmWalk() {
  return (
    <AnimFrame title="From picture to tokens the language model reads" steps={steps} interval={6500}>
      {(_, s) => {
        const st = s.stage;
        const cells = Array.from({ length: N }, (_, i) => i);
        const counter =
          st === 0 ? 'tokens: 0' : st === 1 ? `patches: ${N}` : st === 2 || st === 3 ? `patches: ${N}  tokens: 0` : st === 4 ? `image tokens: ${N}` : st === 5 ? `context: ${N + TEXT_TOKENS} tokens` : 'image tokens: 1,296';

        if (st === 6) {
          return (
            <SketchSvg width={720} height={360} label="A 1000 by 1000 pixel image becomes 36 by 36 patches, which is 1,296 tokens, costing $2.59 per 1,000 images.">
              <HandText x={24} y={30} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
                Real size: 1000 x 1000 px
              </HandText>
              <SketchBox cx={150} cy={190} w={240} h={240} r={8} seed={seedOf('vw-big')} stroke="var(--accent)" fill="var(--accent-soft)" />
              <HandText x={150} y={190} size={TEXT_SIZES.label}>
                {'36 x 36 grid\nof 28 px patches'}
              </HandText>
              <SketchArrow points={[[290, 190], [350, 190]]} seed={seedOf('vw-a1')} stroke="var(--accent)" />
              <SketchBox cx={440} cy={190} w={170} h={80} r={8} seed={seedOf('vw-tok')} stroke="var(--accent)" />
              <HandText x={440} y={190} size={TEXT_SIZES.display} mono color="var(--accent)">
                1,296
              </HandText>
              <HandText x={440} y={238} size={TEXT_SIZES.note} color="var(--muted)">
                image tokens
              </HandText>
              <SketchArrow points={[[530, 190], [585, 190]]} seed={seedOf('vw-a2')} stroke="var(--accent)" />
              <SketchBox cx={655} cy={190} w={110} h={80} r={8} seed={seedOf('vw-usd')} stroke="var(--ok)" />
              <HandText x={655} y={178} size={TEXT_SIZES.heading} mono color="var(--ok)">
                $2.59
              </HandText>
              <HandText x={655} y={206} size={TEXT_SIZES.note} color="var(--muted)">
                per 1,000 images
              </HandText>
              <HandText x={24} y={330} anchor="start" size={TEXT_SIZES.label} mono color="var(--muted)">
                {counter}
              </HandText>
            </SketchSvg>
          );
        }

        const showImage = st <= 2 || st === 3;
        return (
          <SketchSvg width={720} height={360} label={`Toy image of ${N} patches at stage ${st} of the pipeline to tokens.`}>
            {/* image or patch grid */}
            {showImage && (
              <>
                <HandText x={CX0 + (COLS * CELL) / 2} y={36} size={TEXT_SIZES.heading} color="var(--muted)">
                  {st === 0 ? 'Image' : 'Patches'}
                </HandText>
                {st === 0 ? (
                  <SketchBox cx={CX0 + (COLS * CELL) / 2} cy={CY0 + (ROWS * CELL) / 2} w={COLS * CELL} h={ROWS * CELL} r={8} seed={seedOf('vw-img')} stroke="var(--accent)" fill="var(--accent-soft)" />
                ) : (
                  cells.map((i) => {
                    const c = i % COLS;
                    const r = Math.floor(i / COLS);
                    const active = st === 2 && i === PICK;
                    return (
                      <SketchBox
                        key={i}
                        cx={CX0 + c * CELL + CELL / 2}
                        cy={CY0 + r * CELL + CELL / 2}
                        w={CELL - 6}
                        h={CELL - 6}
                        r={6}
                        seed={seedOf(`vw-c${i}`)}
                        stroke={active ? 'var(--accent)' : st >= 3 ? 'var(--ok)' : 'var(--muted)'}
                        fill={active ? 'var(--accent)' : undefined}
                        strokeWidth={active ? 2.2 : 1.4}
                      />
                    );
                  })
                )}
                {st === 0 && (
                  <HandText x={CX0 + (COLS * CELL) / 2} y={CY0 + ROWS * CELL + 20} size={TEXT_SIZES.note} color="var(--muted)" mono>
                    {`${W} x ${H} px`}
                  </HandText>
                )}
              </>
            )}

            {/* step 2: flatten */}
            {st === 2 && (
              <>
                <SketchArrow points={[[CX0 + COLS * CELL + 12, 120], [330, 120]]} seed={seedOf('vw-f1')} stroke="var(--accent)" />
                <SketchBox cx={470} cy={120} w={240} h={60} r={8} seed={seedOf('vw-flat')} stroke="var(--accent)" />
                <HandText x={470} y={120} size={TEXT_SIZES.label} mono color="var(--accent)">
                  {`[ ${FLAT.toLocaleString('en-US')} numbers ]`}
                </HandText>
                <HandText x={470} y={170} size={TEXT_SIZES.note} color="var(--muted)">
                  {`${P} x ${P} pixels x 3 colours`}
                </HandText>
              </>
            )}

            {/* step 3: encoder */}
            {st === 3 && (
              <>
                <SketchArrow points={[[CX0 + COLS * CELL + 12, 130], [300, 130]]} seed={seedOf('vw-e1')} stroke="var(--accent)" />
                <SketchBox cx={420} cy={130} w={200} h={60} r={8} seed={seedOf('vw-enc')} stroke="var(--accent)" fill="var(--accent-soft)" />
                <HandText x={420} y={130} size={TEXT_SIZES.label}>
                  Vision encoder
                </HandText>
                <SketchArrow points={[[526, 130], [580, 130]]} seed={seedOf('vw-e2')} stroke="var(--accent)" />
                <SketchBox cx={650} cy={130} w={110} h={60} r={8} seed={seedOf('vw-feat')} stroke="var(--ok)" />
                <HandText x={650} y={130} size={TEXT_SIZES.label} mono color="var(--ok)">
                  {`${N} vectors`}
                </HandText>
              </>
            )}

            {/* steps 4-5: projector and tokens */}
            {(st === 4 || st === 5) && (
              <>
                <HandText x={24} y={36} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
                  {st === 4 ? `Projector output: ${N} image tokens` : 'Language model input'}
                </HandText>
                {cells.map((i) => (
                  <SketchBox
                    key={i}
                    cx={46 + (i % 6) * 52}
                    cy={90 + Math.floor(i / 6) * 52}
                    w={44}
                    h={40}
                    r={6}
                    seed={seedOf(`vw-t${i}`)}
                    stroke={st === 4 ? 'var(--accent)' : 'var(--ok)'}
                    fill={st === 4 ? 'var(--accent-soft)' : undefined}
                  />
                ))}
                <HandText x={190} y={178} size={TEXT_SIZES.note} color="var(--muted)">
                  {`${N} image tokens`}
                </HandText>
                {st === 5 && (
                  <>
                    <HandText x={400} y={36} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
                      + text tokens
                    </HandText>
                    {Array.from({ length: TEXT_TOKENS }, (_, i) => (
                      <SketchBox key={i} cx={420 + (i % 3) * 52} cy={90 + Math.floor(i / 3) * 52} w={44} h={40} r={6} seed={seedOf(`vw-x${i}`)} stroke="var(--warn)" />
                    ))}
                    <HandText x={470} y={178} size={TEXT_SIZES.note} color="var(--muted)">
                      {`${TEXT_TOKENS} text tokens (illustrative)`}
                    </HandText>
                    <SketchArrow points={[[330, 128], [600, 128]]} seed={seedOf('vw-j1')} stroke="var(--accent)" />
                    <SketchBox cx={650} cy={128} w={100} h={60} r={8} seed={seedOf('vw-llm')} stroke="var(--accent)" fill="var(--accent-soft)" />
                    <HandText x={650} y={128} size={TEXT_SIZES.label}>
                      LLM
                    </HandText>
                  </>
                )}
              </>
            )}

            <HandText x={24} y={330} anchor="start" size={TEXT_SIZES.label} mono color="var(--accent)">
              {counter}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
