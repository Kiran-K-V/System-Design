import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const W = 108;
const H = 56;

const nodes: BuildNode[] = [
  { id: 'viewer', x: 64, y: 70, w: W, h: H, label: 'Viewer', step: 0 },
  { id: 'api', x: 212, y: 70, w: W, h: H, label: 'View API', step: 0 },
  { id: 'kafka', x: 360, y: 70, w: W, h: H, label: 'Kafka', sub: 'view events', step: 0 },
  { id: 'flink', x: 508, y: 70, w: W, h: H, label: 'Flink job', sub: 'sum per minute', step: 1 },
  { id: 'counts', x: 656, y: 70, w: 108, h: 88, shape: 'db', label: 'Counts', sub: 'by video id', step: 1 },
  { id: 'reader', x: 64, y: 250, w: W, h: H, label: 'Reader', step: 2 },
  { id: 'topapi', x: 212, y: 250, w: W, h: H, label: 'Top-K API', step: 2 },
  { id: 'cache', x: 360, y: 250, w: W, h: H, label: 'Cache', sub: 'list per window', step: 2 },
  { id: 'job', x: 508, y: 250, w: W, h: H, label: 'Top-K job', sub: 'min-heap of K', step: 2 },
  { id: 'rollup', x: 656, y: 250, w: W, h: H, label: 'Rollup', sub: '1h, 1d, 1mo', step: 3 },
];

const edges: BuildEdge[] = [
  { from: 'viewer', to: 'api', step: 0 },
  { from: 'api', to: 'kafka', step: 0 },
  { from: 'kafka', to: 'flink', step: 1 },
  { from: 'flink', to: 'counts', step: 1 },
  { from: 'reader', to: 'topapi', step: 2 },
  { from: 'topapi', to: 'cache', step: 2 },
  { from: 'job', to: 'cache', step: 2 },
  { from: 'counts', to: 'job', step: 2 },
  { from: 'counts', to: 'rollup', step: 3 },
  { from: 'rollup', to: 'job', step: 3 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: record every view',
    caption: 'The View API does one cheap thing: append the event to a Kafka topic (lesson 8.6). It does not touch a counter. The log absorbs the burst.',
    packets: [{ from: 'viewer', to: 'api', label: 'view' }, { from: 'api', to: 'kafka', label: 'view', delay: 0.9 }],
  },
  {
    req: 'FR1: count views per video',
    caption: 'A Flink job reads the topic, keyed by video id (lesson 8.7). It sums views for one minute, then writes one partial count per video. The store sees far fewer writes than there are views.',
    packets: [{ from: 'kafka', to: 'flink', label: '+1' }, { from: 'flink', to: 'counts', label: '+n', delay: 0.9 }],
  },
  {
    req: 'FR1: read the all-time top K',
    caption: 'Nobody sorts billions of rows per request. A background job scans the counts, keeps a min-heap of size K, and writes the finished list to a cache. The API reads that one small list.',
    packets: [{ from: 'counts', to: 'job', label: 'scan' }, { from: 'job', to: 'cache', label: 'top K', delay: 0.9 }, { from: 'reader', to: 'topapi', delay: 1.8 }],
  },
  {
    req: 'FR2: top K for 1 hour, 1 day, 1 month',
    caption: 'The same pipeline also writes per-minute buckets. A rollup keeps one running total per window: add the newest bucket, subtract the one that just expired. Each window gets its own cached list under its own key.',
    packets: [{ from: 'counts', to: 'rollup', label: 'buckets' }, { from: 'rollup', to: 'job', label: 'sums', delay: 0.9 }],
  },
  {
    req: 'NFR: lists are about a minute old',
    caption: 'Freshness is the sum of the pipeline delays: the Flink emit period, the job period, and the cache refresh. Keep each short and the total stays near the one-minute goal.',
    active: ['flink', 'job', 'cache'],
  },
];

export default function TopkBuild() {
  return <DesignBuild title="Top-K: build it requirement by requirement" steps={steps} nodes={nodes} edges={edges} height={330} label="Top-K architecture growing step by step from a view event to a cached top K list" />;
}
