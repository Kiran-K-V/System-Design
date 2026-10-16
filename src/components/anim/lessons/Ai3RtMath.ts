/** Latency budget for one voice turn. Every stage time is an editable, illustrative default, not a measurement. */
export interface Stage {
  id: string;
  label: string;
  ms: number;
  max: number;
}

export const CASCADED: Stage[] = [
  { id: 'wait', label: 'Turn end wait (VAD)', ms: 500, max: 1500 },
  { id: 'stt', label: 'Speech to text, final', ms: 200, max: 1000 },
  { id: 'llm', label: 'LLM first token', ms: 400, max: 2000 },
  { id: 'tts', label: 'Text to speech, first audio', ms: 250, max: 1000 },
  { id: 'net', label: 'Network, both ways', ms: 100, max: 600 },
];

export const S2S: Stage[] = [
  { id: 'wait', label: 'Turn end wait (VAD)', ms: 500, max: 1500 },
  { id: 'model', label: 'Model first audio', ms: 500, max: 2000 },
  { id: 'net', label: 'Network, both ways', ms: 100, max: 600 },
];

export const total = (ms: number[]) => ms.reduce((a, b) => a + b, 0);

/** Raw PCM bytes per second. */
export const pcmBytesPerSec = (rateHz: number, bits: number, channels: number) => (rateHz * bits * channels) / 8;
