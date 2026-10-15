import { DesignCompare, type CompareVariant } from '../DesignBuild';

const nodes = [
  { id: 'q', x: 90, y: 170, w: 130, h: 70, label: 'Waiting', sub: 'C: 6 tokens' },
  { id: 's1', x: 360, y: 90, w: 140, h: 60, label: 'Slot 1', sub: 'A: 2 tokens' },
  { id: 's2', x: 360, y: 250, w: 140, h: 60, label: 'Slot 2', sub: 'B: 8 tokens' },
  { id: 'out', x: 620, y: 170, w: 110, h: 56, label: 'Clients' },
];
const edges = [
  { from: 'q', to: 's1' },
  { from: 'q', to: 's2' },
  { from: 's1', to: 'out' },
  { from: 's2', to: 'out' },
];

const fixed: CompareVariant = {
  id: 'fixed',
  label: 'Naive: wait for the batch',
  nodes,
  edges,
  steps: [
    { caption: 'One model runs 2 requests per batch. Each iteration makes one token for every request in the batch. A needs 2 tokens, B needs 8, and C waits.', active: ['s1', 's2'], notes: [{ x: 360, y: 345, text: 'iteration 1', size: 14 }] },
    { caption: 'After iteration 2, A is finished. The batch is still running, because B has 6 tokens left. Slot 1 sits empty. C cannot join a batch that has already started.', tones: { s1: 'warn', s2: 'accent' }, notes: [{ x: 360, y: 345, text: 'iteration 3: slot 1 idle', size: 14, tone: 'warn' }] },
    { caption: 'B ends after iteration 8. Only now does C start. C needs 6 tokens, so it ends after iteration 14. Slot 1 was busy 2 of 8 iterations in the first batch: (2 + 8) / 16 = 62.5% use.', tones: { s1: 'bad', s2: 'ok' }, notes: [{ x: 360, y: 345, text: 'C waits 8, done at 14', size: 14, tone: 'bad' }] },
  ],
};

const continuous: CompareVariant = {
  id: 'continuous',
  label: 'Better: join between tokens',
  nodes,
  edges,
  steps: [
    { caption: 'Same start: 2 slots, A needs 2 tokens, B needs 8, C waits with 6 tokens.', active: ['s1', 's2'], notes: [{ x: 360, y: 345, text: 'iteration 1', size: 14 }] },
    { caption: 'The scheduler decides again after every iteration, not after every request. A finishes after iteration 2 and leaves at once.', tones: { s1: 'ok', s2: 'accent' }, notes: [{ x: 360, y: 345, text: 'iteration 3: A leaves', size: 14, tone: 'ok' }] },
    { caption: 'C takes the free slot for iteration 3. C ends after iteration 8, the same time as B. Both slots were busy all 8 iterations: 100% use. C waited 2 iterations instead of 8, and all three requests ended by iteration 8 instead of 14.', tones: { s1: 'ok', s2: 'ok', q: 'ok' }, notes: [{ x: 360, y: 345, text: 'C waits 2, done at 8', size: 14, tone: 'ok' }] },
  ],
};

export default function ChatgptBatching() {
  return (
    <DesignCompare
      title="Sharing one GPU"
      prompt="Batching:"
      variants={[fixed, continuous]}
      height={370}
      label="Comparison of static batching, where a free slot waits for the whole batch, and continuous batching, where a waiting request joins between tokens."
    />
  );
}
