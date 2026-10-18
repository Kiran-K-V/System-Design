import { DesignCompare, type CompareVariant } from '../DesignBuild';

const hash: CompareVariant = {
  id: 'hash',
  label: 'Naive: hash the URL',
  nodes: [
    { id: 'a', x: 80, y: 90, w: 110, h: 56, label: 'URL A' },
    { id: 'b', x: 80, y: 230, w: 110, h: 56, label: 'URL B' },
    { id: 'svc', x: 300, y: 160, w: 150, h: 70, label: 'Service', sub: 'hash, take 7 chars' },
    { id: 'db', x: 560, y: 160, w: 130, h: 80, label: 'URL table', shape: 'db' },
  ],
  edges: [
    { from: 'a', to: 'svc' },
    { from: 'b', to: 'svc' },
    { from: 'svc', to: 'db' },
  ],
  steps: [
    { caption: 'The service hashes each long URL and keeps the first 7 base62 characters as the code. No counter is needed.', active: ['svc'] },
    { caption: 'URL A hashes to the code "k3Fq9Zd". The service writes it. So far so good.', packets: [{ from: 'a', to: 'svc' }, { from: 'svc', to: 'db' }], tones: { db: 'ok' } },
    { caption: 'URL B, a different URL, also hashes to "k3Fq9Zd". Cutting a hash to 7 characters throws bits away, so two URLs can land on one code. The insert fails.', packets: [{ from: 'b', to: 'svc' }, { from: 'svc', to: 'db', tone: 'bad' }], tones: { b: 'bad', db: 'bad' } },
    { caption: 'The fix is to check the table, add some extra characters to the URL, and hash again. Every write now needs a read first, and a retry loop. At 1B codes in 62^7 space, we expect about 142,000 colliding pairs.', active: ['svc'], tones: { svc: 'warn' } },
  ],
};

const counter: CompareVariant = {
  id: 'counter',
  label: 'Better: counter ranges',
  nodes: [
    { id: 's1', x: 90, y: 90, w: 130, h: 56, label: 'Server 1' },
    { id: 's2', x: 90, y: 240, w: 130, h: 56, label: 'Server 2' },
    { id: 'ctr', x: 360, y: 165, w: 150, h: 70, label: 'Range counter', sub: 'next = 1,000,000' },
    { id: 'db', x: 620, y: 165, w: 120, h: 80, label: 'URL table', shape: 'db' },
  ],
  edges: [
    { from: 's1', to: 'ctr', label: 'get range', labelAt: [0, -18] },
    { from: 's2', to: 'ctr' },
    { from: 's1', to: 'db', bend: 40 },
    { from: 's2', to: 'db', bend: -40 },
  ],
  steps: [
    { caption: 'A small counter service holds one number: the next free ID. Servers do not ask it for every code. They ask for a whole range.', active: ['ctr'] },
    { caption: 'Server 1 asks for 1,000 IDs and gets 1,000,000 to 1,000,999. Server 2 asks next and gets 1,001,000 to 1,001,999. Ranges never overlap.', packets: [{ from: 's1', to: 'ctr' }, { from: 's2', to: 'ctr', delay: 0.6 }], tones: { ctr: 'accent' } },
    { caption: 'Server 1 encodes ID 1,000,000 in base62 and gets "4c92". It writes the row. No other server can produce this ID, so no collision check is needed.', packets: [{ from: 's1', to: 'db' }], tones: { s1: 'ok', db: 'ok' } },
    { caption: 'The counter is hit once per 1,000 writes, not once per write. If Server 2 crashes, its unused IDs are skipped. A gap in the codes is harmless. The price: codes grow in order, so they are guessable.', active: ['ctr'], tones: { s2: 'warn' } },
  ],
};

export default function BitlyIds() {
  return (
    <DesignCompare
      title="Making a short code"
      prompt="Code generation:"
      variants={[hash, counter]}
      height={330}
      label="Two designs for making short codes. Hashing causes collisions. Counter ranges give each server its own block of IDs."
    />
  );
}
