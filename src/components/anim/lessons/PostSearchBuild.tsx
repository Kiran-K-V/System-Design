import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** Post search: the design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'user', x: 90, y: 80, w: 120, label: 'User', step: 0 },
  { id: 'api', x: 250, y: 80, w: 130, label: 'Post API', step: 0 },
  { id: 'posts', x: 410, y: 80, w: 130, label: 'Posts DB', sub: 'source of truth', h: 80, shape: 'db', step: 0 },
  { id: 'cdc', x: 590, y: 80, w: 130, label: 'Change log', sub: 'change feed', h: 80, shape: 'db', step: 2 },
  { id: 'likes', x: 250, y: 210, w: 130, label: 'Likes store', sub: 'counters', h: 80, shape: 'db', step: 1 },
  { id: 'indexer', x: 590, y: 210, w: 130, label: 'Indexer', step: 3 },
  { id: 'index', x: 590, y: 350, w: 130, label: 'Search index', sub: 'shards', h: 80, shape: 'db', step: 3 },
  { id: 'query', x: 410, y: 350, w: 130, label: 'Query service', step: 4 },
  { id: 'cache', x: 250, y: 350, w: 130, label: 'Result cache', sub: 'short life', step: 6 },
  { id: 'searcher', x: 90, y: 350, w: 120, label: 'Searcher', step: 4 },
];

const edges: BuildEdge[] = [
  { from: 'user', to: 'api', step: 0 },
  { from: 'api', to: 'posts', step: 0 },
  { from: 'api', to: 'likes', label: 'count', labelAt: [-34, 0], step: 1 },
  { from: 'posts', to: 'cdc', step: 2 },
  { from: 'cdc', to: 'indexer', step: 3 },
  { from: 'indexer', to: 'index', label: 'write', labelAt: [30, 0], step: 3 },
  { from: 'searcher', to: 'cache', step: 6 },
  { from: 'cache', to: 'query', step: 6 },
  { from: 'query', to: 'index', step: 4 },
  { from: 'likes', to: 'indexer', label: 'milestones', labelAt: [0, -16], step: 5 },
  { from: 'query', to: 'likes', label: 're-rank', labelAt: [-6, 18], step: 5 },
];

const steps: BuildStep[] = [
  { req: 'FR1: create posts', caption: 'A user creates a post. The Post API writes it to the posts database. This is the source of truth. Everything else can be rebuilt from it.', packets: [{ from: 'user', to: 'api', label: 'post' }, { from: 'api', to: 'posts', label: 'insert', delay: 0.9 }] },
  { req: 'FR1: like posts', caption: 'A like is not a row in the posts table. At 100,000 likes a second it goes to a counter store, sharded by post id. This keeps the hot write path away from the posts database.', packets: [{ from: 'api', to: 'likes', label: '+1' }] },
  { req: 'NFR: searchable in about a minute', caption: 'Change data capture reads the posts database log and publishes each new post to a change log, an ordered list that readers consume at their own pace (lesson 6.5). The application does not write to the index itself, so the two can never disagree after a partial failure.', packets: [{ from: 'posts', to: 'cdc', label: 'new post' }] },
  { req: 'FR2: search by keyword', caption: 'The indexer reads the feed, splits each post into terms, and writes it into an inverted index split over shards (lessons 4.3 and 8.5). Each term points to the posts that contain it.', packets: [{ from: 'cdc', to: 'indexer', label: 'post' }, { from: 'indexer', to: 'index', label: 'terms', delay: 0.9 }] },
  { req: 'FR2: search by keyword', caption: 'A search goes to the query service. It asks every shard for its best matches, then merges the lists and returns one page.', packets: [{ from: 'searcher', to: 'query', label: 'q' }, { from: 'query', to: 'index', label: 'terms', delay: 0.9 }] },
  { req: 'FR3: sort by likes or recency', caption: 'Recency is cheap: post ids grow with time. Likes change too often to index each one. The like store sends the index a message only at milestones, and the query service re-reads exact counts for its top results.', packets: [{ from: 'likes', to: 'indexer', label: 'milestone' }, { from: 'query', to: 'likes', label: 'exact', delay: 0.9 }] },
  { req: 'NFR: median under 500 ms', caption: 'Popular searches repeat. A result cache with a short time to live answers them without touching the shards. The TTL must fit inside the one-minute freshness budget.', packets: [{ from: 'searcher', to: 'cache', label: 'q' }, { from: 'cache', to: 'query', label: 'miss', delay: 0.9 }] },
];

export default function PostSearchBuild() {
  return <DesignBuild title="Post search, built up" steps={steps} nodes={nodes} edges={edges} height={410} label="Post search architecture growing from post API to result cache" />;
}
