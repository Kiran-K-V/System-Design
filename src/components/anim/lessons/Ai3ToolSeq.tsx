import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

/** Block and field names are from the Anthropic tool-use docs. The weather values are illustrative. */
const ACTORS = ['User', 'Your code', 'Model API', 'Tool'];

interface Row {
  m: SeqMessage;
  caption: string;
  calls: number;
}

const ROWS: Row[] = [
  { m: { from: 'User', to: 'Your code', label: 'Weather: Paris, Tokyo?' }, caption: 'A user asks a question that needs live data. The model cannot know the weather. Your code holds the tool definitions.', calls: 0 },
  { m: { from: 'Your code', to: 'Model API', label: 'messages + tools' }, caption: 'Your code calls the model and sends the tool definitions (name, description, input_schema) with the question. This is model call 1.', calls: 1 },
  { m: { from: 'Model API', to: 'Your code', label: 'stop_reason: tool_use', tone: 'accent' }, caption: 'The reply has stop_reason "tool_use" and two tool_use blocks, each with an id, a name, and an input. The model asked for two calls at once. This is a parallel tool call.', calls: 1 },
  { m: { from: 'Model API', to: 'Model API', label: 'wrote 2 requests, ran 0', note: true, tone: 'warn' }, caption: 'The model only wrote text that looks like a call. It ran nothing and has no network access to your tools. Everything that happens next is your code deciding.', calls: 1 },
  { m: { from: 'Your code', to: 'Tool', label: 'get_weather(Paris)' }, caption: 'Your code checks the call is allowed, then runs the first tool. How you run them is your choice: the docs say you may run parallel calls at the same time or one by one.', calls: 1 },
  { m: { from: 'Your code', to: 'Tool', label: 'get_weather(Tokyo)' }, caption: 'The second call. These two are independent reads, so they are safe to run at the same time.', calls: 1 },
  { m: { from: 'Tool', to: 'Your code', label: '18 C, clear', tone: 'ok' }, caption: 'The first result comes back.', calls: 1 },
  { m: { from: 'Tool', to: 'Your code', label: '24 C, cloudy', tone: 'ok' }, caption: 'The second result comes back.', calls: 1 },
  { m: { from: 'Your code', to: 'Model API', label: 'user msg: 2 tool_result' }, caption: 'Your code sends one user message with one tool_result block for each tool_use id. The tool_result blocks must come first in the content. The model call count is now 2.', calls: 2 },
  { m: { from: 'Model API', to: 'Your code', label: 'stop_reason: end_turn', tone: 'ok' }, caption: 'The model now has the data and writes the answer. end_turn means it is finished. If it had asked for more tools, the stop reason would be tool_use again, and the loop would go round once more.', calls: 2 },
  { m: { from: 'Your code', to: 'User', label: 'Paris 18 C, Tokyo 24 C' }, caption: 'Your code shows the answer. One user question cost two model calls and two tool runs.', calls: 2 },
];

export default function Ai3ToolSeq() {
  const steps = ROWS.map((r) => ({ caption: r.caption }));
  return (
    <AnimFrame title="A tool round trip with two parallel calls" steps={steps} interval={4200}>
      {(i) => (
        <div>
          <SequenceDiagram actors={ACTORS} messages={ROWS.map((r) => r.m)} visible={i + 1} width={640} />
          <div className="mt-2 px-2 pb-2 text-sm">
            <span className="text-muted">Model API calls so far: </span>
            <span className="font-mono tabular-nums">{ROWS[i].calls}</span>
          </div>
        </div>
      )}
    </AnimFrame>
  );
}
