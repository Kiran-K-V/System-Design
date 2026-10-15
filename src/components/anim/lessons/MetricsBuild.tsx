import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'svc', x: 70, y: 200, w: 100, h: 56, label: 'Services', step: 0 },
  { id: 'col', x: 225, y: 200, w: 110, h: 56, label: 'Collector', step: 0 },
  { id: 'buf', x: 375, y: 200, w: 90, h: 56, label: 'Buffer', step: 1 },
  { id: 'store', x: 545, y: 200, w: 110, h: 80, label: 'Series\nstore', shape: 'db', step: 1 },
  { id: 'dash', x: 375, y: 70, w: 110, h: 56, label: 'Dashboard', step: 2 },
  { id: 'query', x: 545, y: 70, w: 110, h: 60, label: 'Query\nservice', step: 2 },
  { id: 'roll', x: 545, y: 335, w: 110, h: 70, label: 'Rollups', shape: 'db', step: 3 },
  { id: 'eval', x: 225, y: 335, w: 110, h: 60, label: 'Rule\nevaluator', step: 4 },
  { id: 'alert', x: 70, y: 335, w: 100, h: 60, label: 'Alert\nmanager', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'col', to: 'svc', step: 0 },
  { from: 'col', to: 'buf', step: 1 },
  { from: 'buf', to: 'store', step: 1 },
  { from: 'dash', to: 'query', step: 2 },
  { from: 'query', to: 'store', step: 2 },
  { from: 'store', to: 'roll', step: 3 },
  { from: 'query', to: 'roll', step: 3, bend: 150 },
  { from: 'store', to: 'eval', step: 4 },
  { from: 'eval', to: 'alert', step: 5 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: ingest metrics',
    caption: 'The collector pulls. Every 10 seconds it calls each service for its current values. This is the Prometheus model. A service that does not answer is a service that is down, and the collector knows it at once.',
    packets: [{ from: 'col', to: 'svc' }],
  },
  {
    req: 'NFR: 5M points per second',
    caption: 'Points flow through a buffer into a store built for time series (lesson 10.2). The buffer is a log (lesson 6.2). A burst piles up there instead of crushing the store, and the store drains at its own speed.',
    packets: [{ from: 'col', to: 'buf' }, { from: 'buf', to: 'store', delay: 0.5 }],
  },
  {
    req: 'FR2: query and graph',
    caption: 'A query service turns a request such as "average CPU by region, last 7 days" into reads on the store. Dashboards only talk to this service.',
    packets: [{ from: 'dash', to: 'query' }, { from: 'query', to: 'store', delay: 0.5 }],
  },
  {
    req: 'NFR: fast graphs over weeks',
    caption: 'A rollup job writes coarser copies of old data: one point per minute, then one per hour. A 30-day graph reads the hourly rollup. The deep dive below shows the saving.',
  },
  {
    req: 'FR3: alert rules',
    caption: 'A rule evaluator runs every rule on a fixed timer. It reads the store, compares the result with the threshold, and keeps a pending state until the condition has held for the whole window.',
    packets: [{ from: 'store', to: 'eval' }],
  },
  {
    req: 'FR4: notify people',
    caption: 'Firing alerts go to an alert manager. It groups alerts, drops duplicates, honors silences, and routes each one to email, Slack, or a pager.',
    packets: [{ from: 'eval', to: 'alert' }],
  },
  {
    req: 'NFR: bounded cost',
    caption: 'No new box. The collector enforces a limit on how many distinct series one service may create, and drops the rest. Without this cap, one bad label can create millions of series and bring the store down.',
    active: ['col'],
  },
];

export default function MetricsBuild() {
  return (
    <DesignBuild
      title="Metrics monitoring, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={400}
      label="High-level design of a metrics system: a collector scrapes services, a buffer feeds a series store, a query service and rollups serve dashboards, and a rule evaluator feeds an alert manager."
    />
  );
}
