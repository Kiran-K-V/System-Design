import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** ChatGPT-style assistant: the serving design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'client', x: 60, y: 100, w: 84, label: 'Client', step: 0 },
  { id: 'api', x: 190, y: 100, w: 100, label: 'Chat API', sub: 'auth, limits', step: 0 },
  { id: 'router', x: 340, y: 100, w: 100, label: 'Router', sub: 'picks engine', step: 0 },
  { id: 'eng1', x: 580, y: 70, w: 150, h: 64, label: 'Engine 1', sub: 'weights + KV', step: 0 },
  { id: 'store', x: 190, y: 235, w: 100, h: 70, label: 'Chat store', shape: 'db', step: 1 },
  { id: 'builder', x: 60, y: 235, w: 100, h: 64, label: 'Context\nbuilder', step: 1 },
  { id: 'eng2', x: 580, y: 170, w: 150, h: 64, label: 'Engine 2', sub: 'weights + KV', step: 2 },
  { id: 'queue', x: 340, y: 235, w: 100, h: 64, label: 'Waiting\nline', step: 3 },
  { id: 'safety', x: 450, y: 345, w: 110, h: 56, label: 'Output\nfilter', step: 5 },
  { id: 'evals', x: 190, y: 355, w: 100, h: 56, label: 'Eval tap', step: 6 },
  { id: 'region', x: 620, y: 335, w: 150, h: 64, label: 'Region B', sub: 'warm pool', shape: 'dashed', step: 7 },
];

const edges: BuildEdge[] = [
  { from: 'client', to: 'api', head: 'both', step: 0 },
  { from: 'api', to: 'router', step: 0 },
  { from: 'router', to: 'eng1', step: 0 },
  { from: 'store', to: 'builder', step: 1 },
  { from: 'builder', to: 'api', step: 1 },
  { from: 'router', to: 'eng2', step: 2 },
  { from: 'router', to: 'queue', head: 'both', step: 3 },
  { from: 'router', to: 'safety', head: 'both', label: 'tokens', labelAt: [-30, 0], step: 5 },
  { from: 'store', to: 'evals', dashed: true, label: 'sample', labelAt: [34, 0], step: 6 },
  { from: 'router', to: 'region', dashed: true, label: 'overflow', labelAt: [30, -26], step: 7 },
];

const steps: BuildStep[] = [
  { req: 'FR1: stream a reply', caption: 'The client sends a message to the chat API. The router hands the turn to a GPU engine, which streams tokens back (lesson A3.2). One engine is enough to start. It holds the model weights and, for each running chat, a KV cache.', packets: [{ from: 'client', to: 'api', label: 'turn' }, { from: 'api', to: 'router', label: 'turn', delay: 0.6 }, { from: 'router', to: 'eng1', label: 'turn', delay: 1.2 }] },
  { req: 'FR2: continue an old chat', caption: 'Every message is saved in the chat store. For a new turn the context builder reads the history and decides what goes into the prompt. This is the backend design; the AI-specific part is what the builder keeps, in the history deep dive.', packets: [{ from: 'store', to: 'builder', label: 'history' }, { from: 'builder', to: 'api', label: 'prompt', delay: 0.7 }] },
  { req: 'NFR: fast first token on long chats', caption: 'A second engine, and the router now matters. The KV cache of a chat lives on the engine that served its last turn. If the router sends the next turn to the same engine, the engine reads the cache. If it picks the other one, that engine rebuilds the whole history. Deep dive 1.', packets: [{ from: 'router', to: 'eng2', label: 'same chat' }] },
  { req: 'NFR: GPU memory is the limit', caption: 'An engine can hold only so many chats in KV memory. When no engine has room, turns wait in a line instead of failing. The line is where free-tier turns are delayed first and where an honest wait time is computed.', packets: [{ from: 'router', to: 'queue', label: 'no room' }] },
  { req: 'NFR: history grows every turn', caption: 'No new box. The context builder keeps the front of the prompt stable and trims the middle in chunks, so the engine can keep reusing cached work. An edit to an early message changes the front and costs a full rebuild. Deep dive 2.', active: ['builder'] },
  { req: 'NFR: safe output', caption: 'Tokens pass an output filter on their way back to the user. The safe-output rate is part of the quality bar, so the filter belongs on the streaming path and its latency counts against the time to first token.', packets: [{ from: 'router', to: 'safety', label: 'tokens' }] },
  { req: 'NFR: answer quality', caption: 'A sample of stored chats goes to the eval pipeline. Offline sets catch regressions before release. Online signals, such as thumbs and regenerate rate, catch what the sets miss. Slice them by chat length.', packets: [{ from: 'store', to: 'evals', label: 'sample' }] },
  { req: 'NFR: launch spikes, no spare GPUs', caption: 'A second region takes overflow only if it already has GPUs and loaded weights. There is no autoscaling into capacity that does not exist, so the plan is shed and degrade first, then spill. Spilled chats arrive with a cold cache. Deep dive 3.', packets: [{ from: 'router', to: 'region', label: 'spill' }] },
];

export default function Ai13ChatBuild() {
  return <DesignBuild title="ChatGPT-style assistant, built up" steps={steps} nodes={nodes} edges={edges} height={410} label="Chat assistant serving architecture growing from one engine to a router, waiting line, filter, eval tap and second region" />;
}
