import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

/** Two step-through sequences: the WebSocket upgrade and an SSE reconnect with replay. */

const WS_ACTORS = ['Browser', 'Server'];
const WS: { m: SeqMessage; caption: string; wire: string }[] = [
  {
    m: { from: 'Browser', to: 'Server', label: 'GET /chat  Upgrade: websocket' },
    wire: 'HTTP/1.1',
    caption:
      'A WebSocket starts as an ordinary HTTP request. The browser asks to switch protocols. It sends a random Sec-WebSocket-Key (RFC 6455 example: dGhlIHNhbXBsZSBub25jZQ==) and Sec-WebSocket-Version: 13.',
  },
  {
    m: { from: 'Server', to: 'Server', label: 'accept: SHA-1(key+GUID)', note: true, tone: 'accent' },
    wire: 'HTTP/1.1',
    caption:
      'The server proves it understands WebSocket. It appends a fixed GUID (258EAFA5-E914-47DA-95CA-C5AB0DC85B11) to the key, hashes with SHA-1, and base64-encodes. For the example key the result is s3pPLMBiTxaQ9kYGzzhZRbK+xOo=. This stops a plain HTTP server from answering by accident.',
  },
  {
    m: { from: 'Server', to: 'Browser', label: '101 Switching Protocols', tone: 'ok' },
    wire: 'WebSocket',
    caption:
      'Status 101 means: this TCP connection now speaks WebSocket, not HTTP. No new connection and no more headers. From here on, either side can send a frame at any time.',
  },
  {
    m: { from: 'Browser', to: 'Server', label: 'text frame "hi" (masked)' },
    wire: 'WebSocket',
    caption:
      'The browser sends a message as a frame. RFC 6455 requires every client frame to be masked with a 4-byte key. The server must close the connection if it gets an unmasked client frame. Server frames are never masked.',
  },
  {
    m: { from: 'Server', to: 'Browser', label: 'text frame "hello"', tone: 'ok' },
    wire: 'WebSocket',
    caption: 'The server answers with a frame. A frame header is 2 to 14 bytes, so a short message costs a few bytes of overhead. An HTTP request would repeat all its headers.',
  },
  {
    m: { from: 'Server', to: 'Browser', label: 'text frame "new msg" (push)', tone: 'ok' },
    wire: 'WebSocket',
    caption: 'The server pushes with no request from the browser. This is what plain HTTP cannot do. One connection carries both directions at once (full duplex).',
  },
  {
    m: { from: 'Browser', to: 'Server', label: 'ping (opcode 0x9)' },
    wire: 'WebSocket',
    caption:
      'An idle connection looks dead to proxies. nginx closes a proxied connection after 60 s of silence by default (proxy_read_timeout). Ping and pong frames are the heartbeat: they keep the path warm and prove the peer is alive.',
  },
  {
    m: { from: 'Server', to: 'Browser', label: 'pong (opcode 0xA)', tone: 'ok' },
    wire: 'WebSocket',
    caption: 'RFC 6455 says an endpoint must answer a ping with a pong. If a pong never comes, the sender treats the connection as dead and reconnects.',
  },
  {
    m: { from: 'Browser', to: 'Server', label: 'close frame (0x8)', tone: 'warn' },
    wire: 'closing',
    caption: 'Either side can start a clean close with a close frame. The other side answers with its own, then TCP closes. If the network just vanishes, no close frame ever arrives. Only a missed heartbeat reveals it.',
  },
];

export function WsUpgrade() {
  const steps = [
    { caption: 'One TCP connection, two actors. We follow it from the first HTTP request to the close.' },
    ...WS.map((s) => ({ caption: s.caption })),
  ];
  const messages = WS.map((s) => s.m);
  return (
    <AnimFrame title="WebSocket: upgrade, frames, heartbeat, close" steps={steps} interval={3600}>
      {(i) => {
        const proto = i === 0 ? 'none yet' : WS[i - 1].wire;
        return (
          <>
            <SequenceDiagram actors={WS_ACTORS} messages={messages} visible={i} width={640} />
            <div className="mt-3 px-2 text-sm">
              <span className="rounded-lg border border-line px-3 py-1.5">
                <span className="text-muted">Protocol on the connection: </span>
                <span className="font-mono font-semibold">{proto}</span>
              </span>
            </div>
          </>
        );
      }}
    </AnimFrame>
  );
}

const SSE_ACTORS = ['Browser', 'Server'];
const SSE: { m: SeqMessage; caption: string; last: number | null }[] = [
  {
    m: { from: 'Browser', to: 'Server', label: 'GET /events  Accept: text/event-stream' },
    last: null,
    caption: 'SSE is a normal HTTP GET. The browser API is EventSource. The response never ends: the server keeps writing to it.',
  },
  {
    m: { from: 'Server', to: 'Browser', label: '200  Content-Type: text/event-stream', tone: 'ok' },
    last: null,
    caption: 'The server answers with the media type text/event-stream. Each event is lines of text such as "id: 41" and "data: ...", ended by a blank line. The spec requires UTF-8.',
  },
  {
    m: { from: 'Server', to: 'Browser', label: 'id: 41  data: {...}', tone: 'ok' },
    last: 41,
    caption: 'Event 41 arrives. The browser remembers the id of the last event it saw: 41. It keeps this value for the next reconnect.',
  },
  {
    m: { from: 'Server', to: 'Browser', label: 'id: 42  data: {...}', lost: true, tone: 'bad' },
    last: 41,
    caption: 'The connection drops (a phone leaves Wi-Fi, a proxy times out) while event 42 is in flight. The browser never sees 42. Without a replay rule, 42 would be lost for good.',
  },
  {
    m: { from: 'Browser', to: 'Browser', label: 'closed. wait retry ms', note: true, tone: 'warn' },
    last: 41,
    caption: 'The browser reconnects by itself. It waits the retry delay first. The server can set it with a "retry: 3000" line (milliseconds). Without one, the delay is implementation-defined, in the region of a few seconds.',
  },
  {
    m: { from: 'Browser', to: 'Server', label: 'GET /events  Last-Event-ID: 41' },
    last: 41,
    caption: 'The new request carries Last-Event-ID: 41. This header is sent only when an id was seen. It says: I have everything up to 41.',
  },
  {
    m: { from: 'Server', to: 'Browser', label: 'replay 42, 43, 44, 45', tone: 'ok' },
    last: 45,
    caption: 'The server must keep recent events keyed by id. It looks up everything after 41 and sends 42 to 45 in order. Resume is the application\'s job: SSE gives the id and the header, you write the buffer.',
  },
  {
    m: { from: 'Server', to: 'Browser', label: 'id: 46  data: {...} (live)', tone: 'ok' },
    last: 46,
    caption: 'The browser is caught up and live events continue. Replay is only as long as your buffer. If the id is older than the buffer, send a full snapshot instead.',
  },
];

export function SseResume() {
  const steps = [
    { caption: 'A browser reads a live feed over SSE. We follow one connection that drops and recovers.' },
    ...SSE.map((s) => ({ caption: s.caption })),
  ];
  const messages = SSE.map((s) => s.m);
  return (
    <AnimFrame title="SSE: drop, reconnect, replay with Last-Event-ID" steps={steps} interval={3600}>
      {(i) => {
        const last = i === 0 ? null : SSE[i - 1].last;
        return (
          <>
            <SequenceDiagram actors={SSE_ACTORS} messages={messages} visible={i} width={640} />
            <div className="mt-3 px-2 text-sm">
              <span className="rounded-lg border border-line px-3 py-1.5">
                <span className="text-muted">Browser's last event id: </span>
                <span className="font-mono font-semibold">{last ?? 'none'}</span>
              </span>
            </div>
          </>
        );
      }}
    </AnimFrame>
  );
}
