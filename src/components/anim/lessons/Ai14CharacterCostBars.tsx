import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { COST_CUT_CLAIM, API_MULTIPLE_CLAIM, DAU_SCENARIO, dauScenario } from './Ai14CharacterMath';

/** Before and after cost bars. Every number is a Character.AI company claim (2024-06-20). No dollar figure for 2022 is published. */

const X0 = 200;
const MAX_W = 440;
const W = 720;

interface Row {
  label: string;
  value: number;
  text: string;
  tone: string;
}

function Bars({ rows, scale, note, label }: { rows: Row[]; scale: number; note: string; label: string }) {
  const H = 70 + rows.length * 66;
  return (
    <SketchSvg width={W} height={H} label={label}>
      <HandText x={24} y={26} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
        {note}
      </HandText>
      {rows.map((r, i) => {
        const cy = 82 + i * 66;
        const w = Math.max(14, (r.value / scale) * MAX_W);
        return (
          <g key={r.label}>
            <HandText x={24} y={cy} size={TEXT_SIZES.label} anchor="start">
              {r.label}
            </HandText>
            <SketchBox cx={X0 + w / 2} cy={cy} w={w} h={40} r={4} seed={seedOf(`cost-${r.label}`)} stroke={r.tone} fill={r.tone} />
            <HandText x={X0 + w + 10} y={cy} size={TEXT_SIZES.label} anchor="start" color={r.tone}>
              {r.text}
            </HandText>
          </g>
        );
      })}
    </SketchSvg>
  );
}

const IDX = 'Cost for the same traffic. Today = 1. Index only: no dollar figure is published.';
const d = dauScenario();
const usd = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(2).replace(/\.?0+$/, '')}B` : `$${Math.round(n / 1e6)}M`);

const steps = [
  { caption: 'Company claim: serving cost is down "by a factor of 33" since late 2022 (the summary post says "at least 33X"). Draw late 2022 as 33 and today as 1. The post gives no dollar figure for 2022 and does not say whether "cost" means per query, per hour, or the whole bill.' },
  { caption: 'Today is 1. The drop from 33 to 1 is the whole claim. It comes from the model, the cache and the kernels together. The post does not split the 33 among them.' },
  { caption: 'Company claim: the same traffic on "leading commercial APIs" would cost "at least 13.5X" more. Our reading: this puts the 2022 stack (33) above even today\'s API bill (13.5). Which APIs, which prices and which model quality are not published.' },
  { caption: `Company claim: the post's example is 100 million daily users at one hour each. At $0.01 an hour that is ${usd(d.yearly)} a year, "$3.65 per daily active user", against "at least ${usd(DAU_SCENARIO.apiUsd)}" on APIs. Our arithmetic: ${usd(DAU_SCENARIO.apiUsd)} / ${usd(d.yearly)} = ${d.apiMultiple.toFixed(1)}, a little under the 13.5 above. Both are lower bounds, so they do not conflict.` },
];

export default function Ai14CharacterCostBars() {
  return (
    <AnimFrame title="Character.AI cost claims, before and after" steps={steps} interval={3600}>
      {(i) => {
        if (i === 3) {
          return (
            <Bars
              label="Bars: serving 100 million daily users for an hour a day costs 365 million dollars a year on Character.AI's own stack and at least 4.75 billion dollars on commercial APIs"
              scale={DAU_SCENARIO.apiUsd}
              note="Yearly bill, 100M users x 1 hour a day (the post's example)"
              rows={[
                { label: 'Own stack', value: d.yearly, text: usd(d.yearly), tone: 'var(--ok)' },
                { label: 'On APIs, at least', value: DAU_SCENARIO.apiUsd, text: usd(DAU_SCENARIO.apiUsd), tone: 'var(--warn)' },
              ]}
            />
          );
        }
        const rows: Row[] = [{ label: 'Late 2022', value: COST_CUT_CLAIM, text: `${COST_CUT_CLAIM}`, tone: 'var(--bad)' }];
        if (i >= 1) rows.push({ label: 'Today', value: 1, text: '1', tone: 'var(--ok)' });
        if (i >= 2) rows.push({ label: 'On APIs, at least', value: API_MULTIPLE_CLAIM, text: `${API_MULTIPLE_CLAIM}`, tone: 'var(--warn)' });
        return <Bars label={`Bars of relative serving cost: late 2022 is ${COST_CUT_CLAIM}${i >= 1 ? ', today is 1' : ''}${i >= 2 ? `, today on commercial APIs is at least ${API_MULTIPLE_CLAIM}` : ''}`} scale={COST_CUT_CLAIM} note={IDX} rows={rows} />;
      }}
    </AnimFrame>
  );
}
