import { useState } from 'react';
import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';
import { Seg } from './CacheWidgetFrame';

interface Beat {
  m: SeqMessage;
  caption: string;
}

interface Strategy {
  id: string;
  label: string;
  intro: string;
  actors: string[];
  beats: Beat[];
}

const m = (from: string, to: string, label: string, tone?: SeqMessage['tone'], extra?: Partial<SeqMessage>): SeqMessage => ({ from, to, label, tone, ...extra });
const note = (on: string, label: string, tone?: SeqMessage['tone']): SeqMessage => ({ from: on, to: on, label, tone, note: true });

const ACTORS = ['App', 'Cache', 'DB'];

const STRATEGIES: Strategy[] = [
  {
    id: 'aside',
    label: 'Cache-aside',
    intro:
      'Cache-aside (also called lazy loading): the app owns all the logic. The cache is a plain key-value store. It does not know the database exists. Step through a read miss, a hit, then a write.',
    actors: ACTORS,
    beats: [
      { m: m('App', 'Cache', 'GET user:7'), caption: 'Read path. The app asks the cache first.' },
      { m: m('Cache', 'App', 'miss', 'warn'), caption: 'No entry. A miss.' },
      { m: m('App', 'DB', 'SELECT user 7'), caption: 'The app goes to the database itself.' },
      { m: m('DB', 'App', 'row (v1)'), caption: 'The database returns the row. Version v1 is current.' },
      { m: m('App', 'Cache', 'SET user:7 = v1, TTL 300s', 'ok'), caption: 'The app fills the cache and sets a TTL (time to live) of 300 seconds, so a wrong copy cannot live forever.' },
      { m: m('App', 'Cache', 'GET user:7'), caption: 'Later, the same key is read again.' },
      { m: m('Cache', 'App', 'hit: v1', 'ok'), caption: 'A hit. The database is not touched.' },
      { m: m('App', 'DB', 'UPDATE user 7 = v2'), caption: 'Write path. The app writes the database first. It is the source of truth.' },
      { m: m('App', 'Cache', 'DEL user:7', 'bad', { lost: true }), caption: 'Then the app deletes the cached key so the next read reloads. Here the delete is lost: a timeout, or the app crashed between the two steps.' },
      { m: note('Cache', 'still holds v1: stale', 'bad'), caption: 'Failure mode: stale reads. The cache serves v1 until the TTL ends or another delete arrives. Two systems were updated with no transaction between them, so one can fail.' },
    ],
  },
  {
    id: 'through',
    label: 'Read-through',
    intro:
      'Read-through: the app only talks to the cache. On a miss, the cache itself loads from the database through a loader you give it. The app code gets simpler. The cache component gets smarter.',
    actors: ACTORS,
    beats: [
      { m: m('App', 'Cache', 'GET user:7'), caption: 'The app asks the cache. It never calls the database for reads.' },
      { m: m('Cache', 'DB', 'load user:7', 'warn'), caption: 'Miss. The cache calls the database itself.' },
      { m: m('DB', 'Cache', 'row (v1)'), caption: 'The row comes back to the cache.' },
      { m: note('Cache', 'store v1, TTL 300s', 'ok'), caption: 'The cache stores the row.' },
      { m: m('Cache', 'App', 'v1', 'ok'), caption: 'The cache returns it. To the app, a miss and a hit look the same, only slower.' },
      { m: m('App', 'Cache', 'GET user:7'), caption: 'The next read of the same key.' },
      { m: m('Cache', 'App', 'hit: v1', 'ok'), caption: 'A hit.' },
      { m: m('App', 'Cache', 'GET user:9'), caption: 'Now a key that is not cached, while the database is down.' },
      { m: m('Cache', 'DB', 'load user:9', 'bad', { lost: true }), caption: 'The loader cannot reach the database.' },
      { m: note('Cache', 'load failed: error', 'bad'), caption: 'Failure mode: every miss is an error, and many misses at once all hit the database together (lesson 5.5). Read-through hides complexity. It does not remove staleness: updates still need a write strategy.' },
    ],
  },
  {
    id: 'writethrough',
    label: 'Write-through',
    intro:
      'Write-through: every write goes to the cache, and the cache writes the database before it answers. The cache and the database agree after every successful write. It is usually paired with read-through.',
    actors: ACTORS,
    beats: [
      { m: m('App', 'Cache', 'PUT user:7 = v2'), caption: 'The app sends the write to the cache, not to the database.' },
      { m: m('Cache', 'DB', 'write v2'), caption: 'The cache writes the database right away, in the same call.' },
      { m: m('DB', 'Cache', 'ack', 'ok'), caption: 'The database confirms that the write is durable (safely stored).' },
      { m: m('Cache', 'App', 'ok', 'ok'), caption: 'Only now does the app get its answer. The write costs cache time plus database time. You pay latency on writes to get fresh reads.' },
      { m: m('App', 'Cache', 'GET user:7'), caption: 'A later read.' },
      { m: m('Cache', 'App', 'hit: v2 (fresh)', 'ok'), caption: 'It hits, and it is never stale: the cache was updated by the same write.' },
      { m: m('App', 'Cache', 'PUT user:8 = v3'), caption: 'Another write.' },
      { m: m('Cache', 'DB', 'write v3', 'bad', { lost: true }), caption: 'The database write fails or times out.' },
      { m: note('Cache', 'undo v3, return error', 'bad'), caption: 'Failure mode: the cache must not keep v3. If the timeout hides the true outcome, the database might hold v3 anyway. Safe designs drop the key and let the next read reload. Also: data written but never read still fills the cache.' },
    ],
  },
  {
    id: 'writeback',
    label: 'Write-back',
    intro:
      'Write-back (write-behind): writes go to the cache only, and the cache flushes them to the database later, in the background. Writes are very fast. The price is risk: for a while, the only copy of new data is in cache memory.',
    actors: ACTORS,
    beats: [
      { m: m('App', 'Cache', 'PUT user:7 = v2'), caption: 'The app writes to the cache.' },
      { m: m('Cache', 'App', 'ok (fast)', 'ok'), caption: 'The cache answers at once, in about 0.5 ms. The database has not been touched.' },
      { m: note('Cache', 'dirty: v2 not in DB', 'warn'), caption: 'The cache marks the entry dirty: newer than the database.' },
      { m: m('App', 'Cache', 'PUT user:7 = v3'), caption: 'A second write to the same key, a moment later.' },
      { m: note('Cache', 'overwrite: still 1 dirty', 'ok'), caption: 'The cache overwrites in place. Two writes will become one database write. This coalescing is the main gain for hot keys and counters.' },
      { m: m('Cache', 'DB', 'flush v3 (batch, ~5 s)', 'ok'), caption: 'After a delay, or when a batch is full, the cache flushes to the database.' },
      { m: m('DB', 'Cache', 'ack', 'ok'), caption: 'The entry is clean again.' },
      { m: m('App', 'Cache', 'PUT user:9 = v1'), caption: 'A new write. The app gets "ok" again.' },
      { m: m('Cache', 'App', 'ok (fast)', 'ok'), caption: 'The user believes it is saved.' },
      { m: note('Cache', 'CRASH: dirty v1 lost', 'bad'), caption: 'Failure mode: the cache node dies before the flush. The write is gone, and the app was told it succeeded. Use write-back only for data you can lose or rebuild (counters, view counts), or add a durable log in front of it.' },
    ],
  },
  {
    id: 'around',
    label: 'Write-around',
    intro:
      'Write-around: writes go straight to the database and skip the cache. The cache is filled only by reads. It keeps write-once data (logs, uploads, history) from pushing out hot read data.',
    actors: ACTORS,
    beats: [
      { m: m('App', 'DB', 'INSERT log:1'), caption: 'The app writes a new record straight to the database.' },
      { m: m('DB', 'App', 'ok', 'ok'), caption: 'Durable. The write is as fast as the database is.' },
      { m: note('Cache', 'skipped: nothing stored', 'ok'), caption: 'The cache never saw the write. It stays free for data that is actually read often. Most log rows are never read.' },
      { m: m('App', 'Cache', 'GET log:1'), caption: 'If someone does read it later...' },
      { m: m('Cache', 'App', 'miss', 'warn'), caption: '...the first read is a miss. A write is followed by a miss by design.' },
      { m: m('App', 'DB', 'SELECT log:1'), caption: 'The app loads it from the database.' },
      { m: m('DB', 'App', 'row'), caption: 'The row returns.' },
      { m: m('App', 'Cache', 'SET log:1', 'ok'), caption: 'The cache is filled now, as in cache-aside. If this record is read often, it stays.' },
      { m: m('App', 'DB', 'UPDATE user 7 = v2', 'warn'), caption: 'Now update a row that was cached earlier as v1. Write-around does not touch the cache.' },
      { m: note('Cache', 'user:7 still v1: stale', 'bad'), caption: 'Failure mode: stale reads, for data that is both written and read. Write-around is right only for data that is rarely read right after being written. Otherwise add an invalidation, as in cache-aside.' },
    ],
  },
];

export default function CacheStrategies() {
  const [id, setId] = useState('aside');
  const s = STRATEGIES.find((x) => x.id === id)!;
  const steps = [{ caption: s.intro }, ...s.beats.map((b) => ({ caption: b.caption }))];
  const messages = s.beats.map((b) => b.m);
  return (
    <div className="not-prose mt-8">
      <Seg value={id} options={STRATEGIES.map((x) => ({ id: x.id, label: x.label }))} onChange={setId} label="Caching strategy" />
      <div className="-mb-6">
        <AnimFrame key={id} title={`${s.label}: order of reads and writes`} steps={steps} interval={2800}>
          {(i) => <SequenceDiagram actors={s.actors} messages={messages} visible={i} width={640} />}
        </AnimFrame>
      </div>
    </div>
  );
}
