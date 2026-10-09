import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

const ACTORS = ['Client A', 'Client B', 'Cache', 'DB'];

const BEATS: { m: SeqMessage; caption: string }[] = [
  {
    m: { from: 'Client A', to: 'Cache', label: 'GET k' },
    caption: 'A hot key k was just deleted or expired. Client A asks the cache for it. Hundreds more clients are about to ask too. Two are drawn here.',
  },
  {
    m: { from: 'Cache', to: 'Client A', label: 'miss + lease L1', tone: 'ok' },
    caption:
      'The cache has no value. It answers "miss" and also hands A a lease: a token bound to key k. In Facebook\'s memcache the token is 64 bits. The lease means "you may fill k, nobody else should".',
  },
  {
    m: { from: 'Client B', to: 'Cache', label: 'GET k' },
    caption: 'Client B asks for k a moment later. Without leases, B would also go to the database. Here, the cache already has a lease out for k.',
  },
  {
    m: { from: 'Cache', to: 'Client B', label: 'wait, lease out', tone: 'warn' },
    caption:
      'The cache tells B to wait a short time and ask again. It does not send B to the database. In the Facebook paper the server hands out a token only once every 10 seconds per key. Every other request in that window gets this "wait" answer.',
  },
  {
    m: { from: 'Client A', to: 'DB', label: 'SELECT k' },
    caption: 'Only A, the lease holder, queries the database. The expensive work happens once, not once per waiting client.',
  },
  {
    m: { from: 'DB', to: 'Client A', label: 'v2' },
    caption: 'The database returns the current value, v2.',
  },
  {
    m: { from: 'Client A', to: 'Cache', label: 'SET k = v2 (L1)', tone: 'ok' },
    caption:
      'A fills the cache and shows its token L1. The cache checks that L1 is still valid and stores v2. If a writer had deleted k since the lease was issued, L1 would be void and this set would be refused. That also blocks the stale-set race from lesson 5.3.',
  },
  {
    m: { from: 'Client B', to: 'Cache', label: 'GET k (retry)' },
    caption: 'B waited a few milliseconds and asks again.',
  },
  {
    m: { from: 'Cache', to: 'Client B', label: 'hit: v2', tone: 'ok' },
    caption:
      'The value is there. B never touched the database. The Facebook paper measured the effect on keys prone to herds: peak database query rate 17K/s without leases, 1.3K/s with leases.',
  },
];

export default function LeaseHerd() {
  const steps = BEATS.map((b) => ({ caption: b.caption }));
  const messages = BEATS.map((b) => b.m);
  return (
    <AnimFrame title="A lease lets one client rebuild a hot key" steps={steps} interval={3600}>
      {(i) => <SequenceDiagram actors={ACTORS} messages={messages} visible={i + 1} width={640} />}
    </AnimFrame>
  );
}
