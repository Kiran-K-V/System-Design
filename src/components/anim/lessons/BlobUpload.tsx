import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowPacket, type Tone } from '../FlowDiagram';

interface Step {
  caption: string;
  active: string;
  edges: FlowEdge[];
  packets?: FlowPacket[];
  /** Tone of each of the four part cells. */
  parts?: [Tone, Tone, Tone, Tone];
  store?: string;
  storeTone?: Tone;
}

const steps: Step[] = [
  {
    caption:
      'A user wants to upload a 200 MiB video. The naive path sends the bytes through the app server. API Gateway caps a request body at 10 MB, and every upload would tie up app server connections and bandwidth. So the client first asks the API for permission, and sends the bytes somewhere else.',
    active: 'client',
    edges: [{ from: 'client', to: 'api', label: 'I want to upload', labelAt: [-36, -6] }],
    packets: [{ from: 'client', to: 'api' }],
  },
  {
    caption:
      'The API checks who the user is and what they may upload. It starts a multipart upload in the object store (the store returns an upload id) and signs one URL per part. Signing is local math with the API’s credentials. A pre-signed URL is a bearer token: whoever holds it can do that one action until it expires.',
    active: 'api',
    edges: [
      { from: 'api', to: 'store', label: 'start upload', labelAt: [48, -2] },
      { from: 'api', to: 'client', label: 'signed URLs', labelAt: [-40, -4] },
    ],
    packets: [{ from: 'api', to: 'store' }, { from: 'api', to: 'client', delay: 1 }],
    store: 'upload id issued',
  },
  {
    caption:
      'The client cuts the file into 16 MiB parts (13 parts, so shown here as four) and PUTs them straight to the store, several at a time. The app server is not in the path. Each response carries an ETag, a fingerprint of that part. The client keeps the part number and ETag of each.',
    active: 'client',
    edges: [{ from: 'client', to: 'store', label: 'PUT parts in parallel', labelAt: [0, -34] }],
    packets: [{ from: 'client', to: 'store' }, { from: 'client', to: 'store', delay: 0.25 }],
    parts: ['ok', 'ok', 'warn', 'warn'],
    store: 'holds parts 1, 2',
  },
  {
    caption: 'Part 3 fails: the connection drops. The client retries only part 3, with the same signed URL while it is still valid. The other parts are safe. A single big PUT would have restarted from byte zero.',
    active: 'client',
    edges: [{ from: 'client', to: 'store', label: 'retry part 3', labelAt: [0, -34] }],
    packets: [{ from: 'client', to: 'store', label: 'part 3' }],
    parts: ['ok', 'ok', 'bad', 'warn'],
    store: 'holds parts 1, 2, 4',
  },
  {
    caption:
      'All parts are in. The client sends the list of part numbers and ETags to the API. The API calls complete on the store. The store joins the parts, in part-number order, into one object and the parts disappear. Until complete or abort is called, the stored parts are billed, so set a lifecycle rule to clean up abandoned uploads.',
    active: 'api',
    edges: [
      { from: 'client', to: 'api', label: 'done + ETags', labelAt: [-36, -6] },
      { from: 'api', to: 'store', label: 'complete', labelAt: [48, -2] },
    ],
    packets: [{ from: 'client', to: 'api' }, { from: 'api', to: 'store', delay: 1 }],
    parts: ['ok', 'ok', 'ok', 'ok'],
    store: 'one object',
    storeTone: 'ok',
  },
  {
    caption:
      'Reads go through a CDN. The first viewer in a region misses the cache, so the CDN fetches from the store (the origin) and keeps a copy. Later viewers nearby get it from the edge. The object store is the durable home. The CDN absorbs the read traffic (lesson 2.7).',
    active: 'cdn',
    edges: [
      { from: 'client', to: 'cdn', label: 'GET video', labelAt: [-14, 30] },
      { from: 'cdn', to: 'store', label: 'miss: fetch', labelAt: [60, 20] },
    ],
    packets: [{ from: 'client', to: 'cdn' }, { from: 'cdn', to: 'store', delay: 1 }],
    store: 'one object',
    storeTone: 'ok',
  },
];

export default function BlobUpload() {
  return (
    <AnimFrame title="Blob storage: pre-signed URL and multipart upload" steps={steps} interval={5400}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'client', x: 80, y: 190, w: 110, h: 60, label: 'Client' },
          { id: 'api', x: 340, y: 60, w: 130, h: 60, label: 'API server' },
          { id: 'cdn', x: 340, y: 322, w: 130, h: 60, label: 'CDN', tone: s.active === 'cdn' ? 'default' : 'muted' },
          { id: 'store', x: 610, y: 190, w: 160, h: 80, label: 'Object store', sub: s.store, shape: 'db', tone: s.storeTone ?? 'default' },
          ...(s.parts ? s.parts.map((t, k) => ({ id: `p${k}`, x: 548 + k * 40, y: 276, w: 36, h: 36, label: String(k + 1), tone: t }) as FlowNode) : []),
        ];
        return <FlowDiagram width={720} height={360} nodes={nodes} edges={s.edges} packets={s.packets} active={[s.active]} stepKey={i} travel={0.9} label="A client uploads parts straight to an object store using pre-signed URLs from an API server" />;
      }}
    </AnimFrame>
  );
}
