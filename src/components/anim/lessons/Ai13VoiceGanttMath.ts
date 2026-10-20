/**
 * Timeline of one voice turn that needs a tool call, with and without filler speech. Pure functions.
 *
 * Stage values are the P50 numbers of the ElevenLabs budget used in lesson A12.2: endpointing 120, STT final 60,
 * network 60, LLM first token 250, TTS first audio 110, player buffer 80. The tool time, the 100 ms the model needs
 * to write the filler words and the tool arguments, and the 1,100 ms length of the filler clip are ILLUSTRATIVE.
 */

export const ENDPOINT = 120;
export const STT = 60;
export const NET = 60;
export const LLM_FIRST = 250;
export const TTS_FIRST = 110;
export const BUFFER = 80;
/** Time for the model to write the filler words and the tool-call arguments, after its first token (assumed). */
export const CALL_WRITE = 100;
/** Length of the filler clip "Let me check that for you", ms (assumed). */
export const FILLER_CLIP = 1100;
/** Default tool time, ms (assumed). */
export const TOOL_MS = 900;

export interface Seg {
  id: string;
  label: string;
  start: number;
  dur: number;
  kind: 'stage' | 'tool' | 'filler' | 'silence' | 'answer';
}

/** Time the user stops talking is 0. The first three stages are the same in every variant. */
export const toolStart = () => ENDPOINT + STT + NET + LLM_FIRST + CALL_WRITE;

export interface Run {
  segs: Seg[];
  /** Start of the first sound of the turn, ms. */
  firstSound: number;
  /** Longest stretch of silence the user hears after the turn ends, ms. */
  longestSilence: number;
  /** Start of the answer audio, ms. */
  answerStart: number;
}

/** Without filler: the model calls the tool at once and the line is silent until the answer. */
export function withoutFiller(toolMs: number = TOOL_MS): Run {
  let t = 0;
  const segs: Seg[] = [];
  const add = (id: string, label: string, dur: number, kind: Seg['kind'] = 'stage') => {
    segs.push({ id, label, start: t, dur, kind });
    t += dur;
  };
  add('ep', 'Endpointing', ENDPOINT);
  add('stt', 'STT final', STT);
  add('net', 'Network', NET);
  add('llm1', 'LLM writes the call', LLM_FIRST + CALL_WRITE);
  add('tool', 'Tool runs', toolMs, 'tool');
  add('llm2', 'LLM answer, first token', LLM_FIRST);
  add('tts2', 'TTS first audio', TTS_FIRST);
  add('buf2', 'Player buffer', BUFFER);
  const answerStart = t;
  return { segs, firstSound: answerStart, longestSilence: answerStart, answerStart };
}

/** With filler: the first words the model writes are the filler. TTS speaks them while the tool runs. */
export function withFiller(toolMs: number = TOOL_MS): Run {
  const segs: Seg[] = [];
  let t = 0;
  const add = (id: string, label: string, start: number, dur: number, kind: Seg['kind'] = 'stage') => {
    segs.push({ id, label, start, dur, kind });
    t = start + dur;
  };
  add('ep', 'Endpointing', 0, ENDPOINT);
  add('stt', 'STT final', t, STT);
  add('net', 'Network', t, NET);
  add('llm1', 'LLM writes the call', t, LLM_FIRST + CALL_WRITE);
  const callAt = t;
  add('tool', 'Tool runs', callAt, toolMs, 'tool');
  const toolEnd = t;
  // The filler words are the first tokens, so TTS can start after the first token of the model.
  const fillerSpeechStart = ENDPOINT + STT + NET + LLM_FIRST + TTS_FIRST + BUFFER;
  segs.push({ id: 'filler', label: 'Filler speech', start: fillerSpeechStart, dur: FILLER_CLIP, kind: 'filler' });
  const fillerEnd = fillerSpeechStart + FILLER_CLIP;
  const answerReady = toolEnd + LLM_FIRST + TTS_FIRST + BUFFER;
  segs.push({ id: 'llm2', label: 'LLM answer, first token', start: toolEnd, dur: LLM_FIRST, kind: 'stage' });
  segs.push({ id: 'tts2', label: 'TTS and buffer', start: toolEnd + LLM_FIRST, dur: TTS_FIRST + BUFFER, kind: 'stage' });
  // The answer must wait until the filler clip has finished playing.
  const answerStart = Math.max(answerReady, fillerEnd);
  const gap = Math.max(0, answerReady - fillerEnd);
  if (gap > 0) segs.push({ id: 'gap', label: 'Silence', start: fillerEnd, dur: gap, kind: 'silence' });
  segs.push({ id: 'answer', label: 'Answer audio', start: answerStart, dur: 400, kind: 'answer' });
  return { segs, firstSound: fillerSpeechStart, longestSilence: Math.max(fillerSpeechStart, gap), answerStart };
}

/** Tool time at which the answer is ready exactly when the filler clip ends. Below this, the filler delays the answer. */
export function breakEvenToolMs(): number {
  const fillerEnd = ENDPOINT + STT + NET + LLM_FIRST + TTS_FIRST + BUFFER + FILLER_CLIP;
  return fillerEnd - (toolStart() + LLM_FIRST + TTS_FIRST + BUFFER);
}
