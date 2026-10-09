import { useState } from 'react';
import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';
import { Seg } from './CacheWidgetFrame';

type Scenario = 'ryw' | 'mono' | 'prefix';

interface V {
  sub: string;
  tone?: Tone;
}

interface Step {
  caption: string;
  a: V;
  b: V;
  active: string[];
  packets: FlowPacket[];
  note?: string;
  noteTone?: Tone;
  repl?: boolean;
}

const LABELS: Record<Scenario, { a: string; b: string; c: string }> = {
  ryw: { a: 'Leader', b: 'Follower', c: 'You' },
  mono: { a: 'Follower 1', b: 'Follower 2', c: 'You' },
  prefix: { a: 'Shard 1 follower', b: 'Shard 2 follower', c: 'Reader' },
};

function steps(scn: Scenario, fix: boolean): Step[] {
  if (scn === 'ryw') {
    return [
      {
        caption: 'A profile page. Your display name is "Ann" on the leader and on a follower. Reads can go to either one.',
        a: { sub: 'name = Ann' },
        b: { sub: 'name = Ann' },
        active: [],
        packets: [],
      },
      {
        caption: 'You change your name to "Anna". The write goes to the leader, which commits it and answers OK.',
        a: { sub: 'name = Anna', tone: 'ok' },
        b: { sub: 'name = Ann' },
        active: ['c', 'a'],
        packets: [
          { from: 'c', to: 'a', label: 'Anna' },
          { from: 'a', to: 'c', label: 'OK', tone: 'ok', delay: 0.9 },
        ],
      },
      {
        caption: 'The leader ships the change to the follower, but shipping takes time. For a moment the follower still holds the old name.',
        a: { sub: 'name = Anna', tone: 'ok' },
        b: { sub: 'name = Ann' },
        active: ['a'],
        packets: [{ from: 'a', to: 'b', label: 'Anna' }],
        repl: true,
      },
      fix
        ? {
            caption:
              'Fix: you just wrote, so the router sends your read to the leader. (Another way: your write returned a log position, and a follower answers only after it passes that position.) You see "Anna".',
            a: { sub: 'name = Anna', tone: 'ok' },
            b: { sub: 'name = Ann' },
            active: ['c', 'a'],
            packets: [
              { from: 'c', to: 'a', label: 'read' },
              { from: 'a', to: 'c', label: 'Anna', tone: 'ok', delay: 0.9 },
            ],
            note: 'read-your-writes holds',
            noteTone: 'ok',
          }
        : {
            caption: 'You reload. The router sends your read to the follower. It answers "Ann". The change you just made seems to have vanished. The system is working as designed, and the user thinks it is broken.',
            a: { sub: 'name = Anna', tone: 'ok' },
            b: { sub: 'name = Ann', tone: 'warn' },
            active: ['c', 'b'],
            packets: [
              { from: 'c', to: 'b', label: 'read' },
              { from: 'b', to: 'c', label: 'Ann', tone: 'warn', delay: 0.9 },
            ],
            note: 'read-your-writes violated',
            noteTone: 'bad',
          },
      {
        caption: 'The follower catches up. Replicas now agree, as eventual consistency promises. That promise says nothing about what you saw in between.',
        a: { sub: 'name = Anna', tone: 'ok' },
        b: { sub: 'name = Anna', tone: 'ok' },
        active: ['a', 'b'],
        packets: [],
        repl: true,
      },
    ];
  }
  if (scn === 'mono') {
    const s0: Step = {
      caption:
        'The leader (not drawn) committed name = "Anna" a moment ago. Follower 1 has applied it. Follower 2 is behind and still holds "Ann". You keep refreshing the page.',
      a: { sub: 'name = Anna', tone: 'ok' },
      b: { sub: 'name = Ann (behind)' },
      active: [],
      packets: [],
    };
    const readA = (caption: string): Step => ({
      caption,
      a: { sub: 'name = Anna', tone: 'ok' },
      b: { sub: 'name = Ann (behind)' },
      active: ['c', 'a'],
      packets: [
        { from: 'c', to: 'a', label: 'read' },
        { from: 'a', to: 'c', label: 'Anna', tone: 'ok', delay: 0.9 },
      ],
    });
    return [
      s0,
      readA('Refresh 1. The router sends the read to follower 1. You see "Anna".'),
      fix
        ? readA('Fix: the router sends every read from this user to the same follower, chosen by hashing the user id. Refresh 2 goes to follower 1 again. You see "Anna".')
        : {
            caption: 'Refresh 2. The router picks follower 2 this time. You see "Ann". The page went back in time: you saw the new value, and then the old one.',
            a: { sub: 'name = Anna', tone: 'ok' },
            b: { sub: 'name = Ann (behind)', tone: 'warn' },
            active: ['c', 'b'],
            packets: [
              { from: 'c', to: 'b', label: 'read' },
              { from: 'b', to: 'c', label: 'Ann', tone: 'warn', delay: 0.9 },
            ],
            note: 'time went backward',
            noteTone: 'bad',
          },
      readA(fix ? 'Refresh 3 also goes to follower 1. Anna, Anna, Anna. Values may be a little old, but they never move backward.' : 'Refresh 3 lands on follower 1 again. You see "Anna". Three refreshes gave Anna, Ann, Anna.'),
      {
        caption: fix
          ? 'This is monotonic reads: once you have seen a value, you never see an older one. It is weaker than read-your-writes and cheap: no coordination, only routing.'
          : 'Each answer was valid for its replica. But the sequence breaks monotonic reads: a later read returned something older than an earlier read. This is the weakest guarantee that still lets users trust a page.',
        a: { sub: 'name = Anna', tone: 'ok' },
        b: { sub: 'name = Anna', tone: 'ok' },
        active: ['a', 'b'],
        packets: [],
      },
    ];
  }
  return [
    {
      caption:
        'A chat app splits its data over two shards (lesson 4.7). Alice’s question lives on shard 1. Bob’s reply will live on shard 2. Each shard has a follower that serves reads.',
      a: { sub: '(no messages)' },
      b: { sub: '(no messages)' },
      active: [],
      packets: [],
    },
    {
      caption:
        'Alice asks, "Is the site down?" Bob sees the question and replies, "No, it is up." The reply was written after Bob read the question. It depends on it.',
      a: { sub: 'Q: Is the site down?', tone: 'ok' },
      b: { sub: 'A: No, it is up.', tone: 'ok' },
      active: ['a', 'b'],
      packets: [],
      note: 'leaders hold Q and A (not drawn)',
      noteTone: 'ok',
    },
    {
      caption:
        'Each shard replicates on its own, with no order across shards. Shard 2’s follower applies the reply quickly. Shard 1’s follower is slow, so the question has not arrived.',
      a: { sub: '(question not yet here)' },
      b: { sub: 'A: No, it is up.', tone: 'ok' },
      active: ['b'],
      packets: [],
    },
    fix
      ? {
          caption:
            'Fix: the reply carries a mark saying "I come after the question". Shard 2’s follower will not show it until the question is visible. The reader sees an empty chat, not a broken one.',
          a: { sub: '(question not yet here)' },
          b: { sub: 'A: held back', tone: 'warn' },
          active: ['c', 'a', 'b'],
          packets: [
            { from: 'c', to: 'a', label: 'read' },
            { from: 'c', to: 'b', label: 'read', delay: 0.15 },
          ],
          note: 'prefix of history: empty',
          noteTone: 'ok',
        }
      : {
          caption:
            'A reader loads the chat from both followers. They see the answer "No, it is up." with no question. The answer now makes no sense, or worse, suggests the opposite. Each shard answered with what it had. Together, the answers show a history that never happened.',
          a: { sub: '(question not yet here)' },
          b: { sub: 'A: No, it is up.', tone: 'warn' },
          active: ['c', 'a', 'b'],
          packets: [
            { from: 'a', to: 'c', label: 'nothing' },
            { from: 'b', to: 'c', label: 'A', tone: 'warn', delay: 0.15 },
          ],
          note: 'answer without a question',
          noteTone: 'bad',
        },
    {
      caption:
        'Shard 1’s follower catches up. The reader now sees question, then answer. The guarantee you wanted is consistent prefix: you may see an old state, but you only ever see a state that really existed, with causes before effects.',
      a: { sub: 'Q: Is the site down?', tone: 'ok' },
      b: { sub: 'A: No, it is up.', tone: 'ok' },
      active: ['a', 'b'],
      packets: [],
    },
  ];
}

const TITLES: Record<Scenario, string> = {
  ryw: 'Read-your-writes',
  mono: 'Monotonic reads',
  prefix: 'Consistent prefix',
};

export default function AnomalyWalk() {
  const [scn, setScn] = useState<Scenario>('ryw');
  const [fix, setFix] = useState(false);
  const list = steps(scn, fix);
  const lab = LABELS[scn];
  return (
    <div>
      <div className="not-prose mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="text-muted">Anomaly:</span>
          <Seg
            label="Anomaly"
            value={scn}
            onChange={setScn}
            options={[
              { id: 'ryw', label: 'Missing my own write' },
              { id: 'mono', label: 'Time goes backward' },
              { id: 'prefix', label: 'Answer before question' },
            ]}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted">Guarantee:</span>
          <Seg
            label="Guarantee"
            value={fix ? 'on' : 'off'}
            onChange={(v) => setFix(v === 'on')}
            options={[
              { id: 'off', label: 'Off (plain eventual)' },
              { id: 'on', label: `On (${TITLES[scn].toLowerCase()})` },
            ]}
          />
        </div>
      </div>
      <AnimFrame title={`${TITLES[scn]}: ${fix ? 'guarantee on' : 'guarantee off'}`} steps={list} interval={4000}>
        {(i, s) => {
          const nodes: FlowNode[] = [
            { id: 'c', x: 70, y: 150, w: 100, h: 60, label: lab.c },
            { id: 'a', x: 420, y: 66, w: 230, h: 86, shape: 'db', label: lab.a, sub: s.a.sub, tone: s.a.tone },
            { id: 'b', x: 420, y: 238, w: 230, h: 86, shape: 'db', label: lab.b, sub: s.b.sub, tone: s.b.tone },
          ];
          const edges: FlowEdge[] = [
            { from: 'c', to: 'a', head: 'both' },
            { from: 'c', to: 'b', head: 'both' },
          ];
          if (s.repl) edges.push({ from: 'a', to: 'b', head: 'end', dashed: true, label: 'replication', labelAt: [58, 0] });
          const notes: FlowNote[] = s.note ? [{ x: 16, y: 268, text: s.note, anchor: 'start', size: 16, tone: s.noteTone }] : [];
          return <FlowDiagram width={720} height={310} nodes={nodes} edges={edges} notes={notes} active={s.active} packets={s.packets} stepKey={`${scn}-${fix}-${i}`} label={`${TITLES[scn]} example with a client and two replicas`} />;
        }}
      </AnimFrame>
    </div>
  );
}
