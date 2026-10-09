import { useState } from 'react';
import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';
import { Seg } from './CacheWidgetFrame';

type Mode = 'async' | 'semi';

interface NodeView {
  sub: string;
  tone?: Tone;
}

interface Step {
  caption: string;
  leader: NodeView;
  f1: NodeView;
  f2: NodeView;
  active: string[];
  packets: FlowPacket[];
  note?: string;
  noteTone?: Tone;
  /** Draw the follower-to-leader ack edge as live. */
  ack?: boolean;
}

const START: Step = {
  caption:
    'One row, x, stored on three machines. The leader accepts writes. Two followers replay the leader’s log (the write-ahead log from lesson 4.2). All three hold x = 4 at log position 41.',
  leader: { sub: 'log 41 · x=4' },
  f1: { sub: 'log 41 · x=4' },
  f2: { sub: 'log 41 · x=4' },
  active: [],
  packets: [],
};

const SEND: Step = {
  caption: 'A client sends the write x = 5. Writes go to the leader only. Followers never accept them.',
  leader: { sub: 'log 41 · x=4' },
  f1: { sub: 'log 41 · x=4' },
  f2: { sub: 'log 41 · x=4' },
  active: ['client', 'leader'],
  packets: [{ from: 'client', to: 'leader', label: 'x=5' }],
};

const APPEND: Step = {
  caption:
    'The leader appends record 42 to its own log and fsyncs it. This is the same commit point as on one machine. The write is now durable on one machine only.',
  leader: { sub: 'log 42 · x=5', tone: 'ok' },
  f1: { sub: 'log 41 · x=4' },
  f2: { sub: 'log 41 · x=4' },
  active: ['leader'],
  packets: [],
  note: 'durable on 1 of 3',
  noteTone: 'warn',
};

function stepsFor(mode: Mode): Step[] {
  if (mode === 'async') {
    return [
      START,
      SEND,
      APPEND,
      {
        caption:
          'Asynchronous: the leader answers OK right away. The client waited for one local fsync (~0.1–1 ms on an SSD). The leader plans to ship record 42 to the followers in the background.',
        leader: { sub: 'log 42 · x=5', tone: 'ok' },
        f1: { sub: 'log 41 · x=4' },
        f2: { sub: 'log 41 · x=4' },
        active: ['client'],
        packets: [{ from: 'leader', to: 'client', label: 'OK', tone: 'ok' }],
        note: 'client believes x=5 is saved',
        noteTone: 'ok',
      },
      {
        caption:
          'CRASH. The leader’s machine dies before it ships record 42. Both followers are healthy. Neither has seen the write. The client already holds an OK.',
        leader: { sub: 'crashed', tone: 'bad' },
        f1: { sub: 'log 41 · x=4' },
        f2: { sub: 'log 41 · x=4' },
        active: [],
        packets: [],
        note: 'record 42 exists only on a dead disk',
        noteTone: 'bad',
      },
      {
        caption:
          'Failover promotes follower 1. The cluster is up again, and x = 4. The write the client was told succeeded is gone. This is the price of asynchronous replication: fast commits, and a window where an acknowledged write can be lost.',
        leader: { sub: 'crashed', tone: 'bad' },
        f1: { sub: 'new leader · x=4', tone: 'warn' },
        f2: { sub: 'log 41 · x=4' },
        active: ['f1'],
        packets: [],
        note: 'x=5 lost',
        noteTone: 'bad',
      },
    ];
  }
  return [
    START,
    SEND,
    APPEND,
    {
      caption:
        'Semi-synchronous: the leader ships record 42 to both followers and waits. It will not answer the client yet.',
      leader: { sub: 'log 42 · x=5', tone: 'ok' },
      f1: { sub: 'log 41 · x=4' },
      f2: { sub: 'log 41 · x=4' },
      active: ['leader'],
      packets: [
        { from: 'leader', to: 'f1', label: 'rec 42' },
        { from: 'leader', to: 'f2', label: 'rec 42', delay: 0.15 },
      ],
      note: 'waiting for 1 ack',
      noteTone: 'warn',
    },
    {
      caption:
        'Follower 1 writes record 42 to its own log and sends an ack. Follower 2 is slower. The leader needs only one ack (MySQL’s default is one). A follower in the same data center adds about one round trip, ~0.5 ms.',
      leader: { sub: 'log 42 · x=5', tone: 'ok' },
      f1: { sub: 'log 42 · x=5', tone: 'ok' },
      f2: { sub: 'log 41 · x=4 (slow)' },
      active: ['f1'],
      packets: [{ from: 'f1', to: 'leader', label: 'ack', tone: 'ok' }],
      ack: true,
      note: 'durable on 2 of 3',
      noteTone: 'ok',
    },
    {
      caption: 'Now the leader replies OK. The write exists on two machines. One machine can fail and the write survives.',
      leader: { sub: 'log 42 · x=5', tone: 'ok' },
      f1: { sub: 'log 42 · x=5', tone: 'ok' },
      f2: { sub: 'log 41 · x=4 (slow)' },
      active: ['client'],
      packets: [{ from: 'leader', to: 'client', label: 'OK', tone: 'ok' }],
    },
    {
      caption: 'CRASH. The same leader failure as before. This time record 42 is already on follower 1.',
      leader: { sub: 'crashed', tone: 'bad' },
      f1: { sub: 'log 42 · x=5', tone: 'ok' },
      f2: { sub: 'log 41 · x=4 (slow)' },
      active: [],
      packets: [],
      note: 'leader down',
      noteTone: 'bad',
    },
    {
      caption:
        'Failover promotes follower 1, the follower with the longest log. x = 5 survives. Follower 2 catches up from the new leader. The price: every write paid one extra round trip, and a slow or dead follower can stall commits. MySQL falls back to asynchronous after a timeout (default 10 s).',
      leader: { sub: 'crashed', tone: 'bad' },
      f1: { sub: 'new leader · x=5', tone: 'ok' },
      f2: { sub: 'log 41 → catching up' },
      active: ['f1'],
      packets: [{ from: 'f1', to: 'f2', label: 'rec 42', tone: 'ok' }],
      note: 'x=5 kept',
      noteTone: 'ok',
    },
  ];
}

export default function ReplicationCommit() {
  const [mode, setMode] = useState<Mode>('async');
  const steps = stepsFor(mode);
  return (
    <div>
      <div className="not-prose mt-8 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted">Leader answers the client:</span>
        <Seg
          label="Replication mode"
          value={mode}
          onChange={setMode}
          options={[
            { id: 'async', label: 'Async: right after its own fsync' },
            { id: 'semi', label: 'Semi-sync: after 1 follower acks' },
          ]}
        />
      </div>
      <AnimFrame title={`One write, then a leader crash (${mode === 'async' ? 'asynchronous' : 'semi-synchronous'})`} steps={steps} interval={3600}>
        {(i, s) => {
          const nodes: FlowNode[] = [
            { id: 'client', x: 50, y: 150, w: 80, h: 56, label: 'Client' },
            { id: 'leader', x: 255, y: 150, w: 170, h: 100, shape: 'db', label: 'Leader', sub: s.leader.sub, tone: s.leader.tone },
            { id: 'f1', x: 615, y: 70, w: 170, h: 90, shape: 'db', label: 'Follower 1', sub: s.f1.sub, tone: s.f1.tone },
            { id: 'f2', x: 615, y: 232, w: 170, h: 90, shape: 'db', label: 'Follower 2', sub: s.f2.sub, tone: s.f2.tone },
          ];
          const edges: FlowEdge[] = [
            { from: 'client', to: 'leader', head: 'both' },
            { from: 'leader', to: 'f1', label: 'ship log', labelAt: [-8, -20], dashed: !s.ack, head: s.ack ? 'both' : 'end' },
            { from: 'leader', to: 'f2', label: 'ship log', labelAt: [-8, 22], dashed: true },
          ];
          const notes: FlowNote[] = s.note ? [{ x: 255, y: 262, text: s.note, anchor: 'middle', tone: s.noteTone, size: 16 }] : [];
          return (
            <FlowDiagram
              width={720}
              height={300}
              nodes={nodes}
              edges={edges}
              notes={notes}
              active={s.active}
              packets={s.packets}
              stepKey={`${mode}-${i}`}
              label="A write on a leader with two followers, then a leader crash"
            />
          );
        }}
      </AnimFrame>
    </div>
  );
}
