import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { Cube, type CubeTarget, type Vec3 } from '../three/blocks';
import { Tag } from '../three/extras';
import { usePalette } from '../three/theme';

/** Four partitions as lanes of records, with two consumer groups as layers above (illustrative). */
interface Step {
  caption: string;
  /** 1 records only, 2 + billing group, 3 + analytics group, 4 + new records and lag. */
  level: 1 | 2 | 3 | 4;
}

const steps: Step[] = [
  {
    caption:
      'A topic is split into partitions. Each partition is an ordered list of records, oldest on the left. Here are 4 partitions, P0 to P3.',
    level: 1,
  },
  {
    caption:
      'A consumer group reads the topic. Each partition goes to one consumer in the group: C1 reads P0 and P1, C2 reads P2 and P3. Each bar is the bookmark of the group (its committed offset) in that partition.',
    level: 2,
  },
  {
    caption:
      'A second group, analytics, reads the same records with its own bookmarks. Reading does not remove records, so the two groups never get in the way of each other.',
    level: 3,
  },
  {
    caption:
      'New records arrive at the right end. Each group moves at its own speed. The gap between the newest record and a bookmark is the lag of that group.',
    level: 4,
  },
];

const DISTANCE = 14;
const ANGLE: [number, number] = [0.5, -0.45];
const PARTS = [
  { name: 'P0', z: 1.8 },
  { name: 'P1', z: 0.6 },
  { name: 'P2', z: -0.6 },
  { name: 'P3', z: -1.8 },
];
const BILLING_Y = 1.6;
const ANALYTICS_Y = 3.0;
const RECORDS = 11; // offsets 0 to 10; 8 to 10 appear in step 4
const X = (i: number) => -3 + i * 0.5;
// Bookmark offsets per partition P0..P3.
const BILLING_EARLY = [6, 5, 7, 4];
const BILLING_LATE = [9, 10, 9, 8];
const ANALYTICS_EARLY = [2, 3, 1, 2];
const ANALYTICS_LATE = [3, 4, 2, 3];

export default function PubsubGroupLayers3D() {
  const p = usePalette();
  return (
    <AnimFrame title="Consumer groups as layers over the same partitions" steps={steps} interval={5000}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

type Palette = ReturnType<typeof usePalette>;

/** A box target. When `on` is false, face and edge fade to 0 so the box glides out of view. */
function box(pos: Vec3, size: Vec3, color: string, on: boolean, face: number, edge: number, edgeColor: string): CubeTarget {
  return { pos, size, color, face: on ? face : 0, edge: on ? edge : 0, edgeColor };
}

function Scene({ step, p }: { step: Step; p: Palette }) {
  const lvl = step.level;
  const showBilling = lvl >= 2;
  const showAnalytics = lvl >= 3;
  const showNew = lvl >= 4;
  const billingAt = lvl >= 4 ? BILLING_LATE : BILLING_EARLY;
  const analyticsAt = lvl >= 4 ? ANALYTICS_LATE : ANALYTICS_EARLY;

  const cubes: { key: string; t: CubeTarget }[] = [];
  const tags: { key: string; position: Vec3; text: string; show: boolean }[] = [];

  PARTS.forEach((part) => {
    for (let i = 0; i < RECORDS; i++) {
      cubes.push({
        key: `r-${part.name}-${i}`,
        t: box([X(i), 0, part.z], [0.38, 0.25, 0.7], p.muted, i < 8 || showNew, 0.6, 0.5, p.fg),
      });
    }
    tags.push({ key: `lane-${part.name}`, position: [-3.7, 0, part.z], text: part.name, show: true });
  });

  cubes.push({
    key: 'sheet-billing',
    t: box([-0.2, BILLING_Y, 0], [6.6, 0.03, 4.6], p.accent, showBilling, 0.1, 0.5, p.accent),
  });
  cubes.push({
    key: 'sheet-analytics',
    t: box([-0.2, ANALYTICS_Y, 0], [6.6, 0.03, 4.6], p.ok, showAnalytics, 0.1, 0.5, p.ok),
  });

  PARTS.forEach((part, pi) => {
    cubes.push({
      key: `bk-billing-${part.name}`,
      t: box(
        [X(billingAt[pi]), (BILLING_Y + 0.15) / 2, part.z],
        [0.08, BILLING_Y - 0.15, 0.08],
        p.accent,
        showBilling,
        0.9,
        0.9,
        p.accent,
      ),
    });
    cubes.push({
      key: `bk-analytics-${part.name}`,
      t: box(
        [X(analyticsAt[pi]), (ANALYTICS_Y + 0.15) / 2, part.z],
        [0.08, ANALYTICS_Y - 0.15, 0.08],
        p.ok,
        showAnalytics,
        0.9,
        0.9,
        p.ok,
      ),
    });
  });

  tags.push({ key: 'tag-billing', position: [-4.3, BILLING_Y, 0], text: 'billing group', show: showBilling });
  tags.push({ key: 'tag-analytics', position: [-4.3, ANALYTICS_Y, 0], text: 'analytics group', show: showAnalytics });
  tags.push({ key: 'tag-c1', position: [3.6, BILLING_Y, 1.2], text: 'C1 reads P0, P1', show: showBilling });
  tags.push({ key: 'tag-c2', position: [3.6, BILLING_Y, -1.2], text: 'C2 reads P2, P3', show: showBilling });
  tags.push({ key: 'tag-lag', position: [X(6.5), 0.55, 1.8], text: 'lag', show: showNew });

  const legend = [
    { label: 'Record', color: p.muted },
    ...(lvl >= 2 ? [{ label: 'Billing group bookmarks', color: p.accent }] : []),
    ...(lvl >= 3 ? [{ label: 'Analytics group bookmarks', color: p.ok }] : []),
  ];

  return (
    <Stage3D
      label="Four partitions drawn as lanes of records, with two consumer groups as layers above, each with its own bookmark bars."
      distance={DISTANCE}
      legend={legend}
      angle={ANGLE}
    >
      {cubes.map((c) => (
        <Cube key={c.key} {...c.t} />
      ))}
      {tags.map((t) => (
        <Tag key={t.key} position={t.position} text={t.text} show={t.show} />
      ))}
    </Stage3D>
  );
}
