import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

/** Two-phase commit across two databases, then the same run with a coordinator crash. */

const ACTORS = ['Coordinator', 'Database A', 'Database B'];

const HAPPY: SeqMessage[] = [
  { from: 'Coordinator', to: 'Database A', label: 'PREPARE' },
  { from: 'Coordinator', to: 'Database B', label: 'PREPARE' },
  { from: 'Database A', to: 'Coordinator', label: 'YES (locks held)', tone: 'ok' },
  { from: 'Database B', to: 'Coordinator', label: 'YES (locks held)', tone: 'ok' },
  { from: 'Coordinator', to: 'Coordinator', label: 'log: COMMIT', note: true, tone: 'accent' },
  { from: 'Coordinator', to: 'Database A', label: 'COMMIT', tone: 'ok' },
  { from: 'Coordinator', to: 'Database B', label: 'COMMIT', tone: 'ok' },
];

const CRASH: SeqMessage[] = [
  { from: 'Coordinator', to: 'Database A', label: 'PREPARE' },
  { from: 'Coordinator', to: 'Database B', label: 'PREPARE' },
  { from: 'Database A', to: 'Coordinator', label: 'YES (locks held)', tone: 'ok' },
  { from: 'Database B', to: 'Coordinator', label: 'YES (locks held)', tone: 'ok' },
  { from: 'Coordinator', to: 'Coordinator', label: 'log: COMMIT, then CRASH', note: true, tone: 'bad' },
  { from: 'Database A', to: 'Database A', label: 'stuck: still locked', note: true, tone: 'bad' },
  { from: 'Database B', to: 'Database B', label: 'stuck: still locked', note: true, tone: 'bad' },
];

interface S {
  caption: string;
  msgs: SeqMessage[];
  visible: number;
}

const steps: S[] = [
  { caption: 'A transfer moves money between two databases, A and B. Each database is its own transaction system. We need all-or-nothing across both. A coordinator (a third process) drives two phases: prepare, then commit.', msgs: HAPPY, visible: 0 },
  { caption: 'Phase 1, prepare. The coordinator asks A to prepare. A does its part, writes its state to disk so it survives a crash, and keeps its locks. It promises to commit if told to.', msgs: HAPPY, visible: 1 },
  { caption: 'The coordinator asks B the same.', msgs: HAPPY, visible: 2 },
  { caption: 'A votes YES. From now on A may not decide alone. It must wait for the coordinator. A\'s rows stay locked.', msgs: HAPPY, visible: 3 },
  { caption: 'B votes YES. All participants are prepared. Both hold locks.', msgs: HAPPY, visible: 4 },
  { caption: 'The coordinator writes "COMMIT" to its own durable log. This is the commit point of the whole transaction. If any vote had been NO, it would log ABORT.', msgs: HAPPY, visible: 5 },
  { caption: 'Phase 2, commit. The coordinator tells A to commit. A applies the change and releases its locks.', msgs: HAPPY, visible: 6 },
  { caption: 'B commits. Both databases committed, or neither would have. Cost: 2 round trips, 2 durable writes per participant, and locks held through both phases.', msgs: HAPPY, visible: 7 },
  { caption: 'Now the failure. Same run through both YES votes. A and B are prepared and hold locks. The coordinator is about to write its decision.', msgs: CRASH, visible: 4 },
  { caption: 'The coordinator writes COMMIT to its log, then crashes before it sends anything to A or B.', msgs: CRASH, visible: 5 },
  { caption: 'A and B voted YES, so they cannot commit or abort on their own. They keep their locks and wait. Every other transaction that needs those rows waits too, until the coordinator restarts and reads its log. This is why two-phase commit is called blocking.', msgs: CRASH, visible: 7 },
];

export default function TwoPhaseCommit() {
  return (
    <AnimFrame title="Two-phase commit, and the crash that blocks it" steps={steps} interval={3600}>
      {(_, s) => <SequenceDiagram actors={ACTORS} messages={s.msgs} visible={s.visible} />}
    </AnimFrame>
  );
}
