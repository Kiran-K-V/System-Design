import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { TONE, type Tone } from '../FlowDiagram';

/**
 * A crash that turns into a cascade. Three servers, each able to serve 1,000 requests per second (example numbers).
 * Demand stays at 2,400 the whole time. Every step is a fixed picture: load per server and which ones are down.
 */

const CAP = 1000;
const ROW_Y = [92, 160, 228];
const BAR_X = 190; // left edge of the bar track
const BAR_W = 300; // width of the track, which stands for 250% of capacity
const MAX_PCT = 250;

interface Srv {
  load: number; // requests per second this server is asked to serve
  down?: boolean;
  tag?: string;
}

interface Step {
  caption: string;
  headline: string;
  headTone: Tone;
  servers: [Srv, Srv, Srv];
  active: number;
}

const steps: Step[] = [
  {
    caption:
      'Three identical servers share 2,400 requests per second. Each can serve 1,000, so each runs at 80%. The cluster looks healthy and has some spare room. These are example numbers.',
    headline: 'Demand 2,400 per second. Everything is fine.',
    headTone: 'ok',
    servers: [{ load: 800 }, { load: 800 }, { load: 800 }],
    active: -1,
  },
  {
    caption:
      'Server 1 crashes. The load balancer takes it out of the pool (lesson 2.4). Its 800 requests per second go to the other two. Each now has to serve 1,200 against a capacity of 1,000.',
    headline: 'Demand 2,400. Two servers can serve at most 2,000.',
    headTone: 'warn',
    servers: [{ load: 0, down: true, tag: 'crashed' }, { load: 1200 }, { load: 1200 }],
    active: 0,
  },
  {
    caption:
      'Servers 2 and 3 are overloaded. Queues grow, so every request gets slower. Clients time out and retry, which adds even more load. The Google SRE book gives a two-cluster example: a cluster pushed from 1,000 to 1,200 requests per second ends up with successful throughput well below 1,000.',
    headline: 'Overload makes servers slower, and slow makes it worse.',
    headTone: 'bad',
    servers: [{ load: 0, down: true, tag: 'crashed' }, { load: 1300, tag: 'slow, queues' }, { load: 1300, tag: 'slow, queues' }],
    active: 1,
  },
  {
    caption:
      'Server 2 runs out of memory under its queue and crashes. Server 3 is now alone with the whole 2,400 requests per second. That is 240% of what it can do.',
    headline: 'One survivor carries all the demand.',
    headTone: 'bad',
    servers: [{ load: 0, down: true, tag: 'crashed' }, { load: 0, down: true, tag: 'crashed' }, { load: 2400 }],
    active: 1,
  },
  {
    caption:
      'Server 3 fails too. The service is down. The first crash was an ordinary event. The outage came from the load that moved to the servers that were left. This is a cascading failure.',
    headline: 'Total outage. The cause was load moving, not the first crash.',
    headTone: 'bad',
    servers: [{ load: 0, down: true, tag: 'crashed' }, { load: 0, down: true, tag: 'crashed' }, { load: 0, down: true, tag: 'crashed' }],
    active: 2,
  },
  {
    caption:
      'Restarting server 1 does not help. The full 2,400 requests per second hit one cold server and it falls over again. The SRE book gives a larger example: a service healthy at 10,000 per second that failed at 11,000 may need the load to drop to about 1,000 per second, with only 10% of servers healthy, before it recovers. The fix is to cut demand first: shed load, or turn traffic away, and bring servers back in turn.',
    headline: 'Recovery needs demand to fall below what a cold fleet can serve.',
    headTone: 'warn',
    servers: [{ load: 2400, tag: 'restarted, cold' }, { load: 0, down: true, tag: 'crashed' }, { load: 0, down: true, tag: 'crashed' }],
    active: 0,
  },
];

const toneFor = (s: Srv): Tone => (s.down ? 'muted' : s.load > CAP ? 'bad' : s.load / CAP >= 0.8 ? 'warn' : 'ok');

export default function RelCascadeWalk() {
  return (
    <AnimFrame title="A crash becomes a cascade" steps={steps} interval={3600}>
      {(i, st) => (
        <SketchSvg width={720} height={280} label="Three servers and their load as a crash cascades">
          <HandText x={360} y={30} size={TEXT_SIZES.heading} color={TONE[st.headTone]}>
            {st.headline}
          </HandText>
          {st.servers.map((s, k) => {
            const y = ROW_Y[k];
            const tone = toneFor(s);
            const pct = s.down ? 0 : (s.load / CAP) * 100;
            const fillW = Math.max(0, (Math.min(pct, MAX_PCT) / MAX_PCT) * BAR_W);
            return (
              <g key={k}>
                <SketchBox cx={80} cy={y} w={110} h={44} r={8} seed={seedOf(`srv${k}`)} stroke={s.down ? 'var(--bad)' : st.active === k ? 'var(--accent)' : TONE.default} strokeWidth={st.active === k ? 2.2 : 1.4} dashed={s.down} />
                <HandText x={80} y={y} size={TEXT_SIZES.label} color={s.down ? 'var(--muted)' : undefined}>{`Server ${k + 1}`}</HandText>
                <SketchBox cx={BAR_X + BAR_W / 2} cy={y} w={BAR_W} h={26} r={6} seed={seedOf(`track${k}`)} stroke="var(--muted)" />
                {fillW > 4 && <SketchBox cx={BAR_X + fillW / 2} cy={y} w={fillW} h={26} r={6} seed={seedOf(`fill${k}:${i}`)} stroke={TONE[tone]} fill={TONE[tone]} fillStyle="solid" />}
                <HandText x={BAR_X + BAR_W + 16} y={y} size={TEXT_SIZES.label} anchor="start" color={TONE[tone]}>
                  {s.down ? 'down' : `${s.load.toLocaleString('en-US')} per s`}
                </HandText>
                {s.tag && (
                  <HandText x={80} y={y + 35} size={TEXT_SIZES.note} color="var(--muted)">
                    {s.tag}
                  </HandText>
                )}
              </g>
            );
          })}
          <SketchArrow points={[[BAR_X + (BAR_W * 100) / MAX_PCT, 66], [BAR_X + (BAR_W * 100) / MAX_PCT, 252]]} head="none" dashed stroke="var(--muted)" seed={seedOf('capline')} />
          <HandText x={BAR_X + (BAR_W * 100) / MAX_PCT} y={262} size={TEXT_SIZES.note} color="var(--muted)">
            capacity: 1,000 per s
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
