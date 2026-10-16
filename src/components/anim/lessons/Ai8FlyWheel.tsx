import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Node {
  label: string;
  x: number;
  y: number;
  count: string;
  /** Where the count text sits relative to the box. */
  above: boolean;
}

const NODES: Node[] = [
  { label: 'Log', x: 110, y: 100, count: '100,000 traces', above: true },
  { label: 'Redact', x: 360, y: 100, count: '14,200 details masked', above: true },
  { label: 'Pick', x: 610, y: 100, count: '6,500 picked', above: true },
  { label: 'Label', x: 610, y: 250, count: '300 labeled, 120 fail', above: false },
  { label: 'Eval set', x: 360, y: 250, count: '+40 cases', above: false },
  { label: 'Improve', x: 110, y: 250, count: 'release 43', above: false },
];

interface Step {
  caption: string;
  active: number;
  /** Nodes reached so far. */
  reached: number;
  closing?: boolean;
}

const steps: Step[] = [
  { caption: 'Log: every request is stored as a trace, tagged with the release that served it. The counts here are illustrative, per day.', active: 0, reached: 1 },
  { caption: 'Redact: personal details are masked before the trace goes anywhere a person or a training job can read it. The count is how many details were masked.', active: 1, reached: 2 },
  { caption: 'Pick: no one can read 100,000 traces. Take the 6,000 that user signals flagged (thumbs-down, edits, retries, complaints) plus 500 chosen at random.', active: 2, reached: 3 },
  { caption: 'Label: a judge screens the 6,500, and people label 300 of them as pass or fail with a short reason. 120 fail.', active: 3, reached: 4 },
  { caption: 'Eval set: the 120 failures fall into 3 new scenarios. Add 40 of them as new test cases, and keep some of them held out.', active: 4, reached: 5 },
  { caption: 'Improve: fix the prompt or tools first. Only if that is not enough, turn the cases into training data. The result is release 43.', active: 5, reached: 6 },
  { caption: 'Close the loop: release 43 goes up the rollout ladder, serves traffic, and its traces enter the log tagged "43". Compare failure rates by release.', active: 0, reached: 6, closing: true },
];

const BW = 150;
const BH = 56;

export default function Ai8FlyWheel() {
  return (
    <AnimFrame title="The feedback flywheel, one turn" steps={steps} interval={5200}>
      {(_, s) => (
        <SketchSvg width={720} height={350} label="Six stages in a loop: log, redact, pick, label, eval set, improve, and back to log.">
          {NODES.map((n, i) => {
            const on = i < s.reached;
            const act = i === s.active;
            return (
              <g key={n.label}>
                <SketchBox cx={n.x} cy={n.y} w={BW} h={BH} r={8} seed={seedOf(`fw${i}`)} stroke={act ? 'var(--accent)' : on ? 'var(--fg)' : 'var(--muted)'} fill={act ? 'var(--accent)' : undefined} dashed={!on} strokeWidth={act ? 2.2 : 1.4} />
                <HandText x={n.x} y={n.y} size={TEXT_SIZES.label} color={on ? 'var(--fg)' : 'var(--muted)'}>
                  {n.label}
                </HandText>
                {on && (
                  <HandText x={n.x} y={n.above ? n.y - 46 : n.y + 46} size={TEXT_SIZES.note} color={act ? 'var(--accent)' : 'var(--muted)'} mono>
                    {n.count}
                  </HandText>
                )}
              </g>
            );
          })}
          {[
            { from: [190, 100], to: [280, 100], i: 1 },
            { from: [440, 100], to: [530, 100], i: 2 },
            { from: [610, 134], to: [610, 216], i: 3 },
            { from: [530, 250], to: [440, 250], i: 4 },
            { from: [280, 250], to: [190, 250], i: 5 },
            { from: [110, 216], to: [110, 134], i: 0 },
          ].map((a) => {
            const hot = a.i === s.active && (a.i !== 0 || !!s.closing);
            const shown = a.i === 0 ? !!s.closing : a.i < s.reached;
            return (
              <SketchArrow key={a.i} points={[a.from as [number, number], a.to as [number, number]]} seed={seedOf(`fwa${a.i}`)} stroke={hot ? 'var(--accent)' : 'var(--muted)'} dashed={!shown} strokeWidth={hot ? 2.2 : 1.4} />
            );
          })}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
