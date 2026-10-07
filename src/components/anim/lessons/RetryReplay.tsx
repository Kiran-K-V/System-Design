import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

/**
 * A payment is retried after a lost response.
 * mode "naive": no idempotency key, the customer is charged twice.
 * mode "key": same retry with an idempotency key and a server-side dedupe store.
 */

type Mode = 'naive' | 'key';

const NAIVE_ACTORS = ['Client', 'API', 'Payments DB'];
const NAIVE: { m: SeqMessage; caption: string }[] = [
  { m: { from: 'Client', to: 'API', label: 'POST /charges $50' }, caption: 'The client asks to charge the customer $50.' },
  { m: { from: 'API', to: 'Payments DB', label: 'INSERT charge $50' }, caption: 'The API writes the charge. The money moves.' },
  { m: { from: 'Payments DB', to: 'API', label: 'ok', tone: 'ok' }, caption: 'The database confirms.' },
  { m: { from: 'API', to: 'Client', label: '201 Created', lost: true, tone: 'bad' }, caption: 'The success response is lost on the network. The server did its job. The client has no way to know.' },
  { m: { from: 'Client', to: 'Client', label: 'timeout. Did it work?', note: true, tone: 'warn' }, caption: 'The client times out. It faces a choice: give up and maybe lose the sale, or retry and maybe charge twice.' },
  { m: { from: 'Client', to: 'API', label: 'POST /charges $50 (retry)' }, caption: 'It retries. To the server, this request looks exactly like a new purchase of $50.' },
  { m: { from: 'API', to: 'Payments DB', label: 'INSERT charge $50', tone: 'bad' }, caption: 'The API writes a second charge. Nothing links it to the first.' },
  { m: { from: 'API', to: 'Client', label: '201 Created', tone: 'ok' }, caption: 'This time the response arrives. The client thinks one charge happened. The customer paid $100.' },
];

const KEY_ACTORS = ['Client', 'API', 'Key store', 'Payments DB'];
const KEYED: { m: SeqMessage; caption: string }[] = [
  { m: { from: 'Client', to: 'Client', label: 'make key K1 (a UUID)', note: true, tone: 'accent' }, caption: 'Before the first try, the client makes one random key for this purchase. The key names the operation, not the request.' },
  { m: { from: 'Client', to: 'API', label: 'POST $50, key K1' }, caption: 'The client sends the charge with the key in the Idempotency-Key header.' },
  { m: { from: 'API', to: 'Key store', label: 'K1 absent: claim it' }, caption: 'The API claims K1 with an atomic "insert if absent". K1 is new, so the claim succeeds. Status: in progress.' },
  { m: { from: 'API', to: 'Payments DB', label: 'INSERT charge $50' }, caption: 'The API writes the charge. The money moves once.' },
  { m: { from: 'API', to: 'Key store', label: 'K1 = done + 201 body' }, caption: 'The API saves the final answer (status and body) under K1.' },
  { m: { from: 'API', to: 'Client', label: '201 Created', lost: true, tone: 'bad' }, caption: 'The same network fault: the response is lost.' },
  { m: { from: 'Client', to: 'Client', label: 'timeout. Retry, same K1', note: true, tone: 'warn' }, caption: 'The client times out and retries. It reuses K1, because this is the same purchase.' },
  { m: { from: 'Client', to: 'API', label: 'POST $50, key K1' }, caption: 'The retry reaches the API with the same key.' },
  { m: { from: 'API', to: 'Key store', label: 'K1 found: done', tone: 'ok' }, caption: 'The key store already holds K1, marked done, with the saved response.' },
  { m: { from: 'API', to: 'Client', label: '201 (saved copy)', tone: 'ok' }, caption: 'The API replays the saved response. It does not touch the Payments DB. The customer paid $50, once.' },
];

function Strip({ ledger, store, bad }: { ledger: number; store: string | null; bad: boolean }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3 px-2 text-sm">
      <div className="rounded-lg border px-3 py-1.5" style={{ borderColor: bad ? 'var(--bad)' : 'var(--border)' }}>
        <span className="text-muted">Payments DB: </span>
        <span className="font-mono tabular-nums" style={{ color: bad ? 'var(--bad)' : undefined }}>
          {ledger === 0 ? 'no charges' : `${ledger} charge${ledger > 1 ? 's' : ''} x $50 = $${ledger * 50}`}
        </span>
      </div>
      {store !== null && (
        <div className="rounded-lg border border-line px-3 py-1.5">
          <span className="text-muted">Key store: </span>
          <span className="font-mono">{store}</span>
        </div>
      )}
    </div>
  );
}

export default function RetryReplay({ mode }: { mode: Mode }) {
  const script = mode === 'naive' ? NAIVE : KEYED;
  const actors = mode === 'naive' ? NAIVE_ACTORS : KEY_ACTORS;
  const steps = [
    {
      caption:
        mode === 'naive'
          ? 'A customer pays $50. We follow the call from the client to the database. This version has no idempotency key.'
          : 'The same payment, with an idempotency key. The API now has a key store next to the Payments DB.',
    },
    ...script.map((s) => ({ caption: s.caption })),
  ];
  const messages = script.map((s) => s.m);

  return (
    <AnimFrame
      title={mode === 'naive' ? 'Retry without a key: double charge' : 'Retry with an idempotency key: one charge'}
      steps={steps}
      interval={3000}
    >
      {(i) => {
        const shown = messages.slice(0, i);
        const ledger = shown.filter((m) => m.label.startsWith('INSERT')).length;
        let store: string | null = null;
        if (mode === 'key') {
          const claimed = shown.some((m) => m.label === 'K1 absent: claim it');
          const done = shown.some((m) => m.label === 'K1 = done + 201 body');
          store = done ? 'K1 → done, saved 201' : claimed ? 'K1 → in progress' : 'empty';
        }
        return (
          <>
            <SequenceDiagram actors={actors} messages={messages} visible={i} width={640} />
            <Strip ledger={ledger} store={store} bad={ledger > 1} />
          </>
        );
      }}
    </AnimFrame>
  );
}
