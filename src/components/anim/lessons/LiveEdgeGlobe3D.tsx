import { useMemo } from 'react';
import * as THREE from 'three';
import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { Cube, type Vec3 } from '../three/blocks';
import { Arc, Dot, Globe, Tag, globeArc, latLon } from '../three/extras';
import { usePalette, type Palette } from '../three/theme';

/**
 * A live stream on a globe over India. The origin keeps a moving window of short segments. When a new segment is
 * cut, every edge misses it in the same second. Request coalescing lets one miss per edge reach the origin.
 */

const ORIGIN = { name: 'Origin', lat: 19.1, lon: 72.9 };
/** `lab` moves each city label off its dot so neighbors do not collide: [degrees north, degrees east]. */
const EDGES = [
  { name: 'Delhi', lat: 28.6, lon: 77.2, lab: [2.4, 0] },
  { name: 'Kolkata', lat: 22.6, lon: 88.4, lab: [2.2, 2.5] },
  { name: 'Bengaluru', lat: 12.97, lon: 77.6, lab: [-2.6, -3.2] },
  { name: 'Chennai', lat: 13.1, lon: 80.3, lab: [-2.4, 3.4] },
  { name: 'Hyderabad', lat: 17.4, lon: 78.5, lab: [1.8, 3.6] },
];
const VIEWERS_PER_EDGE = 6;
const WINDOW = 5;

const R = 2.2;
const SURF = R * 1.01;
const LABEL = R * 1.02;

/** Viewers sit in a small ring around their edge city. */
const viewerAt = (e: number, k: number) => {
  const a = (k / VIEWERS_PER_EDGE) * Math.PI * 2 + e;
  return latLon(EDGES[e].lat + Math.sin(a) * 2.2, EDGES[e].lon + Math.cos(a) * 2.2, SURF);
};
const LATE = { lat: 25.6, lon: 85.1 }; // Patna, served by the Kolkata edge
const LATE_EDGE = 1;

type Phase = 'window' | 'miss' | 'coalesce' | 'serve' | 'late';
interface Step {
  caption: string;
  phase: Phase;
  /** Number of the newest segment in the window. */
  newest: number;
}

const steps: Step[] = [
  {
    caption: 'The origin keeps a moving window: the last few segments of the match, each a few seconds long. The packager cuts a new segment, adds it to the end, and drops the oldest from the front.',
    phase: 'window',
    newest: 45,
  },
  {
    caption: 'Segment 46 is cut. Every viewer wants it in the same second, and no edge has it yet. Every request at every edge is a miss. Without care, all of them would go to the origin at once.',
    phase: 'miss',
    newest: 46,
  },
  {
    caption: 'Request coalescing. At each edge, the first miss goes to the origin. All the other requests at that edge wait for that one answer. The origin sees 5 requests, one per edge, not one per viewer.',
    phase: 'coalesce',
    newest: 46,
  },
  {
    caption: 'The answer reaches each edge, and every waiting viewer is served from it as a hit. The manifest, the list of current segments, changes every few seconds, so edges cache it for only about that long.',
    phase: 'serve',
    newest: 46,
  },
  {
    caption: 'A late viewer in Patna opens the app mid-over. They start at the live edge of the window, the newest segment. They do not download the match from the start.',
    phase: 'late',
    newest: 46,
  },
];

export default function LiveEdgeGlobe3D() {
  const p = usePalette();
  return (
    <AnimFrame title="One live segment, every edge, the same second" steps={steps} interval={5600}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: Palette }) {
  const geo = useMemo(() => {
    const origin = latLon(ORIGIN.lat, ORIGIN.lon, SURF);
    const edges = EDGES.map((e) => latLon(e.lat, e.lon, SURF));
    // The window floats above the origin as a row of blocks, laid along the local east direction.
    const n = new THREE.Vector3(...origin).normalize();
    const east = n.clone().cross(new THREE.Vector3(0, 1, 0)).normalize().negate();
    const north = east.clone().cross(n).normalize().negate();
    // Float well above the surface and a little north-west, so the window never covers the edge cities.
    const base = n.clone().multiplyScalar(R * 1.16).add(north.clone().multiplyScalar(0.05)).add(east.clone().multiplyScalar(-0.62));
    const slot = (i: number): Vec3 => {
      const v = base.clone().add(north.clone().multiplyScalar((i - (WINDOW - 1) / 2) * 0.13));
      return [v.x, v.y, v.z];
    };
    return {
      origin,
      edges,
      slot,
      up: edges.map((e) => globeArc(e, origin, SURF, 0.5)),
      down: edges.map((e) => globeArc(origin, e, SURF, 0.5)),
      viewers: EDGES.map((_, e) => Array.from({ length: VIEWERS_PER_EDGE }, (_, k) => viewerAt(e, k))),
      viewerArcs: EDGES.map((_, e) => Array.from({ length: VIEWERS_PER_EDGE }, (_, k) => globeArc(viewerAt(e, k), edges[e], SURF, 2.5))),
      late: latLon(LATE.lat, LATE.lon, SURF),
      lateArc: globeArc(latLon(LATE.lat, LATE.lon, SURF), edges[LATE_EDGE], SURF, 2.5),
    };
  }, []);

  const ph = step.phase;
  const missing = ph === 'miss' || ph === 'coalesce';
  // Segments shown in the window: newest - WINDOW + 1 .. newest. The block of the new segment slides in on the right.
  const segs = Array.from({ length: WINDOW + 2 }, (_, i) => step.newest - WINDOW - 1 + i + 1);

  const legend = [
    { label: 'Origin and its window', color: p.warn },
    { label: 'Edge server', color: p.fg },
    { label: 'Viewer', color: p.muted },
    ...(missing ? [{ label: 'Miss', color: p.bad }] : []),
    ...(ph === 'coalesce' ? [{ label: 'One request per edge', color: p.accent }] : []),
    ...(ph === 'serve' || ph === 'late' ? [{ label: 'Hit, served by the edge', color: p.ok }] : []),
  ];

  return (
    <Stage3D
      label="A globe over India. The origin in Mumbai holds a window of live segments. Five edge cities each serve a ring of viewers. Arcs show misses, one coalesced request per edge, and hits."
      distance={3.4}
      focus={latLon(20.5, 80, R)}
      view={[0.36, -2.97]}
      legend={legend}
      angle={[0.36, -2.97]}
    >
      <Globe r={R} line={p.fg} fill={p.bg} />

      {/* The moving window above the origin. */}
      {segs.map((n) => {
        const idx = n - (step.newest - WINDOW + 1);
        const inWindow = idx >= 0 && idx < WINDOW;
        const pos = geo.slot(Math.max(-1, Math.min(WINDOW, idx)));
        const fresh = n === step.newest && ph !== 'window';
        return (
          <Cube
            key={n}
            pos={pos}
            size={[0.1, 0.1, 0.1]}
            color={fresh ? p.accent : p.warn}
            face={inWindow ? 0.75 : 0}
            edge={inWindow ? 0.8 : 0}
            edgeColor={fresh ? p.accent : p.warn}
            pop={fresh && ph === 'late'}
            hint={`Segment ${n}, a few seconds of the match.${n === step.newest ? ' The live edge.' : ''}`}
          />
        );
      })}
      <Tag position={geo.slot(-1.4)} text="oldest" show={ph === 'window'} />
      <Tag position={geo.slot(WINDOW + 0.6)} text={ph === 'window' ? 'newest' : 'live edge'} color={ph === 'window' ? undefined : 'var(--accent)'} />

      <Dot pos={geo.origin} color={p.warn} r={0.05} pop={ph === 'coalesce'} hint="The origin: the packager writes each new segment here." />
      <Tag position={latLon(ORIGIN.lat - 2.2, ORIGIN.lon - 3.5, LABEL)} text="origin (Mumbai)" color="var(--warn)" hideBehind />

      {EDGES.map((e, i) => (
        <group key={e.name}>
          <Dot pos={geo.edges[i]} color={missing ? p.bad : ph === 'serve' || ph === 'late' ? p.ok : p.fg} r={0.038} pop={ph === 'miss'} hint={`Edge server in ${e.name}. Serves the viewers around it.`} />
          <Tag position={latLon(e.lat + e.lab[0], e.lon + e.lab[1], LABEL)} text={e.name} hideBehind />
          <Arc points={geo.up[i]} color={p.accent} progress={ph === 'coalesce' ? 1 : 0} opacity={ph === 'coalesce' ? 1 : 0} width={0.009} />
          <Arc points={geo.down[i]} color={p.ok} progress={ph === 'serve' ? 1 : 0} opacity={ph === 'serve' ? 0.8 : 0} width={0.009} />
          {geo.viewers[i].map((v, k) => (
            <group key={k}>
              <Dot pos={v} color={missing ? p.bad : ph === 'serve' || ph === 'late' ? p.ok : p.muted} r={0.016} opacity={ph === 'coalesce' ? 0.45 : 1} />
              <Arc points={geo.viewerArcs[i][k]} color={ph === 'miss' ? p.bad : p.ok} progress={ph === 'miss' || ph === 'serve' ? 1 : 0} opacity={ph === 'miss' || ph === 'serve' ? 0.7 : 0} width={0.0045} />
            </group>
          ))}
        </group>
      ))}

      <Dot pos={geo.late} color={p.accent} r={0.026} opacity={ph === 'late' ? 1 : 0} pop={ph === 'late'} hint="A viewer who joins late. Gets the newest segment, not the history." />
      <Arc points={geo.lateArc} color={p.accent} progress={ph === 'late' ? 1 : 0} opacity={ph === 'late' ? 1 : 0} width={0.007} />
      <Tag position={latLon(LATE.lat + 2.5, LATE.lon - 3, LABEL)} text="late viewer (Patna)" color="var(--accent)" show={ph === 'late'} hideBehind />
      <Tag position={latLon(8, 70, LABEL)} text="origin sees 5 requests" color="var(--accent)" show={ph === 'coalesce'} hideBehind />
    </Stage3D>
  );
}
