import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'client', x: 70, y: 190, w: 90, h: 56, label: 'Client', step: 0 },
  { id: 'meta', x: 280, y: 60, w: 150, h: 56, label: 'Metadata service', step: 0 },
  { id: 'metadb', x: 520, y: 60, w: 130, h: 70, label: 'Metadata DB', shape: 'db', step: 0 },
  { id: 's3', x: 560, y: 290, w: 140, h: 70, label: 'Object storage', shape: 'db', step: 0 },
  { id: 'cdn', x: 300, y: 330, w: 100, h: 50, label: 'CDN', step: 3 },
  { id: 'sync', x: 500, y: 175, w: 130, h: 50, label: 'Sync service', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'client', to: 'meta', step: 0, label: 'ask', labelAt: [-10, -14] },
  { from: 'meta', to: 'metadb', step: 0 },
  { from: 'client', to: 's3', step: 0, label: 'bytes', labelAt: [0, 16] },
  { from: 's3', to: 'cdn', step: 3 },
  { from: 'cdn', to: 'client', step: 3 },
  { from: 'client', to: 'sync', step: 5, head: 'both' },
  { from: 'sync', to: 'metadb', step: 5 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: upload a file',
    caption: 'The client asks the metadata service for permission. The service records the file and returns a pre-signed URL (lesson 8.11). The client sends the bytes straight to object storage. App servers never carry file bytes.',
    packets: [{ from: 'client', to: 'meta' }, { from: 'client', to: 's3', delay: 0.8 }],
  },
  {
    req: 'NFR: files up to 50 GB',
    caption: 'No new box. The client cuts a big file into chunks and uploads each with a multipart upload, so a failure costs one chunk, not the whole file (lesson 9.6).',
    active: ['client', 's3'],
  },
  {
    req: 'NFR: low upload cost',
    caption: 'No new box. Each chunk has a SHA-256 hash. The metadata DB keeps a table of known hashes. The client sends its hash list and uploads only the chunks the server lacks.',
    active: ['metadb'],
  },
  {
    req: 'FR2: download a file',
    caption: 'The metadata service looks up the file\'s chunk list and returns signed URLs. Chunks come from a CDN in front of object storage, close to the user.',
    packets: [{ from: 's3', to: 'cdn' }, { from: 'cdn', to: 'client', delay: 0.6 }],
  },
  {
    req: 'FR3: share a file',
    caption: 'No new box. A share row says which user may read which file. The metadata service checks it before it hands out any download URL.',
    active: ['metadb', 'meta'],
  },
  {
    req: 'FR4: sync across devices',
    caption: 'Each device keeps a cursor: the last change it saw. The sync service pushes a nudge, and the device asks "what changed since my cursor?" Only metadata moves, then missing chunks.',
    packets: [{ from: 'sync', to: 'client' }],
  },
];

export default function DropboxBuild() {
  return (
    <DesignBuild
      title="File storage and sync, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={390}
      label="Design of a file storage and sync system. The client uploads chunks straight to object storage using pre-signed URLs, a metadata service tracks files and shares, a CDN serves downloads, and a sync service tells devices what changed."
    />
  );
}
