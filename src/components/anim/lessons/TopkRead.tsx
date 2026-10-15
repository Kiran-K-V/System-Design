import { DesignCompare, type CompareVariant } from '../DesignBuild';

const W = 120;
const H = 56;

const naive: CompareVariant = {
  id: 'naive',
  label: 'Naive: sort on every read',
  nodes: [
    { id: 'reader', x: 90, y: 150, w: W, h: H, label: 'Reader' },
    { id: 'api', x: 280, y: 150, w: W, h: H, label: 'Top-K API' },
    { id: 'counts', x: 500, y: 150, w: 150, h: 90, shape: 'db', label: 'Counts table', sub: '4B rows, 64 GB' },
  ],
  edges: [
    { from: 'reader', to: 'api' },
    { from: 'api', to: 'counts' },
  ],
  steps: [
    { caption: 'A reader asks for the top 1,000 videos in the last hour.', packets: [{ from: 'reader', to: 'api', label: 'top K' }], active: ['reader'] },
    {
      caption: 'The API runs ORDER BY views DESC LIMIT 1000. The database must visit every row, or keep an index that changes on every single view.',
      packets: [{ from: 'api', to: 'counts', label: 'sort' }],
      tones: { counts: 'warn' },
      active: ['counts'],
    },
    {
      caption: 'The table is 64 GB (4B rows x 16 B). Every request repeats the scan, and the scans fight the view writes for the same disk and CPU. Latency is far above tens of milliseconds.',
      tones: { counts: 'bad' },
      active: ['counts'],
    },
  ],
};

const better: CompareVariant = {
  id: 'better',
  label: 'Better: precompute and cache',
  nodes: [
    { id: 'reader', x: 80, y: 80, w: W, h: H, label: 'Reader' },
    { id: 'api', x: 250, y: 80, w: W, h: H, label: 'Top-K API' },
    { id: 'cache', x: 420, y: 80, w: W, h: H, label: 'Cache', sub: '16 KB each' },
    { id: 'job', x: 420, y: 220, w: W, h: H, label: 'Top-K job' },
    { id: 'counts', x: 600, y: 220, w: 110, h: 90, shape: 'db', label: 'Counts' },
  ],
  edges: [
    { from: 'reader', to: 'api' },
    { from: 'api', to: 'cache' },
    { from: 'job', to: 'cache' },
    { from: 'counts', to: 'job' },
  ],
  steps: [
    { caption: 'The same request arrives.', packets: [{ from: 'reader', to: 'api', label: 'top K' }], active: ['reader'] },
    {
      caption: 'The API reads one small value from the cache: at most 1,000 entries of 16 bytes, about 16 KB. No scan, no sort.',
      packets: [{ from: 'api', to: 'cache', label: 'get' }],
      tones: { cache: 'ok' },
      active: ['cache'],
    },
    {
      caption: 'Meanwhile, every 30 seconds (our assumption), the job scans the counts once. It keeps a min-heap of size K, so memory is K entries, not 4B.',
      packets: [{ from: 'counts', to: 'job', label: 'scan' }],
      active: ['job'],
    },
    {
      caption: 'The job writes the new list to the cache. Cost per refresh is one scan, however many readers there are. The price is a list that is up to 30 seconds old.',
      packets: [{ from: 'job', to: 'cache', label: 'top K' }],
      tones: { cache: 'ok' },
      active: ['cache'],
    },
  ],
};

export default function TopkRead() {
  return <DesignCompare title="Top K read path" prompt="Design:" variants={[naive, better]} height={290} label="Top K read path with a naive sort on every request and a precomputed cached list" />;
}
