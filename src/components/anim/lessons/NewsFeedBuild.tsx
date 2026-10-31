import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'client', x: 70, y: 175, w: 90, h: 56, label: 'Client', step: 0 },
  { id: 'api', x: 270, y: 175, w: 130, h: 56, label: 'API service', step: 0 },
  { id: 'postdb', x: 500, y: 60, w: 130, h: 70, label: 'Posts DB', shape: 'db', step: 0 },
  { id: 'follow', x: 500, y: 175, w: 130, h: 70, label: 'Follow graph', shape: 'db', step: 1 },
  { id: 'queue', x: 270, y: 305, w: 120, h: 56, label: 'Fan-out queue', step: 4 },
  { id: 'workers', x: 450, y: 305, w: 110, h: 56, label: 'Workers', step: 4 },
  { id: 'cache', x: 650, y: 305, w: 110, h: 56, label: 'Feed cache', step: 3 },
];

const edges: BuildEdge[] = [
  { from: 'client', to: 'api', step: 0 },
  { from: 'api', to: 'postdb', step: 0 },
  { from: 'api', to: 'follow', step: 1 },
  { from: 'api', to: 'cache', step: 3 },
  { from: 'api', to: 'queue', step: 4 },
  { from: 'queue', to: 'workers', step: 4 },
  { from: 'workers', to: 'follow', step: 4, dashed: true },
  { from: 'workers', to: 'cache', step: 4 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: publish a post',
    caption: 'A post is one row: id, author, text, time. The API service writes it to the posts table.',
    packets: [{ from: 'client', to: 'api' }, { from: 'api', to: 'postdb', delay: 0.7 }],
  },
  {
    req: 'FR2: follow and unfollow',
    caption: 'The follow graph is a table of (follower, followee) pairs, indexed both ways (the Indexing lesson). We ask two questions of it: who does Ana follow, and who follows Ben.',
  },
  {
    req: 'FR3: view the home feed (pull)',
    caption: 'No new box. The first design builds a feed at read time: look up who the user follows, fetch each one\'s recent posts, merge by time. It works. The deep dive shows when it stops working.',
    active: ['api', 'postdb', 'follow'],
  },
  {
    req: 'NFR: fast feed reads',
    caption: 'Keep a ready-made feed per user in a cache: a short list of post ids, newest first. A read is one lookup, then a fetch of those posts.',
  },
  {
    req: 'NFR: write the feed ahead of time',
    caption: 'When a post is published, a queue (the Queues lesson) hands it to workers. Each worker looks up the author\'s followers and adds the post id to each follower\'s feed. This is fan-out on write.',
    packets: [{ from: 'api', to: 'queue' }, { from: 'workers', to: 'cache', delay: 0.8 }],
  },
  {
    req: 'NFR: celebrities do not break it',
    caption: 'No new box. For authors with millions of followers, skip the fan-out. The read path fetches their posts straight from the posts table and merges them in. This is the hybrid.',
    active: ['api', 'postdb', 'cache'],
  },
];

export default function NewsFeedBuild() {
  return (
    <DesignBuild
      title="News feed, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={370}
      label="Design of a news feed. An API service uses a posts table and a follow graph. A queue and workers push post ids into per-user feed caches, and posts from celebrities are merged in at read time."
    />
  );
}
