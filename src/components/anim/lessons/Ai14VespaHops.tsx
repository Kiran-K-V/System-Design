import { DesignCompare, type CompareVariant } from '../DesignBuild';
import type { FlowEdge, FlowGroup, FlowNode } from '../FlowDiagram';

/**
 * Network hops in one answer-engine request: separate stores and services, against one engine.
 * Illustrative design of ours. The Vespa page does not publish a hop count or a diagram.
 */

const app: FlowNode = { id: 'app', x: 90, y: 186, w: 140, h: 60, label: 'Answer\nservice' };

const stitched: CompareVariant = {
  id: 'stitched',
  label: 'Separate stores',
  nodes: [
    app,
    { id: 'embed', x: 470, y: 36, w: 220, h: 44, label: 'Embedding server', badge: 1 },
    { id: 'vec', x: 470, y: 94, w: 220, h: 44, label: 'Vector database', badge: 2 },
    { id: 'kw', x: 470, y: 152, w: 220, h: 44, label: 'Keyword index', badge: 2 },
    { id: 'meta', x: 470, y: 210, w: 220, h: 44, label: 'Metadata store', badge: 3 },
    { id: 'light', x: 470, y: 268, w: 220, h: 44, label: 'Light ranker', badge: 4 },
    { id: 'gpu', x: 470, y: 326, w: 220, h: 44, label: 'GPU reranker', badge: 5 },
  ],
  edges: ['embed', 'vec', 'kw', 'meta', 'light', 'gpu'].map((to): FlowEdge => ({ from: 'app', to, head: 'both' })),
  steps: [
    {
      caption: 'Hop 1. The answer service sends the question text to an embedding server and gets a vector back. One round trip.',
      packets: [{ from: 'app', to: 'embed', label: 'text' }],
      active: ['embed'],
    },
    {
      caption: 'Hop 2. It asks the vector database (meaning) and the keyword index (exact words) at the same time. Two calls, but they overlap, so they add one round trip to the critical path.',
      packets: [
        { from: 'app', to: 'vec', label: 'vector' },
        { from: 'app', to: 'kw', label: 'words' },
      ],
      active: ['vec', 'kw'],
    },
    {
      caption: 'Hop 3. Our scenario: the vector database cannot apply the filter well, so the service fetches fields from a metadata store and filters the candidates itself. Candidate lists now cross the wire.',
      packets: [{ from: 'meta', to: 'app', label: '1,000' }],
      active: ['meta'],
      notes: [{ x: 595, y: 214, text: 'filter here', tone: 'warn' }],
    },
    {
      caption: 'Hops 4 and 5. A light ranker service cuts the list. Then the survivors go to a GPU service for the neural rerank. Each call sends the candidates out and gets scores back.',
      packets: [
        { from: 'app', to: 'light', label: '1,000' },
        { from: 'app', to: 'gpu', label: '100' },
      ],
      active: ['light', 'gpu'],
    },
    {
      caption: 'Total: 6 calls and 5 round trips in a row. Each hop costs a round trip, a chance of a slow reply, and a copy of the candidate list over the wire. Fan-out inside each store is not counted here.',
      active: ['app'],
      tones: { embed: 'warn', vec: 'warn', kw: 'warn', meta: 'warn', light: 'warn', gpu: 'warn' },
    },
  ],
};

const engineNodes = (neural: boolean): FlowNode[] => [
  { id: 'ret', x: 565, y: 85, w: 210, h: 44, label: 'Hybrid retrieval', badge: 2 },
  { id: 'fil', x: 565, y: 150, w: 210, h: 44, label: 'Filter' },
  { id: 'lt', x: 565, y: 215, w: 210, h: 44, label: 'Light ranker' },
  ...(neural ? [{ id: 'nn', x: 565, y: 280, w: 210, h: 44, label: 'Neural ranker' }] : []),
];

const engineEdges = (neural: boolean): FlowEdge[] => [
  { from: 'ret', to: 'fil', tone: 'muted' },
  { from: 'fil', to: 'lt', tone: 'muted' },
  ...(neural ? [{ from: 'lt', to: 'nn', tone: 'muted' as const }] : []),
];

const engineOut: CompareVariant = {
  id: 'engineOut',
  label: 'One engine, reranker outside',
  nodes: [
    app,
    { id: 'embed', x: 290, y: 60, w: 200, h: 44, label: 'Embedding server', badge: 1 },
    ...engineNodes(false),
    { id: 'gpu', x: 290, y: 290, w: 200, h: 44, label: 'GPU reranker', badge: 3 },
  ],
  edges: [
    { from: 'app', to: 'embed', head: 'both' },
    { from: 'app', to: 'ret', head: 'both' },
    { from: 'app', to: 'gpu', head: 'both' },
    ...engineEdges(false),
  ],
  groups: [{ x: 440, y: 28, w: 260, h: 224, label: 'One engine, same nodes' } as FlowGroup],
  steps: [
    {
      caption: 'Hop 1. Same as before: the question text goes to an embedding server. The page does not say the engine makes the query vector, so we keep this call.',
      packets: [{ from: 'app', to: 'embed', label: 'text' }],
      active: ['embed'],
    },
    {
      caption: 'Hop 2. One query goes to the engine. Retrieval, the filter and the light ranker run on the engine nodes that hold the data. The candidate list moves between stages inside the engine, not between services.',
      packets: [{ from: 'app', to: 'ret', label: 'query' }],
      active: ['ret', 'fil', 'lt'],
    },
    {
      caption: 'Hop 3. The neural model is still a separate service. The engine returns 100 passages to the answer service, and the service sends them on to the GPU. Those 100 passages cross the wire twice.',
      packets: [{ from: 'app', to: 'gpu', label: '100' }],
      active: ['gpu'],
      tones: { gpu: 'warn' },
    },
    {
      caption: 'Total: 3 calls and 3 round trips in a row, down from 6 and 5. The metadata hop and the light-ranker hop are gone. The inference hop is still there.',
      active: ['app'],
    },
  ],
};

const engineIn: CompareVariant = {
  id: 'engineIn',
  label: 'One engine, inference inside',
  nodes: [app, { id: 'embed', x: 290, y: 60, w: 200, h: 44, label: 'Embedding server', badge: 1 }, ...engineNodes(true)],
  edges: [{ from: 'app', to: 'embed', head: 'both' }, { from: 'app', to: 'ret', head: 'both' }, ...engineEdges(true)],
  groups: [{ x: 440, y: 28, w: 260, h: 289, label: 'One engine, same nodes' } as FlowGroup],
  steps: [
    {
      caption: 'Hop 1. The query vector still comes from an embedding server. Our reading: this hop stays unless the engine also makes the query vector, which the page does not claim.',
      packets: [{ from: 'app', to: 'embed', label: 'text' }],
      active: ['embed'],
    },
    {
      caption: 'Hop 2. One query goes to the engine. It retrieves, filters, light-ranks and neural-ranks on its own nodes. Company claim (Vespa): it runs "ranking models and cross-encoders directly within the serving layer".',
      packets: [{ from: 'app', to: 'ret', label: 'query' }],
      active: ['ret', 'fil', 'lt', 'nn'],
    },
    {
      caption: 'Only the final 10 passages travel back to the answer service. The 1,000 and the 100 never leave the engine.',
      active: ['nn'],
      tones: { nn: 'ok' },
    },
    {
      caption: 'Total: 2 calls and 2 round trips. On our assumptions that saves a few milliseconds of network. The bigger gains are fewer chances of a slow reply and no second copy of the data to keep in step.',
      active: ['app'],
      tones: { embed: 'ok', ret: 'ok', fil: 'ok', lt: 'ok', nn: 'ok' },
    },
  ],
};

export default function Ai14VespaHops() {
  return (
    <DesignCompare
      title="Hops in one answer-engine request (illustrative design)"
      prompt="Design:"
      variants={[stitched, engineOut, engineIn]}
      height={372}
      label="Three designs of one answer-engine request. Separate stores need 6 calls and 5 round trips in a row. One engine with the reranker outside needs 3. One engine with inference inside needs 2."
    />
  );
}
