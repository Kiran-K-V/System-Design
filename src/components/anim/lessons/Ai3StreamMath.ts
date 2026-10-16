/** Math for lesson A3.2 (streaming). Pure functions, no React. */

export interface Timeline {
  /** Seconds until the user sees the first token when the reply is blocking. */
  blockingFirst: number;
  /** Seconds until the user sees the first token when the reply streams. */
  streamFirst: number;
  /** Seconds until the last token exists. Same for both modes. */
  done: number;
}

/** n output tokens, tps tokens per second after the first token, ttft seconds to the first token. */
export function timeline(n: number, tps: number, ttft: number): Timeline {
  const done = ttft + n / tps;
  return { blockingFirst: done, streamFirst: ttft, done };
}

export interface Cancel {
  generated: number;
  saved: number;
}

/** The user leaves at `t` seconds. If the server stops on disconnect, it generated only what existed by t. */
export function cancelAt(n: number, tps: number, ttft: number, t: number): Cancel {
  const generated = Math.max(0, Math.min(n, Math.floor((t - ttft) * tps)));
  return { generated, saved: n - generated };
}

/**
 * Closes a cut-off JSON string so JSON.parse accepts it. This is what a "partial JSON" parser does.
 * It returns a value that parses but may be wrong, because the cut value is still growing.
 */
export function closePartial(s: string): string {
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (const ch of s) {
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }
  let out = s;
  if (inStr) out += '"';
  out = out.replace(/[,\s]+$/, '');
  if (/:$/.test(out)) out += ' null';
  return out + stack.reverse().join('');
}

export function tryParse(s: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** The tool-input chunks used by the assembler demo (shape from the Anthropic streaming docs). */
export const CHUNKS = ['{"location": "San Fra', 'ncisco, CA", ', '"unit": "cel', 'sius"}'];
