import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** Ad click aggregator: the high-level design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'browser', x: 90, y: 80, w: 120, label: 'Browser', step: 0 },
  { id: 'click', x: 250, y: 80, w: 130, label: 'Click service', step: 0 },
  { id: 'kafka', x: 410, y: 80, w: 130, h: 80, label: 'Kafka', sub: 'by ad id', shape: 'db', step: 1 },
  { id: 'lake', x: 590, y: 80, w: 130, h: 80, label: 'Raw lake', sub: 'all raw clicks', shape: 'db', step: 5 },
  { id: 'flink', x: 410, y: 220, w: 130, label: 'Flink', sub: '1 min windows', step: 2 },
  { id: 'batch', x: 590, y: 220, w: 130, label: 'Batch job', sub: 'recount', step: 6 },
  { id: 'adv', x: 90, y: 360, w: 120, label: 'Advertiser', step: 4 },
  { id: 'api', x: 250, y: 360, w: 130, label: 'Query API', step: 4 },
  { id: 'olap', x: 410, y: 360, w: 140, h: 80, label: 'Analytics DB', sub: 'ad + minute rows', shape: 'db', step: 3 },
];

const edges: BuildEdge[] = [
  { from: 'browser', to: 'click', head: 'both', step: 0 },
  { from: 'click', to: 'kafka', step: 1 },
  { from: 'kafka', to: 'flink', label: 'ad id', labelAt: [-34, 0], step: 2 },
  { from: 'flink', to: 'olap', label: 'upsert', labelAt: [-30, 0], step: 3 },
  { from: 'adv', to: 'api', step: 4 },
  { from: 'api', to: 'olap', step: 4 },
  { from: 'kafka', to: 'lake', step: 5 },
  { from: 'lake', to: 'batch', step: 6 },
  { from: 'batch', to: 'olap', label: 'fix', labelAt: [38, 6], step: 6 },
];

const steps: BuildStep[] = [
  { req: 'FR1: send the user to the advertiser', caption: 'The browser calls the click service. The service checks the signed click token and answers with a redirect to the advertiser. The user never waits for any counting.', packets: [{ from: 'browser', to: 'click', label: 'click' }] },
  { req: 'NFR: do not lose a click', caption: 'Before it redirects, the click service appends the click to a durable log. Kafka keeps the click even if everything after it is down (the Kafka lesson). Records are keyed by ad id.', packets: [{ from: 'click', to: 'kafka', label: 'click' }] },
  { req: 'FR2: counts per ad per minute', caption: 'A Flink job reads the log. Events with the same ad id go to the same task. The task counts clicks in one-minute windows, cut by the time stamped on each click (the Flink lesson).', packets: [{ from: 'kafka', to: 'flink', label: 'click' }] },
  { req: 'FR2: counts per ad per minute', caption: 'When a window closes, Flink upserts one row: it creates or replaces the row for the key (ad id, minute) with the full count. The key makes the write safe to repeat. The deep dive below shows why that matters.', packets: [{ from: 'flink', to: 'olap', label: 'set 40' }] },
  { req: 'FR2: advertisers query the counts', caption: 'The query API reads pre-aggregated rows. One day of one ad is at most 1,440 rows, so the query stays fast. It never scans raw clicks.', packets: [{ from: 'adv', to: 'api', label: 'query' }, { from: 'api', to: 'olap', label: 'read', delay: 0.9 }] },
  { req: 'NFR: do not lose a click', caption: 'A second consumer copies every raw event into cheap object storage. Kafka keeps data only for its retention period. The lake keeps it for good, so we can recount any hour.', packets: [{ from: 'kafka', to: 'lake', label: 'copy' }] },
  { req: 'NFR: counts must be right', caption: 'A batch job recounts the raw clicks for finished hours, removes duplicate click ids, and overwrites any row that differs from the streaming result. It also fixes events that arrived too late for their window.', packets: [{ from: 'lake', to: 'batch', label: 'read' }, { from: 'batch', to: 'olap', label: 'fix', delay: 0.9 }] },
  { req: 'NFR: count a click once', caption: 'No new box. Each click carries a unique click id, signed by the ad server. Flink remembers recent ids per ad in checkpointed state and drops repeats. Deduplication happens inside the stream, where it survives restarts.', active: ['flink'] },
];

export default function AdClickBuild() {
  return <DesignBuild title="Ad click aggregator, built up" steps={steps} nodes={nodes} edges={edges} height={410} label="Ad click aggregator architecture growing from click service to batch reconciliation" />;
}
