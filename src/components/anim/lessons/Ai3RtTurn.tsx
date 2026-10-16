import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

const messages: SeqMessage[] = [
  { from: 'Client', to: 'Server', label: 'input_audio_buffer.append' },
  { from: 'Server', to: 'Client', label: 'input_audio_buffer.speech_stopped' },
  { from: 'Server', to: 'Client', label: 'response.output_audio.delta' },
  { from: 'Client', to: 'Client', label: 'plays the audio', note: true },
  { from: 'Server', to: 'Client', label: 'input_audio_buffer.speech_started', tone: 'warn' },
  { from: 'Client', to: 'Server', label: 'conversation.item.truncate', tone: 'accent' },
  { from: 'Server', to: 'Server', label: 'response cancelled', note: true, tone: 'ok' },
];

const captions = [
  'The user speaks. The client sends microphone audio as a stream of input_audio_buffer.append events. There is no request and no response here. Two streams run at the same time over one connection.',
  'Server voice activity detection (VAD) hears the user stop. It sends input_audio_buffer.speech_stopped. That is the turn boundary. The wait before it fires is the first slice of the latency budget.',
  'The model answers with audio. The server sends many response.output_audio.delta events, each with a chunk of audio. The client may hold more audio than the user has heard so far.',
  'The client plays the chunks. At this moment the server has generated more than the user has heard. If the user interrupts now, the transcript must say only what the user heard.',
  'The user talks over the answer (barge-in). VAD fires input_audio_buffer.speech_started while the model is still speaking. This event is the signal. Nothing yet stopped the audio.',
  'The client reacts. On WebSocket the client owns playback, so it stops its speaker at once and sends conversation.item.truncate to cut the stored item to what was played. On WebRTC the server keeps an output buffer and truncates unplayed audio itself. If your session does not auto-interrupt, send response.cancel too.',
  'The response is cancelled, so the server stops producing audio for it. The transcript ends where the user stopped listening. Without the truncate step, the model "remembers" saying words the user never heard.',
];

export default function Ai3RtTurn() {
  return (
    <AnimFrame title="One voice turn with a barge-in (OpenAI Realtime event names)" steps={captions.map((caption) => ({ caption }))} interval={5600}>
      {(i) => <SequenceDiagram actors={['Client', 'Server']} messages={messages} visible={i + 1} width={720} />}
    </AnimFrame>
  );
}
