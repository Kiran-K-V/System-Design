import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { FLAG_POINTS, SLICES, delta, flagged, pct, total, type Slice } from './Ai15MigLogic';

type View = 'overall' | 'slices';

const W = 360;
const BAR_X = 140;
const BAR_W = 160;
const AXIS_MIN = 60;
const barLen = (p: number) => ((Math.max(p, AXIS_MIN) - AXIS_MIN) / (100 - AXIS_MIN)) * BAR_W;
const fmt = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
const sign = (n: number) => (n > 0 ? `+${n.toFixed(0)}` : n.toFixed(0));

const SHORT: Record<string, string> = {
  'Refund questions': 'Refunds',
  'Shipping questions': 'Shipping',
  'Needs a tool call': 'Tool calls',
  'Not in English': 'Not English',
  'Long threads': 'Long threads',
  'All cases': 'All cases',
};

/** Old and new pass rates per slice. The case counts are made up (illustrative). Maths is in Ai15MigLogic. */
export default function Ai15MigDiff() {
  const [view, setView] = useState<View>('overall');
  const all = total(SLICES);
  const rows: Slice[] = view === 'overall' ? [all] : [all, ...SLICES];
  const H = 80 + rows.length * 56;

  return (
    <CacheWidgetFrame
      title="Same total score, different behavior"
      hint="illustrative: 200 made-up test cases"
      caption={
        view === 'overall' ? (
          <>Both models pass 179 of 200 cases (89.5%). On this view, the new model looks safe to ship. Switch to the slice view.</>
        ) : (
          <>
            The total is still 89.5% for both. But two slices lost {FLAG_POINTS} points or more, and two gained. The small slices are noisy: 20 cases is a small sample. Use the flagged rows as a reading list. Open those cases. Do not trust the percent alone.
          </>
        )
      }
    >
      <div className="mb-3">
        <Seg
          label="View"
          value={view}
          onChange={setView}
          options={[
            { id: 'overall', label: 'Overall only' },
            { id: 'slices', label: 'By slice' },
          ]}
        />
      </div>
      <div className="mx-auto w-full max-w-[460px] [&>svg]:min-w-0!">
        <SketchSvg width={W} height={H} label="Pass rate of the old and the new model, overall and per slice of the test set.">
          <SketchBox cx={22} cy={18} w={16} h={12} r={3} seed={seedOf('lg1')} stroke="var(--muted)" fill="var(--muted)" />
          <HandText x={36} y={18} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
            old model
          </HandText>
          <SketchBox cx={150} cy={18} w={16} h={12} r={3} seed={seedOf('lg2')} stroke="var(--accent)" fill="var(--accent)" />
          <HandText x={164} y={18} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
            new model
          </HandText>
          <HandText x={12} y={42} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
            bars start at 60%
          </HandText>
          {rows.map((s, i) => {
            const y = 76 + i * 56;
            const o = pct(s.oldPass, s.n);
            const n = pct(s.newPass, s.n);
            const d = delta(s);
            const bad = s.name !== 'All cases' && flagged(s);
            const tone = bad ? 'var(--bad)' : 'var(--accent)';
            return (
              <g key={s.name}>
                <HandText x={12} y={y - 9} anchor="start" size={TEXT_SIZES.label}>
                  {SHORT[s.name]}
                </HandText>
                <HandText x={12} y={y + 11} anchor="start" size={TEXT_SIZES.note} color={bad ? 'var(--bad)' : 'var(--muted)'}>
                  {`${s.n} cases, ${sign(d)} pts`}
                </HandText>
                <SketchBox cx={BAR_X + barLen(o) / 2} cy={y - 9} w={Math.max(barLen(o), 6)} h={14} r={4} seed={seedOf(`o${s.name}`)} stroke="var(--muted)" fill="var(--muted)" />
                <HandText x={BAR_X + barLen(o) + 8} y={y - 9} anchor="start" size={TEXT_SIZES.note} mono color="var(--muted)">
                  {fmt(o)}
                </HandText>
                <SketchBox cx={BAR_X + barLen(n) / 2} cy={y + 9} w={Math.max(barLen(n), 6)} h={14} r={4} seed={seedOf(`n${s.name}`)} stroke={tone} fill={tone} strokeWidth={bad ? 2.2 : 1.4} />
                <HandText x={BAR_X + barLen(n) + 8} y={y + 9} anchor="start" size={TEXT_SIZES.note} mono color={bad ? 'var(--bad)' : 'var(--fg)'}>
                  {fmt(n)}
                </HandText>
              </g>
            );
          })}
        </SketchSvg>
      </div>
    </CacheWidgetFrame>
  );
}
