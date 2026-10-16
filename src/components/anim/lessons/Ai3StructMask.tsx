import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { applyMask, type Cand } from './Ai3StructLogic';

/** Illustrative next-token probabilities for a label-and-urgency reply. The mask rule is real: invalid tokens get probability zero. */
interface Pos {
  out: string;
  state: string;
  cands: Cand[];
  pick: number;
  caption: string;
}

const POS: Pos[] = [
  {
    out: '',
    state: 'Grammar state: expect "{"',
    cands: [
      { t: 'Sure', p: 0.4, ok: false },
      { t: '```json', p: 0.3, ok: false },
      { t: '{', p: 0.25, ok: true },
      { t: 'Here', p: 0.05, ok: false },
    ],
    pick: 2,
    caption: 'The schema says the reply is one JSON object. The grammar allows only "{" first. The model wanted to say "Sure" (40%). That token is masked, which means its probability is set to zero. The remaining mass is rescaled, so "{" gets 100%. The numbers in this walk are illustrative.',
  },
  {
    out: '{"label": ',
    state: 'Grammar state: expect an enum value',
    cands: [
      { t: '"negative"', p: 0.45, ok: true },
      { t: '"awful"', p: 0.2, ok: false },
      { t: '"bad"', p: 0.15, ok: false },
      { t: '"neutral"', p: 0.12, ok: true },
      { t: '"mixed"', p: 0.08, ok: true },
    ],
    pick: 0,
    caption: 'The schema lists three labels. "awful" and "bad" are not in the list, so the grammar masks them. 45% + 12% + 8% = 65% is kept and rescaled: "negative" goes from 45% to 69.2%. The model still chooses among the valid labels by its own probabilities.',
  },
  {
    out: '{"label": "negative", "urgent": ',
    state: 'Grammar state: expect a boolean',
    cands: [
      { t: 'true', p: 0.55, ok: true },
      { t: 'false', p: 0.3, ok: true },
      { t: '"yes"', p: 0.1, ok: false },
      { t: 'null', p: 0.05, ok: false },
    ],
    pick: 0,
    caption: 'A boolean field allows only true or false. The string "yes" (10%) and null (5%) are masked. true goes from 55% to 64.7%. Wrong types become impossible, not just unlikely.',
  },
  {
    out: '{"label": "negative", "urgent": true',
    state: 'Grammar state: expect "}"',
    cands: [
      { t: '}', p: 0.6, ok: true },
      { t: ', "why"', p: 0.3, ok: false },
      { t: '\\n', p: 0.1, ok: false },
    ],
    pick: 0,
    caption: 'Both fields are present, and the schema sets additionalProperties to false. So no new key is allowed. The model wanted to add a "why" field (30%). It is masked. Only "}" can follow.',
  },
];

const BAR = 150;
const ROW = 44;

export default function Ai3StructMask() {
  const steps = [...POS.map((p) => ({ caption: p.caption })), { caption: 'The final text is valid against the schema: right keys, right types, a label from the list. The grammar was built from your schema before the first token. The mask costs a compile step the first time (cached after) and a lookup per token. It guarantees the shape. It does not guarantee the label is the right one for this ticket.' }];
  return (
    <AnimFrame title="Constrained decoding, token by token" steps={steps} interval={4600}>
      {(i) => {
        const done = i >= POS.length;
        const pos = POS[Math.min(i, POS.length - 1)];
        const masked = applyMask(pos.cands);
        const outText = done ? '{"label": "negative", "urgent": true}' : pos.out;
        return (
          <SketchSvg width={720} height={330} label={`Step ${i + 1} of constrained decoding`}>
            <HandText x={20} y={24} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              Output so far
            </HandText>
            <HandText x={20} y={52} anchor="start" size={TEXT_SIZES.label} mono color={done ? 'var(--ok)' : 'var(--fg)'}>
              {outText || '(empty)'}
            </HandText>
            {!done && (
              <>
                <HandText x={20} y={92} anchor="start" size={TEXT_SIZES.heading} color="var(--accent)">
                  {pos.state}
                </HandText>
                <HandText x={190} y={122} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                  model probability
                </HandText>
                <HandText x={470} y={122} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                  after the mask
                </HandText>
                {pos.cands.map((c, k) => {
                  const y = 150 + k * ROW;
                  const chosen = k === pos.pick;
                  const w = Math.max(4, c.p * BAR * 1.6);
                  const mw = Math.max(0, masked[k] * BAR * 1.6);
                  return (
                    <g key={c.t + k}>
                      <HandText x={20} y={y} anchor="start" size={TEXT_SIZES.label} mono color={c.ok ? 'var(--fg)' : 'var(--bad)'}>
                        {c.t}
                      </HandText>
                      <SketchBox cx={190 + w / 2} cy={y} w={w} h={22} r={6} seed={seedOf(`p-${i}-${k}`)} fill={c.ok ? 'var(--muted)' : 'var(--bad)'} stroke={c.ok ? 'var(--muted)' : 'var(--bad)'} />
                      <HandText x={190 + w + 8} y={y} anchor="start" size={TEXT_SIZES.note} mono color="var(--muted)">
                        {c.p.toFixed(2)}
                      </HandText>
                      {c.ok ? (
                        <>
                          <SketchBox cx={470 + mw / 2} cy={y} w={mw} h={22} r={6} seed={seedOf(`m-${i}-${k}`)} fill={chosen ? 'var(--accent)' : 'var(--ok)'} stroke={chosen ? 'var(--accent)' : 'var(--ok)'} strokeWidth={chosen ? 2.2 : 1.4} />
                          <HandText x={470 + mw + 8} y={y} anchor="start" size={TEXT_SIZES.note} mono color={chosen ? 'var(--accent)' : 'var(--muted)'}>
                            {masked[k].toFixed(2)}
                          </HandText>
                        </>
                      ) : (
                        <HandText x={470} y={y} anchor="start" size={TEXT_SIZES.note} color="var(--bad)">
                          masked: 0
                        </HandText>
                      )}
                    </g>
                  );
                })}
              </>
            )}
            {done && (
              <HandText x={360} y={170} size={TEXT_SIZES.title} color="var(--ok)">
                Valid against the schema
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
