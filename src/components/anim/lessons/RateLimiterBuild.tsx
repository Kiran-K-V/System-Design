import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'client', x: 70, y: 170, w: 90, h: 56, label: 'Client', step: 0 },
  { id: 'gw1', x: 250, y: 70, w: 130, h: 56, label: 'Gateway A', step: 0 },
  { id: 'backend', x: 640, y: 40, w: 110, h: 50, label: 'Backend', step: 0 },
  { id: 'gw2', x: 250, y: 280, w: 130, h: 56, label: 'Gateway B', step: 1 },
  { id: 'redis', x: 450, y: 170, w: 120, h: 70, label: 'Redis', shape: 'db', step: 1 },
  { id: 'shard2', x: 450, y: 300, w: 130, h: 56, label: 'Redis shard 2', step: 4 },
  { id: 'replica', x: 640, y: 170, w: 110, h: 70, label: 'Replica', shape: 'db', step: 5 },
  { id: 'rules', x: 250, y: 175, w: 110, h: 50, label: 'Rules', step: 6 },
];

const edges: BuildEdge[] = [
  { from: 'client', to: 'gw1', step: 0 },
  { from: 'gw1', to: 'backend', step: 0 },
  { from: 'client', to: 'gw2', step: 1 },
  { from: 'gw1', to: 'redis', step: 1 },
  { from: 'gw2', to: 'redis', step: 1 },
  { from: 'gw1', to: 'shard2', step: 4, dashed: true },
  { from: 'gw2', to: 'shard2', step: 4, dashed: true },
  { from: 'redis', to: 'replica', step: 5, label: 'copy', labelAt: [0, -16] },
  { from: 'rules', to: 'gw1', step: 6, dashed: true },
  { from: 'rules', to: 'gw2', step: 6, dashed: true },
];

const steps: BuildStep[] = [
  {
    req: 'Goal: limit each client',
    caption: 'Start with one gateway. It finds the caller (API key, user, or IP) and keeps a token bucket per caller in its own memory. A request with a token goes on to the backend.',
    packets: [{ from: 'client', to: 'gw1' }],
  },
  {
    req: 'Quality: the limit holds across servers',
    caption: 'A second gateway breaks it. Each keeps its own buckets, so a client gets twice the limit. Move the buckets into a shared Redis, one key per caller.',
  },
  {
    req: 'Quality: no two servers pass the same token',
    caption: 'No new box. The refill, the check, and the take run as one small script inside Redis, in a single uninterruptible step, so two gateways can never both take the last token. The deep dive shows the race.',
    active: ['redis'],
  },
  {
    req: 'Goal: reject with 429',
    caption: 'When the script says no, the gateway answers 429 Too Many Requests with a Retry-After header. The backend never sees the request.',
    packets: [{ from: 'gw1', to: 'client', tone: 'bad' }],
    active: ['gw1'],
  },
  {
    req: 'Quality: 1M checks per second',
    caption: 'One Redis cannot take that load under our assumption. Split callers over shards (separate Redis servers, each holding some callers) by key (lesson 4.8). Each caller always lands on the same shard, so its bucket stays in one place.',
    packets: [{ from: 'gw1', to: 'shard2' }],
  },
  {
    req: 'Quality: highly available',
    caption: 'Each shard gets a replica for failover. If Redis is unreachable, the gateway must pick: let requests through (fail open) or block them (fail closed).',
  },
  {
    req: 'Rules: configurable limits',
    caption: 'Limits live in a small rules store. Gateways poll it every few seconds and cache the result. A rule change reaches every gateway without a deploy.',
  },
];

export default function RateLimiterBuild() {
  return (
    <DesignBuild
      title="Distributed rate limiter, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={350}
      label="Design of a distributed rate limiter that grows from one gateway with in-memory buckets to many gateways, sharded Redis with replicas, and a rules store."
    />
  );
}
