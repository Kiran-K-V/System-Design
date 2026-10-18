import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'client', x: 60, y: 200, w: 84, h: 56, label: 'Client', step: 0 },
  { id: 'api', x: 200, y: 200, w: 90, h: 56, label: 'Chat\nAPI', step: 0 },
  { id: 'queue', x: 350, y: 200, w: 100, h: 60, label: 'Inference\nqueue', step: 0 },
  { id: 'gpu', x: 520, y: 200, w: 110, h: 70, label: 'GPU\nworkers', step: 0 },
  { id: 'buf', x: 520, y: 340, w: 110, h: 70, label: 'Token\nbuffer', shape: 'db', step: 1 },
  { id: 'gate', x: 350, y: 340, w: 100, h: 60, label: 'Stream\ngateway', step: 1 },
  { id: 'conv', x: 200, y: 70, w: 110, h: 70, label: 'Chat\nstore', shape: 'db', step: 2 },
  { id: 'lim', x: 350, y: 70, w: 100, h: 60, label: 'Rate\nlimiter', step: 3 },
];

const edges: BuildEdge[] = [
  { from: 'client', to: 'api', step: 0 },
  { from: 'api', to: 'queue', step: 0 },
  { from: 'queue', to: 'gpu', step: 0 },
  { from: 'gpu', to: 'buf', step: 1 },
  { from: 'buf', to: 'gate', step: 1 },
  { from: 'gate', to: 'client', step: 1 },
  { from: 'api', to: 'conv', step: 2 },
  { from: 'api', to: 'lim', step: 3 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: send a prompt',
    caption: 'The API accepts the prompt and puts it in a queue. GPU workers take requests from the queue. A GPU is the scarce part, so work waits in line instead of failing.',
    packets: [{ from: 'client', to: 'api' }, { from: 'api', to: 'queue', delay: 0.5 }, { from: 'queue', to: 'gpu', delay: 1 }],
  },
  {
    req: 'NFR: first token fast',
    caption: 'A worker writes each token to a buffer as it is made. The stream gateway reads the buffer and sends each token to the client as it arrives, as one event in an open HTTP response. Each event has a number. If the connection drops, the client reconnects and says the last number it saw, and the gateway replays from there.',
    packets: [{ from: 'gpu', to: 'buf' }, { from: 'buf', to: 'gate', delay: 0.5 }, { from: 'gate', to: 'client', delay: 1 }],
  },
  {
    req: 'FR2: resume old chats',
    caption: 'Every message is appended to a conversation store, keyed by conversation. Before a new run, the API reads the recent messages that fit the model input limit and puts them in front of the prompt.',
    packets: [{ from: 'api', to: 'conv' }],
  },
  {
    req: 'NFR: fair use per tier',
    caption: 'A rate limiter sits in front of the queue. It keeps two budgets per user: requests per minute and tokens per minute. Paid tiers get larger budgets. An empty budget gets a "too many requests" reply (HTTP status 429) with a retry time.',
    packets: [{ from: 'api', to: 'lim' }],
  },
  {
    req: 'NFR: GPUs stay busy',
    caption: 'No new box. The queue orders work by tier, and workers add a waiting request to a running batch the moment a slot frees. The deep dive below shows what that gains.',
    active: ['queue', 'gpu'],
  },
];

export default function ChatgptBuild() {
  return (
    <DesignBuild
      title="Chat app, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={400}
      label="High-level design of a chat app: a client, chat API, inference queue and GPU workers, a token buffer and stream gateway for streaming, a conversation store, and a rate limiter."
    />
  );
}
