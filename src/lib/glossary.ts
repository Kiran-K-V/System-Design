import { formPattern } from './termPattern';

/**
 * Shared glossary. One entry per term.
 * Lessons do not mark terms by hand: on Backend lesson pages, `termCard.ts` finds the first use
 * of each term and shows `def` in a card on hover, focus, or tap.
 *
 * - `term`: display name. It is also a match pattern.
 * - `aka`: other forms to match (acronym expansion, spelling). A trailing "s" plural always matches.
 * - Matching is case-sensitive when a pattern has an uppercase letter ("TLS", "Redis"),
 *   and case-insensitive when it is all lowercase ("idempotency").
 * - `lesson`: the lesson that teaches the term. The card links there, and that lesson does not mark it.
 * - `def`: one or two short sentences. Simplified Technical English: one idea per sentence.
 */

export type TermLevel = 'junior' | 'mid' | 'senior' | 'staff';

export interface GlossaryTerm {
  id: string;
  term: string;
  aka?: string[];
  level: TermLevel;
  def: string;
  lesson?: string;
}

/** Every surface form of a term. */
export const termForms = (g: GlossaryTerm) => [g.term, ...(g.aka ?? [])];

/** Regexes for every surface form of a term. */
export const termPattern = (g: GlossaryTerm) => termForms(g).map(formPattern);

const t = (id: string, term: string, level: TermLevel, def: string, more: Pick<GlossaryTerm, 'aka' | 'lesson'> = {}): GlossaryTerm => ({
  id,
  term,
  level,
  def,
  ...more,
});

const L = {
  est: '01-one-machine/estimation',
  tvl: '01-one-machine/throughput-vs-latency',
  dns: '02-networking/dns',
  tcp: '02-networking/ip-tcp-udp',
  tls: '02-networking/http-tls',
  cdn: '02-networking/cdn-proxies',
  lb: '02-networking/load-balancing',
  rt: '02-networking/real-time-transport',
  rpc: '02-networking/rpc-grpc',
  auth: '03-api-design/auth',
  gql: '03-api-design/graphql-rpc',
  idem: '03-api-design/idempotency',
  page: '03-api-design/pagination',
  rest: '03-api-design/rest',
  cap: '04-data/cap-pacelc',
  cons: '04-data/consensus',
  cm: '04-data/consistency-models',
  ch: '04-data/consistent-hashing',
  dm: '04-data/data-modeling',
  idx: '04-data/indexing',
  repl: '04-data/replication',
  shard: '04-data/sharding',
  nosql: '04-data/sql-vs-nosql',
  se: '04-data/storage-engines',
  tx: '04-data/transactions',
  cs: '05-caching/cache-strategies',
  evict: '05-caching/eviction',
  stamp: '05-caching/invalidation-stampede',
  why: '05-caching/why-cache',
  dlq: '06-async/backpressure-dlq',
  cdc: '06-async/cdc',
  ds: '06-async/delivery-semantics',
  ps: '06-async/pubsub-logs',
  q: '06-async/queues',
  cb: '07-reliability/circuit-breaker',
  fm: '07-reliability/failure-modes',
  obs: '07-reliability/observability',
  rl: '07-reliability/rate-limiting',
  tr: '07-reliability/timeouts-retries',
  gw: '08-technologies/api-gateway',
  blob: '08-technologies/blob-storage',
  cass: '08-technologies/cassandra',
  ddb: '08-technologies/dynamodb',
  es: '08-technologies/elasticsearch',
  flink: '08-technologies/flink',
  kafka: '08-technologies/kafka',
  pg: '08-technologies/postgresql',
  redis: '08-technologies/redis',
  temporal: '08-technologies/temporal',
  zk: '08-technologies/zookeeper',
  cont: '09-patterns/contention',
  big: '09-patterns/large-blobs',
  multi: '09-patterns/multi-step',
  reads: '09-patterns/scaling-reads',
  bds: '10-advanced/big-data-structures',
  ids: '10-advanced/ids-and-time',
  prox: '10-advanced/proximity-search',
  ts: '10-advanced/time-series',
  vec: '10-advanced/vector-databases',
  docs: '11-breakdowns/google-docs',
  pay: '11-breakdowns/payment-system',
  yt: '11-breakdowns/youtube',
  drop: '11-breakdowns/dropbox',
  bitly: '11-breakdowns/bitly',
};

export const glossary: GlossaryTerm[] = [
  // Numbers and load
  t('rps', 'RPS', 'junior', 'Requests per second. It is the usual unit for the load on a service. QPS (queries per second) means the same thing.', { aka: ['QPS', 'requests per second'], lesson: L.est }),
  t('percentile', 'p99', 'junior', 'The 99th percentile. 99% of requests are faster than this value. p50 is the median, and p999 is the slowest 0.1%.', { aka: ['p50', 'p95', 'p999', 'p99.9'], lesson: L.tvl }),
  t('tail-latency', 'tail latency', 'mid', 'The latency of the slowest requests, such as p99 and above. A few slow calls can make a whole page slow.', { lesson: L.tvl }),
  t('littles-law', "Little's Law", 'mid', 'Requests in the system = arrival rate × time each request spends inside. Use it to size pools, queues, and servers.', { aka: ["Little's law"], lesson: L.tvl }),

  // Networking
  t('dns', 'DNS', 'junior', 'Domain Name System. It turns a name such as example.com into an IP address.', { lesson: L.dns }),
  t('ttl', 'TTL', 'junior', 'Time to live. It is how long a cached value or record stays valid. After the TTL ends, the value expires.', { aka: ['time to live'] }),
  t('tcp', 'TCP', 'junior', 'A transport protocol that delivers bytes reliably and in order. It resends lost packets.', { lesson: L.tcp }),
  t('udp', 'UDP', 'junior', 'A transport protocol that sends single packets with no delivery or order guarantee. It is fast and simple.', { lesson: L.tcp }),
  t('tls', 'TLS', 'junior', 'Transport Layer Security. It encrypts a connection and proves the identity of the server. HTTPS is HTTP over TLS.', { lesson: L.tls }),
  t('http2', 'HTTP/2', 'mid', 'A version of HTTP that sends many requests at the same time over one connection.', { lesson: L.tls }),
  t('quic', 'QUIC', 'senior', 'A transport protocol on top of UDP. HTTP/3 uses it. One lost packet does not stop the other streams.', { lesson: L.tls }),
  t('hol', 'head-of-line blocking', 'mid', 'One slow or lost item at the front of a line stops all the items behind it.', { aka: ['head of line blocking'] }),
  t('cdn', 'CDN', 'junior', 'Content delivery network. Servers near users keep copies of content, so most requests do not travel to your origin.', { aka: ['content delivery network'], lesson: L.cdn }),
  t('reverse-proxy', 'reverse proxy', 'mid', 'A server in front of your servers. It receives client requests and sends them to a backend server.', { lesson: L.cdn }),
  t('load-balancer', 'load balancer', 'junior', 'A component that spreads incoming requests across many servers.', { lesson: L.lb }),
  t('l4-l7', 'L7', 'mid', 'Layer 7 of the network model: the application layer (HTTP). An L7 load balancer can read the request. An L4 load balancer sees only IP addresses and ports.', { aka: ['L4', 'layer 7', 'layer 4'], lesson: L.lb }),
  t('health-check', 'health check', 'junior', 'A small request that asks a server "are you alive and ready?". Failed checks remove the server from rotation.', { lesson: L.lb }),
  t('websocket', 'WebSocket', 'junior', 'A long-lived two-way connection between a browser and a server. Each side can send messages at any time.', { lesson: L.rt }),
  t('sse', 'SSE', 'mid', 'Server-sent events. A long-lived HTTP response that the server uses to push events to the client, one way only.', { aka: ['server-sent events'], lesson: L.rt }),
  t('long-polling', 'long polling', 'mid', 'The client sends a request, and the server holds it open until new data exists or a timeout occurs.', { lesson: L.rt }),
  t('rpc', 'RPC', 'junior', 'Remote procedure call. Code on one machine calls a function on another machine as if it was local.', { lesson: L.rpc }),
  t('grpc', 'gRPC', 'mid', 'An RPC framework from Google. It uses HTTP/2 and Protocol Buffers.', { lesson: L.rpc }),
  t('protobuf', 'Protocol Buffers', 'mid', 'A compact binary format for structured data. A schema file defines the fields.', { aka: ['protobuf'], lesson: L.rpc }),

  // API design
  t('rest', 'REST', 'junior', 'An API style. URLs name resources, and HTTP methods (GET, POST, PUT, DELETE) act on them.', { lesson: L.rest }),
  t('graphql', 'GraphQL', 'junior', 'A query language for APIs. The client asks for exactly the fields it needs in one request.', { lesson: L.gql }),
  t('jwt', 'JWT', 'mid', 'JSON Web Token. A signed token that holds claims about a user. A server can check it without a database lookup.', { lesson: L.auth }),
  t('oauth', 'OAuth', 'mid', 'A standard that lets a user give an app limited access to their account on another service, without sharing a password.', { lesson: L.auth }),
  t('idempotent', 'idempotent', 'mid', 'An operation is idempotent when doing it two or more times has the same effect as doing it once. Retries are then safe.', { aka: ['idempotency'], lesson: L.idem }),
  t('idempotency-key', 'idempotency key', 'mid', 'A unique ID that the client sends with a request. The server uses it to detect a retry and return the first result.', { aka: ['Idempotency-Key'], lesson: L.idem }),
  t('cursor-pagination', 'cursor pagination', 'mid', 'Paging that returns a pointer to the last item seen. The next page starts after it. It stays correct while rows change.', { aka: ['cursor-based pagination'], lesson: L.page }),
  t('offset-pagination', 'offset pagination', 'mid', 'Paging with "skip N rows, take M". It is simple, but it gets slow on deep pages and skips or repeats rows when data changes.', { lesson: L.page }),
  t('webhook', 'webhook', 'junior', 'An HTTP request that a service sends to your URL when an event occurs. It is a callback over HTTP.'),
  t('api-gateway', 'API gateway', 'mid', 'A single entry point in front of many services. It does common work such as auth, rate limits, and routing.', { lesson: L.gw }),

  // Data
  t('acid', 'ACID', 'junior', 'Atomicity, consistency, isolation, durability. The four guarantees of a database transaction.', { lesson: L.tx }),
  t('isolation-level', 'isolation level', 'mid', 'A setting that controls which changes from other transactions a transaction can see. Stronger levels prevent more anomalies but cost more.', { lesson: L.tx }),
  t('read-committed', 'Read Committed', 'mid', 'An isolation level. A transaction sees only committed data, but two reads of one row can return different values. It is the PostgreSQL default.', { aka: ['read committed'], lesson: L.tx }),
  t('snapshot-isolation', 'snapshot isolation', 'senior', 'An isolation level. Each transaction reads from a fixed snapshot of the database taken at its start.', { lesson: L.tx }),
  t('serializable', 'serializable', 'senior', 'The strongest isolation level. The result is the same as if the transactions ran one at a time.', { lesson: L.tx }),
  t('mvcc', 'MVCC', 'senior', 'Multi-version concurrency control. The database keeps old versions of rows, so readers do not block writers.', { lesson: L.tx }),
  t('lost-update', 'lost update', 'mid', 'Two transactions read a value, both change it, and the second write deletes the first change.', { lesson: L.tx }),
  t('write-skew', 'write skew', 'senior', 'Two transactions read the same data, then write different rows. Each write is valid alone, but together they break a rule.', { lesson: L.tx }),
  t('deadlock', 'deadlock', 'mid', 'Two transactions each hold a lock that the other one needs. Neither can continue.'),
  t('2pc', 'two-phase commit', 'senior', 'A protocol that commits one transaction across many databases. A coordinator asks all of them to prepare, then tells all of them to commit.', { aka: ['2PC'] }),
  t('read-replica', 'read replica', 'mid', 'A copy of a database that serves reads. Writes go to the leader and then copy to the replica.', { lesson: L.repl }),
  t('replication-lag', 'replication lag', 'mid', 'The delay before a write on the leader shows on a replica. Reads from the replica can return old data during this delay.', { aka: ['replica lag'], lesson: L.repl }),
  t('async-replication', 'asynchronous replication', 'mid', 'The leader confirms a write before replicas have it. Writes are fast, but a leader crash can lose recent writes.', { lesson: L.repl }),
  t('failover', 'failover', 'mid', 'When the leader fails, a replica becomes the new leader and takes its traffic.', { lesson: L.repl }),
  t('quorum', 'quorum', 'senior', 'The minimum number of nodes that must agree for an operation to succeed. Usually a majority.', { lesson: L.cons }),
  t('raft', 'Raft', 'senior', 'A consensus algorithm. Nodes elect one leader, and the leader copies a log to a majority before it commits an entry.', { lesson: L.cons }),
  t('paxos', 'Paxos', 'staff', 'The first widely used consensus algorithm. It is known for being hard to understand. Raft solves the same problem.', { lesson: L.cons }),
  t('split-brain', 'split brain', 'senior', 'Two nodes both think that they are the leader and both accept writes. The data then diverges.', { aka: ['split-brain'], lesson: L.cons }),
  t('fencing-token', 'fencing token', 'senior', 'A number that increases each time a lock or lease is granted. Storage rejects writes with an old number, so a stale lock holder cannot do damage.', { lesson: L.cont }),
  t('shard', 'sharding', 'mid', 'Splitting data across many databases. Each part (a shard) holds a subset of the keys.', { aka: ['shard'], lesson: L.shard }),
  t('hot-key', 'hot key', 'mid', 'One key that gets much more traffic than the others. It overloads the one shard or node that owns it.', { aka: ['hot partition', 'hot shard'], lesson: L.shard }),
  t('consistent-hashing', 'consistent hashing', 'mid', 'A way to map keys to nodes on a ring. When you add or remove a node, only a small part of the keys move.', { lesson: L.ch }),
  t('vnodes', 'virtual nodes', 'senior', 'Each real node takes many points on a consistent-hashing ring. This spreads the load more evenly.', { aka: ['vnodes'], lesson: L.ch }),
  t('cap', 'CAP theorem', 'mid', 'During a network partition, a distributed system must choose: answer requests (availability) or stay correct (consistency).', { aka: ['CAP'], lesson: L.cap }),
  t('pacelc', 'PACELC', 'senior', 'An extension of CAP. Without a partition, a system still trades latency against consistency.', { lesson: L.cap }),
  t('linearizability', 'linearizability', 'senior', 'The strongest consistency model. Every read returns the latest write, as if only one copy of the data exists.', { aka: ['linearizable'], lesson: L.cm }),
  t('eventual-consistency', 'eventual consistency', 'mid', 'If writes stop, all replicas become the same in the end. Until then, reads can return old values.', { aka: ['eventually consistent'], lesson: L.cm }),
  t('read-your-writes', 'read your writes', 'mid', 'A guarantee that after a user writes, their later reads show that write.', { aka: ['read-your-writes'], lesson: L.cm }),
  t('btree', 'B-tree', 'mid', 'A sorted, balanced tree on disk. Most SQL databases use it for tables and indexes. Reads are fast. Writes update pages in place.', { lesson: L.se }),
  t('lsm', 'LSM tree', 'mid', 'Log-structured merge tree. Writes go to memory, then flush to sorted files that merge in the background. Writes are very fast.', { aka: ['LSM-tree', 'LSM'], lesson: L.se }),
  t('wal', 'write-ahead log', 'mid', 'A log on disk that a database writes before it changes data. After a crash, the database replays the log.', { aka: ['WAL'], lesson: L.se }),
  t('write-amplification', 'write amplification', 'senior', 'One logical write causes many physical writes to disk, for example from logs, page rewrites, and compaction.'),
  t('secondary-index', 'secondary index', 'mid', 'An index on a column that is not the primary key. It makes lookups by that column fast.'),
  t('composite-index', 'composite index', 'mid', 'One index on two or more columns. Column order matters: it helps queries that filter on the leftmost columns.', { lesson: L.idx }),
  t('denormalization', 'denormalization', 'mid', 'Storing the same data in more than one place, so reads need fewer joins. Writes must update every copy.', { aka: ['denormalize', 'denormalized'], lesson: L.dm }),
  t('wide-column', 'wide-column store', 'mid', 'A NoSQL database (such as Cassandra) where a partition key finds a row group, and rows are sorted by a clustering key.', { aka: ['wide-column'], lesson: L.nosql }),
  t('partition-key', 'partition key', 'mid', 'The part of a key that decides which node stores a row. All rows with the same partition key live together.', { lesson: L.ddb }),
  t('sort-key', 'sort key', 'mid', 'The part of a key that orders rows inside one partition. It allows range queries in that partition.', { lesson: L.ddb }),
  t('inverted-index', 'inverted index', 'mid', 'A map from each word to the list of documents that contain it. Search engines use it.', { lesson: L.es }),
  t('bloom-filter', 'Bloom filter', 'mid', 'A small data structure that says "definitely not in the set" or "maybe in the set". It uses very little memory.', { lesson: L.bds }),
  t('hyperloglog', 'HyperLogLog', 'senior', 'A data structure that estimates the count of distinct items with very little memory and about 1% error.', { lesson: L.bds }),
  t('count-min', 'count-min sketch', 'senior', 'A data structure that estimates how often each item appears. It can overcount, but never undercounts.', { lesson: L.bds }),

  // Tools
  t('postgres', 'PostgreSQL', 'junior', 'A popular open-source SQL database.', { aka: ['Postgres'], lesson: L.pg }),
  t('redis', 'Redis', 'junior', 'An in-memory data store. It is used for caches, counters, queues, and locks.', { lesson: L.redis }),
  t('kafka', 'Kafka', 'junior', 'A distributed log. Producers append events to partitions, and consumers read them in order and can replay them.', { lesson: L.kafka }),
  t('cassandra', 'Cassandra', 'mid', 'A distributed wide-column database without a leader. It is built for very high write rates.', { lesson: L.cass }),
  t('dynamodb', 'DynamoDB', 'mid', 'A managed key-value and document database from AWS. It scales by partition key.', { lesson: L.ddb }),
  t('elasticsearch', 'Elasticsearch', 'junior', 'A search engine built on inverted indexes. It does full-text search and filters at scale.', { lesson: L.es }),
  t('flink', 'Flink', 'mid', 'A stream processing engine. It computes results over events as they arrive, with state and windows.', { lesson: L.flink }),
  t('zookeeper', 'ZooKeeper', 'mid', 'A coordination service. Systems use it for leader election, configuration, and locks.', { lesson: L.zk }),
  t('temporal', 'Temporal', 'mid', 'A workflow engine. It records each step, so a long process continues after a crash.', { lesson: L.temporal }),
  t('s3', 'S3', 'junior', 'Amazon Simple Storage Service. A blob storage service for files of any size.', { lesson: L.blob }),
  t('blob-storage', 'blob storage', 'junior', 'Storage for large files (images, videos, backups), addressed by key. Also called object storage.', { aka: ['object storage'], lesson: L.blob }),
  t('presigned-url', 'pre-signed URL', 'mid', 'A temporary URL that lets a client upload or download one file directly to blob storage, without your server in the path.', { aka: ['presigned URL', 'signed URL'], lesson: L.big }),
  t('multipart-upload', 'multipart upload', 'mid', 'A large file uploads in parts. Each part can retry alone, and the store joins the parts at the end.', { lesson: L.big }),
  t('lua-script', 'Lua script', 'mid', 'A small script that Redis runs as one atomic step. No other command runs in the middle of it.', { lesson: L.redis }),
  t('sorted-set', 'sorted set', 'mid', 'A Redis type: unique members, each with a score, kept in score order. It is used for leaderboards and time queues.', { lesson: L.redis }),

  // Caching
  t('cache-aside', 'cache-aside', 'mid', 'The app reads the cache first. On a miss, it reads the database and writes the result to the cache.', { lesson: L.cs }),
  t('write-through', 'write-through', 'mid', 'Each write goes to the cache and the database at the same time.', { lesson: L.cs }),
  t('write-back', 'write-back', 'senior', 'Writes go to the cache first, and the cache writes them to the database later. It is fast, but a crash can lose data.', { aka: ['write-behind'], lesson: L.cs }),
  t('lru', 'LRU', 'junior', 'Least recently used. When the cache is full, it removes the item that was not used for the longest time.', { lesson: L.evict }),
  t('hit-rate', 'hit rate', 'junior', 'The fraction of requests that the cache answers without a trip to the database.', { aka: ['hit ratio'], lesson: L.why }),
  t('stampede', 'cache stampede', 'mid', 'A popular key expires, and many requests miss at the same time. They all hit the database together.', { aka: ['thundering herd'], lesson: L.stamp }),

  // Async
  t('visibility-timeout', 'visibility timeout', 'mid', 'After a consumer takes a message, the queue hides it for some time. If the consumer does not delete it in time, the message returns.', { lesson: L.q }),
  t('dlq', 'dead-letter queue', 'mid', 'A separate queue for messages that failed too many times. A human or a tool can look at them later.', { aka: ['DLQ', 'dead letter queue'], lesson: L.dlq }),
  t('backpressure', 'backpressure', 'mid', 'A slow consumer signals a fast producer to slow down, so queues do not grow without limit.', { lesson: L.dlq }),
  t('at-least-once', 'at-least-once', 'mid', 'Each message is delivered one or more times. Nothing is lost, but duplicates can occur.', { aka: ['at least once'], lesson: L.ds }),
  t('at-most-once', 'at-most-once', 'mid', 'Each message is delivered zero or one time. There are no duplicates, but messages can be lost.', { aka: ['at most once'], lesson: L.ds }),
  t('exactly-once', 'exactly-once', 'senior', 'Each message has its effect exactly one time. In practice, this is at-least-once delivery plus idempotent processing.', { aka: ['exactly once'], lesson: L.ds }),
  t('pubsub', 'pub/sub', 'junior', 'Publish/subscribe. Publishers send messages to a topic, and every subscriber of that topic gets a copy.', { lesson: L.ps }),
  t('consumer-group', 'consumer group', 'mid', 'A set of consumers that share the work of a topic. Each partition goes to one consumer in the group.', { lesson: L.ps }),
  t('cdc', 'CDC', 'mid', 'Change data capture. A tool reads the database log and publishes each change as an event.', { aka: ['change data capture'], lesson: L.cdc }),
  t('outbox', 'transactional outbox', 'senior', 'Write the event to an outbox table in the same transaction as the data. A separate process then publishes it.', { aka: ['outbox pattern', 'outbox table'], lesson: L.cdc }),
  t('dual-write', 'dual write', 'mid', 'The app writes the same change to two systems, such as a database and a queue. If one write fails, the two systems disagree.', { lesson: L.cdc }),
  t('fan-out', 'fan-out', 'mid', 'One event becomes many deliveries, such as one post copied to the feeds of all followers.', { aka: ['fan out', 'fanout'] }),

  // Reliability
  t('circuit-breaker', 'circuit breaker', 'mid', 'After many failures to a dependency, stop calling it for a time and fail fast. Then try again carefully.', { lesson: L.cb }),
  t('bulkhead', 'bulkhead', 'senior', 'Give each dependency its own pool of threads or connections, so one slow dependency cannot use all of them.', { lesson: L.cb }),
  t('exp-backoff', 'exponential backoff', 'mid', 'Wait longer after each failed retry, for example 1 s, 2 s, 4 s, 8 s.', { aka: ['backoff'], lesson: L.tr }),
  t('jitter', 'jitter', 'mid', 'A random part added to a retry delay, so clients do not all retry at the same moment.', { lesson: L.tr }),
  t('token-bucket', 'token bucket', 'mid', 'A rate-limit algorithm. A bucket fills with tokens at a fixed rate, and each request uses one. Short bursts are allowed.', { lesson: L.rl }),
  t('cascading-failure', 'cascading failure', 'mid', 'One component fails, its load moves to the others, and they fail too.', { lesson: L.fm }),
  t('load-shedding', 'load shedding', 'mid', 'Reject some requests on purpose when overloaded, so the rest still get good service.', { lesson: L.cb }),
  t('slo', 'SLO', 'mid', 'Service level objective. A target for a measured value, for example "99.9% of requests succeed in 30 days".', { aka: ['service level objective'], lesson: L.obs }),
  t('sla', 'SLA', 'junior', 'Service level agreement. A promise to customers, often with a penalty when the provider misses it.', { aka: ['service level agreement'], lesson: L.obs }),
  t('sli', 'SLI', 'mid', 'Service level indicator. The measured value behind an SLO, such as the success rate or the p99 latency.', { aka: ['service level indicator'], lesson: L.obs }),
  t('error-budget', 'error budget', 'senior', 'The failure that an SLO allows. With a 99.9% SLO, 0.1% of requests may fail. When the budget is used up, stop risky releases.', { lesson: L.obs }),
  t('heartbeat', 'heartbeat', 'mid', 'A small message sent at a regular interval to show that a node or connection is still alive.'),

  // Patterns
  t('optimistic-concurrency', 'optimistic concurrency', 'mid', 'Do not lock. Read a version number, and write only if the version did not change. Retry on conflict.', { aka: ['optimistic locking', 'optimistic concurrency control'], lesson: L.cont }),
  t('pessimistic-locking', 'pessimistic locking', 'mid', 'Lock the row before the change, so no other transaction can change it until you commit.', { aka: ['pessimistic lock'], lesson: L.cont }),
  t('cas', 'compare-and-set', 'mid', 'An atomic operation: write the new value only if the current value is still the expected value.', { aka: ['compare-and-swap', 'CAS'] }),
  t('distributed-lock', 'distributed lock', 'senior', 'A lock that many machines share, often in Redis or ZooKeeper. It needs a timeout and a fencing token to be safe.', { lesson: L.cont }),
  t('saga', 'saga', 'senior', 'A long process split into local steps. If a step fails, earlier steps are undone by compensating actions.', { lesson: L.multi }),
  t('compensating-action', 'compensating action', 'senior', 'A step that undoes the effect of an earlier step, such as a refund for a charge.', { lesson: L.multi }),
  t('workflow-engine', 'workflow engine', 'mid', 'A system that runs multi-step processes and records the progress of each step, so a crash does not lose the process.', { lesson: L.multi }),

  // Advanced
  t('uuid', 'UUID', 'junior', 'Universally unique identifier. A 128-bit random ID that any machine can make without coordination.', { lesson: L.ids }),
  t('snowflake', 'Snowflake ID', 'senior', 'A 64-bit ID made of a timestamp, a machine ID, and a counter. The IDs sort by time.', { aka: ['Snowflake'], lesson: L.ids }),
  t('clock-skew', 'clock skew', 'senior', 'The difference between the clocks of two machines. Because of it, timestamps from different machines cannot order events safely.', { aka: ['clock drift'] }),
  t('lamport', 'Lamport clock', 'staff', 'A counter that each node increases and sends with its messages. It orders events by cause, not by wall-clock time.', { aka: ['Lamport timestamp'], lesson: L.ids }),
  t('vector-clock', 'vector clock', 'staff', 'A list of counters, one per node. It shows if one event happened before another, or if they were concurrent.', { lesson: L.ids }),
  t('geohash', 'geohash', 'mid', 'A short string that encodes a map cell. Nearby places often share a prefix, so a prefix search finds neighbors.', { lesson: L.prox }),
  t('quadtree', 'quadtree', 'mid', 'A tree that splits a map area into four parts, again and again, until each cell holds few points.', { lesson: L.prox }),
  t('tsdb', 'time-series database', 'mid', 'A database built for timestamped measurements. It is fast for appends and time-range queries.', { aka: ['time series database'], lesson: L.ts }),
  t('downsampling', 'downsampling', 'mid', 'Replace old fine-grained data with coarser summaries, such as per-minute data with per-hour averages.', { lesson: L.ts }),
  t('embedding', 'embedding', 'mid', 'A list of numbers that represents the meaning of an item. Similar items have embeddings that are close together.', { lesson: L.vec }),
  t('ann', 'approximate nearest neighbor', 'senior', 'A search that finds vectors close to a query vector fast, but can miss some of the exact best matches.', { aka: ['ANN'], lesson: L.vec }),
  t('hnsw', 'HNSW', 'staff', 'Hierarchical navigable small world. A graph index for approximate nearest neighbor search.', { lesson: L.vec }),
  t('watermark', 'watermark', 'senior', 'In stream processing, a marker that says "no events older than time T should still arrive". It lets a window close.', { lesson: L.flink }),
  t('checkpoint', 'checkpoint', 'mid', 'A saved copy of the state of a job. After a crash, the job restarts from the last checkpoint.', { lesson: L.flink }),
  t('tumbling-window', 'tumbling window', 'mid', 'Fixed time buckets that do not overlap, such as each full minute.', { lesson: L.flink }),

  // Case studies
  t('crdt', 'CRDT', 'staff', 'Conflict-free replicated data type. Replicas change their copy independently, and all copies merge to the same result.', { lesson: L.docs }),
  t('ot', 'operational transformation', 'staff', 'A method for real-time editing. Each edit is adjusted against concurrent edits, so all users see the same document.', { aka: ['OT'], lesson: L.docs }),
  t('hls', 'HLS', 'mid', 'HTTP Live Streaming. A video is cut into short segment files, and a playlist file lists them.', { lesson: L.yt }),
  t('abr', 'adaptive bitrate', 'mid', 'The player switches between video qualities during playback, based on the current network speed.', { aka: ['ABR'], lesson: L.yt }),
  t('transcoding', 'transcoding', 'junior', 'Converting a video to other formats, resolutions, or bitrates.', { lesson: L.yt }),
  t('cd-chunking', 'content-defined chunking', 'senior', 'Split a file at points chosen by its content, not at fixed sizes. An insert then changes only nearby chunks.', { lesson: L.drop }),
  t('double-entry', 'double-entry bookkeeping', 'mid', 'Each money movement writes two entries: a debit on one account and a credit on another. The totals must always balance.', { aka: ['double-entry ledger', 'double-entry'], lesson: L.pay }),
  t('reconciliation', 'reconciliation', 'mid', 'A job that compares your records with an external source, such as a bank report, and flags any difference.', { lesson: L.pay }),
  t('base62', 'Base62', 'junior', 'Writing a number with 62 characters: 0-9, a-z, and A-Z. It makes short IDs for URLs.', { lesson: L.bitly }),
  t('scatter-gather', 'scatter-gather', 'mid', 'Send one query to all shards at the same time, then merge the results. The slowest shard sets the latency.'),
  t('etag', 'ETag', 'mid', 'An HTTP header that holds a version tag for a resource. Clients use it for cache checks and conditional writes.'),
  t('dag', 'DAG', 'mid', 'Directed acyclic graph. Steps with dependencies and no loops. A job runs after all the jobs that it depends on.', { aka: ['directed acyclic graph'] }),
];

export const glossaryById = new Map(glossary.map((g) => [g.id, g]));
