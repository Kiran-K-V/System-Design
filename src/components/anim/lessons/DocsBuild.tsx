import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'a', x: 55, y: 110, w: 80, h: 56, label: 'Editor A', step: 0 },
  { id: 'api', x: 210, y: 340, w: 110, h: 56, label: 'Docs API', step: 0 },
  { id: 'store', x: 385, y: 340, w: 120, h: 70, label: 'Doc store', shape: 'db', step: 0 },
  { id: 'collab', x: 300, y: 200, w: 150, h: 64, label: 'Collab server', sub: 'one owner per doc', step: 1 },
  { id: 'b', x: 55, y: 290, w: 80, h: 56, label: 'Editor B', step: 1 },
  { id: 'oplog', x: 510, y: 200, w: 110, h: 70, label: 'Edit log', shape: 'db', step: 2 },
  { id: 'cursors', x: 490, y: 75, w: 130, h: 56, label: 'Cursors', sub: 'memory only', shape: 'dashed', step: 4 },
  { id: 'snap', x: 625, y: 340, w: 120, h: 56, label: 'Snapshots', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'a', to: 'api', step: 0 },
  { from: 'api', to: 'store', step: 0 },
  { from: 'a', to: 'collab', step: 1, head: 'both' },
  { from: 'b', to: 'collab', step: 1, head: 'both' },
  { from: 'collab', to: 'oplog', step: 2 },
  { from: 'collab', to: 'cursors', step: 4 },
  { from: 'snap', to: 'oplog', step: 5 },
  { from: 'snap', to: 'store', step: 5 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: create a document',
    caption: 'The simplest part. An editor calls the docs API, which stores a new document with an empty snapshot. Opening a document later loads its latest snapshot over plain HTTP.',
    packets: [{ from: 'a', to: 'api', label: 'create' }, { from: 'api', to: 'store', label: 'empty doc', delay: 0.9 }],
  },
  {
    req: 'FR2: many editors, one document',
    caption: 'Each editor opens a WebSocket (lesson 2.5) to a collaboration server. All editors of one document are routed to the same server, chosen by hashing the document id (lesson 4.8). That server orders their edits.',
    packets: [{ from: 'a', to: 'collab', label: 'edit' }, { from: 'b', to: 'collab', label: 'edit', delay: 0.4 }],
  },
  {
    req: 'NFR: no edit is lost',
    caption: 'The server appends each edit to a durable operation log before it confirms. If the server dies, the log still has every confirmed edit, in order.',
    packets: [{ from: 'collab', to: 'oplog', label: 'append' }],
  },
  {
    req: 'FR3: edits appear live',
    caption: 'No new box. After the server orders and merges an edit, it sends the result to every other editor on the same document. The merge step is operational transform or a CRDT, two methods the lesson explains below. The deep dive below works one example by hand.',
    packets: [{ from: 'collab', to: 'a', label: 'edit', tone: 'ok' }, { from: 'collab', to: 'b', label: 'edit', tone: 'ok' }],
    active: ['collab'],
  },
  {
    req: 'FR4: see cursors and presence',
    caption: 'Cursor positions live in memory on the collaboration server. They are not written to any database. The server throttles them and drops a user who stops sending small "still here" messages.',
    packets: [{ from: 'collab', to: 'cursors', label: 'cursor' }],
  },
  {
    req: 'NFR: storage stays bounded',
    caption: 'A snapshot job saves a copy of the full text every N operations and lets old log entries be trimmed. To open a document or recover after a crash, load the latest snapshot and replay the few operations after it.',
    packets: [{ from: 'snap', to: 'oplog', label: 'read' }, { from: 'snap', to: 'store', label: 'save', delay: 0.9 }],
  },
];

export default function DocsBuild() {
  return (
    <DesignBuild
      title="Google Docs, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={400}
      label="High-level design of a collaborative document editor that grows from an editor, a docs API, and a document store to include a collaboration server, a second editor, an operation log, in-memory cursors, and a snapshot job."
    />
  );
}
