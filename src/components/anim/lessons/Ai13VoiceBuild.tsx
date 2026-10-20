import DesignBuild, { type BuildEdge, type BuildGroup, type BuildNode, type BuildStep } from '../DesignBuild';

/** Voice agent: the high-level design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'caller', x: 90, y: 70, w: 120, label: 'Caller', sub: 'on a phone', step: 0 },
  { id: 'tel', x: 250, y: 70, w: 130, label: 'Telephony', sub: '8 kHz audio', step: 0 },
  { id: 'sess', x: 420, y: 70, w: 130, label: 'Call session', sub: 'one per call', step: 0 },
  { id: 'stt', x: 590, y: 70, w: 130, label: 'Streaming STT', sub: 'interim, final', step: 1 },
  { id: 'llm', x: 590, y: 200, w: 130, label: 'LLM', sub: 'streams tokens', step: 1 },
  { id: 'tts', x: 420, y: 200, w: 130, label: 'Streaming TTS', sub: 'first audio', step: 1 },
  { id: 'turn', x: 250, y: 200, w: 130, label: 'Turn manager', sub: 'VAD, barge-in', step: 2 },
  { id: 'tools', x: 590, y: 330, w: 130, label: 'Tool runner', sub: 'plus filler', step: 3 },
  { id: 'fb', x: 420, y: 330, w: 130, label: 'Fallback', sub: 'deadlines', step: 4 },
  { id: 'human', x: 250, y: 330, w: 130, label: 'Human agent', sub: 'warm transfer', step: 4 },
  { id: 'log', x: 90, y: 330, w: 120, h: 80, label: 'Call log', sub: 'audio, timings', shape: 'db', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'caller', to: 'tel', head: 'both', step: 0 },
  { from: 'tel', to: 'sess', head: 'both', step: 0 },
  { from: 'sess', to: 'stt', step: 1 },
  { from: 'stt', to: 'llm', step: 1 },
  { from: 'llm', to: 'tts', step: 1 },
  { from: 'tts', to: 'sess', step: 1 },
  { from: 'sess', to: 'turn', head: 'both', step: 2 },
  { from: 'llm', to: 'tools', head: 'both', step: 3 },
  { from: 'llm', to: 'fb', label: 'timeout', labelAt: [38, 14], step: 4 },
  { from: 'fb', to: 'human', step: 4 },
  { from: 'turn', to: 'log', step: 5 },
];

const groups: BuildGroup[] = [{ x: 345, y: 8, w: 320, h: 258, label: 'one region', step: 6 }];

const steps: BuildStep[] = [
  { req: 'FR1: answer a phone call', caption: 'The phone network hands the call to a telephony service. It opens a two-way audio stream to our call session. The audio is narrowband: 8,000 samples a second, one channel.', packets: [{ from: 'caller', to: 'tel', label: 'voice' }, { from: 'tel', to: 'sess', label: 'stream', delay: 0.9 }] },
  { req: 'FR2: reply in under 800 ms (P50)', caption: 'The session streams audio to STT while the caller talks. STT streams text to the LLM. The LLM streams tokens to TTS. TTS streams audio back. No stage waits for the full output of the one before it.', packets: [{ from: 'sess', to: 'stt', label: 'audio' }, { from: 'stt', to: 'llm', label: 'text', delay: 0.9 }, { from: 'llm', to: 'tts', label: 'tokens', delay: 1.8 }] },
  { req: 'FR3: know when to answer and when to stop', caption: 'The turn manager watches the audio. It decides when the caller is done (endpointing) and stops the agent the moment the caller barges in. It owns the four states of the turn.', packets: [{ from: 'sess', to: 'turn', label: 'speech' }], active: ['turn'] },
  { req: 'FR4: use tools without dead air', caption: 'The LLM can call a tool, such as a booking system. While the tool runs, the agent speaks a short filler line, so the caller does not hear silence.', packets: [{ from: 'llm', to: 'tools', label: 'call' }] },
  { req: 'FR5: recover when a stage fails', caption: 'Every stage has a deadline. When one is missed, the fallback router switches to a standby provider, gives a shorter answer, or transfers the call to a person with a summary.', packets: [{ from: 'llm', to: 'fb', label: 'late' }, { from: 'fb', to: 'human', label: 'transfer', delay: 0.9 }] },
  { req: 'NFR: measure every turn', caption: 'The turn manager logs each turn: the time the user stopped, the time of first audio, interruptions, and the stage timings. The latency percentiles come from this log, not from a vendor page.', packets: [{ from: 'turn', to: 'log', label: 'timings' }] },
  { req: 'NFR: P95 under 1.5 s', caption: 'No new box. STT, LLM, and TTS run in one region next to the call session, so the network line stays small. A hop to a far region eats the budget.', active: ['sess', 'stt', 'llm', 'tts'] },
];

export default function Ai13VoiceBuild() {
  return <DesignBuild title="Voice agent, built up" steps={steps} nodes={nodes} edges={edges} groups={groups} height={400} label="Voice agent architecture growing from the phone call to the call log" />;
}
