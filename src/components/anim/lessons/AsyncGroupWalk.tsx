import AnimFrame from '../AnimFrame';
import AsyncPartitionViz, { type GroupMember, type LogCell, type PartitionRow } from './AsyncPartitionViz';

interface Step {
  caption: string;
  logs: LogCell[][];
  members: GroupMember[];
  incoming?: number[];
}

const k = (key: string, state?: LogCell['state']): LogCell => ({ key, state });
const done = (key: string) => k(key, 'consumed');
const nxt = (key: string) => k(key, 'next');

const steps: Step[] = [
  {
    caption:
      'A topic called orders has 4 partitions. Each partition is its own ordered log. A consumer group, here "billing", shares the work. The group gives each partition to exactly one member. C1 owns P0 and P1. C2 owns P2 and P3.',
    logs: [[], [], [], []],
    members: [{ name: 'C1', owns: [0, 1] }, { name: 'C2', owns: [2, 3] }],
  },
  {
    caption:
      'A producer writes four records. The letter is the record key, for example a user id. The producer hashes the key to pick a partition. Each record lands at the next free offset of its partition. Offsets start at 0.',
    logs: [[k('A')], [k('B')], [k('C')], [k('D')]],
    members: [{ name: 'C1', owns: [0, 1] }, { name: 'C2', owns: [2, 3] }],
    incoming: [0, 1, 2, 3],
  },
  {
    caption:
      'Two more records arrive with keys A and C. The same key hashes to the same partition, so A goes to P0 again, at offset 1. Order holds inside one partition. Across partitions there is no order.',
    logs: [[k('A'), k('A')], [k('B')], [k('C'), k('C')], [k('D')]],
    members: [{ name: 'C1', owns: [0, 1] }, { name: 'C2', owns: [2, 3] }],
    incoming: [0, 2],
  },
  {
    caption:
      'Each consumer reads only its own partitions, in offset order, and commits the offset it finished. C1 is caught up. C2 committed offset 1 on P2. It read the second C but has not committed it yet. The committed offset is the group’s bookmark.',
    logs: [[done('A'), done('A')], [done('B')], [done('C'), nxt('C')], [done('D')]],
    members: [{ name: 'C1', owns: [0, 1] }, { name: 'C2', owns: [2, 3] }],
  },
  {
    caption:
      'C2 crashes. It stops sending heartbeats. The group coordinator does not know yet. It waits for the session timeout, 45 seconds by default in the current consumer settings. P2 and P3 have no live reader. New records keep arriving, so lag grows on P2 and P3.',
    logs: [[done('A'), done('A')], [done('B')], [done('C'), nxt('C'), k('C')], [done('D'), k('D')]],
    members: [{ name: 'C1', owns: [0, 1] }, { name: 'C2', owns: [2, 3], state: 'down' }],
    incoming: [2, 3],
  },
  {
    caption:
      'The timeout expires. The group rebalances: it removes C2 and moves its partitions to C1. C1 starts each partition at the committed offset, not at the end. So the second C is read again. If C2 had finished it before the crash, the work is done twice (lesson 6.3).',
    logs: [[done('A'), done('A')], [done('B')], [done('C'), nxt('C'), k('C')], [done('D'), nxt('D')]],
    members: [{ name: 'C1', owns: [0, 1, 2, 3] }],
  },
  {
    caption:
      'C1 works through the backlog on P2 and P3 and commits as it goes. Lag falls to zero. One consumer now does the work of two, so the group has less room for a spike.',
    logs: [[done('A'), done('A')], [done('B')], [done('C'), done('C'), done('C')], [done('D'), done('D')]],
    members: [{ name: 'C1', owns: [0, 1, 2, 3] }],
  },
  {
    caption:
      'C2 restarts and rejoins the group. A second rebalance splits the partitions again. P2 and P3 move back to C2, which resumes from the committed offsets. Every join or leave triggers a rebalance.',
    logs: [[done('A'), done('A')], [done('B')], [done('C'), done('C'), done('C')], [done('D'), done('D')]],
    members: [{ name: 'C1', owns: [0, 1] }, { name: 'C2', owns: [2, 3], state: 'new' }],
  },
];

export default function AsyncGroupWalk() {
  return (
    <AnimFrame title="Partitions, a consumer group, and a rebalance" steps={steps} interval={4200}>
      {(_, s) => {
        const partitions: PartitionRow[] = s.logs.map((cells, i) => ({ cells, incoming: s.incoming?.includes(i) }));
        return <AsyncPartitionViz partitions={partitions} members={s.members} groupName="Group: billing" label="Four partitions read by a consumer group. One consumer crashes and its partitions move." />;
      }}
    </AnimFrame>
  );
}
