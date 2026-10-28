import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Llama 3 54-day snapshot. Counts are copied from the paper (Table 5 and the text). "Other" is 419 minus the five rows shown (ours). */

const W = 720;
const X0 = 220;
const MAX_W = 380;

interface Row {
  label: string;
  value: number;
  tone: string;
}

const ALL: Row[] = [{ label: 'All interruptions', value: 466, tone: 'var(--accent)' }];
const SPLIT: Row[] = [
  { label: 'Planned', value: 47, tone: 'var(--muted)' },
  { label: 'Unexpected', value: 419, tone: 'var(--bad)' },
];
const CAUSES: Row[] = [
  { label: 'Faulty GPU', value: 148, tone: 'var(--bad)' },
  { label: 'GPU HBM3 memory', value: 72, tone: 'var(--bad)' },
  { label: 'Software bug', value: 54, tone: 'var(--warn)' },
  { label: 'Network switch or cable', value: 35, tone: 'var(--warn)' },
  { label: 'Host maintenance', value: 32, tone: 'var(--bad)' },
  { label: 'All other causes', value: 78, tone: 'var(--muted)' },
];

function Bars({ rows, scale, note, label }: { rows: Row[]; scale: number; note: string; label: string }) {
  const H = 64 + rows.length * 54;
  return (
    <SketchSvg width={W} height={H} label={label}>
      <HandText x={24} y={26} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
        {note}
      </HandText>
      {rows.map((r, i) => {
        const cy = 70 + i * 54;
        const w = Math.max(10, (r.value / scale) * MAX_W);
        return (
          <g key={r.label}>
            <HandText x={24} y={cy} size={TEXT_SIZES.label} anchor="start">
              {r.label}
            </HandText>
            <SketchBox cx={X0 + w / 2} cy={cy} w={w} h={34} r={4} seed={seedOf(`e2llama-${r.label}`)} stroke={r.tone} fill={r.tone} />
            <HandText x={X0 + w + 10} y={cy} size={TEXT_SIZES.label} anchor="start" color={r.tone}>
              {String(r.value)}
            </HandText>
          </g>
        );
      })}
    </SketchSvg>
  );
}

const steps = [
  { caption: 'Paper claim: "During a 54-day snapshot period of pre-training, we experienced a total of 466 job interruptions." An interruption is any time the training job stopped and had to restart.' },
  { caption: 'Paper claim: 47 were planned, from automated maintenance such as firmware upgrades, or from operator actions such as a config or dataset change. The other 419 were unexpected. Only the unexpected ones are failures.' },
  { caption: 'Paper claim: root causes of the 419 (root-cause table). A faulty GPU is the biggest row, then GPU memory (HBM3), then a software bug, then switches and cables, then host maintenance (the printed share for the first row, 30.1%, does not match its count of 148; see the lesson). The last bar is our sum of the other 13 rows of the table.' },
  { caption: 'Paper claim: about 78% of unexpected interruptions are confirmed or suspected hardware, and manual intervention was needed only three times. Red bars are the hardware rows, amber is software. Our reading: the machine is the main source of trouble, and automation handled almost all of it.' },
];

export default function AiE2LlamaCauses() {
  return (
    <AnimFrame title="Llama 3 405B: 54 days of interruptions" steps={steps} interval={4200}>
      {(i) => {
        if (i === 0) return <Bars label="Bar: 466 job interruptions in 54 days" rows={ALL} scale={466} note="Count of job interruptions, Llama 3 405B pre-training, 54-day snapshot" />;
        if (i === 1) return <Bars label="Bars: 47 planned and 419 unexpected interruptions" rows={SPLIT} scale={466} note="Planned against unexpected" />;
        return (
          <Bars
            label="Bars of unexpected interruptions by root cause: faulty GPU 148, HBM3 memory 72, software bug 54, network 35, host maintenance 32, other 78"
            rows={i === 3 ? CAUSES : CAUSES.map((r, k) => ({ ...r, tone: k === 0 ? 'var(--accent)' : 'var(--muted)' }))}
            scale={148}
            note="Unexpected interruptions by root cause (419 in all)"
          />
        );
      }}
    </AnimFrame>
  );
}
