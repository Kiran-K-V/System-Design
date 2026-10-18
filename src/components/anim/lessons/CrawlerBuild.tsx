import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const W = 108;
const H = 56;

const nodes: BuildNode[] = [
  { id: 'seeds', x: 64, y: 70, w: W, h: H, label: 'Seed URLs', step: 0 },
  { id: 'frontier', x: 212, y: 70, w: W, h: H, label: 'Frontier', sub: 'per-host queues', step: 0 },
  { id: 'fetch', x: 360, y: 70, w: W, h: H, label: 'Fetcher', step: 0 },
  { id: 'web', x: 508, y: 70, w: W, h: H, label: 'The web', shape: 'dashed', step: 0 },
  { id: 'raw', x: 360, y: 205, w: 108, h: 88, shape: 'db', label: 'Raw HTML', sub: 'blob store', step: 1 },
  { id: 'parser', x: 508, y: 205, w: W, h: H, label: 'Parser', step: 1 },
  { id: 'text', x: 508, y: 340, w: 108, h: 88, shape: 'db', label: 'Text', sub: 'blob store', step: 1 },
  { id: 'rules', x: 656, y: 205, w: W, h: H, label: 'Host rules', sub: 'robots.txt, DNS', step: 2 },
  { id: 'dedupe', x: 212, y: 340, w: W, h: H, label: 'Dedupe', sub: 'URL + content', step: 3 },
  { id: 'dlq', x: 64, y: 205, w: W, h: H, label: 'Failed URLs', sub: 'after 5 tries', step: 4 },
];

const edges: BuildEdge[] = [
  { from: 'seeds', to: 'frontier', step: 0 },
  { from: 'frontier', to: 'fetch', step: 0 },
  { from: 'fetch', to: 'web', step: 0 },
  { from: 'fetch', to: 'raw', step: 1 },
  { from: 'raw', to: 'parser', step: 1 },
  { from: 'parser', to: 'text', step: 1 },
  { from: 'fetch', to: 'rules', step: 2 },
  { from: 'parser', to: 'dedupe', step: 3 },
  { from: 'dedupe', to: 'frontier', step: 3 },
  { from: 'frontier', to: 'dlq', step: 4 },
];

const steps: BuildStep[] = [
  {
    req: 'Goal: crawl from seed URLs',
    caption: 'Seed URLs go into the frontier, the list of URLs still to fetch. A fetcher asks the frontier for the next URL and downloads the page. The frontier is a queue (lesson 6.1), so workers can scale out.',
    packets: [{ from: 'seeds', to: 'frontier', label: 'seed' }, { from: 'frontier', to: 'fetch', delay: 0.9 }, { from: 'fetch', to: 'web', delay: 1.8 }],
  },
  {
    req: 'Goal: extract text and store it',
    caption: 'The fetcher writes the raw HTML to blob storage and passes only its id on. A separate parser reads it, extracts the text, and stores that. Two stages mean a parser crash never loses a download.',
    packets: [{ from: 'fetch', to: 'raw', label: 'html' }, { from: 'raw', to: 'parser', delay: 0.9 }, { from: 'parser', to: 'text', label: 'text', delay: 1.8 }],
  },
  {
    req: 'Quality: be polite to every site',
    caption: 'Before each fetch, the fetcher checks the host rules: the cached robots.txt rules, the per-host wait time, and a cached DNS answer (the address lookup for the site). Only then does it send the request.',
    packets: [{ from: 'fetch', to: 'rules', label: 'allowed?' }],
  },
  {
    req: 'Goal: follow links, once each',
    caption: 'The parser also pulls out links. Each link is checked against what is already seen, by URL and by content hash. Only new ones go back into the frontier, so the crawl grows without looping.',
    packets: [{ from: 'parser', to: 'dedupe', label: 'links' }, { from: 'dedupe', to: 'frontier', label: 'new only', delay: 0.9 }],
  },
  {
    req: 'Quality: no lost work',
    caption: 'A failed fetch goes back to the queue and is tried again after a delay. After 5 failures (our assumption) the URL moves to a dead-letter queue, a holding line for failures (lesson 6.4), for a human or a later job to inspect.',
    packets: [{ from: 'frontier', to: 'dlq', label: 'gave up' }],
  },
];

export default function CrawlerBuild() {
  return <DesignBuild title="Web crawler: build it requirement by requirement" steps={steps} nodes={nodes} edges={edges} height={400} label="Web crawler architecture growing from a frontier and fetcher to parsing, politeness, dedupe, and retries" />;
}
