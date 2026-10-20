import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type Tone } from '../FlowDiagram';

/** The four states of a voice turn, and what the agent remembers after a barge-in. All numbers are illustrative. */

const nodes: FlowNode[] = [
  { id: 'listen', x: 110, y: 150, w: 150, label: 'Listening', sub: 'caller talks' },
  { id: 'think', x: 360, y: 150, w: 150, label: 'Thinking', sub: 'LLM, TTS start' },
  { id: 'speak', x: 610, y: 150, w: 150, label: 'Speaking', sub: 'audio plays' },
  { id: 'int', x: 360, y: 310, w: 150, label: 'Interrupted', sub: 'playback paused' },
];

type EdgeId = 'l-t' | 't-s' | 's-i' | 'i-l' | 'i-s' | 's-l';
const EDGES: Record<EdgeId, Omit<FlowEdge, 'tone'>> = {
  'l-t': { from: 'listen', to: 'think', label: 'turn ends', labelAt: [0, -16] },
  't-s': { from: 'think', to: 'speak', label: 'first audio', labelAt: [0, -16] },
  's-i': { from: 'speak', to: 'int', label: 'speech heard', bend: 30, labelAt: [58, -2] },
  'i-l': { from: 'int', to: 'listen', label: 'words: cancel', labelAt: [-40, 22] },
  'i-s': { from: 'int', to: 'speak', label: 'no words: resume', bend: 30, labelAt: [-64, 20] },
  's-l': { from: 'speak', to: 'listen', label: 'reply ends', bend: -80, labelAt: [0, -8] },
};

interface Step {
  caption: string;
  active: string;
  edge?: EdgeId;
  edgeTone?: Tone;
  notes?: string[];
  noteTone?: Tone;
}

const steps: Step[] = [
  { caption: 'LISTENING. The caller says "Book a table for four on Friday." A voice activity detector marks the audio as speech, and STT sends text as it goes. The agent has nothing to cancel, because it is not producing anything.', active: 'listen', notes: ['Agent output: none'] },
  { caption: 'The caller stops. After the silence threshold the turn manager decides the turn is over, and the state moves to THINKING. The LLM starts, and its first words go to TTS.', active: 'think', edge: 'l-t', notes: ['Silence threshold passed', 'Agent output: starting'] },
  { caption: 'TTS makes its first audio, and the state moves to SPEAKING. The model writes fast: it has already produced 9.0 s of speech (about 22 words at 2.5 words a second). Speech plays at one second per second, so most of it waits in a buffer.', active: 'speak', edge: 't-s', notes: ['Model wrote: 9.0 s, 22 words', 'Caller heard: 0.0 s'] },
  { caption: 'Two seconds in, the caller has heard 2.4 s. Then the caller starts to speak: "No, Saturday." The detector hears speech while the agent is talking. This is the barge-in.', active: 'speak', notes: ['Model wrote: 9.0 s, 22 words', 'Caller heard: 2.4 s, 6 words'], noteTone: 'warn' },
  { caption: 'INTERRUPTED. Step one is to stop playback at once. Do not wait. The agent is still unsure whether this is real speech or a cough, so it holds here until words arrive or a short window ends.', active: 'int', edge: 's-i', edgeTone: 'warn', notes: ['Playback: paused', 'Waiting for a transcript'], noteTone: 'warn' },
  { caption: 'Words arrive: "no, Saturday." Now cancel and truncate. Cancel the model response and flush the unplayed audio. Cut the stored reply to the part the caller heard. Without this, the model believes it said all 22 words.', active: 'int', edge: 'i-l', edgeTone: 'ok', notes: ['Cancelled: 16 words never heard', 'Stored in history: 6 words'], noteTone: 'ok' },
  { caption: 'The state moves to LISTENING. The caller’s correction is the next turn, and the model now answers from a history that matches what was said out loud.', active: 'listen', edge: 'i-l', edgeTone: 'ok', notes: ['History = what the caller heard', 'Next turn starts'], noteTone: 'ok' },
  { caption: 'The other branch: a cough, not words. The detector fires and playback pauses, but no transcript arrives inside the window. This is a false interruption. The agent resumes where it stopped. Nothing is cancelled and nothing is truncated.', active: 'speak', edge: 'i-s', edgeTone: 'accent', notes: ['No words in the window', 'Resume from 2.4 s'], noteTone: 'accent' },
];

export default function Ai13VoiceTurn() {
  return (
    <AnimFrame title="The turn state machine: one barge-in and one false alarm" steps={steps} interval={7000}>
      {(i, s) => {
        const edges: FlowEdge[] = (Object.keys(EDGES) as EdgeId[]).map((k) => ({ ...EDGES[k], tone: s.edge === k ? (s.edgeTone ?? 'accent') : 'muted' }));
        const notes: FlowNote[] = (s.notes ?? []).map((text, n) => ({ x: 24, y: 358 + n * 28, text, size: 14, tone: n === 0 ? (s.noteTone ?? 'muted') : 'muted' }));
        return (
          <FlowDiagram
            width={720}
            height={410}
            nodes={nodes}
            edges={edges}
            notes={notes}
            active={[s.active]}
            stepKey={i}
            label="State machine with four states: listening, thinking, speaking, and interrupted, with the cancel and truncate step on a barge-in"
          />
        );
      }}
    </AnimFrame>
  );
}
