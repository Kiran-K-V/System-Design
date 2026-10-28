import AnimFrame from '../AnimFrame';
import { Badge, HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Step {
  caption: string;
  active: number; // -1 none, 0..4 a row, 5 final
}

const ROWS = [
  { name: 'The test', q: 'Did the model see these questions?\nCan the test still tell models apart?' },
  { name: 'The answer key', q: 'Are the labels right?\nA wrong key caps every score.' },
  { name: 'The run', q: 'How many tries, which tools, what budget,\nand whose harness?' },
  { name: 'The comparison', q: 'Were rivals run the same way?\nWho voted, and what was left out?' },
  { name: 'Your task', q: 'Does the test look like your work?\nOnly your own set can say.' },
];

const steps: Step[] = [
  { active: -1, caption: 'A launch post gives you one number. Between that number and your product sit five places where it can slip. Step through them.' },
  { active: 0, caption: 'The test. If the questions leaked into training, the model is recalling answers. If the test is old and easy, the top models bunch together and the number cannot separate them.' },
  { active: 1, caption: 'The answer key. Some benchmark answers are wrong. A model that gives the right answer is marked wrong, so the top of the scale is partly noise.' },
  { active: 2, caption: 'The run. The same model gives different scores with one try or sixty-four, tools on or off, a small or large thinking budget, and a plain or custom harness. The footnote says which.' },
  { active: 3, caption: 'The comparison. A chart is only fair if every bar was produced the same way. On a voting board, ask who voted and which model variants were tested before the one shown.' },
  { active: 4, caption: 'Your task. A strong score on coding puzzles says little about invoice fields or support tickets. The match between the test and your work is the part nobody else can check for you.' },
  { active: 5, caption: 'Close the gap yourself. Treat the launch post as a lead, then run your own golden set on the new model and the old one. Your set is the evidence.' },
];

const BX = 150;
const Y0 = 72;
const DY = 66;

export default function Ai15BenchClaim() {
  return (
    <AnimFrame title="Five places a claimed score can slip" steps={steps} interval={5200}>
      {(_, s) => (
        <SketchSvg width={720} height={430} label="A launch-post score and five questions to ask: the test, the answer key, the run, the comparison, and your task.">
          <HandText x={360} y={28} size={TEXT_SIZES.heading} color="var(--fg)">
            Model Z: 92% on a public benchmark
          </HandText>
          {ROWS.map((r, i) => {
            const y = Y0 + i * DY;
            const isActive = s.active === i;
            const isFinalYou = s.active === 5 && i === 4;
            const tone = isFinalYou ? 'var(--ok)' : isActive ? 'var(--accent)' : 'var(--muted)';
            const lit = isActive || isFinalYou;
            return (
              <g key={r.name}>
                <Badge cx={34} cy={y} n={i + 1} seed={seedOf(`bc${i}`)} />
                <SketchBox cx={BX} cy={y} w={180} h={44} r={8} seed={seedOf(`bcb${i}`)} stroke={tone} fill={lit ? tone : undefined} strokeWidth={lit ? 2.2 : 1.4} />
                <HandText x={BX} y={y} size={TEXT_SIZES.label} color={lit ? 'var(--fg)' : 'var(--muted)'}>
                  {r.name}
                </HandText>
                <HandText x={262} y={y} anchor="start" size={TEXT_SIZES.label} color={lit ? 'var(--fg)' : 'var(--muted)'}>
                  {r.q}
                </HandText>
              </g>
            );
          })}
          {s.active === 5 && (
            <HandText x={360} y={Y0 + 5 * DY + 6} size={TEXT_SIZES.heading} color="var(--ok)">
              Launch post = a lead. Your golden set = the evidence.
            </HandText>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
