import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'creator', x: 70, y: 70, w: 100, h: 44, label: 'Creator', step: 0 },
  { id: 'api', x: 255, y: 70, w: 144, h: 44, label: 'Upload service', step: 0 },
  { id: 'db', x: 635, y: 200, w: 150, h: 80, label: 'Metadata database', sub: 'by video id', shape: 'db', step: 0 },
  { id: 'blob', x: 255, y: 200, w: 144, h: 80, label: 'Blob store', sub: 'raw, segments', shape: 'db', step: 1 },
  { id: 'pipe', x: 450, y: 200, w: 136, h: 60, label: 'Transcode jobs', sub: 'per segment', step: 2 },
  { id: 'cdn', x: 255, y: 335, w: 110, h: 44, label: 'CDN', step: 3 },
  { id: 'watch', x: 450, y: 335, w: 144, h: 44, label: 'Watch service', step: 3 },
  { id: 'viewer', x: 352, y: 430, w: 100, h: 44, label: 'Viewer', step: 3 },
];

const edges: BuildEdge[] = [
  { from: 'creator', to: 'api', step: 0, label: 'start upload', labelAt: [0, -14] },
  { from: 'api', to: 'db', step: 0, label: 'row: uploading', labelAt: [30, -16] },
  { from: 'creator', to: 'blob', step: 1, label: 'parts', labelAt: [-30, 16] },
  { from: 'api', to: 'blob', step: 1, label: 'signed URLs', labelAt: [-52, 0] },
  { from: 'blob', to: 'pipe', step: 2, head: 'both', label: 'in, out', labelAt: [0, -18] },
  { from: 'pipe', to: 'db', step: 2, label: 'ready', labelAt: [0, 16] },
  { from: 'viewer', to: 'watch', step: 3, label: 'which?', labelAt: [38, 8] },
  { from: 'watch', to: 'db', step: 3, label: 'metadata', labelAt: [42, 10] },
  { from: 'viewer', to: 'cdn', step: 3, label: 'segments', labelAt: [-44, 8] },
  { from: 'cdn', to: 'blob', step: 3, label: 'on a miss', labelAt: [-44, 0] },
];

const steps: BuildStep[] = [
  {
    req: 'Requirement 1: start an upload',
    caption:
      'A creator asks to upload. The upload service creates a row with status “uploading” and returns an upload id. The service never touches the video bytes: a video can be tens of gigabytes, and bytes through an app server would block it for the whole transfer.',
    packets: [{ from: 'creator', to: 'api' }, { from: 'api', to: 'db', delay: 0.9 }],
  },
  {
    req: 'Requirement 1: upload the bytes, and resume',
    caption:
      'The service starts a multipart upload in blob storage and gives the client signed URLs. The client sends parts straight to storage, in parallel (the Blob Storage and CDN lesson). If the connection drops, the client asks which parts are done and sends only the rest.',
    packets: [{ from: 'api', to: 'blob' }, { from: 'creator', to: 'blob', delay: 0.9 }],
  },
  {
    req: 'Requirement 1: make it playable',
    caption:
      'When the last part lands, an event starts a pipeline. It is a graph of jobs, where an arrow means “finish first”. The jobs split the file into short segments, encode each segment at several bitrates, and build a manifest that lists them. The outputs go back to blob storage. Then the row becomes “ready”.',
    packets: [{ from: 'blob', to: 'pipe' }, { from: 'pipe', to: 'blob', delay: 0.9 }, { from: 'pipe', to: 'db', delay: 1.8 }],
  },
  {
    req: 'Requirement 2: watch a video',
    caption:
      'A viewer asks the watch service for a video and gets metadata and the manifest address. Then the player fetches the manifest and segments from the CDN. The CDN fetches from blob storage only on a miss, so popular segments are served from an edge near the viewer.',
    packets: [{ from: 'viewer', to: 'watch' }, { from: 'watch', to: 'db', delay: 0.9 }, { from: 'viewer', to: 'cdn', delay: 1.8 }, { from: 'cdn', to: 'blob', delay: 2.7 }],
  },
  {
    req: 'Requirement 2: playback that adapts',
    caption:
      'The manifest lists the same video at several bitrates, called rungs. The player downloads one short segment at a time and picks the rung for the next one from how fast the last one arrived. A weak network gets a lower rung. A strong one gets a higher rung. Nothing on the server changes.',
    packets: [{ from: 'viewer', to: 'cdn' }, { from: 'cdn', to: 'viewer', delay: 0.9 }],
    active: ['viewer'],
  },
];

export default function YoutubeBuild() {
  return (
    <DesignBuild
      title="YouTube: the design grows one requirement at a time"
      steps={steps}
      nodes={nodes}
      edges={edges}
      height={470}
      label="Creator, upload service, blob store, transcode pipeline, metadata database, CDN, watch service, and viewer"
    />
  );
}
