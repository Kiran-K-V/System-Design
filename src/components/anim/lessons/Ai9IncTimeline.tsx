import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/**
 * Dates and percentages from Anthropic's engineering post "A postmortem of three recent issues" (published 2025-09-17).
 * Day 0 is August 1, 2025.
 */
interface Lane {
  id: string;
  label: string;
  start: number;
  /** Day the fix was deployed. */
  fixed: number;
  /** Day the fix reached everyone. Same as `fixed` when it was a rollback. */
  done: number;
}

const LANES: Lane[] = [
  { id: 'route', label: 'Wrong servers', start: 4, fixed: 34, done: 48 },
  { id: 'out', label: 'Odd characters', start: 24, fixed: 32, done: 32 },
  { id: 'topk', label: 'Skipped words', start: 24, fixed: 34, done: 42 },
];

interface Step {
  caption: string;
  day: number;
  label: string;
}

const steps: Step[] = [
  {
    caption:
      'August 5. A change sends some requests to servers set up for a different context window. The context window is how much text the model reads at once. At first, 0.8% of requests to one model are affected. The answers still come back as normal responses, so a dashboard of error codes has nothing to show.',
    day: 4,
    label: 'Aug 5',
  },
  {
    caption:
      'August 25. Two more changes go out the same day. One is a bad setting on the servers: answers start to contain odd characters, such as Thai or Chinese in an English reply. The other is a compiler bug in the code that picks the next word. It sometimes left out the best choice. Three bugs are now live at once, each with different symptoms.',
    day: 24,
    label: 'Aug 25',
  },
  {
    caption:
      'August 29. A routine load balancer change sends more short requests to the wrong servers. The load balancer is the part that spreads requests over servers. The share of affected requests climbs. Anthropic says it did not link this spike to the change at first, because each bug looked different on each platform.',
    day: 28,
    label: 'Aug 29',
  },
  {
    caption:
      'August 31. The worst hour: 16% of requests to that model are affected. Across the period, about 30% of Claude Code users had at least one message sent to the wrong servers. The routing was sticky: once a conversation landed on a wrong server, its next messages were likely to land there too.',
    day: 30,
    label: 'Aug 31',
  },
  {
    caption:
      'September 2. The odd-character bug is rolled back. That is 8 days after it was deployed. A rollback means going back to the last good version. It is the fastest tool you have: one step back to a state you already trust.',
    day: 32,
    label: 'Sep 2',
  },
  {
    caption:
      'September 4. The routing fix is deployed, 30 days after the bug began. It then rolls out slowly to each platform. The same day, one model is rolled back to avoid the skipped-word bug. A fix that is deployed is not a fix that has reached everyone.',
    day: 34,
    label: 'Sep 4',
  },
  {
    caption:
      'September 12. A second model is rolled back for the skipped-word bug. Anthropic also says it rolled back a third model as a precaution. For this model, the possible exposure lasted 18 days (September 12 minus August 25).',
    day: 42,
    label: 'Sep 12',
  },
  {
    caption:
      'September 16 to 18. The routing fix reaches every platform. Anthropic published its write-up on September 17. Its listed changes: checks that catch odd characters, evals that run continuously on production traffic, and faster ways to read user feedback without breaking privacy.',
    day: 48,
    label: 'Sep 18',
  },
];

const X0 = 150;
const SPAN = 50;
const PX = 540 / SPAN;
const x = (d: number) => X0 + d * PX;
const LANE_Y = (i: number) => 112 + i * 58;

export default function Ai9IncTimeline() {
  return (
    <AnimFrame title="Three bugs, five weeks: Anthropic, August to September 2025" steps={steps} interval={6500}>
      {(_, s) => (
        <SketchSvg width={720} height={300} label={`Timeline of three bugs, cursor at ${s.label}`}>
          <HandText x={X0} y={22} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
            {`Today: ${s.label}`}
          </HandText>
          <SketchArrow points={[[X0, 262], [X0 + 540, 262]]} head="none" stroke="var(--muted)" seed={seedOf('inc-axis')} />
          {[
            [0, 'Aug 1'],
            [14, 'Aug 15'],
            [31, 'Sep 1'],
            [45, 'Sep 15'],
          ].map(([d, t]) => (
            <HandText key={String(t)} x={x(Number(d))} y={282} size={TEXT_SIZES.note} color="var(--muted)">
              {String(t)}
            </HandText>
          ))}
          {LANES.map((l, i) => {
            const cy = LANE_Y(i);
            const begun = s.day >= l.start;
            const badEnd = Math.min(s.day, l.fixed);
            const warnEnd = Math.min(s.day, l.done);
            return (
              <g key={l.id}>
                <HandText x={X0 - 12} y={cy} anchor="end" size={TEXT_SIZES.label} color={begun ? 'var(--fg)' : 'var(--muted)'}>
                  {l.label}
                </HandText>
                {begun && (
                  <SketchBox cx={(x(l.start) + x(badEnd)) / 2} cy={cy} w={Math.max(x(badEnd) - x(l.start), 6)} h={26} r={6} seed={seedOf(`bad${l.id}`)} stroke="var(--bad)" fill="var(--bad)" />
                )}
                {begun && warnEnd > l.fixed && (
                  <SketchBox cx={(x(l.fixed) + x(warnEnd)) / 2} cy={cy} w={Math.max(x(warnEnd) - x(l.fixed), 6)} h={26} r={6} seed={seedOf(`warn${l.id}`)} stroke="var(--warn)" fill="var(--warn)" />
                )}
                {s.day >= l.done && (
                  <HandText x={x(l.done) + 14} y={cy} anchor="start" size={TEXT_SIZES.note} color="var(--ok)">
                    fixed
                  </HandText>
                )}
              </g>
            );
          })}
          <SketchArrow points={[[x(s.day), 46], [x(s.day), 250]]} head="none" dashed stroke="var(--accent)" strokeWidth={2.2} seed={seedOf(`cur${s.day}`)} />
          <HandText x={X0 + 540} y={22} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
            red: wrong answers reach users. orange: fix rolling out.
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
