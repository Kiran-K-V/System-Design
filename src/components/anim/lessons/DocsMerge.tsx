import { DesignCompare, type CompareVariant } from '../DesignBuild';

const note = (x: number, y: number, text: string, tone?: 'ok' | 'bad' | 'warn') => ({ x, y, text, size: 14 as const, tone });

const nodes: CompareVariant['nodes'] = [
  { id: 'a', x: 85, y: 85, w: 150, h: 60, label: 'Alice', sub: 'types X after A' },
  { id: 'b', x: 85, y: 265, w: 150, h: 60, label: 'Bob', sub: 'deletes C' },
  { id: 'srv', x: 360, y: 175, w: 150, h: 64, label: 'Server' },
];
const edges: CompareVariant['edges'] = [
  { from: 'a', to: 'srv', head: 'both' },
  { from: 'b', to: 'srv', head: 'both' },
];

const lww: CompareVariant = {
  id: 'lww',
  label: 'Naive: last write wins',
  nodes,
  edges,
  steps: [
    { caption: 'The shared text is "ABC". Each editor sends its whole new text to the server. The server keeps the most recent one.', active: ['srv'], notes: [note(520, 150, 'Alice screen: ABC'), note(520, 175, 'Bob screen: ABC')] },
    { caption: 'At the same moment, Alice types X after A and Bob deletes C. Alice now has "AXBC". Bob has "AB".', packets: [{ from: 'a', to: 'srv', label: 'AXBC' }, { from: 'b', to: 'srv', label: 'AB', delay: 0.5 }], tones: { a: 'warn', b: 'warn' }, notes: [note(520, 150, 'Alice screen: AXBC'), note(520, 175, 'Bob screen: AB')] },
    { caption: 'Bob\'s message arrives last, so the server keeps "AB". It sends "AB" to Alice. Her X disappears from her screen.', packets: [{ from: 'srv', to: 'a', label: 'AB', tone: 'bad' }], tones: { a: 'bad', srv: 'bad' }, notes: [note(520, 150, 'Alice screen: AB', 'bad'), note(520, 175, 'Bob screen: AB')] },
    { caption: 'The users now agree, but Alice lost an edit that nobody told her about. Sending whole documents makes every concurrent edit a conflict. Editing needs a finer unit: one operation.', tones: { a: 'bad' }, notes: [note(520, 150, 'Alice screen: AB', 'bad'), note(520, 175, 'Bob screen: AB')] },
  ],
};

const ot: CompareVariant = {
  id: 'ot',
  label: 'Better: operational transform',
  nodes,
  edges,
  steps: [
    { caption: 'Editors send operations, not text. Alice sends insert(1, "X"). Bob sends delete(2). Both are based on "ABC", so they are concurrent.', packets: [{ from: 'a', to: 'srv', label: 'ins(1,X)' }, { from: 'b', to: 'srv', label: 'del(2)', delay: 0.5 }], tones: { a: 'warn', b: 'warn' }, notes: [note(520, 150, 'Alice screen: AXBC'), note(520, 175, 'Bob screen: AB')] },
    { caption: 'The server orders them. Alice is first. insert(1, "X") applies as it is: "ABC" becomes "AXBC".', active: ['srv'], tones: { a: 'ok' }, notes: [note(520, 150, 'Server text: AXBC', 'ok')] },
    { caption: 'Bob\'s delete(2) was written for "ABC". Alice\'s insert came earlier, at position 1, which is before 2. So everything after it moved one place right. The server transforms delete(2) into delete(3).', active: ['srv'], tones: { b: 'warn', srv: 'accent' }, notes: [note(520, 150, 'delete(2) becomes delete(3)', 'warn')] },
    { caption: 'delete(3) on "AXBC" removes C. The server text is "AXB". The server sends delete(3) to Alice. It sends insert(1, "X") to Bob, who already deleted C, so the insert stays at 1.', packets: [{ from: 'srv', to: 'a', label: 'del(3)', tone: 'ok' }, { from: 'srv', to: 'b', label: 'ins(1,X)', tone: 'ok', delay: 0.5 }], tones: { a: 'ok', b: 'ok', srv: 'ok' }, notes: [note(520, 150, 'Server text: AXB', 'ok')] },
    { caption: 'Alice\'s screen: AXBC, then delete(3), gives AXB. Bob\'s screen: AB, then insert(1, X), gives AXB. All three copies equal "AXB" and both edits survived.', tones: { a: 'ok', b: 'ok', srv: 'ok' }, notes: [note(520, 150, 'Alice screen: AXB', 'ok'), note(520, 175, 'Bob screen: AXB', 'ok')] },
  ],
};

export default function DocsMerge() {
  return (
    <DesignCompare
      title="Two edits at the same moment"
      prompt="Merging:"
      variants={[lww, ot]}
      height={350}
      label="Two designs for merging concurrent edits to the text ABC. Last write wins drops Alice's insert. Operational transform changes Bob's delete from position 2 to position 3 and keeps both edits."
    />
  );
}
