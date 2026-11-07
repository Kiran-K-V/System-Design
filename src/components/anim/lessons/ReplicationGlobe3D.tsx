import { useMemo } from 'react';
import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import type { Vec3 } from '../three/blocks';
import { Arc, Dot, Globe, Tag, globeArc, latLon } from '../three/extras';
import { usePalette, type Palette } from '../three/theme';

/**
 * Single-leader replication on a globe. Log entries fly from the leader to followers in other regions, so lag grows
 * with distance. Then the leader's region fails, a follower is promoted, and the old leader is fenced out by epoch.
 */

type Region = 'virginia' | 'oregon' | 'frankfurt' | 'mumbai';
const REGIONS: Record<Region, { name: string; lat: number; lon: number }> = {
  virginia: { name: 'Virginia', lat: 38.9, lon: -77.0 },
  oregon: { name: 'Oregon', lat: 45.6, lon: -121.2 },
  frankfurt: { name: 'Frankfurt', lat: 50.1, lon: 8.7 },
  mumbai: { name: 'Mumbai', lat: 19.1, lon: 72.9 },
};
const USER = { lat: 12.9, lon: 77.6 }; // a reader in Bengaluru, served by the Mumbai follower

type Role = 'leader' | 'follower' | 'down' | 'stale-leader';

interface Step {
  caption: string;
  roles: Record<Region, Role>;
  /** How far the latest log entry has travelled to each follower, 0 to 1. Keyed by "from>to". */
  log: Partial<Record<string, number>>;
  /** The user's read from the Mumbai follower. */
  read: 'none' | 'stale' | 'fresh';
  /** The old leader's write attempt, refused by fencing. */
  fenced: boolean;
  epoch: number;
  view: [number, number];
  distance: number;
}

const F = 'follower' as const;
const steps: Step[] = [
  {
    caption: 'One leader in Virginia takes every write. Followers in Oregon, Frankfurt and Mumbai each keep a copy, so readers near them get fast answers.',
    roles: { virginia: 'leader', oregon: F, frankfurt: F, mumbai: F },
    log: {},
    read: 'none',
    fenced: false,
    epoch: 7,
    view: [0.68, -0.85],
    distance: 9.5,
  },
  {
    caption: 'A user saves a new profile. The leader commits it and ships the log entry out. Oregon is close and has it already. Frankfurt is across an ocean. Mumbai is on the far side of the planet. This gap is replica lag.',
    roles: { virginia: 'leader', oregon: F, frankfurt: F, mumbai: F },
    log: { 'virginia>oregon': 1, 'virginia>frankfurt': 0.65, 'virginia>mumbai': 0.3 },
    read: 'none',
    fenced: false,
    epoch: 7,
    view: [0.68, -1.05],
    distance: 9.5,
  },
  {
    caption: 'The user is in Bengaluru, so the page reloads from the Mumbai follower. The new profile has not arrived there yet. The user sees the old profile. The write worked. The read was early.',
    roles: { virginia: 'leader', oregon: F, frankfurt: F, mumbai: F },
    log: { 'virginia>oregon': 1, 'virginia>frankfurt': 1, 'virginia>mumbai': 0.55 },
    read: 'stale',
    fenced: false,
    epoch: 7,
    view: [0.45, -2.45],
    distance: 8.5,
  },
  {
    caption: 'A moment later every follower has the entry and the same read is correct. Fixes for the gap: read from the leader just after a write, or carry a log position that the follower must reach before it answers.',
    roles: { virginia: 'leader', oregon: F, frankfurt: F, mumbai: F },
    log: { 'virginia>oregon': 1, 'virginia>frankfurt': 1, 'virginia>mumbai': 1 },
    read: 'fresh',
    fenced: false,
    epoch: 7,
    view: [0.45, -2.45],
    distance: 8.5,
  },
  {
    caption: 'The Virginia region goes dark. Followers stop getting heartbeats. They cannot tell a dead leader from a slow network, so they wait for a timeout first. Too short gives false failovers. Too long extends the outage.',
    roles: { virginia: 'down', oregon: F, frankfurt: F, mumbai: F },
    log: {},
    read: 'none',
    fenced: false,
    epoch: 7,
    view: [0.68, -0.85],
    distance: 9.5,
  },
  {
    caption: 'Frankfurt has the longest log, so it is promoted. The cluster moves to epoch 8. Frankfurt now ships the log to the others. With asynchronous replication, any write that never left Virginia is lost.',
    roles: { virginia: 'down', oregon: F, frankfurt: 'leader', mumbai: F },
    log: { 'frankfurt>oregon': 1, 'frankfurt>mumbai': 1 },
    read: 'none',
    fenced: false,
    epoch: 8,
    view: [0.68, -1.75],
    distance: 9.5,
  },
  {
    caption: 'Virginia comes back still thinking it leads, with epoch 7. It tries to send writes. Every node has seen epoch 8, so it refuses anything stamped 7. That refusal is called fencing. It stops two leaders from writing different data.',
    roles: { virginia: 'stale-leader', oregon: F, frankfurt: 'leader', mumbai: F },
    log: { 'frankfurt>oregon': 1, 'frankfurt>mumbai': 1 },
    read: 'none',
    fenced: true,
    epoch: 8,
    view: [0.68, -0.85],
    distance: 9.5,
  },
];

const R = 2.2;
const SURFACE = R * 1.01;
const LABEL = R * 1.17;
const pos = (r: Region, h = SURFACE): Vec3 => latLon(REGIONS[r].lat, REGIONS[r].lon, h);

export default function ReplicationGlobe3D() {
  const p = usePalette();
  return (
    <AnimFrame title="Replication across regions: lag, failover, fencing" steps={steps} interval={5600}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: Palette }) {
  const arcs = useMemo(() => {
    const pairs: [Region, Region][] = [
      ['virginia', 'oregon'],
      ['virginia', 'frankfurt'],
      ['virginia', 'mumbai'],
      ['frankfurt', 'oregon'],
      ['frankfurt', 'mumbai'],
    ];
    const out: Record<string, Vec3[]> = {};
    for (const [a, b] of pairs) out[`${a}>${b}`] = globeArc(pos(a), pos(b), SURFACE, 0.22);
    const user = latLon(USER.lat, USER.lon, SURFACE);
    return {
      log: out,
      read: globeArc(user, pos('mumbai'), SURFACE, 2.2),
      user,
      fenceO: globeArc(pos('virginia'), pos('oregon'), SURFACE, 0.22),
      fenceF: globeArc(pos('virginia'), pos('frankfurt'), SURFACE, 0.22),
    };
  }, []);

  const colorOf = (role: Role) => (role === 'leader' ? p.accent : role === 'down' ? p.bad : role === 'stale-leader' ? p.bad : p.ok);
  const roleText = (r: Region) => {
    const role = step.roles[r];
    const name = REGIONS[r].name;
    if (role === 'leader') return `${name} · leader (epoch ${step.epoch})`;
    if (role === 'down') return `${name} · down`;
    if (role === 'stale-leader') return `${name} · old leader (epoch 7)`;
    return name;
  };
  const inbox = (r: Region) => {
    const v = Object.entries(step.log).find(([k]) => k.endsWith(`>${r}`))?.[1];
    return v === undefined ? '' : v >= 1 ? ' · has it' : ' · waiting';
  };

  const legend = [
    { label: 'Leader', color: p.accent },
    { label: 'Follower', color: p.ok },
    { label: 'Log entry in flight', color: p.warn },
    ...(step.read !== 'none' ? [{ label: 'Reader in Bengaluru', color: p.fg }] : []),
    ...(step.roles.virginia !== 'leader' ? [{ label: 'Down or fenced', color: p.bad }] : []),
  ];

  return (
    <Stage3D
      label="A globe with a database leader in Virginia and followers in Oregon, Frankfurt and Mumbai. Log entries travel from the leader along arcs; later the leader fails and Frankfurt takes over."
      distance={step.distance}
      view={step.view}
      legend={legend}
      angle={[0.68, -0.85]}
    >
      <Globe r={R} line={p.fg} fill={p.bg} />
      {(Object.keys(REGIONS) as Region[]).map((r) => {
        const role = step.roles[r];
        const fresh = step.read === 'fresh' && r === 'mumbai';
        return (
          <group key={r}>
            <Dot
              pos={pos(r)}
              color={colorOf(role)}
              r={role === 'leader' ? 0.12 : 0.09}
              opacity={role === 'down' ? 0.5 : 1}
              pop={role === 'leader' || (r === 'mumbai' && step.read !== 'none') || role === 'stale-leader'}
              hint={
                role === 'leader'
                  ? `${REGIONS[r].name}: the leader. Every write goes here first.`
                  : role === 'down'
                    ? `${REGIONS[r].name}: region down, no heartbeats.`
                    : role === 'stale-leader'
                      ? `${REGIONS[r].name}: back online, still on epoch 7. Its writes are refused.`
                      : `${REGIONS[r].name}: a follower. Applies the leader's log in order.${fresh ? ' Caught up.' : ''}`
              }
            />
            <Tag position={pos(r, LABEL)} text={roleText(r) + (role === 'follower' ? inbox(r) : '')} color={role === 'leader' ? 'var(--accent)' : role === 'follower' ? undefined : 'var(--bad)'} hideBehind />
          </group>
        );
      })}

      {Object.entries(arcs.log).map(([k, pts]) => {
        const v = step.log[k];
        return <Arc key={k} points={pts} color={v !== undefined && v < 1 ? p.warn : k.startsWith('frankfurt') ? p.accent : p.warn} progress={v ?? 0} opacity={v === undefined ? 0 : v >= 1 ? 0.55 : 1} width={0.028} />;
      })}

      <Dot pos={arcs.user} color={p.fg} r={0.06} opacity={step.read === 'none' ? 0 : 1} hint="A user in Bengaluru. Reads go to the nearest copy, in Mumbai." />
      <Arc points={arcs.read} color={step.read === 'stale' ? p.bad : p.ok} progress={step.read === 'none' ? 0 : 1} opacity={step.read === 'none' ? 0 : 1} width={0.02} />
      <Tag
        position={latLon(USER.lat - 9, USER.lon + 4, LABEL)}
        text={step.read === 'stale' ? 'reads old profile' : 'reads new profile'}
        color={step.read === 'stale' ? 'var(--bad)' : 'var(--ok)'}
        show={step.read !== 'none'}
        hideBehind
      />

      <Arc points={arcs.fenceO} color={p.bad} progress={step.fenced ? 0.45 : 0} opacity={step.fenced ? 1 : 0} width={0.03} />
      <Arc points={arcs.fenceF} color={p.bad} progress={step.fenced ? 0.4 : 0} opacity={step.fenced ? 1 : 0} width={0.03} />
      <Tag position={latLon(47, -45, LABEL)} text="refused: epoch 7 < 8" color="var(--bad)" show={step.fenced} hideBehind />
    </Stage3D>
  );
}
