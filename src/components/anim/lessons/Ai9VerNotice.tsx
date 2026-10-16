import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { daysBetween } from './Ai9VerLogic';

/** Static infographic. Dates come from Anthropic's model deprecations page, read on 2026-10-16. */
const START = '2026-04-01';
const END = '2026-12-01';
const TODAY = '2026-10-16';
const X0 = 40;
const TRACK = 640;
const span = daysBetween(START, END);
const x = (d: string) => X0 + (daysBetween(START, d) / span) * TRACK;

const ROWS = [
  { name: 'Sonnet 4 and Opus 4', from: '2026-04-14', to: '2026-06-15' },
  { name: 'Opus 4.1', from: '2026-06-05', to: '2026-08-05' },
  { name: 'Sonnet 4.5', from: '2026-09-30', to: '2026-11-30' },
];
const MONTHS: [string, string][] = [
  ['Apr', '2026-04-01'], ['May', '2026-05-01'], ['Jun', '2026-06-01'], ['Jul', '2026-07-01'],
  ['Aug', '2026-08-01'], ['Sep', '2026-09-01'], ['Oct', '2026-10-01'], ['Nov', '2026-11-01'],
];

export default function Ai9VerNotice() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4">
      <SketchSvg width={720} height={330} label="Three model retirements. Each had about 61 to 62 days between the notice and the retirement date.">
        <HandText x={360} y={24} size={TEXT_SIZES.heading} color="var(--fg)">
          Days from notice to retirement (2026)
        </HandText>
        {MONTHS.map(([m, d]) => (
          <HandText key={m} x={x(d)} y={300} size={TEXT_SIZES.note} color="var(--muted)">
            {m}
          </HandText>
        ))}
        {ROWS.map((r, i) => {
          const y = 96 + i * 62;
          const x1 = x(r.from);
          const x2 = x(r.to);
          const days = daysBetween(r.from, r.to);
          return (
            <g key={r.name}>
              <HandText x={x1} y={y - 30} anchor="start" size={TEXT_SIZES.label} color="var(--fg)" halo>
                {r.name}
              </HandText>
              <SketchBox cx={(x1 + x2) / 2} cy={y} w={x2 - x1} h={30} r={6} seed={seedOf(`nt${i}`)} stroke="var(--warn)" fill="var(--warn)" strokeWidth={2.2} />
              <HandText x={x2 - 12} y={y} anchor="end" size={TEXT_SIZES.label} mono>
                {`${days} days`}
              </HandText>
            </g>
          );
        })}
        <SketchBox cx={x(TODAY)} cy={170} w={2} h={230} r={1} seed={seedOf('today')} stroke="var(--accent)" />
        <HandText x={x(TODAY)} y={48} size={TEXT_SIZES.note} color="var(--accent)">
          today, Oct 16
        </HandText>
      </SketchSvg>
      <figcaption className="px-3 pt-2 text-sm text-muted">Each bar starts when Anthropic announced the retirement and ends on the retirement date. Sonnet 4.5 has 45 days left today.</figcaption>
    </figure>
  );
}
