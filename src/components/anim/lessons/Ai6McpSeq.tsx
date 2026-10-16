import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

/** Method names and the order of messages are from the MCP spec, revision 2025-06-18 (lifecycle and tools pages). Weather values are illustrative. */
const ACTORS = ['Host + model', 'MCP client', 'MCP server'];

interface Row {
  m: SeqMessage;
  caption: string;
  phase: string;
}

const ROWS: Row[] = [
  { m: { from: 'MCP client', to: 'MCP server', label: 'initialize', tone: 'accent' }, phase: 'Initialization', caption: 'The host starts one client for this server. The client must open with an initialize request. It carries the protocol version it supports, its own capabilities (for example sampling), and its name and version.' },
  { m: { from: 'MCP server', to: 'MCP client', label: 'result: capabilities', tone: 'ok' }, phase: 'Initialization', caption: 'The server answers with the version it will use and its own capabilities. A server that offers tools must declare the tools capability here. From now on, each side may use only what was negotiated.' },
  { m: { from: 'MCP client', to: 'MCP server', label: 'notifications/initialized' }, phase: 'Initialization', caption: 'The client sends an initialized notification. A notification has no id and gets no reply. The session now moves to the operation phase.' },
  { m: { from: 'MCP client', to: 'MCP server', label: 'tools/list' }, phase: 'Operation', caption: 'The client asks which tools exist. The list can be paged with a cursor. The host will put these definitions in front of the model, so they cost tokens on every request.' },
  { m: { from: 'MCP server', to: 'MCP client', label: 'tools: [get_weather]', tone: 'ok' }, phase: 'Operation', caption: 'Each tool has a name, a description, and an inputSchema in JSON Schema. This is the same shape as a tool definition in a model API. The client hands the list to the host.' },
  { m: { from: 'Host + model', to: 'MCP client', label: 'model chose get_weather', tone: 'warn' }, phase: 'Operation', caption: 'The host calls the model with these tools. The model writes a tool request. The spec says there SHOULD be a human in the loop who can deny the call, and that clients SHOULD show the inputs before the call.' },
  { m: { from: 'MCP client', to: 'MCP server', label: 'tools/call', tone: 'accent' }, phase: 'Operation', caption: 'After approval, the client sends tools/call with the tool name and arguments. This is a JSON-RPC request with an id.' },
  { m: { from: 'MCP server', to: 'MCP client', label: 'result, isError: false', tone: 'ok' }, phase: 'Operation', caption: 'The server runs the tool and returns content. A failed run still returns a result, with isError set to true. An unknown tool or bad arguments return a JSON-RPC error instead.' },
  { m: { from: 'MCP client', to: 'Host + model', label: 'result to the model' }, phase: 'Operation', caption: 'The client passes the result to the host, and the host adds it to the model call. This is the tool loop from lesson A3.4, with MCP carrying the call to the server.' },
];

export default function Ai6McpSeq() {
  const steps = ROWS.map((r) => ({ caption: r.caption }));
  return (
    <AnimFrame title="MCP handshake and one tool call" steps={steps} interval={4600}>
      {(i) => (
        <div>
          <SequenceDiagram actors={ACTORS} messages={ROWS.map((r) => r.m)} visible={i + 1} width={640} />
          <div className="mt-2 px-2 pb-2 text-sm">
            <span className="text-muted">Lifecycle phase: </span>
            <span className="font-mono">{ROWS[i].phase}</span>
          </div>
        </div>
      )}
    </AnimFrame>
  );
}
