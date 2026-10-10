import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Static infographic: a queue deletes what it hands out. A log keeps records and each reader keeps its own offset. */

const Cell = ({ cx, cy, text, color = 'var(--fg)', dashed = false, fill }: { cx: number; cy: number; text: string; color?: string; dashed?: boolean; fill?: string }) => (
  <g>
    <SketchBox cx={cx} cy={cy} w={26} h={26} r={6} seed={seedOf(`qvl-${cx}-${cy}`)} stroke={color} dashed={dashed} fill={fill} fillStyle="solid" />
    <HandText x={cx} y={cy + 1} size={TEXT_SIZES.note} color={dashed ? 'var(--muted)' : 'var(--fg)'}>
      {text}
    </HandText>
  </g>
);

export default function AsyncQueueVsLog() {
  const qx = (i: number) => 226 - i * 32;
  const lx = (i: number) => 410 + i * 30;
  return (
    <div className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={720} height={290} label="A queue removes messages when workers take them. A log keeps records and each reader has its own position.">
        <HandText x={110} y={26} size={TEXT_SIZES.title}>Queue</HandText>
        <HandText x={546} y={26} size={TEXT_SIZES.title}>Log</HandText>

        <SketchBox cx={150} cy={84} w={196} h={44} r={8} seed={seedOf('qvl-tray')} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Cell key={i} cx={qx(i)} cy={84} text={String.fromCharCode(66 + i)} />
        ))}
        <SketchArrow points={[[254, 84], [298, 84]]} seed={seedOf('qvl-take')} stroke="var(--muted)" />
        <SketchBox cx={340} cy={84} w={78} h={44} seed={seedOf('qvl-w1')} />
        <HandText x={340} y={84} size={TEXT_SIZES.label}>Worker</HandText>
        <Cell cx={236} cy={150} text="A" dashed color="var(--bad)" />
        <HandText x={150} y={152} size={TEXT_SIZES.note} color="var(--muted)">taken and deleted</HandText>
        <SketchArrow points={[[290, 150], [250, 150]]} head="end" stroke="var(--bad)" seed={seedOf('qvl-gone')} />
        <HandText x={170} y={196} size={TEXT_SIZES.label}>One worker gets each message.</HandText>
        <HandText x={170} y={222} size={TEXT_SIZES.label}>Nobody can read A again.</HandText>

        <SketchArrow points={[[360, 20], [360, 262]]} head="none" dashed stroke="var(--muted)" strokeWidth={1.4} seed={seedOf('qvl-div')} />

        <SketchBox cx={526} cy={84} w={236} h={44} r={8} seed={seedOf('qvl-log')} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Cell key={i} cx={lx(i) + 18} cy={84} text={String.fromCharCode(65 + i)} color={i < 5 ? 'var(--ok)' : 'var(--muted)'} fill={i < 5 ? 'var(--ok)' : undefined} />
        ))}
        <HandText x={428} y={52} size={TEXT_SIZES.note} color="var(--muted)">offset 0</HandText>
        <SketchArrow points={[[578, 190], [578, 120]]} stroke="var(--accent)" seed={seedOf('qvl-r1')} />
        <HandText x={578} y={212} size={TEXT_SIZES.label} color="var(--accent)">billing: at 5</HandText>
        <SketchArrow points={[[458, 190], [458, 120]]} stroke="var(--warn)" seed={seedOf('qvl-r2')} />
        <HandText x={458} y={234} size={TEXT_SIZES.label} color="var(--warn)">audit: at 1</HandText>
        <HandText x={560} y={262} size={TEXT_SIZES.label}>Records stay until retention ends.</HandText>
      </SketchSvg>
    </div>
  );
}
