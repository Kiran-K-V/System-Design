import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

/**
 * A consumer credits $10 for message M1, and the ack is lost on the way back.
 * mode "naive": the broker redelivers and the consumer credits twice.
 * mode "dedupe": the consumer saves the message id in the same transaction as the credit.
 */

type Mode = 'naive' | 'dedupe';

const ACTORS = ['Broker', 'Consumer', 'Ledger DB'];

const NAIVE: { m: SeqMessage; caption: string }[] = [
  { m: { from: 'Broker', to: 'Consumer', label: 'deliver M1: +$10' }, caption: 'The broker hands message M1 to the consumer. The broker keeps its own copy until it sees an acknowledgement (an ack).' },
  { m: { from: 'Consumer', to: 'Ledger DB', label: 'credit $10' }, caption: 'The consumer does the work: it adds $10 to an account.' },
  { m: { from: 'Ledger DB', to: 'Consumer', label: 'ok', tone: 'ok' }, caption: 'The database confirms. The money is in.' },
  { m: { from: 'Consumer', to: 'Broker', label: 'ack', lost: true, tone: 'bad' }, caption: 'The consumer sends the ack. The network drops it. The consumer did everything right. The broker never hears it.' },
  { m: { from: 'Broker', to: 'Broker', label: 'no ack in time: resend', note: true, tone: 'warn' }, caption: 'The broker waits and hears nothing. It cannot tell a lost ack from a dead consumer. To avoid losing the message it sends it again.' },
  { m: { from: 'Broker', to: 'Consumer', label: 'deliver M1: +$10', tone: 'warn' }, caption: 'The same message M1 arrives a second time. Nothing in it says "seen before".' },
  { m: { from: 'Consumer', to: 'Ledger DB', label: 'credit $10', tone: 'bad' }, caption: 'The consumer credits again. The customer has $20 for one payment.' },
  { m: { from: 'Consumer', to: 'Broker', label: 'ack', tone: 'ok' }, caption: 'This ack arrives and the broker deletes M1. At-least-once delivery did its job. The effect happened twice.' },
];

const DEDUPE: { m: SeqMessage; caption: string }[] = [
  { m: { from: 'Broker', to: 'Consumer', label: 'deliver M1: +$10' }, caption: 'The broker hands message M1 to the consumer. M1 has a unique id, set by the producer.' },
  { m: { from: 'Consumer', to: 'Ledger DB', label: 'txn: id M1 + credit $10', tone: 'accent' }, caption: 'The consumer opens one database transaction. It saves the id M1 in a "processed" table and credits $10. Both changes commit together or not at all (lesson 4.4).' },
  { m: { from: 'Ledger DB', to: 'Consumer', label: 'committed', tone: 'ok' }, caption: 'The transaction commits. The credit and the id are now stored.' },
  { m: { from: 'Consumer', to: 'Broker', label: 'ack', lost: true, tone: 'bad' }, caption: 'The same network fault: the ack is lost.' },
  { m: { from: 'Broker', to: 'Broker', label: 'no ack in time: resend', note: true, tone: 'warn' }, caption: 'The broker resends M1, because it must not lose messages.' },
  { m: { from: 'Broker', to: 'Consumer', label: 'deliver M1: +$10', tone: 'warn' }, caption: 'M1 arrives again, with the same id.' },
  { m: { from: 'Consumer', to: 'Ledger DB', label: 'txn: id M1 + credit' }, caption: 'The consumer starts the same transaction. The insert of id M1 breaks the unique key, so the whole transaction rolls back.' },
  { m: { from: 'Ledger DB', to: 'Consumer', label: 'M1 exists: skip', tone: 'ok' }, caption: 'The consumer learns M1 was already done. It skips the credit. The balance is unchanged.' },
  { m: { from: 'Consumer', to: 'Broker', label: 'ack', tone: 'ok' }, caption: 'The consumer acks. The broker deletes M1. Delivery happened twice. The effect happened once. This is idempotency from lesson 3.4, applied to a queue.' },
];

function Strip({ credits, ids, bad }: { credits: number; ids: string | null; bad: boolean }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3 px-2 text-sm">
      <div className="rounded-lg border px-3 py-1.5" style={{ borderColor: bad ? 'var(--bad)' : 'var(--border)' }}>
        <span className="text-muted">Balance: </span>
        <span className="font-mono tabular-nums" style={{ color: bad ? 'var(--bad)' : undefined }}>${credits * 10}</span>
      </div>
      {ids !== null && (
        <div className="rounded-lg border border-line px-3 py-1.5">
          <span className="text-muted">Processed ids: </span>
          <span className="font-mono">{ids}</span>
        </div>
      )}
    </div>
  );
}

export default function AsyncAckWalk({ mode }: { mode: Mode }) {
  const script = mode === 'naive' ? NAIVE : DEDUPE;
  const steps = [
    { caption: mode === 'naive' ? 'A queue delivers a payment message to a consumer. This consumer has no duplicate protection.' : 'The same delivery, but the consumer keeps a "processed ids" table in the same database as the ledger.' },
    ...script.map((s) => ({ caption: s.caption })),
  ];
  const messages = script.map((s) => s.m);
  return (
    <AnimFrame title={mode === 'naive' ? 'Lost ack, no dedupe: the effect happens twice' : 'Lost ack, with a dedupe table: the effect happens once'} steps={steps} interval={3200}>
      {(i) => {
        const shown = messages.slice(0, i);
        const credits = shown.filter((m) => m.from === 'Consumer' && m.to === 'Ledger DB' && (m.label === 'credit $10' || m.label === 'txn: id M1 + credit $10')).length;
        const ids = mode === 'dedupe' ? (shown.some((m) => m.label === 'txn: id M1 + credit $10') ? 'M1' : 'none') : null;
        return (
          <>
            <SequenceDiagram actors={ACTORS} messages={messages} visible={i} width={640} />
            <Strip credits={credits} ids={ids} bad={credits > 1} />
          </>
        );
      }}
    </AnimFrame>
  );
}
