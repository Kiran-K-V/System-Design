import { useState } from 'react';
import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';
import { Seg } from './CacheWidgetFrame';

type Mode = 'CP' | 'AP';

interface Step {
  caption: string;
  xa: string;
  xb: string;
  cut: boolean;
  active: string[];
  packets: FlowPacket[];
  noteA?: string;
  noteB?: string;
  tone?: { a?: Tone; b?: Tone };
}

function stepsFor(mode: Mode): Step[] {
  const cp = mode === 'CP';
  return [
    {
      caption: 'Two replicas of one value, x. Replica A is near Alice. Replica B is near Bob. They are in different regions and both hold x = 1.',
      xa: '1', xb: '1', cut: false, active: [], packets: [],
    },
    {
      caption: 'Alice writes x = 2 to A. A forwards the write to B. Both replicas now hold 2. When the network works, you can have consistency and availability together.',
      xa: '2', xb: '2', cut: false, active: ['alice', 'a', 'b'],
      packets: [
        { from: 'alice', to: 'a', label: 'x=2' },
        { from: 'a', to: 'b', label: 'x=2', delay: 0.9 },
      ],
    },
    {
      caption: 'The link between the regions fails. This is a network partition. Both replicas are still running. Neither can tell if the other is down or only unreachable.',
      xa: '2', xb: '2', cut: true, active: [], packets: [],
      noteA: 'alive', noteB: 'alive',
    },
    cp
      ? {
          caption: 'CP choice. Alice writes x = 5 to A. A cannot confirm the write with B, so it refuses. Alice gets an error. The data stays correct (x = 2 everywhere), but the system was unavailable for this request.',
          xa: '2', xb: '2', cut: true, active: ['alice', 'a'],
          packets: [
            { from: 'alice', to: 'a', label: 'x=5' },
            { from: 'a', to: 'alice', label: 'error', tone: 'bad', delay: 0.9 },
          ],
          noteA: 'write refused',
          tone: { a: 'bad' },
        }
      : {
          caption: 'AP choice. Alice writes x = 5 to A. A accepts it and answers "ok". The system is available. But B cannot see the write, so the replicas now disagree: A holds 5, B holds 2.',
          xa: '5', xb: '2', cut: true, active: ['alice', 'a'],
          packets: [
            { from: 'alice', to: 'a', label: 'x=5' },
            { from: 'a', to: 'alice', label: 'ok', tone: 'ok', delay: 0.9 },
          ],
          noteA: 'accepted',
          tone: { a: 'warn' },
        },
    cp
      ? {
          caption: 'Bob reads x from B. B cannot check whether it is current, so it refuses. Bob gets an error. A stale answer is never returned.',
          xa: '2', xb: '2', cut: true, active: ['bob', 'b'],
          packets: [
            { from: 'bob', to: 'b', label: 'read x' },
            { from: 'b', to: 'bob', label: 'error', tone: 'bad', delay: 0.9 },
          ],
          noteB: 'read refused',
          tone: { b: 'bad' },
        }
      : {
          caption: 'Bob reads x from B. B answers with what it has: x = 2. Alice already wrote 5, so this answer is stale. Bob got a fast answer, and it was out of date.',
          xa: '5', xb: '2', cut: true, active: ['bob', 'b'],
          packets: [
            { from: 'bob', to: 'b', label: 'read x' },
            { from: 'b', to: 'bob', label: 'x=2 (stale)', tone: 'warn', delay: 0.9 },
          ],
          noteB: 'stale answer',
          tone: { a: 'warn', b: 'warn' },
        },
    cp
      ? {
          caption: 'Bob tries to write x = 7. B refuses again. In a real CP system with three or more replicas, the side that still has a majority keeps working. Only the side with no majority refuses.',
          xa: '2', xb: '2', cut: true, active: ['bob', 'b'],
          packets: [
            { from: 'bob', to: 'b', label: 'x=7' },
            { from: 'b', to: 'bob', label: 'error', tone: 'bad', delay: 0.9 },
          ],
          noteB: 'write refused',
          tone: { b: 'bad' },
        }
      : {
          caption: 'Bob writes x = 7 to B. B accepts. Now both sides took a write while cut off from each other. The two replicas hold different values, 5 and 7, and neither is "wrong".',
          xa: '5', xb: '7', cut: true, active: ['bob', 'b'],
          packets: [
            { from: 'bob', to: 'b', label: 'x=7' },
            { from: 'b', to: 'bob', label: 'ok', tone: 'ok', delay: 0.9 },
          ],
          noteB: 'accepted',
          tone: { a: 'warn', b: 'warn' },
        },
    cp
      ? {
          caption: 'The partition heals. A and B talk again and resume. Every answer the system gave was correct. The price was errors during the partition. Clients retry now.',
          xa: '2', xb: '2', cut: false, active: ['a', 'b'],
          packets: [{ from: 'a', to: 'b', label: 'sync', tone: 'ok' }],
          noteA: 'serving again',
          noteB: 'serving again',
          tone: { a: 'ok', b: 'ok' },
        }
      : {
          caption: 'The partition heals. The replicas compare notes and find a conflict: 5 versus 7. The system needs a rule to merge them. "Last write wins" silently drops one write. Vector clocks or CRDTs keep both for the app to resolve.',
          xa: '5 / 7?', xb: '7 / 5?', cut: false, active: ['a', 'b'],
          packets: [{ from: 'a', to: 'b', label: 'conflict', tone: 'bad' }],
          noteA: 'must reconcile',
          noteB: 'must reconcile',
          tone: { a: 'bad', b: 'bad' },
        },
  ];
}

export default function CapPartition() {
  const [mode, setMode] = useState<Mode>('CP');
  const steps = stepsFor(mode);
  return (
    <div>
      <div className="not-prose mt-8 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted">During a partition, the system chooses:</span>
        <Seg
          label="Partition behavior"
          value={mode}
          onChange={setMode}
          options={[
            { id: 'CP', label: 'CP: stay consistent, reject' },
            { id: 'AP', label: 'AP: stay available, diverge' },
          ]}
        />
      </div>
      <AnimFrame title={`Partition between two replicas (${mode})`} steps={steps} interval={3200}>
        {(_, s) => {
          const nodes: FlowNode[] = [
            { id: 'alice', x: 52, y: 150, w: 84, h: 54, label: 'Alice', sub: 'client' },
            { id: 'a', x: 235, y: 150, w: 130, h: 92, shape: 'db', label: 'Replica A', sub: `x = ${s.xa}`, tone: s.tone?.a },
            { id: 'b', x: 485, y: 150, w: 130, h: 92, shape: 'db', label: 'Replica B', sub: `x = ${s.xb}`, tone: s.tone?.b },
            { id: 'bob', x: 668, y: 150, w: 84, h: 54, label: 'Bob', sub: 'client' },
          ];
          const edges: FlowEdge[] = [
            { from: 'alice', to: 'a', head: 'both' },
            { from: 'bob', to: 'b', head: 'both' },
            s.cut
              ? { from: 'a', to: 'b', head: 'none', dashed: true, tone: 'bad', label: 'link down', labelAt: [0, -18] }
              : { from: 'a', to: 'b', head: 'both', tone: 'ok', label: 'replication', labelAt: [0, -18] },
          ];
          const notes: FlowNote[] = [];
          if (s.cut) notes.push({ x: 360, y: 150, text: '✕', anchor: 'middle', size: 30, tone: 'bad' });
          if (s.noteA) notes.push({ x: 235, y: 228, text: s.noteA, anchor: 'middle', size: 15, tone: s.noteA === 'serving again' ? 'ok' : s.noteA === 'alive' ? 'muted' : 'bad' });
          if (s.noteB) notes.push({ x: 485, y: 228, text: s.noteB, anchor: 'middle', size: 15, tone: s.noteB === 'serving again' ? 'ok' : s.noteB === 'alive' ? 'muted' : 'bad' });
          return (
            <FlowDiagram
              width={720}
              height={260}
              nodes={nodes}
              edges={edges}
              notes={notes}
              active={s.active}
              packets={s.packets}
              stepKey={`${mode}-${s.caption.length}`}
              label="Two replicas separated by a network partition"
            />
          );
        }}
      </AnimFrame>
    </div>
  );
}
