import { useState } from 'react';
import { WidgetFrame } from '../data-kit';
import AsyncPartitionViz, { type LogCell } from './AsyncPartitionViz';
import { assign, groupStats } from './asyncSim';

/**
 * Consumers versus partitions. Model: range assignment, one group, each partition read by one member.
 * Other assignors split differently, but the cap is the same: working consumers <= partitions.
 */

const SAMPLE: LogCell[] = [{ key: 'A' }, { key: 'B' }, { key: 'C' }];

export default function AsyncGroupLab() {
  const [parts, setParts] = useState(3);
  const [cons, setCons] = useState(5);
  const a = assign(parts, cons);
  const st = groupStats(parts, cons);

  return (
    <WidgetFrame
      title="Partitions cap parallelism"
      caption={
        <>
          Set 3 partitions and 5 consumers. Two consumers sit idle, so a fourth and fifth consumer add cost and no speed. The ceiling is the partition count. To read faster you need more partitions first, and that choice is hard to reverse, so pick it with room to grow.
        </>
      }
    >
      <AsyncPartitionViz
        partitions={Array.from({ length: parts }, () => ({ cells: SAMPLE }))}
        members={a.map((owns, i) => ({ name: `C${i + 1}`, owns }))}
        groupName="One consumer group"
        label={`${parts} partitions shared by ${cons} consumers`}
      />
      <div className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <label className="block">
          <span className="flex justify-between"><span>Partitions</span><span className="font-mono tabular-nums">{parts}</span></span>
          <input type="range" min={1} max={8} value={parts} onChange={(e) => setParts(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <label className="block">
          <span className="flex justify-between"><span>Consumers in the group</span><span className="font-mono tabular-nums">{cons}</span></span>
          <input type="range" min={1} max={10} value={cons} onChange={(e) => setCons(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-x-4 text-xs">
        <dt className="text-muted">Working consumers</dt>
        <dt className="text-muted">Idle consumers</dt>
        <dt className="text-muted">Most partitions on one</dt>
        <dd className="font-mono">{st.working}</dd>
        <dd className="font-mono" style={{ color: st.idle > 0 ? 'var(--warn)' : undefined }}>{st.idle}</dd>
        <dd className="font-mono">{st.mostPartitions}</dd>
      </dl>
    </WidgetFrame>
  );
}
