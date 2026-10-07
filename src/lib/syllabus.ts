// Single source of truth for lesson order and titles.
// A lesson id is "<module.slug>/<lesson.slug>" and matches the MDX path under src/content/lessons.

export interface LessonOutline {
  slug: string;
  title: string;
}

export interface ModuleOutline {
  slug: string;
  title: string;
  lessons: LessonOutline[];
}

export const syllabus: ModuleOutline[] = [
  {
    slug: '00-orientation',
    title: 'Orientation',
    lessons: [
      { slug: 'how-to-use', title: 'How to Use This Site' },
      { slug: 'interview-game', title: 'The Interview Game' },
      { slug: 'delivery-framework', title: 'Delivery Framework' },
    ],
  },
  {
    slug: '01-one-machine',
    title: 'First Principles: One Machine',
    lessons: [
      { slug: 'request-journey', title: 'What a Computer Does With a Request' },
      { slug: 'latency-numbers', title: 'Latency Numbers' },
      { slug: 'throughput-vs-latency', title: 'Throughput vs Latency' },
      { slug: 'estimation', title: 'Back-of-Envelope Estimation' },
      { slug: 'numbers-to-know', title: 'Numbers to Know' },
    ],
  },
  {
    slug: '02-networking',
    title: 'Networking',
    lessons: [
      { slug: 'ip-tcp-udp', title: 'IP, TCP, UDP' },
      { slug: 'dns', title: 'DNS' },
      { slug: 'http-tls', title: 'HTTP and TLS' },
      { slug: 'load-balancing', title: 'Load Balancing' },
      { slug: 'real-time-transport', title: 'Real-time Transport' },
      { slug: 'rpc-grpc', title: 'RPC and gRPC' },
      { slug: 'cdn-proxies', title: 'CDN and Proxies' },
    ],
  },
  {
    slug: '03-api-design',
    title: 'API Design',
    lessons: [
      { slug: 'rest', title: 'REST Resources' },
      { slug: 'graphql-rpc', title: 'GraphQL and RPC Styles' },
      { slug: 'pagination', title: 'Pagination' },
      { slug: 'idempotency', title: 'Idempotency' },
      { slug: 'auth', title: 'Auth Basics' },
    ],
  },
  {
    slug: '04-data',
    title: 'Data: Storage From First Principles',
    lessons: [
      { slug: 'data-modeling', title: 'Data Modeling' },
      { slug: 'storage-engines', title: 'How a Database Stores Data' },
      { slug: 'indexing', title: 'Indexing' },
      { slug: 'transactions', title: 'Transactions and Isolation' },
      { slug: 'sql-vs-nosql', title: 'SQL vs NoSQL' },
      { slug: 'replication', title: 'Replication' },
      { slug: 'sharding', title: 'Sharding' },
      { slug: 'consistent-hashing', title: 'Consistent Hashing' },
      { slug: 'cap-pacelc', title: 'CAP and PACELC' },
      { slug: 'consistency-models', title: 'Consistency Models' },
      { slug: 'consensus', title: 'Consensus' },
    ],
  },
  {
    slug: '05-caching',
    title: 'Caching',
    lessons: [
      { slug: 'why-cache', title: 'Why Cache' },
      { slug: 'cache-placement', title: 'Cache Placement' },
      { slug: 'cache-strategies', title: 'Cache Strategies' },
      { slug: 'eviction', title: 'Eviction' },
      { slug: 'invalidation-stampede', title: 'Invalidation and Stampede' },
    ],
  },
  {
    slug: '06-async',
    title: 'Asynchronous Systems',
    lessons: [
      { slug: 'queues', title: 'Queues' },
      { slug: 'pubsub-logs', title: 'Pub/Sub and Logs' },
      { slug: 'delivery-semantics', title: 'Delivery Semantics' },
      { slug: 'backpressure-dlq', title: 'Backpressure and Dead-letter Queues' },
      { slug: 'cdc', title: 'Change Data Capture' },
    ],
  },
  {
    slug: '07-reliability',
    title: 'Reliability and Operations',
    lessons: [
      { slug: 'failure-modes', title: 'Failure Modes' },
      { slug: 'timeouts-retries', title: 'Timeouts, Retries, Backoff' },
      { slug: 'circuit-breaker', title: 'Circuit Breaker and Bulkhead' },
      { slug: 'rate-limiting', title: 'Rate Limiting Algorithms' },
      { slug: 'observability', title: 'Observability' },
    ],
  },
  {
    slug: '08-technologies',
    title: 'Key Technologies',
    lessons: [
      { slug: 'postgresql', title: 'PostgreSQL' },
      { slug: 'redis', title: 'Redis' },
      { slug: 'cassandra', title: 'Cassandra' },
      { slug: 'dynamodb', title: 'DynamoDB' },
      { slug: 'elasticsearch', title: 'Elasticsearch' },
      { slug: 'kafka', title: 'Kafka' },
      { slug: 'flink', title: 'Flink' },
      { slug: 'zookeeper', title: 'ZooKeeper / etcd' },
      { slug: 'temporal', title: 'Temporal' },
      { slug: 'api-gateway', title: 'API Gateway' },
      { slug: 'blob-storage', title: 'Blob Storage and CDN' },
    ],
  },
  {
    slug: '09-patterns',
    title: 'Patterns',
    lessons: [
      { slug: 'scaling-reads', title: 'Scaling Reads' },
      { slug: 'scaling-writes', title: 'Scaling Writes' },
      { slug: 'real-time-updates', title: 'Real-time Updates' },
      { slug: 'contention', title: 'Dealing with Contention' },
      { slug: 'multi-step', title: 'Multi-step Processes' },
      { slug: 'large-blobs', title: 'Handling Large Blobs' },
      { slug: 'long-running-tasks', title: 'Long-running Tasks' },
    ],
  },
  {
    slug: '10-advanced',
    title: 'Advanced Topics',
    lessons: [
      { slug: 'proximity-search', title: 'Proximity Search' },
      { slug: 'time-series', title: 'Time Series Databases' },
      { slug: 'big-data-structures', title: 'Big-data Structures' },
      { slug: 'vector-databases', title: 'Vector Databases' },
      { slug: 'ids-and-time', title: 'Distributed IDs and Time' },
    ],
  },
  {
    slug: '11-breakdowns',
    title: 'Question Breakdowns',
    lessons: [
      { slug: 'bitly', title: 'URL Shortener' },
      { slug: 'rate-limiter', title: 'Rate Limiter' },
      { slug: 'dropbox', title: 'Dropbox' },
      { slug: 'ticketmaster', title: 'Ticketmaster' },
      { slug: 'news-feed', title: 'News Feed' },
      { slug: 'whatsapp', title: 'WhatsApp' },
      { slug: 'live-comments', title: 'Live Comments' },
      { slug: 'youtube', title: 'YouTube' },
      { slug: 'top-k', title: 'Top-K' },
      { slug: 'uber', title: 'Uber' },
      { slug: 'yelp', title: 'Yelp' },
      { slug: 'web-crawler', title: 'Web Crawler' },
      { slug: 'ad-click-aggregator', title: 'Ad Click Aggregator' },
      { slug: 'post-search', title: 'Post Search' },
      { slug: 'job-scheduler', title: 'Job Scheduler' },
      { slug: 'distributed-cache', title: 'Distributed Cache' },
      { slug: 'notification-system', title: 'Notification System' },
      { slug: 'online-auction', title: 'Online Auction' },
      { slug: 'payment-system', title: 'Payment System' },
      { slug: 'google-docs', title: 'Google Docs' },
      { slug: 'metrics-monitoring', title: 'Metrics Monitoring' },
      { slug: 'robinhood', title: 'Robinhood' },
      { slug: 'flash-sale', title: 'Flash Sale' },
      { slug: 'chatgpt', title: 'ChatGPT-style App' },
    ],
  },
  {
    slug: '12-in-the-wild',
    title: 'In the Wild',
    lessons: [
      { slug: 'discord-messages', title: 'Discord Message Storage' },
      { slug: 'figma-multiplayer', title: 'Figma Multiplayer' },
      { slug: 'shopify-inventory', title: 'Shopify Inventory' },
      { slug: 'slack-job-queue', title: 'Slack Job Queue' },
    ],
  },
];

export interface SyllabusLesson {
  id: string;
  title: string;
  number: string;
  moduleTitle: string;
  index: number;
  written: boolean;
}

export interface SyllabusModule {
  slug: string;
  title: string;
  number: number;
  lessons: SyllabusLesson[];
}

// Merges the outline with the lesson ids that exist on disk.
// Fails the build when a lesson file is not in the outline, or requires a missing or later lesson.
export function buildSyllabus(
  written: { id: string; requires: string[] }[],
): { modules: SyllabusModule[]; flat: SyllabusLesson[] } {
  const flat: SyllabusLesson[] = [];
  const modules = syllabus.map((m, mi) => ({
    slug: m.slug,
    title: m.title,
    number: mi,
    lessons: m.lessons.map((l, li) => {
      const id = `${m.slug}/${l.slug}`;
      const lesson: SyllabusLesson = {
        id,
        title: l.title,
        number: `${mi}.${li + 1}`,
        moduleTitle: m.title,
        index: flat.length,
        written: written.some((w) => w.id === id),
      };
      flat.push(lesson);
      return lesson;
    }),
  }));

  const byId = new Map(flat.map((l) => [l.id, l]));
  for (const w of written) {
    const self = byId.get(w.id);
    if (!self) throw new Error(`Lesson "${w.id}" is not in src/lib/syllabus.ts`);
    for (const r of w.requires) {
      const dep = byId.get(r);
      if (!dep) throw new Error(`Lesson "${w.id}" requires unknown lesson "${r}"`);
      if (dep.index >= self.index)
        throw new Error(`Lesson "${w.id}" requires "${r}", which comes later in the syllabus`);
    }
  }
  return { modules, flat };
}
