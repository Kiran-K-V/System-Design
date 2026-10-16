/** Logic for lesson A3.3. Pure functions, no React. */

export interface Cand {
  t: string;
  /** Probability from the model before the grammar mask. Illustrative. */
  p: number;
  /** True when the grammar allows this token in the current state. */
  ok: boolean;
}

/** Sets masked tokens to zero and rescales the rest to sum to 1. This is what constrained decoding does to the distribution. */
export function applyMask(cands: Cand[]): number[] {
  const kept = cands.reduce((s, c) => s + (c.ok ? c.p : 0), 0);
  return cands.map((c) => (c.ok && kept > 0 ? c.p / kept : 0));
}

export const LABELS = ['negative', 'neutral', 'mixed'];

export interface Verdict {
  ok: boolean;
  errors: string[];
}

/** Validates a model reply against the demo schema: { label: enum, urgent: boolean }, both required, no extra keys. */
export function validate(text: string, stopReason: string): Verdict {
  if (stopReason === 'refusal') return { ok: false, errors: ['stop_reason is refusal: the output may not match the schema. Do not parse.'] };
  if (stopReason === 'max_tokens') return { ok: false, errors: ['stop_reason is max_tokens: the output may be cut. Do not parse.'] };
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['Reply is not valid JSON.'] };
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return { ok: false, errors: ['Reply must be a JSON object.'] };
  const o = v as Record<string, unknown>;
  const errors: string[] = [];
  if (!('label' in o)) errors.push('Missing required field "label".');
  else if (typeof o.label !== 'string' || !LABELS.includes(o.label)) errors.push(`"label" must be one of ${LABELS.join(', ')}.`);
  if (!('urgent' in o)) errors.push('Missing required field "urgent".');
  else if (typeof o.urgent !== 'boolean') errors.push('"urgent" must be a boolean.');
  for (const k of Object.keys(o)) if (k !== 'label' && k !== 'urgent') errors.push(`Unexpected field "${k}".`);
  return { ok: errors.length === 0, errors };
}

/** Text fed back to the model on a repair attempt. */
export function repairMessage(errors: string[]): string {
  return `Your last reply failed validation: ${errors.join(' ')} Reply with only the corrected JSON.`;
}
