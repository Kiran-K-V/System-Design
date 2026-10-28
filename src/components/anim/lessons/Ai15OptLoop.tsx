import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchArrow, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { ROUNDS, HELD_OUT, SEED_HELD_OUT } from './Ai15OptLogic';

type Active = 'none' | 'propose' | 'score' | 'keep' | 'loop';

interface Step {
  caption: string;
  active: Active;
  bars: number; // how many train bars are visible (round 0 is the seed prompt)
  tries: boolean;
  heldOut: boolean;
}

const steps: Step[] = [
  { caption: 'Start with one prompt, the seed. Run it on the train cases and count passes: 62 of 100. This is the score. The prompt is the thing we will change. (Illustrative numbers.)', active: 'none', bars: 1, tries: false, heldOut: false },
  { caption: 'Propose. A model reads the current prompt, and sometimes its failures, and writes a few rewritten prompts. This is the only creative step. Each rewrite is a guess.', active: 'propose', bars: 1, tries: false, heldOut: false },
  { caption: 'Score. Run every rewrite on the same train cases with the same checks. Three tries score 58, 66 and 61. Two rewrites are worse than the seed. That is normal.', active: 'score', bars: 1, tries: true, heldOut: false },
  { caption: 'Keep the best. The rewrite that scored 66 beats 62, so it becomes the new current prompt. The two worse tries are thrown away. The score can only go up on the train cases.', active: 'keep', bars: 2, tries: false, heldOut: false },
  { caption: 'Loop. The new prompt goes back to the proposer. Each round costs model calls, so every search has a budget. Two more rounds lift the train score to 71, then 73.', active: 'loop', bars: 4, tries: false, heldOut: false },
  { caption: 'The budget runs out. The best prompt scores 76 on the train cases. A 14 point gain looks great. But the search saw these exact cases many times.', active: 'none', bars: 6, tries: false, heldOut: false },
  { caption: 'Now score once on held-out cases the search never saw. The seed gets 61 there and the winner gets 68. The real gain is 7 points, half of what the train score showed. The gap is the cost of searching.', active: 'none', bars: 6, tries: false, heldOut: true },
];

const BASE = 410;
const SCALE = 2.5; // px per point, axis starts at zero
const X0 = 60;
const DX = 66;

export default function Ai15OptLoop() {
  return (
    <AnimFrame title="Prompt search: propose, score, keep the best" steps={steps} interval={5500}>
      {(_, s) => {
        const box = (id: Active, label: string, cx: number) => (
          <g>
            <SketchBox
              cx={cx}
              cy={64}
              w={180}
              h={44}
              r={8}
              seed={seedOf(`opt-${id}`)}
              stroke={s.active === id ? 'var(--accent)' : 'var(--muted)'}
              fill={s.active === id ? 'var(--accent)' : undefined}
              strokeWidth={s.active === id ? 2.2 : 1.4}
            />
            <HandText x={cx} y={64} size={TEXT_SIZES.label} color={s.active === id ? 'var(--fg)' : 'var(--muted)'}>
              {label}
            </HandText>
          </g>
        );
        const loopOn = s.active === 'loop';
        return (
          <SketchSvg width={720} height={450} label="A loop of three boxes: propose rewrites, score on train cases, keep the best. Below, bars show the train score rising each round and a held-out score that rose less.">
            {box('propose', 'Propose rewrites', 110)}
            {box('score', 'Score on train', 360)}
            {box('keep', 'Keep the best', 610)}
            <SketchArrow points={[[206, 64], [264, 64]]} seed={seedOf('opt-a1')} stroke="var(--muted)" />
            <SketchArrow points={[[456, 64], [514, 64]]} seed={seedOf('opt-a2')} stroke="var(--muted)" />
            <SketchArrow
              points={[[610, 92], [600, 150], [360, 160], [120, 150], [110, 92]]}
              seed={seedOf('opt-a3')}
              stroke={loopOn ? 'var(--accent)' : 'var(--muted)'}
              strokeWidth={loopOn ? 2.2 : 1.4}
            />
            {s.tries && (
              <HandText x={360} y={118} size={TEXT_SIZES.note} mono color="var(--fg)">
                tries: 58 66 61
              </HandText>
            )}

            <HandText x={X0 - 30} y={206} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              Best train score so far
            </HandText>
            {s.heldOut && (
              <HandText x={500} y={206} anchor="start" size={TEXT_SIZES.note} color="var(--warn)">
                Held-out cases, scored once
              </HandText>
            )}
            <SketchArrow points={[[X0 - 34, BASE + 6], [X0 + DX * 5 + 40, BASE + 6]]} seed={seedOf('opt-base')} stroke="var(--muted)" head="none" />

            {ROUNDS.slice(0, s.bars).map((v, i) => (
              <g key={i}>
                <SketchBox cx={X0 + i * DX} cy={BASE - (v * SCALE) / 2} w={46} h={v * SCALE} r={6} seed={seedOf(`opt-bar${i}`)} stroke="var(--ok)" fill="var(--ok)" />
                <HandText x={X0 + i * DX} y={BASE - v * SCALE - 12} size={TEXT_SIZES.note} mono>
                  {String(v)}
                </HandText>
                <HandText x={X0 + i * DX} y={BASE + 24} size={TEXT_SIZES.note} color="var(--muted)">
                  {i === 0 ? 'seed' : `r${i}`}
                </HandText>
              </g>
            ))}

            {s.heldOut && (
              <g>
                <SketchBox cx={520} cy={BASE - (SEED_HELD_OUT * SCALE) / 2} w={46} h={SEED_HELD_OUT * SCALE} r={6} seed={seedOf('opt-h0')} stroke="var(--muted)" />
                <HandText x={520} y={BASE - SEED_HELD_OUT * SCALE - 12} size={TEXT_SIZES.note} mono>
                  {String(SEED_HELD_OUT)}
                </HandText>
                <HandText x={520} y={BASE + 24} size={TEXT_SIZES.note} color="var(--muted)">
                  seed
                </HandText>
                <SketchBox cx={600} cy={BASE - (HELD_OUT * SCALE) / 2} w={46} h={HELD_OUT * SCALE} r={6} seed={seedOf('opt-h1')} stroke="var(--warn)" fill="var(--warn)" />
                <HandText x={600} y={BASE - HELD_OUT * SCALE - 12} size={TEXT_SIZES.note} mono>
                  {String(HELD_OUT)}
                </HandText>
                <HandText x={600} y={BASE + 24} size={TEXT_SIZES.note} color="var(--muted)">
                  winner
                </HandText>
              </g>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
