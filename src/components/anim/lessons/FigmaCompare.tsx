import { DesignCompare, type CompareVariant } from '../DesignBuild';

const before: CompareVariant = {
  id: 'before',
  label: 'Before',
  nodes: [
    { id: 'clients', x: 80, y: 150, w: 110, h: 56, label: 'Clients' },
    { id: 'server', x: 320, y: 150, w: 150, h: 64, label: 'Multiplayer', sub: 'file in memory' },
    { id: 'ckpt', x: 600, y: 150, w: 150, h: 80, shape: 'db', label: 'Checkpoint', sub: 'in S3 file store' },
  ],
  edges: [
    { from: 'clients', to: 'server', label: 'edits' },
    { from: 'server', to: 'ckpt', label: 'every 30-60 s' },
  ],
  steps: [
    { caption: 'Clients send edits over WebSockets. The server process holds the live file in memory and is the authority on its state.', packets: [{ from: 'clients', to: 'server', label: 'edit' }], active: ['server'] },
    { caption: 'Only about every 30 to 60 seconds does the server encode the whole file and write a checkpoint. Edits made since then exist only in memory.', packets: [{ from: 'server', to: 'ckpt', label: 'save' }], active: ['ckpt'], tones: { ckpt: 'ok' } },
    {
      caption: 'The server crashes. Memory is gone. The newest durable copy is the last checkpoint.',
      tones: { server: 'bad' },
      notes: [{ x: 320, y: 250, text: 'in-memory edits lost', anchor: 'middle', tone: 'bad' }],
    },
    {
      caption: 'The post says up to 60 seconds of work could be lost. A redeploy had a second cost: it closes every in-memory file at once, so checkpoint load spikes.',
      tones: { server: 'bad', ckpt: 'warn' },
      active: ['ckpt'],
      notes: [{ x: 360, y: 250, text: 'loss window: up to 60 s', anchor: 'middle', tone: 'bad' }],
    },
  ],
};

const after: CompareVariant = {
  id: 'after',
  label: 'After',
  nodes: [
    { id: 'clients', x: 80, y: 150, w: 110, h: 56, label: 'Clients' },
    { id: 'server', x: 290, y: 150, w: 150, h: 64, label: 'Multiplayer', sub: 'file in memory' },
    { id: 'journal', x: 560, y: 80, w: 150, h: 80, shape: 'db', label: 'Journal', sub: 'every 0.5 s' },
    { id: 'ckpt', x: 560, y: 220, w: 150, h: 80, shape: 'db', label: 'Checkpoint', sub: 'less often' },
  ],
  edges: [
    { from: 'clients', to: 'server', label: 'edits' },
    { from: 'server', to: 'journal' },
    { from: 'server', to: 'ckpt' },
  ],
  steps: [
    { caption: 'The sync path is the same. Each accepted change also gets a per-file sequence number, an incrementing integer.', packets: [{ from: 'clients', to: 'server', label: 'edit #8' }], active: ['server'] },
    { caption: 'The server writes new changes to a durable journal about every half second, in batches. It still writes full checkpoints, but less often.', packets: [{ from: 'server', to: 'journal', label: '#8, #9' }], active: ['journal'], tones: { journal: 'ok' } },
    {
      caption: 'The server crashes. The latest checkpoint covers up to change #7. The journal holds #8 and #9.',
      tones: { server: 'bad', journal: 'ok', ckpt: 'ok' },
      notes: [{ x: 290, y: 250, text: 'memory gone, disk safe', anchor: 'middle', tone: 'bad' }],
    },
    {
      caption: 'A new server loads the checkpoint, asks the journal for newer entries, and replays them. The file is back at its latest state.',
      packets: [{ from: 'journal', to: 'server', label: 'replay' }],
      active: ['server'],
      tones: { server: 'ok', journal: 'ok', ckpt: 'ok' },
      notes: [{ x: 290, y: 250, text: 'goal: under 1 s of loss', anchor: 'middle', tone: 'ok' }],
    },
  ],
};

export default function FigmaCompare() {
  return (
    <DesignCompare
      title="Figma file persistence"
      prompt="Design:"
      variants={[before, after]}
      height={290}
      label="Before, a Figma file lived in server memory and was saved as a checkpoint every 30 to 60 seconds. After, changes also go to a journal about every half second, and recovery replays it."
    />
  );
}
