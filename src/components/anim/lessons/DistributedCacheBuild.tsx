import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** Distributed cache: the design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'app', x: 90, y: 160, w: 120, label: 'App', sub: 'cache client', step: 0 },
  { id: 'a', x: 400, y: 60, w: 130, label: 'Node A', sub: 'map + LRU list', step: 0 },
  { id: 'b', x: 400, y: 160, w: 130, label: 'Node B', step: 3 },
  { id: 'c', x: 400, y: 260, w: 130, label: 'Node C', step: 3 },
  { id: 'a2', x: 590, y: 60, w: 110, label: 'Copy of A', step: 4 },
  { id: 'b2', x: 590, y: 160, w: 110, label: 'Copy of B', step: 4 },
  { id: 'c2', x: 590, y: 260, w: 110, label: 'Copy of C', step: 4 },
  { id: 'near', x: 90, y: 300, w: 130, label: 'Local copy', sub: 'hot keys, 2 s', shape: 'dashed', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'app', to: 'a', label: 'get / set / delete', labelAt: [-10, -22], step: 0 },
  { from: 'app', to: 'b', step: 3 },
  { from: 'app', to: 'c', label: 'by hash', labelAt: [10, 24], step: 3 },
  { from: 'a', to: 'a2', label: 'copy later', labelAt: [0, -16], step: 4 },
  { from: 'b', to: 'b2', step: 4 },
  { from: 'c', to: 'c2', step: 4 },
  { from: 'app', to: 'near', head: 'both', step: 5 },
];

const steps: BuildStep[] = [
  { req: 'FR1: set, get, delete', caption: 'One node keeps a hash map from key to value. Get, set, and delete take constant time. The app talks to it through a small cache client library.', packets: [{ from: 'app', to: 'a', label: 'get k' }] },
  { req: 'FR2: expiry (TTL)', caption: 'No new box. Each entry stores its expiry time. A read that finds an expired entry deletes it and reports a miss. A background sweep removes expired entries that nobody reads.', active: ['a'] },
  { req: 'FR3: evict by LRU', caption: 'No new box. When memory is full, the node removes the least recently used entry. A linked list ordered by last use makes that constant time (the Eviction lesson). Real caches often use a sampled approximation.', active: ['a'] },
  { req: 'NFR: 1 TB and 100,000 requests/s', caption: 'One node cannot hold 1 TB. The client library hashes each key onto a ring of nodes, a circle where each key belongs to the next node around it (the Consistent Hashing lesson). Adding a node moves only about 1/N of the keys.', packets: [{ from: 'app', to: 'b', label: 'get k2' }, { from: 'app', to: 'c', label: 'get k3', delay: 0.4 }] },
  { req: 'NFR: highly available', caption: 'Each key range also lives on the next node around the ring. Copies are written a moment after the main write, not before it (the Replication lesson). If a node dies, readers use its copy. A copy can lag, and a cache accepts that.', packets: [{ from: 'a', to: 'a2', label: 'copy' }, { from: 'b', to: 'b2', label: 'copy', delay: 0.3 }, { from: 'c', to: 'c2', label: 'copy', delay: 0.6 }] },
  { req: 'NFR: latency under 10 ms', caption: 'A few keys get far more traffic than their node can serve. The client keeps those in its own memory for about two seconds. The deep dive shows two more tools for hot keys.', packets: [{ from: 'app', to: 'near', label: 'hot hit' }] },
];

export default function DistributedCacheBuild() {
  return <DesignBuild title="Distributed cache, built up" steps={steps} nodes={nodes} edges={edges} height={360} label="Distributed cache architecture growing from one node to a replicated ring" />;
}
