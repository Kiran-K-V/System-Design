import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { Cube, type CubeTarget, type Vec3 } from '../three/blocks';
import { Tag } from '../three/extras';
import { usePalette } from '../three/theme';

/** An LSM tree drawn as a building: a small memory floor on top, bigger disk floors below. */
interface Step {
  caption: string;
  /** How many memtable keys are shown, counted from k1. */
  keys: number;
  /** How many fresh files sit on floor 0, counted from f0a. */
  fresh: number;
  /** True when the floor 0 files glide down into floor 1 and vanish. */
  merging: boolean;
  /** True when floor 1 holds the bigger merged file. */
  bigF1: boolean;
}

const steps: Step[] = [
  {
    caption:
      'New writes go into a small sorted table in memory. Engineers call it the memtable. Adding to it is fast, because nothing on disk moves.',
    keys: 3,
    fresh: 0,
    merging: false,
    bigF1: false,
  },
  {
    caption:
      'When the memtable is full, it is written to disk as one sorted file that is never edited again. It lands on floor 0.',
    keys: 0,
    fresh: 1,
    merging: false,
    bigF1: false,
  },
  {
    caption:
      'This repeats, and files pile up on floor 0. To find a key, a read checks memory first, then each file from newest to oldest. More files means more places to look.',
    keys: 2,
    fresh: 3,
    merging: false,
    bigF1: false,
  },
  {
    caption:
      'Too many files. A background job merges them into floor 1 as one bigger sorted file. If a key was written twice, only the newest copy is kept. This merge is called compaction.',
    keys: 2,
    fresh: 3,
    merging: true,
    bigF1: true,
  },
  {
    caption:
      'Each floor is about 10 times bigger than the one above it. Old data sinks down floor by floor. Writes stay fast because they only add. The price is reads that may check several floors, and disk work spent merging.',
    keys: 3,
    fresh: 3,
    merging: true,
    bigF1: true,
  },
];

const EDGE = 0.6;
const FLOOR0_X = [-1.5, 0, 1.5];
const MERGE_POS: Vec3 = [0, -0.38, 0];

const TAGS: { text: string; pos: Vec3 }[] = [
  { text: 'memory (RAM)', pos: [-2.2, 2.6, 0] },
  { text: 'disk floor 0', pos: [-3.3, 1.0, 0] },
  { text: 'disk floor 1', pos: [-4.0, -0.6, 0] },
  { text: 'disk floor 2', pos: [-4.8, -2.2, 0] },
];

export default function StorageLsmFloors3D() {
  const p = usePalette();
  return (
    <AnimFrame title="An LSM tree as floors of a building" steps={steps} interval={4800}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: ReturnType<typeof usePalette> }) {
  const cubes: { key: string; t: CubeTarget }[] = [];

  // A hidden box keeps its place and fades out: face 0 and edge 0.
  const fade = (on: boolean, face: number): [number, number] => (on ? [face, EDGE] : [0, 0]);
  const add = (key: string, pos: Vec3, size: Vec3, color: string, [face, edge]: [number, number], hint?: string) =>
    cubes.push({ key, t: { pos, size, color, face, edge, edgeColor: p.fg, hint } });

  // Floor plates, always shown.
  add('plate-ram', [0, 2.6, 0], [2.4, 0.06, 1.4], p.fg, [0.08, 0.45]);
  add('plate-0', [0, 1.0, 0], [4.6, 0.06, 1.6], p.fg, [0.08, 0.45]);
  add('plate-1', [0, -0.6, 0], [6.0, 0.06, 2.0], p.fg, [0.08, 0.45]);
  add('plate-2', [0, -2.2, 0], [7.6, 0.06, 2.4], p.fg, [0.08, 0.45]);

  // Memtable keys in memory.
  for (let i = 0; i < 4; i++) {
    add(`k${i + 1}`, [-0.75 + i * 0.5, 2.85, 0], [0.4, 0.4, 0.4], p.accent, fade(i < step.keys, 0.85), 'A key in the memtable, kept sorted in RAM.');
  }

  // Fresh files on floor 0. When merging, they glide down to floor 1 and vanish.
  ['f0a', 'f0b', 'f0c'].forEach((key, i) => {
    const home: Vec3 = [FLOOR0_X[i], 1.2, 0];
    const on = !step.merging && i < step.fresh;
    add(key, step.merging ? MERGE_POS : home, [1.1, 0.35, 1.0], p.ok, fade(on, 0.6), 'A sorted file flushed from memory. Never edited again.');
  });

  // Merged file on floor 1.
  const f1Size: Vec3 = step.bigF1 ? [5.2, 0.4, 1.4] : [4.2, 0.4, 1.3];
  add('f1', MERGE_POS, f1Size, p.warn, fade(true, 0.6), 'Floor 1: files merged by compaction. Only the newest copy of each key is kept.');

  // Older data on floor 2.
  add('f2', [0, -1.95, 0], [6.6, 0.45, 1.8], p.muted, fade(true, 0.45), 'Floor 2: older data, about 10 times bigger than floor 1.');

  const legend = [
    { label: 'New writes in memory', color: p.accent },
    { label: 'Fresh files on floor 0', color: p.ok },
    { label: 'Merged file on floor 1', color: p.warn },
    { label: 'Older data on floor 2', color: p.muted },
  ];

  return (
    <Stage3D
      label="An LSM tree drawn as floors: a small memory floor on top and bigger disk floors below, with files moving down as they merge."
      distance={14}
      legend={legend}
      angle={[0.35, -0.55]}
      ground={-2.5}
      groundSize={16}
      focus={[0, step.merging ? -0.2 : step.fresh ? 1.2 : 1.8, 0]}
    >
      {cubes.map((c) => (
        <Cube key={c.key} {...c.t} />
      ))}
      {TAGS.map((t) => (
        <Tag key={t.text} position={t.pos} text={t.text} />
      ))}
    </Stage3D>
  );
}
