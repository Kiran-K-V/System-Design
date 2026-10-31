import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { DAY_LOAD, dayStats } from './Ai2HostMath';

const D = dayStats();
const PRICE = 3.99;
const PCT = (v: number) => `${Math.round(v * 100)}%`;
const USD = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

type Mode = 'load' | 'work' | 'static' | 'lag';
interface Step {
  caption: string;
  mode: Mode;
  stat: string;
}

const steps: Step[] = [
  {
    caption: `Here is one day of traffic for a business-hours product. The curve is illustrative, made up for this lesson. Each bar is one hour, measured in GPUs of work at full speed. The peak is ${D.peakGpus} GPUs. The quiet night needs about 1.`,
    mode: 'load',
    stat: `peak ${D.peakGpus} GPUs, average ${(D.used / 24).toFixed(1)}`,
  },
  {
    caption: `Fixed fleet: you rent ${D.peakGpus} GPUs all day, because a request at 11:00 needs them. The warm bars are work done. The dashed outlines are paid idle capacity. ${D.staticHours} GPU-hours are billed and ${D.used.toFixed(1)} do work: ${PCT(D.staticUtil)} utilization. At $${PRICE} that is ${USD(D.staticHours * PRICE)} a day.`,
    mode: 'static',
    stat: `static: ${PCT(D.staticUtil)} used, ${USD(D.staticHours * PRICE)} a day`,
  },
  {
    caption: `An API prices only the work. The same ${D.used.toFixed(1)} GPU-hours of work, billed at the cost of ${D.used.toFixed(1)} busy GPUs, would be ${USD(D.used * PRICE)} at the same hourly rate. The gap between the two numbers is the price of idle time. This is why utilization, not the hourly rate, decides the crossover (the Build, Buy, or Fine-tune lesson).`,
    mode: 'work',
    stat: `work only: ${USD(D.used * PRICE)} a day`,
  },
  {
    caption: `Autoscaling tries to close the gap by adding GPUs as load rises. A new GPU must start, pull the model weights into memory, and warm up before it serves. That takes minutes in practice; measure yours. Here the fleet follows the previous hour's load. Utilization rises to ${PCT(D.lagUtil)}, and the bill falls to ${USD(D.lagHours * PRICE)} a day.`,
    mode: 'lag',
    stat: `autoscaled: ${PCT(D.lagUtil)} used, ${USD(D.lagHours * PRICE)} a day`,
  },
  {
    caption: `The lag has a price. In the ${D.shortHours} hours where traffic climbs, the fleet is smaller than the load (red bars): requests queue and latency rises. You can add headroom, which costs idle GPUs again, or accept slow mornings. An API absorbs this for you. A self-host design must pick one.`,
    mode: 'lag',
    stat: `${D.shortHours} hours short of capacity`,
  },
];

const X0 = 50;
const BW = 26;
const GAP = 2;
const BASE = 236;
const UNIT_PX = 17;

export default function Ai2HostDay() {
  return (
    <AnimFrame title="One day of traffic against a rented fleet" steps={steps} interval={5200}>
      {(i, s) => (
        <SketchSvg width={720} height={300} label={`Step ${i + 1}: traffic and GPU capacity over 24 hours`}>
          {DAY_LOAD.map((load, h) => {
            const cx = X0 + h * (BW + GAP) + BW / 2;
            const cap = s.mode === 'static' ? D.peakGpus : s.mode === 'lag' ? D.lagged[h] : 0;
            const used = Math.min(load, cap || load);
            const usedH = Math.max(6, used * UNIT_PX);
            const capH = cap * UNIT_PX;
            const short = s.mode === 'lag' && load > cap;
            return (
              <g key={h}>
                {cap > used && <SketchBox cx={cx} cy={BASE - capH / 2} w={BW} h={capH} r={6} seed={seedOf(`hd-c${h}-${s.mode}`)} stroke="var(--warn)" dashed />}
                <SketchBox cx={cx} cy={BASE - usedH / 2} w={BW} h={usedH} r={6} seed={seedOf(`hd-u${h}-${s.mode}`)} fill={s.mode === 'load' ? 'var(--accent)' : short ? 'var(--bad)' : 'var(--ok)'} stroke={s.mode === 'load' ? 'var(--accent)' : short ? 'var(--bad)' : 'var(--ok)'} />
              </g>
            );
          })}
          <SketchArrow points={[[X0 - 6, BASE + 6], [X0 + 24 * (BW + GAP), BASE + 6]]} head="none" seed={seedOf('hd-axis')} stroke="var(--muted)" />
          {[0, 6, 12, 18].map((h) => (
            <HandText key={h} x={X0 + h * (BW + GAP) + BW / 2} y={BASE + 24} size={TEXT_SIZES.note} color="var(--muted)">{`${String(h).padStart(2, '0')}:00`}</HandText>
          ))}
          <HandText x={X0} y={18} size={TEXT_SIZES.note} color="var(--muted)" anchor="start">GPUs of work per hour (bar), GPUs rented (dashed)</HandText>
          <HandText x={360} y={288} size={TEXT_SIZES.label} mono color="var(--fg)">{s.stat}</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
