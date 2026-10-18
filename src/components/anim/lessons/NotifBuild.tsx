import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'sender', x: 50, y: 200, w: 80, h: 56, label: 'Sender', step: 0 },
  { id: 'api', x: 185, y: 200, w: 110, h: 56, label: 'Intake API', step: 0 },
  { id: 'queues', x: 345, y: 200, w: 130, h: 64, label: 'Queues', sub: 'per channel + lane', step: 0 },
  { id: 'push', x: 500, y: 120, w: 80, h: 56, label: 'Push', sub: 'worker', step: 0 },
  { id: 'pprov', x: 650, y: 120, w: 108, h: 56, label: 'Apple / Google', step: 0 },
  { id: 'sms', x: 500, y: 200, w: 80, h: 56, label: 'SMS', sub: 'worker', step: 1 },
  { id: 'email', x: 500, y: 280, w: 80, h: 56, label: 'Email', sub: 'worker', step: 1 },
  { id: 'sprov', x: 650, y: 200, w: 108, h: 56, label: 'SMS vendor', step: 1 },
  { id: 'eprov', x: 650, y: 280, w: 108, h: 56, label: 'Email API', step: 1 },
  { id: 'log', x: 185, y: 330, w: 120, h: 70, label: 'Intake log', shape: 'db', step: 2 },
  { id: 'prefs', x: 185, y: 80, w: 120, h: 70, label: 'Preferences', shape: 'db', step: 3 },
  { id: 'camp', x: 345, y: 330, w: 140, h: 60, label: 'Campaigns', sub: 'expand segment', step: 4 },
  { id: 'limit', x: 345, y: 80, w: 150, h: 56, label: 'Dedupe + limits', step: 6 },
  { id: 'retry', x: 500, y: 365, w: 120, h: 56, label: 'Retry + dead letters', step: 7 },
];

const edges: BuildEdge[] = [
  { from: 'sender', to: 'api', step: 0 },
  { from: 'api', to: 'queues', step: 0 },
  { from: 'queues', to: 'push', step: 0 },
  { from: 'push', to: 'pprov', step: 0 },
  { from: 'queues', to: 'sms', step: 1 },
  { from: 'queues', to: 'email', step: 1 },
  { from: 'sms', to: 'sprov', step: 1 },
  { from: 'email', to: 'eprov', step: 1 },
  { from: 'api', to: 'log', step: 2 },
  { from: 'api', to: 'prefs', step: 3 },
  { from: 'api', to: 'camp', step: 4, bend: 30 },
  { from: 'camp', to: 'queues', step: 4 },
  { from: 'api', to: 'limit', step: 6 },
  { from: 'push', to: 'limit', step: 6 },
  { from: 'email', to: 'retry', step: 7 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: notify one user',
    caption: 'The smallest design. A sender service calls the intake API. The API puts the message on a queue (lesson 6.1). A push worker takes it and calls the push provider (APNs from Apple or FCM from Google, the phone makers delivery services). The sender is not blocked while the provider is slow.',
    packets: [{ from: 'sender', to: 'api', label: 'send' }, { from: 'api', to: 'queues', label: 'enqueue', delay: 0.9 }],
  },
  {
    req: 'FR1: push, SMS, and email',
    caption: 'Each channel gets its own queue and its own worker pool. A slow email vendor then cannot hold back push messages. Each pool is sized to its own provider limit.',
  },
  {
    req: 'NFR: an accepted message is never lost',
    caption: 'The API writes the request to a durable log before it answers "accepted" (HTTP 202). If a queue loses data or a worker crashes, the log still has the request and can enqueue it again.',
    packets: [{ from: 'api', to: 'log', label: 'write first' }],
  },
  {
    req: 'FR3: user preferences',
    caption: 'Before the API enqueues, it reads the user preferences: opt-outs and quiet hours. A message to a channel the user turned off is dropped here, at no cost. Quiet hours turn into a later send time.',
    packets: [{ from: 'api', to: 'prefs', label: 'opted in?' }],
  },
  {
    req: 'FR2: send a campaign',
    caption: 'A campaign is one request that names a segment. The campaign service expands it into one message per user. These messages go to the bulk lane, so a 3M-user blast does not sit in front of a login code.',
    packets: [{ from: 'api', to: 'camp', label: 'campaign' }, { from: 'camp', to: 'queues', label: 'bulk', delay: 0.9 }],
  },
  {
    req: 'NFR: urgent messages stay fast',
    caption: 'No new box. Each channel queue has an urgent lane and a bulk lane. Workers take from urgent first, and bulk workers are capped so that they leave room under the provider limit. The deep dive below shows why.',
    active: ['queues'],
  },
  {
    req: 'NFR: no duplicates, per-user limit',
    caption: 'A fast key-value store (lesson 8.2) holds two things. A token bucket per user (lesson 7.4) caps how many messages one user gets. A dedupe key per message stops a redelivered message from being sent twice.',
    packets: [{ from: 'push', to: 'limit', label: 'seen?' }],
  },
  {
    req: 'NFR: providers fail',
    caption: 'When a provider call fails, the worker puts the message on a retry queue with a delay that grows (backoff with jitter, lesson 7.2). After N tries it goes to a dead-letter queue (lesson 6.4). Drawn from one worker to keep the picture clear.',
    packets: [{ from: 'email', to: 'retry', label: 'failed', tone: 'warn' }],
  },
];

export default function NotifBuild() {
  return (
    <DesignBuild
      title="Notification system, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={410}
      label="High-level design of a notification system that grows from a sender, an intake API, a queue, and a push worker to include SMS and email workers, an intake log, a preferences store, a campaign service, dedupe and rate limits, and a retry queue."
    />
  );
}
