import { motion } from 'motion/react';
import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

interface Layer {
  id: string;
  label: string;
  /** Extra time this layer adds when a request reaches it and misses (ms). */
  cost: number;
  costText: string;
  holds: string;
}

const LAYERS: Layer[] = [
  { id: 'browser', label: 'Browser cache', cost: 0, costText: 'local, ~0 ms', holds: 'static files, API responses' },
  { id: 'cdn', label: 'CDN edge', cost: 20, costText: '+20 ms to the edge', holds: 'images, JS, public pages' },
  { id: 'gateway', label: 'Gateway / proxy cache', cost: 60, costText: '+60 ms to your region', holds: 'whole responses, by URL' },
  { id: 'local', label: 'In-process cache', cost: 1, costText: '+1 ms, ~1 µs lookup', holds: 'hot objects in app memory' },
  { id: 'redis', label: 'Distributed cache (Redis)', cost: 0.5, costText: '+0.5 ms network hop', holds: 'objects shared by all servers' },
  { id: 'buffer', label: 'Database buffer pool', cost: 2, costText: '+2 ms query', holds: 'hot disk pages in DB RAM' },
  { id: 'disk', label: 'Disk (source of truth)', cost: 3, costText: '+3 ms page read', holds: 'everything' },
];

const ROW_Y = [56, 140, 224, 280, 336, 392, 448];
const GROUPS = [
  { label: 'user device', y0: 26, y1: 86 },
  { label: 'edge, near the user', y0: 110, y1: 170 },
  { label: 'your data center / region', y0: 194, y1: 478 },
];

/** The request goes down until the first layer that has the data. `hit` is the index of that layer. */
interface Scenario {
  caption: string;
  hit: number | null;
}

const SCENARIOS: Scenario[] = [
  {
    caption:
      'Seven places can hold a copy of the data. A read starts at the top and goes down. It stops at the first layer that has the data. Each layer you skip saves the time and the work of every layer below it.',
    hit: null,
  },
  {
    caption: 'Request A: the browser has a fresh copy. No network at all. About 0 ms and zero load on your servers. This is the fastest hit in the system.',
    hit: 0,
  },
  {
    caption:
      'Request B: the browser misses, the CDN edge hits. The user pays a round trip to a nearby edge, ~20 ms (assumed). The request never reaches your data center. Edge hits protect your servers and shorten the distance.',
    hit: 1,
  },
  {
    caption:
      'Request C: browser and CDN miss. The gateway or reverse proxy has the whole response cached. The user now pays the long trip to your region, ~80 ms in this example (an assumption: 80 ms user-to-region round trip). The app code does not run.',
    hit: 2,
  },
  {
    caption:
      'Request D: everything above misses. The app keeps this object in its own memory. The lookup takes about 1 µs. The user waits ~81 ms, almost the same as C. The gain is that no other server and no database is touched.',
    hit: 3,
  },
  {
    caption:
      'Request E: the app process misses. Redis has it. A network hop of ~0.5 ms to a cache shared by all app servers. The database still sees nothing.',
    hit: 4,
  },
  {
    caption:
      'Request F: the cache layers miss, so the query reaches the database. The database has the page in its buffer pool, which is its own RAM cache. No disk read. About 2 ms for the query.',
    hit: 5,
  },
  {
    caption:
      'Request G: every cache misses. The database reads the page from disk and then fills its buffer pool. This is the slowest path. Notice the total: from the user, backend layers differ by only a few ms. The big latency win is at the edge. The big load win is that each layer protects the next.',
    hit: 6,
  },
];

function total(hit: number) {
  return LAYERS.slice(0, hit + 1).reduce((a, l) => a + l.cost, 0);
}

const fmtMs = (ms: number) => (ms < 10 && !Number.isInteger(ms) ? ms.toFixed(1) : String(Math.round(ms)));

export default function CacheLayers() {
  return (
    <AnimFrame title="A request stops at the first cache that has the data" steps={SCENARIOS.map((s) => ({ caption: s.caption }))} interval={3600}>
      {(i) => {
        const hit = SCENARIOS[i].hit;
        return (
          <SketchSvg width={660} height={496} label="Seven cache layers from browser to disk. A request goes down and stops at the first hit.">
            {GROUPS.map((g) => (
              <g key={g.label}>
                <SketchBox cx={250} cy={(g.y0 + g.y1) / 2} w={300} h={g.y1 - g.y0} r={14} dashed stroke="var(--muted)" seed={seedOf(g.label)} />
                <HandText x={250} y={g.y0 - 11} size={15} color="var(--muted)">
                  {g.label}
                </HandText>
              </g>
            ))}

            {LAYERS.map((l, r) => {
              const reached = hit === null ? false : r <= hit;
              const isHit = hit === r;
              const isMiss = hit !== null && r < hit;
              const faded = hit !== null && r > hit;
              const y = ROW_Y[r];
              return (
                <g key={l.id} opacity={faded ? 0.38 : 1}>
                  {isHit && <rect x={115} y={y - 20} width={270} height={40} rx={9} fill="var(--ok)" opacity={0.16} />}
                  {isMiss && <rect x={115} y={y - 20} width={270} height={40} rx={9} fill="var(--bad)" opacity={0.08} />}
                  <SketchBox cx={250} cy={y} w={270} h={46} r={9} seed={seedOf(l.id)} stroke={isHit ? 'var(--ok)' : isMiss ? 'var(--bad)' : 'var(--fg)'} strokeWidth={isHit ? 2.2 : 1.4} />
                  <HandText x={250} y={y - 5} size={18}>
                    {l.label}
                  </HandText>
                  <HandText x={275} y={y + 14} size={13} color="var(--muted)">
                    {l.holds}
                  </HandText>
                  {reached && (
                    <HandText x={78} y={y} size={24} weight={700} color={isHit ? 'var(--ok)' : 'var(--bad)'}>
                      {isHit ? '✓' : '✕'}
                    </HandText>
                  )}
                  {isHit ? (
                    <HandText x={412} y={y} size={16} weight={700} anchor="start" color="var(--ok)">
                      {`hit: user waits ~${fmtMs(total(r))} ms`}
                    </HandText>
                  ) : (
                    <HandText x={412} y={y} size={15} anchor="start" color={isMiss ? 'var(--warn)' : 'var(--muted)'}>
                      {l.costText}
                    </HandText>
                  )}
                </g>
              );
            })}

            {hit !== null && (
              <>
                <SketchArrow points={[[36, ROW_Y[0] - 14], [36, ROW_Y[hit]]]} head="end" stroke="var(--accent)" strokeWidth={2} seed={seedOf(`req${hit}`)} />
                <motion.circle
                  key={`dot${i}`}
                  cx={36}
                  r={8}
                  fill="var(--accent)"
                  initial={{ cy: ROW_Y[0] - 14 }}
                  animate={{ cy: ROW_Y[hit] }}
                  transition={{ duration: 0.5 + hit * 0.18, ease: 'easeInOut' }}
                />
                <HandText x={36} y={ROW_Y[0] - 26} size={14} color="var(--accent)">
                  request
                </HandText>
              </>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
