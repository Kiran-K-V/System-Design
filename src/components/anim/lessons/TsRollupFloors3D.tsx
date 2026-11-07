import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { CellField, Cube, type GridCell, type Vec3 } from '../three/blocks';
import { Links, Tag } from '../three/extras';
import { usePalette, type Palette } from '../three/theme';

/**
 * Time-series data as a block: time runs left to right, each row is one series, and bar height is the value.
 * A rollup floor above keeps one block per window: its body spans min to max, and a thin plate marks the average.
 */

const SERIES = ['/pay', '/login', '/search', '/cart', '/home'];
const N = 48; // raw samples per row in the toy
const WIN = 8; // raw samples per rollup window
const BLOCKS = N / WIN;
const SPIKE = { row: 0, t: 21 };
const DX = 0.17;
const tx = (t: number) => (t - (N - 1) / 2) * DX;
const rz = (r: number) => (r - (SERIES.length - 1) / 2) * 0.75;
const ROLL_Y = 2.3;
const VALUE_SCALE = 0.9;

/** Small fixed noise so the toy looks like real traffic and is the same on every load. */
const noise = (r: number, t: number) => {
  const x = Math.sin(r * 12.9898 + t * 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};
const value = (r: number, t: number) =>
  r === SPIKE.row && t === SPIKE.t ? 1.85 : 0.45 + 0.22 * Math.sin(t * 0.33 + r * 1.3) + 0.16 * noise(r, t);

const ROLL = SERIES.map((_, r) =>
  Array.from({ length: BLOCKS }, (_, b) => {
    const vs = Array.from({ length: WIN }, (_, k) => value(r, b * WIN + k));
    return { min: Math.min(...vs), max: Math.max(...vs), avg: vs.reduce((a, v) => a + v, 0) / WIN };
  }),
);
const SPIKE_BLOCK = Math.floor(SPIKE.t / WIN);

interface Step {
  caption: string;
  /** Rows shown: 1 for one series, 5 for all. */
  rows: number;
  rollup: boolean;
  /** Draws the lines from one window of raw samples to its rollup block. */
  window: boolean;
  spike: boolean;
  /** Raw samples older than this index are deleted. 0 keeps all. */
  rawFrom: number;
  focus: Vec3;
  distance: number;
  view: [number, number];
}

const steps: Step[] = [
  {
    caption: 'One series: the metric http_requests_total with the tags host=web-17 and endpoint=/pay. Each bar is one sample. Time runs left to right, and the height is the value.',
    rows: 1,
    rollup: false,
    window: false,
    spike: false,
    rawFrom: 0,
    focus: [0, 0.4, 0],
    distance: 11,
    view: [0.35, -0.25],
  },
  {
    caption: 'Change one tag value and you have a new series. Five endpoints give five rows. Now the data is a block: series front to back, time left to right, value up.',
    rows: 5,
    rollup: false,
    window: false,
    spike: false,
    rawFrom: 0,
    focus: [0, 0.4, 0],
    distance: 13,
    view: [0.55, -0.6],
  },
  {
    caption: 'This toy shows 48 samples per row. A real graph of 90 days with one point every 10 seconds has nearly a million points per series. A screen shows about a thousand.',
    rows: 5,
    rollup: false,
    window: false,
    spike: false,
    rawFrom: 0,
    focus: [0, 0.3, 0],
    distance: 12,
    view: [0.75, -0.35],
  },
  {
    caption: 'Downsampling, also called a rollup. Each window of raw samples becomes one point on the floor above. The point keeps the count, sum, min and max. Each block spans min to max. The thin plate is the average, computed from sum and count.',
    rows: 5,
    rollup: true,
    window: true,
    spike: false,
    rawFrom: 0,
    focus: [0, 1.4, 0],
    distance: 14,
    view: [0.3, -0.55],
  },
  {
    caption: 'One sample on /pay spiked. In its rollup block the average plate barely moves: a plain average hides the spike. The max still reaches it. That is why a rollup stores min and max, not only the average.',
    rows: 5,
    rollup: true,
    window: false,
    spike: true,
    rawFrom: 0,
    focus: [tx(SPIKE.t) + 0.6, 1.3, rz(SPIKE.row)],
    distance: 11.5,
    view: [0.32, -0.4],
  },
  {
    caption: 'Old raw samples are deleted, and the rollup floor keeps the long history. A typical policy is raw data for a few weeks and rolled-up data for a year. The exact windows are your choice.',
    rows: 5,
    rollup: true,
    window: false,
    spike: false,
    rawFrom: N / 2,
    focus: [0, 1.1, 0],
    distance: 14,
    view: [0.4, -0.75],
  },
];

export default function TsRollupFloors3D() {
  const p = usePalette();
  return (
    <AnimFrame title="Time series as a block, with a rollup floor above" steps={steps} interval={5600}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: Palette }) {
  const cells: GridCell[] = [];
  for (let r = 0; r < step.rows; r++) {
    for (let t = step.rawFrom; t < N; t++) {
      const spike = step.spike && r === SPIKE.row && t === SPIKE.t;
      const inWindow = step.window && r === 0 && Math.floor(t / WIN) === 2;
      cells.push({ x: tx(t), y: 0, z: rz(r), h: value(r, t) * VALUE_SCALE, color: spike ? p.bad : inWindow ? p.accent : r === 0 && step.rows === 1 ? p.accent : p.muted });
    }
  }

  const windowLinks: [Vec3, Vec3][] = step.window
    ? Array.from({ length: WIN }, (_, k) => {
        const t = 2 * WIN + k;
        return [
          [tx(t), value(0, t) * VALUE_SCALE + 0.02, rz(0)],
          [tx(2 * WIN + WIN / 2 - 0.5), ROLL_Y + ROLL[0][2].min * VALUE_SCALE - 0.02, rz(0)],
        ];
      })
    : [];

  const legend = [
    { label: 'Raw sample', color: p.muted },
    ...(step.rollup ? [{ label: 'Rollup: min to max', color: p.warn }, { label: 'Rollup: average', color: p.ok }] : []),
    ...(step.spike ? [{ label: 'Spike', color: p.bad }] : []),
  ];

  return (
    <Stage3D
      label="A block of bars: time left to right, one row per series, height is the value. A rollup floor above holds one block per window, spanning min to max with a plate at the average."
      distance={step.distance}
      focus={step.focus}
      view={step.view}
      legend={legend}
      angle={[0.35, -0.25]}
      ground={-0.05}
      groundSize={14}
    >
      <CellField key={`${step.rows}-${step.rawFrom}`} cells={cells} size={[DX * 0.7, 1, 0.5]} opacity={0.9} />

      {/* Raw floor plate. */}
      <Cube pos={[0, -0.03, 0]} size={[N * DX + 0.4, 0.04, SERIES.length * 0.75 + 0.2]} color={p.fg} face={0.05} edge={0.35} edgeColor={p.fg} hint="Raw floor: every sample as it arrived." />
      {/* Rollup floor plate. */}
      <Cube
        pos={[0, ROLL_Y - 0.03, 0]}
        size={[N * DX + 0.4, 0.04, SERIES.length * 0.75 + 0.2]}
        color={p.warn}
        face={step.rollup ? 0.06 : 0}
        edge={step.rollup ? 0.45 : 0}
        edgeColor={p.warn}
        hint={`Rollup floor: one point per window of ${WIN} raw samples.`}
      />

      {SERIES.flatMap((_, r) =>
        ROLL[r].map((b, k) => {
          const on = step.rollup;
          const cx = tx(k * WIN + WIN / 2 - 0.5);
          const spikeBlock = step.spike && r === SPIKE.row && k === SPIKE_BLOCK;
          const lo = ROLL_Y + b.min * VALUE_SCALE;
          const hi = ROLL_Y + b.max * VALUE_SCALE;
          return [
            <Cube
              key={`b${r}-${k}`}
              pos={[cx, (lo + hi) / 2, rz(r)]}
              size={[WIN * DX * 0.82, hi - lo, 0.45]}
              color={spikeBlock ? p.bad : p.warn}
              face={on ? 0.35 : 0}
              edge={on ? 0.6 : 0}
              edgeColor={spikeBlock ? p.bad : p.warn}
              pop={spikeBlock}
              hint={`Rollup point for ${SERIES[r]}: count ${WIN}, min ${b.min.toFixed(2)}, max ${b.max.toFixed(2)}, average ${b.avg.toFixed(2)}.`}
            />,
            <Cube
              key={`a${r}-${k}`}
              pos={[cx, ROLL_Y + b.avg * VALUE_SCALE, rz(r)]}
              size={[WIN * DX * 0.95, 0.035, 0.55]}
              color={p.ok}
              face={on ? 0.95 : 0}
              edge={on ? 0.9 : 0}
              edgeColor={p.ok}
              hint={`Average ${b.avg.toFixed(2)}. On its own it hides spikes.`}
            />,
          ];
        }),
      )}

      <Links segments={windowLinks} color={p.accent} opacity={step.window ? 0.8 : 0} width={1.2} />

      <Tag position={[tx(0) - 0.6, 0.15, rz(0)]} text="host=web-17, endpoint=/pay" show={step.rows === 1} />
      {SERIES.map((s, r) => (
        <Tag key={s} position={[tx(N - 1) + 0.75, 0.1, rz(r)]} text={s} show={step.rows > 1 && step.distance > 10} />
      ))}
      <Tag position={[tx(N - 1) + 0.3, -0.35, rz(SERIES.length - 1) + 0.6]} text="time →" show={step.distance > 10} />
      <Tag position={[tx(0) - 0.9, ROLL_Y + 0.4, rz(0)]} text="rollup floor" color="var(--warn)" show={step.rollup && step.distance > 10} />
      <Tag position={[tx(N / 4), 0.2, rz(SERIES.length - 1) + 0.7]} text="raw deleted" color="var(--muted)" show={step.rawFrom > 0} />
      <Tag position={[tx(SPIKE.t) + 0.5, value(0, SPIKE.t) * VALUE_SCALE + 0.15, rz(0) - 0.4]} text="spike" color="var(--bad)" show={step.spike} />
      <Tag position={[tx(SPIKE.t) + 1.2, ROLL_Y + ROLL[0][SPIKE_BLOCK].avg * VALUE_SCALE, rz(0) - 0.4]} text="average hides it" color="var(--ok)" show={step.spike} />
      <Tag position={[tx(SPIKE.t) + 1.2, ROLL_Y + ROLL[0][SPIKE_BLOCK].max * VALUE_SCALE, rz(0) - 0.4]} text="max keeps it" color="var(--warn)" show={step.spike} />
    </Stage3D>
  );
}
