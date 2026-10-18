import { DesignCompare, type CompareVariant } from '../DesignBuild';

const W = 120;
const H = 56;

const naive: CompareVariant = {
  id: 'naive',
  label: 'Naive: one global queue',
  nodes: [
    { id: 'q', x: 90, y: 150, w: W, h: H, label: 'Global queue', sub: 'A A A A B C' },
    { id: 'f', x: 280, y: 150, w: W, h: H, label: '4 fetchers' },
    { id: 'ha', x: 520, y: 70, w: 130, h: H, label: 'bigsite.com' },
    { id: 'hb', x: 520, y: 150, w: 130, h: H, label: 'b.example' },
    { id: 'hc', x: 520, y: 230, w: 130, h: H, label: 'c.example' },
  ],
  edges: [
    { from: 'q', to: 'f' },
    { from: 'f', to: 'ha' },
    { from: 'f', to: 'hb' },
    { from: 'f', to: 'hc' },
  ],
  steps: [
    { caption: 'Pages from one big site arrive in a run, because pages link to pages on the same site. The queue is first in, first out.', active: ['q'] },
    {
      caption: 'Four fetchers each take the next URL. All four URLs belong to bigsite.com, so four requests hit it in the same instant.',
      packets: [{ from: 'q', to: 'f', label: 'A A A A' }, { from: 'f', to: 'ha', label: 'GET' }, { from: 'f', to: 'ha', label: 'GET', delay: 0.1 }],
      active: ['f'],
    },
    {
      caption: 'The site slows down, blocks the crawler, or answers 429 (too many requests, a status code that tells you to slow down). Meanwhile b.example and c.example sit idle, and a ban hurts the whole crawl.',
      tones: { ha: 'bad', hb: 'muted', hc: 'muted' },
      active: ['ha'],
    },
  ],
};

const better: CompareVariant = {
  id: 'better',
  label: 'Better: a queue per host',
  nodes: [
    { id: 'r', x: 70, y: 150, w: 110, h: H, label: 'Frontier' },
    { id: 'qa', x: 230, y: 70, w: 110, h: H, label: 'Queue A' },
    { id: 'qb', x: 230, y: 150, w: 110, h: H, label: 'Queue B' },
    { id: 'qc', x: 230, y: 230, w: 110, h: H, label: 'Queue C' },
    { id: 'f', x: 400, y: 150, w: 110, h: H, label: 'Fetcher', sub: 'host timers' },
    { id: 'ha', x: 600, y: 70, w: 130, h: H, label: 'bigsite.com' },
    { id: 'hb', x: 600, y: 150, w: 130, h: H, label: 'b.example' },
    { id: 'hc', x: 600, y: 230, w: 130, h: H, label: 'c.example' },
  ],
  edges: [
    { from: 'r', to: 'qa' },
    { from: 'r', to: 'qb' },
    { from: 'r', to: 'qc' },
    { from: 'qa', to: 'f' },
    { from: 'qb', to: 'f' },
    { from: 'qc', to: 'f' },
    { from: 'f', to: 'ha' },
    { from: 'f', to: 'hb' },
    { from: 'f', to: 'hc' },
  ],
  steps: [
    { caption: 'The frontier files each URL into the queue for its host. One host, one queue.', packets: [{ from: 'r', to: 'qa', label: 'A' }, { from: 'r', to: 'qb', label: 'B', delay: 0.2 }, { from: 'r', to: 'qc', label: 'C', delay: 0.4 }], active: ['r'] },
    {
      caption: 'A timer per host says when that host may be contacted again, for example one second after the last request. The fetcher takes from any queue whose timer has expired.',
      active: ['f'],
    },
    {
      caption: 'Each host gets one request, then waits. Load is spread across hosts and no host sees a burst. Fetchers stay busy because there are many hosts to choose from.',
      packets: [{ from: 'f', to: 'ha', label: 'GET' }, { from: 'f', to: 'hb', label: 'GET', delay: 0.2 }, { from: 'f', to: 'hc', label: 'GET', delay: 0.4 }],
      tones: { ha: 'ok', hb: 'ok', hc: 'ok' },
      active: ['f'],
    },
    {
      caption: 'The cost shows up for one huge site. Its queue grows while the others finish. At one request per second, 10 million pages from one host take about 116 days, so cap pages per host.',
      tones: { qa: 'warn' },
      active: ['qa'],
    },
  ],
};

export default function CrawlerQueues() {
  return <DesignCompare title="Frontier design" prompt="Design:" variants={[naive, better]} height={290} label="One global crawl queue hitting a single host versus one queue per host with timers" />;
}
