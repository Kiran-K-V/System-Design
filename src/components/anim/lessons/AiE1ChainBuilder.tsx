import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';

interface Chain {
  id: string;
  name: string;
  goal: string;
  label: string;
  task: string;
  metric: string;
  failure: string;
}

/** Illustrative chains. Not from a source: they show the shape of the mapping. */
const CHAINS: Chain[] = [
  {
    id: 'watch',
    name: 'Watch time',
    goal: 'People find videos that are worth their time.',
    label: 'Implicit: the user watched past a set share of the video.',
    task: 'Predict, for each user and video pair, the chance of a long watch.',
    metric: 'Offline: AUC on held-out days. Online: total watch time.',
    failure: 'Long, slow videos win. Total watch time rises while people feel the time was wasted.',
  },
  {
    id: 'clicks',
    name: 'Clicks',
    goal: 'Show people items they want to open.',
    label: 'Implicit: the user clicked within the session.',
    task: 'Binary classification: click or no click.',
    metric: 'Offline: log loss. Online: click-through rate.',
    failure: 'Sensational titles get clicks. Click-through rises and satisfaction falls.',
  },
  {
    id: 'fraud',
    name: 'Fraud loss',
    goal: 'Lose less money to fraud without blocking good buyers.',
    label: 'Delayed: a confirmed fraud or chargeback after the payment.',
    task: 'Binary classification with a threshold that sets the block rate.',
    metric: 'Offline: recall at a fixed false-block rate. Online: dollars lost.',
    failure: 'Labels arrive late and attackers change tactics, so the model learns last month\'s fraud.',
  },
];

const ROWS: { key: keyof Omit<Chain, 'id' | 'name'>; title: string; tone: string }[] = [
  { key: 'goal', title: '1. Business goal', tone: 'var(--accent)' },
  { key: 'label', title: '2. Label (what we can observe)', tone: 'var(--muted)' },
  { key: 'task', title: '3. Model task', tone: 'var(--muted)' },
  { key: 'metric', title: '4. Metric', tone: 'var(--muted)' },
  { key: 'failure', title: '5. How the proxy fails', tone: 'var(--bad)' },
];

export default function AiE1ChainBuilder() {
  const [id, setId] = useState('watch');
  const c = CHAINS.find((x) => x.id === id) ?? CHAINS[0];
  return (
    <CacheWidgetFrame title="Goal to model task chain" hint="Illustrative examples">
      <div className="mb-3">
        <Seg label="Business goal" value={id} options={CHAINS.map((x) => ({ id: x.id, label: x.name }))} onChange={setId} />
      </div>
      <ol className="space-y-2" aria-live="polite">
        {ROWS.map((r) => (
          <li key={r.key} className="rounded-lg border border-line p-3" style={{ borderLeft: `3px solid ${r.tone}` }}>
            <p className="text-xs uppercase tracking-wide text-muted">{r.title}</p>
            <p className="mt-1 text-sm">{c[r.key]}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted">Each link is a translation, and each translation can lose meaning. The chain is only as good as its weakest link.</p>
    </CacheWidgetFrame>
  );
}
