import AnimFrame from '../AnimFrame';
import { HandText, SketchSvg, TEXT_SIZES } from '../sketch';
import { Arr, Panel, tv, type TT } from './TechParts';

/**
 * Fencing tokens. Follows the scenario in Martin Kleppmann, "How to do distributed locking" (2016):
 * a client holds a lease, pauses, the lease expires, a second client takes it, and the first wakes up and writes.
 */

interface Step {
  caption: string;
  msg: string;
  a: { sub: string; tone?: TT };
  b: { sub: string; tone?: TT };
  lock: { sub: string; tone?: TT };
  store: { sub: string; tone?: TT };
  arrows?: { from: 'a' | 'b'; to: 'lock' | 'store'; label: string; tone: TT; dashed?: boolean }[];
}

const steps: Step[] = [
  {
    caption: 'A lock service hands out leases: a lock that expires on its own, so a crashed client cannot hold it forever. Every grant carries a number that goes up each time. Client A asks and gets the lock with token 33.',
    msg: 'A is granted the lock, token 33',
    a: { sub: 'holds lock, 33', tone: 'ok' },
    b: { sub: 'idle' },
    lock: { sub: 'owner A, next 34' },
    store: { sub: 'highest seen: none' },
    arrows: [{ from: 'a', to: 'lock', label: 'lock?', tone: 'ok' }],
  },
  {
    caption: 'A pauses. A long garbage-collection stop, a slow disk, or a delayed network packet all do this. A does not know time has passed. Meanwhile the lease runs out.',
    msg: 'A is paused. The lease expires.',
    a: { sub: 'paused', tone: 'warn' },
    b: { sub: 'idle' },
    lock: { sub: 'lease of A expired', tone: 'warn' },
    store: { sub: 'highest seen: none' },
  },
  {
    caption: 'Client B asks for the lock. The service sees A\'s lease is gone and grants it to B with the next token, 34. B writes to the storage service and sends 34 with the write. The store records 34 as the highest token seen.',
    msg: 'B gets token 34 and writes',
    a: { sub: 'still paused', tone: 'warn' },
    b: { sub: 'holds lock, 34', tone: 'ok' },
    lock: { sub: 'owner B, next 35' },
    store: { sub: 'highest seen: 34', tone: 'ok' },
    arrows: [{ from: 'b', to: 'lock', label: 'lock?', tone: 'ok' }, { from: 'b', to: 'store', label: 'write, 34', tone: 'ok' }],
  },
  {
    caption: 'A wakes up. It still believes it holds the lock, so no check inside A can catch the mistake. A sends its write with token 33. The store has already seen 34, so it rejects 33. Without the token, A\'s stale write would have overwritten B\'s.',
    msg: 'A\'s stale write is rejected',
    a: { sub: 'wakes, sends 33', tone: 'bad' },
    b: { sub: 'holds lock, 34', tone: 'ok' },
    lock: { sub: 'owner B, next 35' },
    store: { sub: 'rejects 33 < 34', tone: 'bad' },
    arrows: [{ from: 'a', to: 'store', label: 'write, 33', tone: 'bad' }],
  },
];

export default function ContentionFencing() {
  return (
    <AnimFrame title="A paused lock holder, stopped by a fencing token" steps={steps} interval={5600}>
      {(i, s) => (
        <SketchSvg width={720} height={306} label="Client A, client B, a lock service, and a storage service. Fencing tokens stop a stale write.">
          <HandText x={360} y={20} size={TEXT_SIZES.label} color="var(--accent)">{s.msg}</HandText>
          <Panel cx={90} cy={90} w={130} label="Client A" sub={s.a.sub} tone={s.a.tone} sk="cfa" />
          <Panel cx={90} cy={230} w={130} label="Client B" sub={s.b.sub} tone={s.b.tone} sk="cfb" />
          <Panel cx={360} cy={90} w={160} label="Lock service" sub={s.lock.sub} tone={s.lock.tone} sk="cfl" />
          <Panel cx={620} cy={160} w={160} label="Storage" sub={s.store.sub} tone={s.store.tone} strong sk="cfs" />
          {s.arrows?.map((a) => {
            const from: [number, number] = a.from === 'a' ? [158, a.to === 'store' ? 112 : 90] : [158, 230];
            const to: [number, number] = a.to === 'lock' ? [272, a.from === 'a' ? 90 : 105] : [538, a.from === 'a' ? 150 : 180];
            const start: [number, number] = a.to === 'lock' && a.from === 'b' ? [150, 215] : from;
            return <Arr key={`${i}-${a.from}-${a.to}`} from={start} to={to} tone={a.tone} label={a.label} labelDy={a.to === 'store' ? (a.from === 'a' ? 20 : 16) : -14} sk={`cfx${i}${a.from}${a.to}`} />;
          })}
          <HandText x={360} y={288} size={TEXT_SIZES.note} color={tv('muted')}>the storage service, not the lock holder, makes the final check</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
