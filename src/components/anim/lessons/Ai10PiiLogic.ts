/** Logic for the redaction demo (lesson A10.5). Pure functions, no React. A toy detector, not a real product. */

export type Kind = 'EMAIL' | 'PHONE' | 'CARD' | 'SSN' | 'NAME' | 'ADDRESS';
export type DetectorId = 'email' | 'phone' | 'card' | 'ssn' | 'name';
export type Operator = 'label' | 'mask' | 'pseudonym';

export interface Span {
  start: number;
  end: number;
  kind: Kind;
}

export interface Sample {
  id: string;
  label: string;
  text: string;
  /** Every personal item in the text. The demo scores against this list. */
  truth: { value: string; kind: Kind }[];
}

/** Made-up texts. 4111 1111 1111 1111 is a public test card number. */
export const SAMPLES: Sample[] = [
  {
    id: 'support',
    label: 'Support chat',
    text: 'Hi, I am Priya Natarajan. Email priya.n@example.com or call +91 98765 43210. Card 4111 1111 1111 1111 was charged twice. Ship to 12 Orchard Lane.',
    truth: [
      { value: 'Priya Natarajan', kind: 'NAME' },
      { value: 'priya.n@example.com', kind: 'EMAIL' },
      { value: '+91 98765 43210', kind: 'PHONE' },
      { value: '4111 1111 1111 1111', kind: 'CARD' },
      { value: '12 Orchard Lane', kind: 'ADDRESS' },
    ],
  },
  {
    id: 'hr',
    label: 'HR question',
    text: 'Jane Doe (SSN 078-05-1120) asked about leave. Reach her at jane.doe@example.com, or say "five five five, zero one nine nine".',
    truth: [
      { value: 'Jane Doe', kind: 'NAME' },
      { value: '078-05-1120', kind: 'SSN' },
      { value: 'jane.doe@example.com', kind: 'EMAIL' },
      { value: 'five five five, zero one nine nine', kind: 'PHONE' },
    ],
  },
  {
    id: 'ticket',
    label: 'Tracking ticket',
    text: 'Parcel 4111 1111 1111 1112 is late. Ask Jane Doe at 555-0199 for an update. Contact: ops@example.com.',
    truth: [
      { value: 'Jane Doe', kind: 'NAME' },
      { value: '555-0199', kind: 'PHONE' },
      { value: 'ops@example.com', kind: 'EMAIL' },
    ],
  },
];

export const DETECTORS: { id: DetectorId; label: string; kind: Kind; how: string }[] = [
  { id: 'email', label: 'Email pattern', kind: 'EMAIL', how: 'regex' },
  { id: 'phone', label: 'Phone pattern', kind: 'PHONE', how: 'regex' },
  { id: 'card', label: 'Card number + checksum', kind: 'CARD', how: 'regex + Luhn' },
  { id: 'ssn', label: 'US SSN pattern', kind: 'SSN', how: 'regex' },
  { id: 'name', label: 'Known-names list', kind: 'NAME', how: 'word list' },
];

/** Names this toy knows. A real tool uses a trained model for names; it still misses some. */
const KNOWN_NAMES = ['Jane Doe', 'John Smith'];

export function luhnOk(digits: string): boolean {
  const d = digits.replace(/\D/g, '');
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (dbl) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function matches(text: string, re: RegExp, kind: Kind, keep?: (m: string) => boolean): Span[] {
  const out: Span[] = [];
  for (const m of text.matchAll(re)) {
    if (m.index === undefined) continue;
    if (keep && !keep(m[0])) continue;
    out.push({ start: m.index, end: m.index + m[0].length, kind });
  }
  return out;
}

export function detect(text: string, on: DetectorId[]): Span[] {
  const found: Span[] = [];
  if (on.includes('card')) found.push(...matches(text, /\b\d(?:[ -]?\d){12,18}\b/g, 'CARD', luhnOk));
  if (on.includes('ssn')) found.push(...matches(text, /\b\d{3}-\d{2}-\d{4}\b/g, 'SSN'));
  if (on.includes('email')) found.push(...matches(text, /[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g, 'EMAIL'));
  if (on.includes('phone')) found.push(...matches(text, /\+?\d[\d ()-]{5,}\d/g, 'PHONE', (m) => m.replace(/\D/g, '').length >= 7));
  if (on.includes('name')) for (const n of KNOWN_NAMES) found.push(...matches(text, new RegExp(n, 'g'), 'NAME'));
  // Keep the earliest, longest span when two overlap.
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: Span[] = [];
  for (const s of found) if (!kept.length || s.start >= kept[kept.length - 1].end) kept.push(s);
  return kept;
}

/** Small stable hash (FNV-1a). A real system uses a keyed hash such as HMAC with a secret key. */
export function pseudonym(kind: Kind, value: string, salt = 'demo-salt'): string {
  let h = 2166136261;
  for (const c of salt + value) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return `${kind}_${(h >>> 0).toString(16).padStart(8, '0').slice(0, 6)}`;
}

export function redact(text: string, spans: Span[], op: Operator): string {
  let out = '';
  let at = 0;
  const count: Record<string, number> = {};
  for (const s of spans) {
    out += text.slice(at, s.start);
    const value = text.slice(s.start, s.end);
    count[s.kind] = (count[s.kind] ?? 0) + 1;
    out += op === 'label' ? `[${s.kind}_${count[s.kind]}]` : op === 'mask' ? '*'.repeat(value.length) : `[${pseudonym(s.kind, value)}]`;
    at = s.end;
  }
  return out + text.slice(at);
}

export interface Score {
  total: number;
  caught: number;
  leaked: { value: string; kind: Kind }[];
  /** Detected spans that cover no personal item. */
  falseAlarms: string[];
  recall: number;
}

export function score(sample: Sample, spans: Span[]): Score {
  const truthSpans = sample.truth.map((t) => {
    const start = sample.text.indexOf(t.value);
    return { ...t, start, end: start + t.value.length };
  });
  const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) => a.start < b.end && b.start < a.end;
  const leaked = truthSpans.filter((t) => !spans.some((s) => overlaps(s, t))).map(({ value, kind }) => ({ value, kind }));
  const falseAlarms = spans.filter((s) => !truthSpans.some((t) => overlaps(s, t))).map((s) => sample.text.slice(s.start, s.end));
  const caught = truthSpans.length - leaked.length;
  return { total: truthSpans.length, caught, leaked, falseAlarms, recall: truthSpans.length ? caught / truthSpans.length : 1 };
}
