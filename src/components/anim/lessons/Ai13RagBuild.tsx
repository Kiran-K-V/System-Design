import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** Enterprise RAG with permissions: the high-level design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'src', x: 90, y: 70, w: 120, label: 'Sources', sub: 'drive, wiki, tickets', step: 0 },
  { id: 'conn', x: 250, y: 70, w: 130, label: 'Connectors', sub: 'webhook + poll', step: 0 },
  { id: 'queue', x: 410, y: 70, w: 130, label: 'Change queue', sub: 'ordered per doc', step: 1 },
  { id: 'pipe', x: 590, y: 70, w: 140, label: 'Chunk, embed', sub: 'ACL on each chunk', step: 1 },
  { id: 'index', x: 410, y: 200, w: 140, h: 80, label: 'Index', sub: 'vectors, BM25, ACL', shape: 'db', step: 1 },
  { id: 'user', x: 90, y: 330, w: 120, label: 'Employee', step: 2 },
  { id: 'api', x: 250, y: 330, w: 130, label: 'Query API', sub: 'caller identity', step: 2 },
  { id: 'retr', x: 410, y: 330, w: 130, label: 'Retriever', sub: 'hybrid search', step: 2 },
  { id: 'rerank', x: 590, y: 330, w: 130, label: 'Reranker', sub: 'top 20', step: 2 },
  { id: 'llm', x: 590, y: 200, w: 130, label: 'Answer model', sub: 'cites chunks', step: 2 },
  { id: 'perm', x: 90, y: 200, w: 140, label: 'Permissions', sub: 'groups, final check', step: 3 },
  { id: 'probe', x: 250, y: 200, w: 130, label: 'Canary probes', sub: 'leak and lag', step: 6 },
];

const edges: BuildEdge[] = [
  { from: 'src', to: 'conn', step: 0 },
  { from: 'conn', to: 'queue', step: 1 },
  { from: 'queue', to: 'pipe', step: 1 },
  { from: 'pipe', to: 'index', step: 1 },
  { from: 'user', to: 'api', head: 'both', step: 2 },
  { from: 'api', to: 'retr', step: 2 },
  { from: 'retr', to: 'index', step: 2 },
  { from: 'retr', to: 'rerank', step: 2 },
  { from: 'rerank', to: 'llm', step: 2 },
  { from: 'conn', to: 'perm', label: 'ACL events', labelAt: [-34, -10], step: 3 },
  { from: 'api', to: 'perm', label: 'groups', labelAt: [-8, 22], step: 3 },
  { from: 'perm', to: 'retr', label: 'final check', labelAt: [52, -28], dashed: true, step: 3 },
  { from: 'probe', to: 'conn', label: 'edit', labelAt: [24, 0], step: 6 },
  { from: 'probe', to: 'api', label: 'ask', labelAt: [26, 20], step: 6 },
];

const steps: BuildStep[] = [
  { req: 'FR1: read company documents', caption: 'Connectors read each source through its API. Each one subscribes to change events (a webhook) and also polls, because a webhook can be missed. The connector keeps one cursor per source, such as a delta link.', packets: [{ from: 'src', to: 'conn', label: 'docs' }] },
  { req: 'FR1: keep the index in step', caption: 'Every change becomes an event on a queue, ordered per document. The pipeline chunks, embeds, and writes vectors, keywords, and the ACL (the list of groups that may read the document) onto each chunk. The doc id and version are on every chunk.', packets: [{ from: 'conn', to: 'queue', label: 'event' }, { from: 'queue', to: 'pipe', label: 'doc 881', delay: 0.9 }, { from: 'pipe', to: 'index', label: 'chunks', delay: 1.8 }] },
  { req: 'FR2: answer with citations', caption: 'The employee asks. The retriever runs hybrid search, the reranker keeps the best 20 chunks, and the model writes an answer that cites chunk ids. The model sees only these chunks.', packets: [{ from: 'user', to: 'api', label: 'question' }, { from: 'api', to: 'retr', label: 'query', delay: 0.9 }, { from: 'retr', to: 'index', label: 'filter', delay: 1.8 }] },
  { req: 'NFR: zero permission leaks', caption: 'The permission service is the source of truth for groups and ACLs. The query API loads the caller’s groups from it, and the retriever filters inside the search. After rerank, the top chunks are checked once more against the permission service.', packets: [{ from: 'api', to: 'perm', label: 'groups' }, { from: 'perm', to: 'retr', label: 'check', delay: 0.9 }] },
  { req: 'NFR: freshness and revokes', caption: 'No new box. ACL changes and deletes take a fast lane on the queue, ahead of ordinary edits. A delete writes a tombstone so a late edit cannot bring the document back, and purges cached answers that cite it.', active: ['queue'] },
  { req: 'NFR: retrieval quality', caption: 'No new box. The pipeline adds a short context line to each chunk before embedding, the retriever merges vector and keyword results, and the reranker orders the merged list. This is where recall is won, before any prompt change.', active: ['pipe', 'retr', 'rerank'] },
  { req: 'NFR: prove it, every day', caption: 'Canary probes edit a test document and revoke a test user in every source, then ask as the probe user. They measure the time until the edit is searchable and the time until the revoke is effective. Those two numbers are the freshness and leak SLOs.', packets: [{ from: 'probe', to: 'conn', label: 'edit' }, { from: 'probe', to: 'api', label: 'ask', delay: 0.9 }] },
];

export default function Ai13RagBuild() {
  return <DesignBuild title="Enterprise RAG with permissions, built up" steps={steps} nodes={nodes} edges={edges} height={400} label="Enterprise RAG architecture growing from connectors to canary probes" />;
}
