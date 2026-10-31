import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'client', x: 70, y: 170, w: 90, h: 56, label: 'Client', step: 0 },
  { id: 'shorten', x: 250, y: 250, w: 165, h: 56, label: 'Shorten service', step: 0 },
  { id: 'db', x: 450, y: 170, w: 120, h: 70, label: 'URL table', shape: 'db', step: 0 },
  { id: 'gen', x: 450, y: 300, w: 155, h: 56, label: 'Code generator', step: 1 },
  { id: 'redir', x: 250, y: 90, w: 165, h: 56, label: 'Redirect service', step: 3 },
  { id: 'cache', x: 450, y: 60, w: 110, h: 50, label: 'Cache', step: 4 },
  { id: 'replica', x: 630, y: 170, w: 110, h: 70, label: 'Replica', shape: 'db', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'client', to: 'shorten', step: 0 },
  { from: 'shorten', to: 'db', step: 0 },
  { from: 'shorten', to: 'gen', step: 1 },
  { from: 'client', to: 'redir', step: 3 },
  { from: 'redir', to: 'db', step: 3 },
  { from: 'redir', to: 'cache', step: 4 },
  { from: 'db', to: 'replica', step: 5, label: 'copy', labelAt: [0, -16] },
];

const steps: BuildStep[] = [
  {
    req: 'Goal: shorten a URL',
    caption: 'The smallest design that works. The client sends a long URL. The service picks a code and stores the code and the long URL in a table. Each code is unique in the table, so it identifies one row.',
    packets: [{ from: 'client', to: 'shorten' }],
  },
  {
    req: 'Quality: one code, one URL',
    caption: 'Codes must never repeat. A separate generator hands out unique numbers, and the service turns each number into a short code. The deep dive below shows why this beats hashing.',
  },
  {
    req: 'Goals: alias and expiry',
    caption: 'No new box. A custom alias is just a code the user picks. The table rejects it if taken. Expiry is a column, expires_at, that the read path checks.',
    active: ['db'],
  },
  {
    req: 'Goal: redirect',
    caption: 'Reads go to their own service. It looks up the code and answers with a redirect. Reads outnumber writes about 1,000 to 1 in our assumptions, so they must scale on their own.',
    packets: [{ from: 'client', to: 'redir' }],
  },
  {
    req: 'Quality: redirect in about 100 ms',
    caption: 'A cache sits in front of the table (the Cache Strategies lesson). Hot codes answer from memory. Only a miss reads the table.',
    packets: [{ from: 'redir', to: 'cache' }],
  },
  {
    req: 'Quality: highly available',
    caption: 'Copy the table to replicas. Redirects read from a replica, so a lost primary does not stop them. A stale read is fine here, because a code never changes after it is created.',
  },
];

export default function BitlyBuild() {
  return (
    <DesignBuild
      title="URL shortener, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={350}
      label="High-level design of a URL shortener that grows from a client, a shorten service, and a table to include a code generator, a redirect service, a cache, and a replica."
    />
  );
}
