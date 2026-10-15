import { DesignCompare, type CompareVariant } from '../DesignBuild';
import type { FlowNode, FlowNote } from '../FlowDiagram';

const X = [70, 160, 250, 340, 430, 520, 610];
const row = (prefix: string, y: number, tone: FlowNode['tone']): FlowNode[] =>
  X.map((x, i) => ({ id: `${prefix}${i}`, x, y, w: 76, h: 50, label: `c${i + 1}`, tone }));

const notes: FlowNote[] = [
  { x: 24, y: 28, text: 'Version 1 of the file', tone: 'muted' },
  { x: 24, y: 168, text: 'Version 2 after a small insert at the start', tone: 'muted' },
];

const tonesFor = (changed: number[], phase: 'old' | 'new'): Record<string, FlowNode['tone']> => {
  const t: Record<string, FlowNode['tone']> = {};
  X.forEach((_, i) => {
    t[`n${i}`] = phase === 'old' ? 'muted' : changed.includes(i) ? 'bad' : 'ok';
  });
  return t;
};

const build = (id: string, label: string, changed: number[], mid: string, last: string): CompareVariant => ({
  id,
  label,
  nodes: [...row('o', 70, 'default'), ...row('n', 230, 'muted')],
  notes,
  steps: [
    { caption: 'The client cuts version 1 into 7 chunks and hashes each one. The server stores all 7. Each chunk is named by its hash.', tones: tonesFor(changed, 'old'), active: [] },
    { caption: mid, tones: tonesFor(changed, 'new'), active: [] },
    { caption: last, tones: tonesFor(changed, 'new'), active: changed.map((i) => `n${i}`) },
  ],
});

const fixed = build(
  'fixed',
  'Naive: fixed-size chunks',
  [0, 1, 2, 3, 4, 5, 6],
  'The user inserts a few bytes at the start. Every chunk is cut at a fixed byte offset, so every boundary after the insert slides along. Every chunk now holds different bytes.',
  'All 7 chunks are marked changed. The client must upload the whole file again, though only a few bytes changed.',
);

const cdc = build(
  'cdc',
  'Better: content-defined chunks',
  [0],
  'The same insert. This time the cut points depend on the bytes near them, found with a rolling hash. The cuts after the edit land on the same bytes as before. Chunks c2 to c7 are unchanged.',
  'Only c1 is marked changed. The server already has the six reused hashes. The client uploads one chunk.',
);

export default function DropboxChunks() {
  return (
    <DesignCompare
      title="Editing a file"
      prompt="Chunking:"
      variants={[fixed, cdc]}
      height={290}
      label="A small insert at the start of a file. With fixed-size chunks every chunk changes. With content-defined chunks only the first one changes."
    />
  );
}
