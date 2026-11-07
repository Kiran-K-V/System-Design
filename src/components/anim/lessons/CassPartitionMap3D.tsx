import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { Cube, type Vec3 } from '../three/blocks';
import { Dot, Links, Tag } from '../three/extras';
import { usePalette, type Palette } from '../three/theme';

/**
 * The table readings_by_sensor as towers on a ring of nodes. Each sensor_id is one partition: a tower on the node its
 * hash picks. Inside a tower, rows are stacked by read_at, newest on top (CLUSTERING ORDER BY read_at DESC).
 * Each row has two cells: read_at and value.
 */

const NODES = 6;
const RING = 3.4;
const nodePos = (n: number): Vec3 => {
  const a = (n / NODES) * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(a) * RING, 0, Math.sin(a) * RING];
};
const SENSORS = [
  { id: 'sensor 7f3a', node: 0 },
  { id: 'sensor 12c9', node: 2 },
  { id: 'sensor a04e', node: 3 },
  { id: 'sensor 5d81', node: 5 },
];
const X = 1; // the sensor the steps zoom in on
const ROWS = 9;
const ROW_H = 0.26;
const rowY = (k: number) => 0.3 + (ROWS - 1 - k) * ROW_H; // k = 0 is the newest row, on top
const LATEST = 4; // rows in the "latest" slice of the toy

/** Toy readings: fixed values, a few above 50. */
const READING = (s: number, k: number) => Math.round(30 + 28 * Math.abs(Math.sin(s * 2.1 + k * 0.9)));

interface Step {
  caption: string;
  towers: boolean;
  /** Shows the hash arrows from key to node. */
  hash: boolean;
  zoom: boolean;
  latest: boolean;
  scan: boolean;
  focus: Vec3;
  distance: number;
  view: [number, number];
}

const tower = nodePos(SENSORS[X].node);

const steps: Step[] = [
  {
    caption: 'A ring of six nodes and no coordinator. Every row of readings_by_sensor has a sensor_id. Cassandra hashes the sensor_id, and the hash picks the node that stores it. That is the partition key.',
    towers: false,
    hash: true,
    zoom: false,
    latest: false,
    scan: false,
    focus: [0, 0.6, 0],
    distance: 14,
    view: [0.75, -0.3],
  },
  {
    caption: 'All rows with one sensor_id form one partition, kept together on its node. Here each partition is a tower. Four sensors, four towers.',
    towers: true,
    hash: false,
    zoom: false,
    latest: false,
    scan: false,
    focus: [0, 1, 0],
    distance: 14,
    view: [0.5, -0.4],
  },
  {
    caption: 'Inside a partition, rows are sorted by the clustering column read_at. The table says CLUSTERING ORDER BY (read_at DESC), so the newest reading is on top. Each row holds its cells: read_at and value.',
    towers: true,
    hash: false,
    zoom: true,
    latest: false,
    scan: false,
    focus: [tower[0], 1.4, tower[2]],
    distance: 7.5,
    view: [0.3, -1.6],
  },
  {
    caption: '"Latest 100 readings for sensor X" names the partition key. Cassandra goes to one node, opens one partition, and reads a contiguous slice from the top. One place, in order, no searching.',
    towers: true,
    hash: false,
    zoom: true,
    latest: true,
    scan: false,
    focus: [tower[0], 1.6, tower[2]],
    distance: 7.5,
    view: [0.35, -1.75],
  },
  {
    caption: '"All readings above 50 across all sensors" names no partition key. The matches are scattered over every tower on every node. This table does not support that query. You model a second table for it, and copy the data.',
    towers: true,
    hash: false,
    zoom: false,
    latest: false,
    scan: true,
    focus: [0, 1, 0],
    distance: 14,
    view: [0.55, -0.6],
  },
];

export default function CassPartitionMap3D() {
  const p = usePalette();
  return (
    <AnimFrame title="Partitions on the ring, rows sorted inside" steps={steps} interval={5400}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: Palette }) {
  const ringLinks: [Vec3, Vec3][] = Array.from({ length: NODES }, (_, n) => [nodePos(n), nodePos((n + 1) % NODES)]);
  const keyAt: Vec3 = [0, 2.6, 0];
  const hashLinks: [Vec3, Vec3][] = step.hash ? SENSORS.map((s) => [keyAt, [nodePos(s.node)[0], 0.3, nodePos(s.node)[2]]]) : [];

  const legend = [
    { label: 'Node', color: p.fg },
    { label: 'Partition (one sensor_id)', color: p.muted },
    ...(step.zoom ? [{ label: 'read_at cell', color: p.muted }, { label: 'value cell', color: p.ok }] : []),
    ...(step.latest ? [{ label: 'Latest slice', color: p.accent }] : []),
    ...(step.scan ? [{ label: 'Value above 50: everywhere', color: p.bad }] : []),
  ];

  return (
    <Stage3D
      label="Six nodes on a ring. Four partitions stand as towers on the nodes their keys hash to. Inside a tower, rows are stacked newest first, each with a read_at cell and a value cell."
      distance={step.distance}
      focus={step.focus}
      view={step.view}
      legend={legend}
      angle={[0.75, -0.3]}
      ground={-0.15}
      groundSize={12}
    >
      <Links segments={ringLinks} color={p.fg} opacity={0.4} width={1.4} sketch />
      {Array.from({ length: NODES }, (_, n) => (
        <Cube key={n} pos={nodePos(n)} size={[1.3, 0.2, 1.3]} color={p.fg} face={0.12} edge={0.7} edgeColor={p.fg} hint={`Node ${n + 1}. Owns one range of hash values on the ring.`} />
      ))}

      <Links segments={hashLinks} color={p.warn} opacity={step.hash ? 0.85 : 0} width={1.8} />
      <Dot pos={keyAt} color={p.warn} r={0.14} opacity={step.hash ? 1 : 0} hint="hash(sensor_id) picks the node." />
      <Tag position={[keyAt[0], keyAt[1] + 0.45, 0]} text="hash(sensor_id)" color="var(--warn)" show={step.hash} />

      {SENSORS.map((s, si) => {
        const [x, , z] = nodePos(s.node);
        const focused = si === X && step.zoom;
        return (
          <group key={s.id}>
            {Array.from({ length: ROWS }, (_, k) => {
              const v = READING(si, k);
              const inSlice = step.latest && si === X && k < LATEST;
              const hit = step.scan && v > 50;
              const show = step.towers;
              const dim = step.zoom && si !== X ? 0.15 : 1;
              return (
                <group key={k}>
                  <Cube
                    pos={[x - 0.24, rowY(k), z]}
                    size={[0.44, ROW_H * 0.82, 0.6]}
                    color={inSlice ? p.accent : p.muted}
                    face={show ? 0.5 * dim : 0}
                    edge={show ? 0.6 * dim : 0}
                    edgeColor={inSlice ? p.accent : p.fg}
                    hint={`${s.id}, row ${k + 1} from the top. read_at = ${k === 0 ? 'newest' : `${k * 10} s earlier`}.`}
                  />
                  <Cube
                    pos={[x + 0.24, rowY(k), z]}
                    size={[0.44, ROW_H * 0.82, 0.6]}
                    color={hit ? p.bad : inSlice ? p.accent : p.ok}
                    face={show ? (hit ? 0.85 : 0.5) * dim : 0}
                    edge={show ? 0.6 * dim : 0}
                    edgeColor={hit ? p.bad : inSlice ? p.accent : p.fg}
                    hint={`${s.id}: value = ${v}.`}
                  />
                </group>
              );
            })}
            <Tag position={[x, rowY(0) + 0.45, z]} text={s.id} show={step.towers && (!step.zoom || focused)} color={focused ? 'var(--accent)' : undefined} />
          </group>
        );
      })}

      <Tag position={[tower[0] - 0.85, rowY(0), tower[2]]} text="newest" show={step.zoom} />
      <Tag position={[tower[0] - 0.85, rowY(ROWS - 1), tower[2]]} text="oldest" show={step.zoom} />
      <Tag position={[tower[0] - 0.24, rowY(ROWS - 1) - 0.32, tower[2] + 0.4]} text="read_at" show={step.zoom} />
      <Tag position={[tower[0] + 0.3, rowY(ROWS - 1) - 0.32, tower[2] + 0.4]} text="value" color="var(--ok)" show={step.zoom} />
      <Tag position={[tower[0] + 1.25, rowY(LATEST / 2 - 0.5), tower[2]]} text="one contiguous slice" color="var(--accent)" show={step.latest} />
      <Tag position={[0, 3.3, 0]} text="no partition key: not supported" color="var(--bad)" show={step.scan} />
    </Stage3D>
  );
}
