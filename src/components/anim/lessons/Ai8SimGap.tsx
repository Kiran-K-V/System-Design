import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Real figures from a 2026 study with 451 human participants and 31 simulators (agent success; short turns; polite turns). */
const ROWS = [
  { label: 'Agent success rate', human: 63.6, sim: 77.8, simName: 'best simulators' },
  { label: 'Turns of 3 words or fewer', human: 29.0, sim: 1.0, simName: 'GPT-4o' },
  { label: 'Polite turns', human: 15.3, sim: 49.0, simName: 'GPT-4o' },
];

const X0 = 250;
const W = 380;

/** Static infographic: humans against simulators on three measures. */
export default function Ai8SimGap() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-2xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={720} height={300} label="Humans compared with simulated users: success rate 63.6 versus 77.8 percent, short turns 29 versus 1 percent, polite turns 15.3 versus 49 percent.">
        {ROWS.map((r, i) => {
          const y = 52 + i * 90;
          const hw = (r.human / 100) * W;
          const sw = Math.max((r.sim / 100) * W, 6);
          return (
            <g key={r.label}>
              <HandText x={24} y={y + 16} anchor="start" size={TEXT_SIZES.label}>{r.label}</HandText>
              <SketchBox cx={X0 + hw / 2} cy={y} w={hw} h={26} r={6} seed={seedOf(`sgh${i}`)} stroke="var(--ok)" fill="var(--ok)" />
              <HandText x={X0 + hw + 8} y={y} anchor="start" size={TEXT_SIZES.note} mono color="var(--ok)">{`humans ${r.human.toFixed(1)}%`}</HandText>
              <SketchBox cx={X0 + sw / 2} cy={y + 34} w={sw} h={26} r={6} seed={seedOf(`sgs${i}`)} stroke="var(--warn)" fill="var(--warn)" />
              <HandText x={X0 + sw + 8} y={y + 34} anchor="start" size={TEXT_SIZES.note} mono color="var(--warn)">{`${r.simName} ${r.sim.toFixed(1)}%`}</HandText>
            </g>
          );
        })}
        <HandText x={24} y={14} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">the same tasks, played by real people and by simulated users</HandText>
      </SketchSvg>
      <figcaption className="px-2 pt-2 text-[0.95rem] leading-relaxed">
        Real people were harder on the agent than simulators were. The simulators were more cooperative, wrote longer turns, and were more polite than humans.
      </figcaption>
    </figure>
  );
}
