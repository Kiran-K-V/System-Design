import { DesignCompare, type CompareVariant } from '../DesignBuild';

const naive: CompareVariant = {
  id: 'raw',
  label: 'Naive: scan raw samples',
  nodes: [
    { id: 'dash', x: 90, y: 150, w: 120, h: 56, label: 'Dashboard' },
    { id: 'query', x: 330, y: 150, w: 130, h: 56, label: 'Query service' },
    { id: 'raw', x: 600, y: 150, w: 130, h: 80, label: 'Raw samples', shape: 'db', sub: '10 s points' },
  ],
  edges: [
    { from: 'dash', to: 'query' },
    { from: 'query', to: 'raw' },
  ],
  steps: [
    { caption: 'A panel shows average CPU for 1,000 servers over 30 days, with one dot per hour. That is 720 dots on screen.', active: ['dash'], notes: [{ x: 90, y: 250, text: 'Ask: 1,000 series x 30 days', size: 14 }] },
    { caption: 'The store keeps one point per 10 seconds. One series has 30 x 86,400 / 10 = 259,200 points. For 1,000 series the query must read 259 million points.', packets: [{ from: 'query', to: 'raw' }], active: ['raw'], tones: { raw: 'warn' } },
    { caption: 'The query then averages 360 raw points into every dot, because 3,600 s / 10 s = 360. The reader waits for minutes, and it competes with ingest for the same disks. The dashboard times out.', tones: { raw: 'bad', query: 'bad', dash: 'bad' }, notes: [{ x: 330, y: 250, text: 'Read 259M to draw 720', size: 14, tone: 'bad' }] },
  ],
};

const rollup: CompareVariant = {
  id: 'rollup',
  label: 'Better: read a rollup',
  nodes: [
    { id: 'dash', x: 90, y: 150, w: 120, h: 56, label: 'Dashboard' },
    { id: 'query', x: 320, y: 150, w: 130, h: 56, label: 'Query service' },
    { id: 'raw', x: 600, y: 60, w: 130, h: 80, label: 'Raw samples', shape: 'db', sub: 'last 15 days' },
    { id: 'hour', x: 600, y: 250, w: 130, h: 80, label: 'Hour rollup', shape: 'db', sub: 'min, max, avg, count' },
  ],
  edges: [
    { from: 'dash', to: 'query' },
    { from: 'query', to: 'raw', dashed: true },
    { from: 'query', to: 'hour' },
  ],
  steps: [
    { caption: 'Same panel: 1,000 servers, 30 days, one dot per hour. The query service looks at the step first. A one-hour step does not need 10-second points.', active: ['query'], notes: [{ x: 90, y: 250, text: 'Step = 1 hour', size: 14 }] },
    { caption: 'It reads the hour rollup. One series has 30 x 24 = 720 points. For 1,000 series that is 720,000 points, 360 times fewer than the raw scan.', packets: [{ from: 'query', to: 'hour' }], active: ['hour'], tones: { hour: 'ok' } },
    { caption: 'The rollup stores min, max, sum, and count per hour, not just the average. A spike stays visible, and an average of averages is still correct because you can weight by count. Raw points stay only for recent hours, then expire.', tones: { hour: 'ok', raw: 'muted', dash: 'ok' }, notes: [{ x: 320, y: 250, text: 'Read 720k to draw 720', size: 14, tone: 'ok' }] },
  ],
};

export default function MetricsRollup() {
  return (
    <DesignCompare
      title="A 30-day graph"
      prompt="Design:"
      variants={[naive, rollup]}
      height={330}
      label="Comparison of a 30-day dashboard query that scans raw ten-second samples against one that reads an hourly rollup."
    />
  );
}
