import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { Cube, type CubeTarget } from '../three/blocks';
import { Tag } from '../three/extras';
import { usePalette, type Palette } from '../three/theme';

type Row = 'A' | 'B' | 'C';
type VersionKey = 'a1' | 'b2' | 'c3' | 'a4' | 'b5';
type ColorKey = 'muted' | 'accent' | 'ok' | 'bad';
/** A version is hidden, or drawn in one of these colors. */
type Tone = ColorKey | 'hidden';

interface Step {
  caption: string;
  legend: { label: string; color?: ColorKey }[];
  /** Tone per version. A version not listed here is hidden. */
  tones: Partial<Record<VersionKey, Tone>>;
  /** Is the T1 snapshot sheet shown? */
  t1: boolean;
  /** Is the T2 snapshot sheet shown? */
  t2: boolean;
}

const steps: Step[] = [
  {
    caption:
      'Each row keeps a pile of versions. A writer never changes a version. It adds a new one on top, stamped with the time it was saved.',
    legend: [{ label: 'One version of a row', color: 'muted' }],
    tones: { a1: 'muted', b2: 'muted', c3: 'muted' },
    t1: false,
    t2: false,
  },
  {
    caption:
      'Transaction T1 starts at time 3.5. Think of a flat sheet placed at that moment. T1 reads only the newest version under its sheet in each row.',
    legend: [{ label: 'Read by T1', color: 'accent' }],
    tones: { a1: 'accent', b2: 'accent', c3: 'accent' },
    t1: true,
    t2: false,
  },
  {
    caption:
      'While T1 runs, other transactions save new versions of rows A and B. They land above the sheet, so T1 does not see them. T1 keeps reading the same values, and nobody waited for a lock.',
    legend: [{ label: 'Read by T1', color: 'accent' }],
    tones: { a1: 'accent', b2: 'accent', c3: 'accent', a4: 'muted', b5: 'muted' },
    t1: true,
    t2: false,
  },
  {
    caption:
      'Transaction T2 starts later, at time 5.5. Its sheet sits higher, so it sees the new versions of A and B. Both see the same version of row C, because nobody changed it.',
    legend: [
      { label: 'Read by T1', color: 'accent' },
      { label: 'Read by T2 (row C: read by both)', color: 'ok' },
    ],
    tones: { a1: 'accent', b2: 'accent', a4: 'ok', b5: 'ok', c3: 'ok' },
    t1: true,
    t2: true,
  },
  {
    caption:
      'T1 finishes. Now no sheet sits low enough to need the old versions of A and B. Nobody can read them anymore. A cleanup job removes them. In PostgreSQL that job is called VACUUM.',
    legend: [
      { label: 'Read by T2', color: 'ok' },
      { label: 'Old, unreadable version', color: 'bad' },
    ],
    tones: { a1: 'bad', b2: 'bad', a4: 'ok', b5: 'ok', c3: 'ok' },
    t1: false,
    t2: true,
  },
  {
    caption: 'After the cleanup, each row keeps only the versions that some transaction can still read.',
    legend: [{ label: 'Read by T2', color: 'ok' }],
    tones: { a4: 'ok', b5: 'ok', c3: 'ok' },
    t1: false,
    t2: true,
  },
];

const ROWS: Row[] = ['A', 'B', 'C'];
const ROW_X: Record<Row, number> = { A: -2.6, B: 0, C: 2.6 };
const VERSIONS: { key: VersionKey; row: Row; time: number }[] = [
  { key: 'a1', row: 'A', time: 1 },
  { key: 'b2', row: 'B', time: 2 },
  { key: 'c3', row: 'C', time: 3 },
  { key: 'a4', row: 'A', time: 4 },
  { key: 'b5', row: 'B', time: 5 },
];
const T1_TIME = 3.5;
const T2_TIME = 5.5;

const yOf = (time: number) => -2 + time * 0.7;

function look(tone: Tone, p: Palette): { color: string; face: number; edge: number } {
  if (tone === 'hidden') return { color: p.muted, face: 0, edge: 0 };
  if (tone === 'muted') return { color: p.muted, face: 0.5, edge: 0.6 };
  if (tone === 'bad') return { color: p.bad, face: 0.25, edge: 0.5 };
  return { color: p[tone], face: 0.85, edge: 0.6 };
}

function sheet(time: number, color: string, on: boolean): CubeTarget {
  return { pos: [0, yOf(time), 0], size: [8.2, 0.03, 2.6], color, face: on ? 0.16 : 0, edge: on ? 0.6 : 0, edgeColor: color };
}

export default function TxVersionStack3D() {
  const p = usePalette();
  return (
    <AnimFrame title="MVCC in 3D: piles of versions and snapshot sheets" steps={steps} interval={4800}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: Palette }) {
  const legend = step.legend.map((l) => ({ label: l.label, color: l.color ? p[l.color] : undefined }));

  const cubes = VERSIONS.map((v) => {
    const tone = step.tones[v.key] ?? 'hidden';
    const l = look(tone, p);
    const t: CubeTarget = {
      pos: [ROW_X[v.row], yOf(v.time), 0],
      size: [1.6, 0.5, 1.6],
      color: l.color,
      face: l.face,
      edge: l.edge,
      edgeColor: p.fg,
    };
    return <Cube key={v.key} {...t} />;
  });

  const versionTags = VERSIONS.map((v) => {
    const tone = step.tones[v.key] ?? 'hidden';
    return (
      <Tag
        key={`${v.key}-tag`}
        position={[ROW_X[v.row] + 1.25, yOf(v.time), 0]}
        text={tone === 'bad' ? 'nobody can read this' : `time ${v.time}`}
        show={tone !== 'hidden'}
      />
    );
  });

  return (
    <Stage3D label="Three rows, each a stack of versions over time, with flat sheets marking what each transaction can read." distance={13} legend={legend} angle={[0.35, -0.5]}>
      {cubes}
      {versionTags}
      <Cube key="t1-sheet" {...sheet(T1_TIME, p.accent, step.t1)} />
      <Cube key="t2-sheet" {...sheet(T2_TIME, p.ok, step.t2)} />
      <Tag key="t1-name" position={[-4.7, yOf(T1_TIME), 0]} text="T1 snapshot" show={step.t1} />
      <Tag key="t2-name" position={[-4.7, yOf(T2_TIME), 0]} text="T2 snapshot" show={step.t2} />
      {ROWS.map((r) => (
        <Tag key={`row-${r}`} position={[ROW_X[r], -2.6, 0]} text={`row ${r}`} />
      ))}
    </Stage3D>
  );
}
