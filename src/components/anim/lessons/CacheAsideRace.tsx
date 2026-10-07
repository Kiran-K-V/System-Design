import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

const ACTORS = ['Reader A', 'Writer B', 'Cache', 'DB'];

const BEATS: { m: SeqMessage; caption: string }[] = [
  { m: { from: 'Reader A', to: 'Cache', label: 'GET k' }, caption: 'Reader A wants key k. The cache is empty for k. Writer B is about to change it. Both run at the same time on different servers.' },
  { m: { from: 'Cache', to: 'Reader A', label: 'miss', tone: 'warn' }, caption: 'A misses and goes to the database.' },
  { m: { from: 'Reader A', to: 'DB', label: 'SELECT k' }, caption: 'A reads k from the database.' },
  { m: { from: 'DB', to: 'Reader A', label: 'v1' }, caption: 'The database returns v1, the value at this moment. Then A stalls for a moment: a garbage collection pause, a slow network, a busy CPU. It holds v1 and has not written the cache yet.' },
  { m: { from: 'Writer B', to: 'DB', label: 'UPDATE k = v2' }, caption: 'While A is stalled, B updates the database. The truth is now v2.' },
  { m: { from: 'Writer B', to: 'Cache', label: 'DEL k', tone: 'ok' }, caption: 'B does the right thing and deletes k from the cache. The cache has nothing for k, so the delete changes nothing.' },
  { m: { from: 'Reader A', to: 'Cache', label: 'SET k = v1', tone: 'bad' }, caption: 'A wakes up and fills the cache with what it read earlier. v1 is already out of date.' },
  { m: { from: 'Cache', to: 'Cache', label: 'k = v1, DB has v2', tone: 'bad', note: true }, caption: 'The cache now holds old data, and no further delete is coming. Everyone reads v1 until the TTL ends. No server crashed. Every step was correct on its own. The order was wrong.' },
];

export default function CacheAsideRace() {
  const steps = BEATS.map((b) => ({ caption: b.caption }));
  const messages = BEATS.map((b) => b.m);
  return (
    <AnimFrame title="Cache-aside race: a slow reader refills the cache with old data" steps={steps} interval={3200}>
      {(i) => <SequenceDiagram actors={ACTORS} messages={messages} visible={i + 1} width={640} />}
    </AnimFrame>
  );
}
