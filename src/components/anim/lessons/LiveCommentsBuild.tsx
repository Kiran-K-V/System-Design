import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'poster', x: 85, y: 70, w: 124, h: 44, label: 'Commenter', step: 0 },
  { id: 'api', x: 290, y: 70, w: 134, h: 44, label: 'Comment API', step: 0 },
  { id: 'store', x: 505, y: 70, w: 144, h: 80, label: 'Comment store', sub: 'by video', shape: 'db', step: 0 },
  { id: 'pubsub', x: 290, y: 215, w: 134, h: 60, label: 'Pub/sub', sub: 'channel per video', step: 1 },
  { id: 'stream1', x: 495, y: 215, w: 134, h: 60, label: 'Stream server', sub: 'SSE', step: 1 },
  { id: 'viewers', x: 655, y: 275, w: 86, h: 44, label: 'Viewers', step: 1 },
  { id: 'stream2', x: 495, y: 335, w: 134, h: 60, label: 'Stream server', sub: 'SSE', step: 2 },
  { id: 'cache', x: 85, y: 215, w: 134, h: 80, label: 'Recent cache', sub: 'last 100', shape: 'db', step: 3 },
  { id: 'late', x: 85, y: 345, w: 124, h: 44, label: 'Late joiner', step: 3 },
  { id: 'cdn', x: 290, y: 345, w: 134, h: 60, label: 'CDN', sub: '1 s snapshots', step: 4 },
];

const edges: BuildEdge[] = [
  { from: 'poster', to: 'api', step: 0, label: 'POST', labelAt: [0, -14] },
  { from: 'api', to: 'store', step: 0, label: 'save', labelAt: [0, -14] },
  { from: 'api', to: 'pubsub', step: 1, label: 'publish', labelAt: [-34, 0] },
  { from: 'pubsub', to: 'stream1', step: 1, label: 'deliver', labelAt: [0, -14] },
  { from: 'stream1', to: 'viewers', step: 1, label: 'push', labelAt: [20, -16] },
  { from: 'pubsub', to: 'stream2', step: 2, label: 'on demand', labelAt: [-38, 12] },
  { from: 'stream2', to: 'viewers', step: 2 },
  { from: 'api', to: 'cache', step: 3, label: 'latest', labelAt: [-34, -22] },
  { from: 'late', to: 'cache', step: 3, label: 'history', labelAt: [-34, 0] },
  { from: 'cache', to: 'cdn', step: 4, label: 'snapshot', labelAt: [-8, 30] },
  { from: 'late', to: 'cdn', step: 4, label: 'mega', labelAt: [0, 16] },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: post a comment',
    caption:
      'A viewer posts a comment with a plain HTTP request. The API checks it and saves it in a store partitioned by video, with a per-video sequence number. Posting is stateless, so any API server can take it (lesson 2.4).',
    packets: [{ from: 'poster', to: 'api' }, { from: 'api', to: 'store', delay: 0.9 }],
  },
  {
    req: 'FR2: see new comments live',
    caption:
      'After the save, the API publishes the comment to a pub/sub channel named for the video. A stream server holds each viewer’s SSE connection and is subscribed to that channel. It writes the comment into every open connection. Data flows one way, so SSE is enough.',
    packets: [{ from: 'api', to: 'pubsub' }, { from: 'pubsub', to: 'stream1', delay: 0.9 }, { from: 'stream1', to: 'viewers', delay: 1.8 }],
  },
  {
    req: 'NFR: scale to many viewers',
    caption:
      'One server cannot hold every viewer of a big video, so viewers spread over many stream servers. A server subscribes to a video’s channel only while it has at least one viewer of that video. Every comment then reaches only the servers that need it.',
    packets: [{ from: 'pubsub', to: 'stream2' }, { from: 'stream2', to: 'viewers', delay: 0.9 }],
  },
  {
    req: 'FR3: late joiners see recent comments',
    caption:
      'A viewer who joins late asks for the latest comments. The API keeps the last 100 per video in a cache as it publishes, so history is one cache read. The store is the fallback and the source of truth. The cache does not hold anything the store lacks.',
    packets: [{ from: 'api', to: 'cache' }, { from: 'late', to: 'cache', delay: 0.9 }],
  },
  {
    req: 'NFR: a mega-stream',
    caption:
      'For the biggest streams, even a pushed fan-out is too much. A job writes a snapshot of the latest comments every second, and the CDN serves it to everyone. Viewers poll the CDN edge, not the stream servers. This trades about 1 to 3 seconds of delay for much lower cost.',
    packets: [{ from: 'cache', to: 'cdn' }, { from: 'cdn', to: 'late', delay: 0.9 }],
  },
];

export default function LiveCommentsBuild() {
  return (
    <DesignBuild
      title="Live comments: the design grows one requirement at a time"
      steps={steps}
      nodes={nodes}
      edges={edges}
      height={400}
      label="Commenter, comment API, comment store, pub/sub, two stream servers, viewers, a recent cache, and a CDN"
    />
  );
}
