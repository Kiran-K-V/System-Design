import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket } from '../FlowDiagram';

interface DnsStep {
  caption: string;
  active: string[];
  packets: FlowPacket[];
  cache: string;
  badge: number | null;
}

const IP = '203.0.113.7';

const baseNodes: FlowNode[] = [
  { id: 'client', x: 62, y: 150, w: 108, label: 'Browser', sub: 'stub resolver' },
  { id: 'resolver', x: 250, y: 150, w: 120, h: 72, label: 'Resolver', sub: 'recursive' },
  { id: 'root', x: 598, y: 45, w: 200, label: 'Root server', sub: 'knows who runs .com' },
  { id: 'tld', x: 598, y: 150, w: 200, label: '.com TLD server', sub: 'knows who runs example.com' },
  { id: 'auth', x: 598, y: 255, w: 200, label: 'Authoritative', sub: 'holds example.com records' },
];

const edges: FlowEdge[] = [
  { from: 'client', to: 'resolver', head: 'both' },
  { from: 'resolver', to: 'root', head: 'both' },
  { from: 'resolver', to: 'tld', head: 'both' },
  { from: 'resolver', to: 'auth', head: 'both' },
];

const steps: DnsStep[] = [
  {
    caption: 'You type www.example.com. The browser needs an IP address. Its own cache and the OS cache have no entry. So it asks a recursive resolver, a server that does the lookup work on its behalf.',
    active: ['client'],
    packets: [],
    cache: 'cache: empty',
    badge: null,
  },
  {
    caption: 'Query 1: "What is the A record (IPv4 address) for www.example.com?" This is a recursive query. It means "do whatever it takes and bring me the answer". The resolver checks its cache. Nothing there.',
    active: ['client', 'resolver'],
    packets: [{ from: 'client', to: 'resolver' }],
    cache: 'cache: empty (miss)',
    badge: 1,
  },
  {
    caption: 'The resolver starts at the top. It asks a root server. The root does not know the IP. It knows who runs .com, and answers with a referral: "ask these .com servers". Resolvers ship with the root server list built in.',
    active: ['resolver', 'root'],
    packets: [
      { from: 'resolver', to: 'root' },
      { from: 'root', to: 'resolver', label: 'ask .com', tone: 'warn', delay: 1 },
    ],
    cache: 'cache: empty',
    badge: 2,
  },
  {
    caption: 'The resolver asks a .com TLD (top-level domain) server. It also lacks the IP. It knows which name servers own example.com, and refers the resolver there.',
    active: ['resolver', 'tld'],
    packets: [
      { from: 'resolver', to: 'tld' },
      { from: 'tld', to: 'resolver', label: 'ask ns1', tone: 'warn', delay: 1 },
    ],
    cache: 'cache: NS for .com',
    badge: 3,
  },
  {
    caption: `The resolver asks the authoritative server for example.com. This server holds the real records. It answers: www.example.com is ${IP}, with a TTL (time to live) of 300 seconds.`,
    active: ['resolver', 'auth'],
    packets: [
      { from: 'resolver', to: 'auth' },
      { from: 'auth', to: 'resolver', label: IP, tone: 'ok', delay: 1 },
    ],
    cache: 'cache: NS .com, NS example.com',
    badge: 4,
  },
  {
    caption: `The resolver stores the answer for 300 seconds and returns it to the browser. Cold cost: 1 hop to the resolver plus 3 hops upstream. At ~10 ms to the resolver and ~30 ms per upstream hop (illustrative), that is ~100 ms before the first TCP packet.`,
    active: ['client', 'resolver'],
    packets: [{ from: 'resolver', to: 'client', label: IP, tone: 'ok' }],
    cache: `cache: www = ${IP} (300 s)`,
    badge: 5,
  },
  {
    caption: 'Another user on the same resolver asks 20 seconds later. The resolver finds the answer in its cache and replies at once. No upstream server is touched. Cost: one hop, ~10 ms. This is why DNS survives billions of lookups.',
    active: ['client', 'resolver'],
    packets: [
      { from: 'client', to: 'resolver' },
      { from: 'resolver', to: 'client', label: IP, tone: 'ok', delay: 1 },
    ],
    cache: 'cache hit, 280 s left',
    badge: 6,
  },
  {
    caption: 'After 300 seconds the entry expires. The next query must refresh it. But the resolver still remembers who runs .com and example.com (those records live much longer), so it skips the root and TLD and asks the authoritative server directly.',
    active: ['resolver', 'auth'],
    packets: [
      { from: 'resolver', to: 'auth' },
      { from: 'auth', to: 'resolver', label: IP, tone: 'ok', delay: 1 },
    ],
    cache: 'expired: ask authoritative',
    badge: 7,
  },
];

export default function DnsWalk() {
  return (
    <AnimFrame title="DNS: a cold lookup, then a cached one" steps={steps} interval={3000}>
      {(i, step) => {
        const nodes = baseNodes.map((n) => (step.active.includes(n.id) ? n : { ...n, tone: 'default' as const }));
        const notes: FlowNote[] = [{ x: 150, y: 42, text: 'Question every time:\nwhat is the A record of\nwww.example.com?', anchor: 'middle', size: 14 }, { x: 14, y: 215, text: step.cache, anchor: 'start', size: 14, tone: step.cache.includes('hit') ? 'ok' : undefined }];
        const withBadge = nodes.map((n) => (n.id === 'resolver' && step.badge ? { ...n, badge: step.badge } : n));
        return (
          <FlowDiagram
            width={720}
            height={300}
            nodes={withBadge}
            edges={edges}
            notes={notes}
            active={step.active}
            packets={step.packets}
            stepKey={i}
            travel={0.9}
            label="DNS lookup path from browser to recursive resolver to root, TLD and authoritative servers"
          />
        );
      }}
    </AnimFrame>
  );
}
