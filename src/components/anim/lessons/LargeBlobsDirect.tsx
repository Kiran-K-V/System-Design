import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowPacket, type Tone } from '../FlowDiagram';

interface Step {
  caption: string;
  active: string[];
  edges: FlowEdge[];
  packets: FlowPacket[];
  db?: string;
  dbTone?: Tone;
  store?: string;
  storeTone?: Tone;
  handler?: string;
  api?: string;
}

const steps: Step[] = [
  { caption: 'A user wants to upload a 2 GB video. If the bytes pass through the API server, it holds a connection and bandwidth for the whole transfer, and a gateway body cap may reject the file. In this design the API never sees a byte. First the client asks permission.', active: ['client'], edges: [{ from: 'client', to: 'api', label: 'upload request', labelAt: [-70, -8] }], packets: [{ from: 'client', to: 'api' }], api: 'idle' },
  { caption: 'The API checks who the user is, then inserts a metadata row with status PENDING. The row says who owns the file, its name, size, and expected checksum. The bytes are not stored yet, so the row must not claim they are.', active: ['api'], edges: [{ from: 'api', to: 'db', label: 'row: PENDING', labelAt: [58, 0] }], packets: [{ from: 'api', to: 'db' }], db: 'row: PENDING', api: 'checks auth' },
  { caption: 'The API starts a multipart upload and signs one URL for each part. Signing is local math with the API credentials, so there is no call to the store for it. The URLs go back to the client. This is the only work the server does for this file.', active: ['api'], edges: [{ from: 'api', to: 'client', label: 'signed URLs', labelAt: [-60, -8] }], packets: [{ from: 'api', to: 'client' }], db: 'row: PENDING', api: 'only signs' },
  { caption: 'The client cuts the file into parts and PUTs several at once straight to the object store. The API server is off the data path. Each part carries a checksum, so the store can reject bytes that were damaged on the way.', active: ['client'], edges: [{ from: 'client', to: 'store', label: 'PUT parts 1, 2, 3', labelAt: [20, 10] }], packets: [{ from: 'client', to: 'store' }, { from: 'client', to: 'store', delay: 0.3 }], db: 'row: PENDING', store: 'parts 1, 2, 3', api: 'idle' },
  { caption: 'Part 2 fails: the network drops. The client resends part 2 only, with the same signed URL while it is valid. A single big PUT would restart from byte zero. If the client app closes, it can ask the store which parts exist and send the rest.', active: ['client'], edges: [{ from: 'client', to: 'store', label: 'retry part 2', labelAt: [20, 10] }], packets: [{ from: 'client', to: 'store' }], db: 'row: PENDING', store: 'parts 1, 3 (+2)', storeTone: 'warn', api: 'idle' },
  { caption: 'All parts are in. The client sends the part numbers and checksums to the API. The API calls "complete" on the store, which joins the parts into one object. The row is still PENDING, because the API does not yet know the join worked.', active: ['api'], edges: [{ from: 'client', to: 'api', label: 'done + list', labelAt: [-60, -8] }, { from: 'api', to: 'store', label: 'complete', labelAt: [10, -14] }], packets: [{ from: 'client', to: 'api' }, { from: 'api', to: 'store', delay: 0.9 }], db: 'row: PENDING', store: 'one object', storeTone: 'ok', api: 'calls complete' },
  { caption: 'The store sends an event notification: "object created". It goes to a handler, usually through a queue. Delivery is at least once, so the handler must be safe to run twice. The event is the proof that the bytes exist, so it is a better trigger than the client saying so.', active: ['handler'], edges: [{ from: 'store', to: 'handler', label: 'object created', labelAt: [58, 0] }], packets: [{ from: 'store', to: 'handler' }], db: 'row: PENDING', store: 'one object', storeTone: 'ok', handler: 'got event', api: 'idle' },
  { caption: 'The handler sets the row to READY, but only if it is still PENDING. A repeat event changes nothing. Now a read can find the row by query and the bytes by key. The metadata database holds facts. The blob store holds bytes.', active: ['db'], edges: [{ from: 'handler', to: 'db', label: 'PENDING to READY', labelAt: [0, 16] }], packets: [{ from: 'handler', to: 'db' }], db: 'row: READY', dbTone: 'ok', store: 'one object', storeTone: 'ok', handler: 'safe to repeat', api: 'idle' },
];

export default function LargeBlobsDirect() {
  return (
    <AnimFrame title="Direct upload: the server only signs, the client sends the bytes" steps={steps} interval={5600}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'client', x: 90, y: 170, w: 110, h: 60, label: 'Client' },
          { id: 'api', x: 340, y: 56, w: 140, h: 60, label: 'API server', sub: s.api },
          { id: 'db', x: 340, y: 300, w: 160, h: 84, shape: 'db', label: 'Metadata DB', sub: s.db, tone: s.dbTone },
          { id: 'store', x: 620, y: 170, w: 170, h: 96, shape: 'db', label: 'Object store', sub: s.store, tone: s.storeTone },
          { id: 'handler', x: 620, y: 310, w: 130, h: 60, label: 'Handler', sub: s.handler },
        ];
        return <FlowDiagram width={720} height={360} nodes={nodes} edges={s.edges} packets={s.packets} active={s.active} stepKey={i} travel={0.9} label="A client uploads parts straight to an object store using URLs signed by the API. A storage event makes a handler mark the metadata row ready." />;
      }}
    </AnimFrame>
  );
}
