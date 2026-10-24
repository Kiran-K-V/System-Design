import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'cam', x: 85, y: 70, w: 130, h: 44, label: 'Stadium feed', step: 0 },
  { id: 'pack', x: 300, y: 70, w: 150, h: 60, label: 'Encode and cut', sub: 'every few seconds', step: 0 },
  { id: 'origin', x: 590, y: 70, w: 170, h: 76, label: 'Origin', sub: 'newest segments', shape: 'db', step: 0 },
  { id: 'edge', x: 590, y: 200, w: 120, h: 44, label: 'Edge caches', step: 1 },
  { id: 'viewer', x: 590, y: 335, w: 120, h: 44, label: 'Viewers', step: 1 },
  { id: 'gate', x: 280, y: 335, w: 110, h: 44, label: 'Gate', step: 2 },
  { id: 'acct', x: 280, y: 435, w: 170, h: 44, label: 'Account service', step: 2 },
  { id: 'extras', x: 590, y: 435, w: 150, h: 44, label: 'Extras', sub: 'ads, personal', shape: 'dashed', step: 3 },
];

const edges: BuildEdge[] = [
  { from: 'cam', to: 'pack', step: 0, label: 'live video', labelAt: [0, -16] },
  { from: 'pack', to: 'origin', step: 0, label: 'new segment', labelAt: [0, -16] },
  { from: 'edge', to: 'origin', step: 1, label: 'first ask only', labelAt: [-60, 0] },
  { from: 'viewer', to: 'edge', step: 1, label: 'manifest, segments', labelAt: [-80, 0] },
  { from: 'viewer', to: 'gate', step: 2, label: 'sign in', labelAt: [0, -16] },
  { from: 'gate', to: 'acct', step: 2, label: 'admitted', labelAt: [-40, 0] },
  { from: 'acct', to: 'extras', step: 3, dashed: true, label: 'optional', labelAt: [0, 16] },
];

const steps: BuildStep[] = [
  {
    req: 'Requirement 1: watch the live match',
    caption:
      'The camera feed goes to a packager. It cuts the live video into short segments, a few seconds each, and writes each one to the origin the moment it is ready. The origin only ever holds the newest few. This is the same cutting idea as in the YouTube lesson, but the video does not exist yet: the match is still being played.',
    packets: [{ from: 'cam', to: 'pack' }, { from: 'pack', to: 'origin', delay: 0.9 }],
  },
  {
    req: 'Requirement 1: millions watch the same moment',
    caption:
      'Viewers never talk to the origin. They ask an edge cache for the manifest, then for the newest segment. Every viewer wants the same segment at the same moment. So only the first ask at each edge reaches the origin. The rest are hits.',
    packets: [{ from: 'viewer', to: 'edge' }, { from: 'edge', to: 'origin', delay: 0.9 }],
  },
  {
    req: 'Requirement 2: sign in and check the plan',
    caption:
      'Before the video starts, the app checks who you are and whether your plan allows this match. A gate sits in front of this path. The gate admits people at a rate the account service can survive, and it can turn the rest away early with a polite “try again”. A design that fits the requirements has this gate before the part that is hurt.',
    packets: [{ from: 'viewer', to: 'gate' }, { from: 'gate', to: 'acct', delay: 0.9 }],
  },
  {
    req: 'Requirement 3: ads and a personal home page',
    caption:
      'The ads and the personalised home page are useful, but the match does not need them. We draw them dashed, as optional. When load is too high, we switch these off first and keep the video and the sign-in path alive.',
    packets: [{ from: 'acct', to: 'extras' }],
  },
];

export default function LiveStreamBuild() {
  return (
    <DesignBuild
      title="Live sports: the design grows one requirement at a time"
      steps={steps}
      nodes={nodes}
      edges={edges}
      height={490}
      label="Stadium feed, packager, origin, edge caches, viewers, gate, account service, and optional extras"
    />
  );
}
