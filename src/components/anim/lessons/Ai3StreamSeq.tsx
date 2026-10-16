import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

/** Event names and JSON shapes are from the Anthropic streaming docs. The text and token counts are illustrative. */
type Mode = 'ok' | 'error';

const ACTORS = ['Your app', 'API'];

interface Row {
  m: SeqMessage;
  caption: string;
  /** What the user sees on screen after this step. */
  screen: string;
}

const OK: Row[] = [
  { m: { from: 'Your app', to: 'API', label: 'POST, stream: true' }, caption: 'One request with "stream": true. The HTTP status line will come back first, then the connection stays open and events arrive one by one.', screen: '' },
  { m: { from: 'API', to: 'Your app', label: 'message_start' }, caption: 'message_start carries a Message object with empty content. Its usage already shows the input token count (25 in the docs example).', screen: '' },
  { m: { from: 'API', to: 'Your app', label: 'content_block_start' }, caption: 'A content block opens. Each block has an index that matches its place in the final content array.', screen: '' },
  { m: { from: 'API', to: 'Your app', label: 'ping', tone: 'muted' }, caption: 'ping events can appear anywhere in the stream. Your code can ignore them.', screen: '' },
  { m: { from: 'API', to: 'Your app', label: 'content_block_delta: "Hel"', tone: 'accent' }, caption: 'The first text delta. This is the moment the user sees something. The wait up to here is the time to first token (TTFT).', screen: 'Hel' },
  { m: { from: 'API', to: 'Your app', label: 'content_block_delta: "lo!"', tone: 'accent' }, caption: 'More deltas follow, each a small piece of text. Append them to a buffer for that block index.', screen: 'Hello!' },
  { m: { from: 'API', to: 'Your app', label: 'content_block_stop' }, caption: 'The block is closed. Only now is a tool-call block safe to parse as JSON (see the assembler below).', screen: 'Hello!' },
  { m: { from: 'API', to: 'Your app', label: 'message_delta: end_turn, usage' }, caption: 'message_delta carries the stop_reason and the usage. The token counts in usage are cumulative, not per event.', screen: 'Hello!' },
  { m: { from: 'API', to: 'Your app', label: 'message_stop', tone: 'ok' }, caption: 'message_stop is the last event. Only now do you know the stream finished cleanly. A stream that ends without it was cut.', screen: 'Hello!' },
];

const ERR: Row[] = [
  OK[0],
  OK[1],
  OK[2],
  OK[4],
  { m: { from: 'API', to: 'Your app', label: 'event: error (overloaded)', tone: 'bad' }, caption: 'The API sends an error event inside the open stream. The docs give overloaded_error as an example, which is HTTP 529 in a non-streaming call. Here the HTTP status was already 200.', screen: 'Hel' },
  { m: { from: 'Your app', to: 'Your app', label: 'status check never fires', note: true, tone: 'bad' }, caption: 'A handler that checks the status code once, before reading the body, never sees this. Your stream loop must handle the error event and treat the partial text as unfinished.', screen: 'Hel (cut)' },
];

export default function Ai3StreamSeq({ mode = 'ok' }: { mode?: Mode }) {
  const rows = mode === 'ok' ? OK : ERR;
  const steps = rows.map((r) => ({ caption: r.caption }));
  const title = mode === 'ok' ? 'One streamed reply, event by event' : 'An error after HTTP 200';
  return (
    <AnimFrame title={title} steps={steps} interval={3600}>
      {(i) => (
        <div>
          <SequenceDiagram actors={ACTORS} messages={rows.map((r) => r.m)} visible={i + 1} width={640} />
          <div className="mt-2 px-2 pb-2 text-sm">
            <span className="text-muted">On the user's screen: </span>
            <span className="font-mono" style={{ color: mode === 'error' && i === rows.length - 1 ? 'var(--bad)' : undefined }}>
              {rows[i].screen || '(nothing yet)'}
            </span>
          </div>
        </div>
      )}
    </AnimFrame>
  );
}
