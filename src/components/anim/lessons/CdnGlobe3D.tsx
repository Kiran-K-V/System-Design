import { useMemo } from 'react';
import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { Arc, Dot, Globe, Tag, globeArc, latLon } from '../three/extras';
import { usePalette } from '../three/theme';

interface Glide {
  progress: number;
  opacity: number;
}

interface Step {
  caption: string;
  /** Edge dots are shown when true. */
  edges: boolean;
  /** Arcs from each user to the origin server. */
  toOrigin: Glide;
  /** Arcs from each user to its nearby edge server. */
  toEdge: Glide;
  /** Arc from the Lagos edge to the origin: the one-time fetch. */
  fill: Glide;
}

const steps: Step[] = [
  {
    caption:
      'All your servers are in New York. A user in London, Lagos, Sao Paulo or Mexico City sends every request across the world and back. Light in a cable needs time to cover that distance, so far users wait the longest.',
    edges: false,
    toOrigin: { progress: 1, opacity: 1 },
    toEdge: { progress: 0, opacity: 1 },
    fill: { progress: 0, opacity: 1 },
  },
  {
    caption:
      'A CDN (content delivery network) rents edge servers in many cities. An edge server is a small server near users that keeps copies of your files.',
    edges: true,
    toOrigin: { progress: 1, opacity: 0.35 },
    toEdge: { progress: 0, opacity: 1 },
    fill: { progress: 0, opacity: 1 },
  },
  {
    caption:
      'Each user is now sent to the nearest edge. The trip is short, so the page starts loading much sooner.',
    edges: true,
    toOrigin: { progress: 0, opacity: 1 },
    toEdge: { progress: 1, opacity: 1 },
    fill: { progress: 0, opacity: 1 },
  },
  {
    caption:
      'The first time an edge is asked for a file, it does not have it yet. It fetches the file from New York once. Every later request in that area is served from the edge.',
    edges: true,
    toOrigin: { progress: 0, opacity: 1 },
    toEdge: { progress: 1, opacity: 1 },
    fill: { progress: 1, opacity: 1 },
  },
];

const R = 2.2;
const SURFACE = R * 1.01;
const LABEL_HEIGHT = R * 1.15;
const ORIGIN = { lat: 40.7, lon: -74.0 };
const USERS = [
  { name: 'London', lat: 51.5, lon: -0.1 },
  { name: 'Lagos', lat: 6.5, lon: 3.4 },
  { name: 'Mexico City', lat: 19.4, lon: -99.1 },
  { name: 'Sao Paulo', lat: -23.5, lon: -46.6 },
];
const EDGE_OFFSET = { lat: 5, lon: 6 };

export default function CdnGlobe3D() {
  const p = usePalette();
  return (
    <AnimFrame title="A CDN on a globe: from one far origin to nearby edges" steps={steps} interval={5000}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: ReturnType<typeof usePalette> }) {
  const geo = useMemo(() => {
    const origin = latLon(ORIGIN.lat, ORIGIN.lon, SURFACE);
    const edges = USERS.map((u) => latLon(u.lat + EDGE_OFFSET.lat, u.lon + EDGE_OFFSET.lon, SURFACE));
    const users = USERS.map((u, i) => {
      const user = latLon(u.lat, u.lon, SURFACE);
      return {
        name: u.name,
        user,
        edge: edges[i],
        toOrigin: globeArc(user, origin, SURFACE, 0.25),
        toEdge: globeArc(user, edges[i], SURFACE, 1.2),
      };
    });
    const sydneyEdge = edges[USERS.findIndex((u) => u.name === 'Lagos')];
    return { origin, users, fill: globeArc(sydneyEdge, origin, SURFACE, 0.25) };
  }, []);

  const legend = [
    { label: 'User', color: p.accent },
    { label: 'Origin server', color: p.warn },
    ...(step.edges ? [{ label: 'Edge server', color: p.ok }] : []),
    ...(step.fill.progress > 0 ? [{ label: 'Edge fetches from origin once', color: p.warn }] : []),
  ];

  return (
    <Stage3D
      label="A globe with users in four cities, an origin server in New York, and edge servers near each user."
      distance={9}
      legend={legend}
      angle={[0.44, -1.05]}
    >
      <Globe r={R} line={p.fg} fill={p.bg} />
      <Dot pos={geo.origin} color={p.warn} r={0.1} hint="Origin server in New York. It holds the master copy of every file." />
      <Tag position={latLon(ORIGIN.lat, ORIGIN.lon, LABEL_HEIGHT)} text="New York (origin)" hideBehind />
      {USERS.map((u, i) => {
        const g = geo.users[i];
        return (
          <group key={u.name}>
            <Dot pos={g.user} color={p.accent} r={0.07} hint={`A user in ${u.name}.`} />
            <Tag position={latLon(u.lat, u.lon, LABEL_HEIGHT)} text={u.name} hideBehind />
            <Dot pos={g.edge} color={p.ok} r={0.08} opacity={step.edges ? 1 : 0} hint={`Edge server near ${u.name}. Keeps copies of popular files.`} pop={step.fill.progress > 0 && u.name === 'Lagos'} />
            <Arc points={g.toOrigin} color={p.accent} progress={step.toOrigin.progress} opacity={step.toOrigin.opacity} width={0.025} />
            <Arc points={g.toEdge} color={p.ok} progress={step.toEdge.progress} opacity={step.toEdge.opacity} width={0.025} />
          </group>
        );
      })}
      <Arc points={geo.fill} color={p.warn} progress={step.fill.progress} opacity={step.fill.opacity} width={0.025} />
    </Stage3D>
  );
}
