/** Phone-style calculator state machine. Pure, so the UI only renders it. */

export type Op = '+' | '−' | '×' | '÷';
export type Token = number | Op;

export interface Calc {
  /** Finished numbers and operators, e.g. [1200, '×']. */
  tokens: Token[];
  /** The number being typed, as raw text without commas. '' when nothing is typed yet. */
  entry: string;
  /** True right after '=': a digit starts fresh, an operator continues from the result. */
  done: boolean;
  error: boolean;
  /** The expression that '=' just evaluated, shown above the result. */
  last?: string;
}

export type Action =
  | { type: 'digit'; d: string }
  | { type: 'dot' }
  | { type: 'op'; op: Op }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'back' }
  | { type: 'negate' }
  | { type: 'percent' }
  | { type: 'load'; n: number };

export const empty: Calc = { tokens: [], entry: '', done: false, error: false };

const isOp = (t: Token | undefined): t is Op => typeof t === 'string';
const hasNumber = (entry: string) => entry !== '' && entry !== '-';

/** Drop float noise such as 0.1 + 0.2 = 0.30000000000000004. */
const clean = (n: number) => parseFloat(n.toPrecision(12));

/** Evaluate with × and ÷ before + and −, like a phone calculator. */
export function evaluate(tokens: Token[]): number {
  const sums: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = sums[sums.length - 1];
    if ((t === '×' || t === '÷') && typeof prev === 'number' && typeof tokens[i + 1] === 'number') {
      const next = tokens[++i] as number;
      sums[sums.length - 1] = t === '×' ? prev * next : prev / next;
    } else sums.push(t);
  }
  let total = sums[0] as number;
  for (let i = 1; i < sums.length; i += 2) {
    const n = sums[i + 1] as number;
    total = sums[i] === '+' ? total + n : total - n;
  }
  return clean(total);
}

/** The full expression as it would evaluate now, or null when there is nothing to evaluate. */
function pending(c: Calc): Token[] | null {
  const t = hasNumber(c.entry) ? [...c.tokens, Number(c.entry)] : c.tokens.slice(0, isOp(c.tokens.at(-1)) ? -1 : undefined);
  return t.length ? t : null;
}

/** Live result shown in grey while the user types. Null when it would just repeat the entry. */
export function preview(c: Calc): number | null {
  if (c.done || c.error || c.tokens.length === 0) return null;
  const t = pending(c);
  if (!t || t.length < 3) return null;
  const v = evaluate(t);
  return Number.isFinite(v) ? v : null;
}

/** The operator waiting for its right side, shown as the highlighted key. */
export const activeOp = (c: Calc): Op | null => (c.entry === '' && isOp(c.tokens.at(-1)) ? (c.tokens.at(-1) as Op) : null);

export interface Step {
  calc: Calc;
  /** Set when '=' finishes a calculation, so the UI can add it to the history. */
  finished?: { expr: string; result: number };
}

export function reduce(c: Calc, a: Action): Step {
  if (c.error && a.type !== 'digit' && a.type !== 'load' && a.type !== 'dot') return { calc: empty };
  if (c.error) c = empty;

  switch (a.type) {
    case 'digit': {
      if (c.done) return { calc: { ...empty, entry: a.d } };
      const digits = c.entry.replace(/[-.]/g, '');
      if (digits.length >= 15) return { calc: c };
      const entry = c.entry === '0' ? a.d : c.entry === '-0' ? `-${a.d}` : c.entry + a.d;
      return { calc: { ...c, entry } };
    }
    case 'dot': {
      if (c.done) return { calc: { ...empty, entry: '0.' } };
      if (c.entry.includes('.')) return { calc: c };
      const entry = c.entry === '' ? '0.' : c.entry === '-' ? '-0.' : c.entry + '.';
      return { calc: { ...c, entry } };
    }
    case 'op': {
      if (hasNumber(c.entry)) return { calc: { tokens: [...c.tokens, Number(c.entry), a.op], entry: '', done: false, error: false } };
      if (isOp(c.tokens.at(-1))) return { calc: { ...c, tokens: [...c.tokens.slice(0, -1), a.op] } };
      return { calc: { tokens: [0, a.op], entry: '', done: false, error: false } };
    }
    case 'equals': {
      const t = pending(c);
      if (!t) return { calc: c };
      // "5 + =" has nothing to add: show 5 and do not log it.
      if (t.length < 3) return { calc: { tokens: [], entry: String(t[0]), done: true, error: false } };
      const result = evaluate(t);
      if (!Number.isFinite(result)) return { calc: { ...empty, error: true } };
      return {
        calc: { tokens: [], entry: String(result), done: true, error: false, last: exprText(t) },
        finished: { expr: exprText(t), result },
      };
    }
    case 'clear':
      // First press clears the entry (C), second press clears all (AC).
      return { calc: hasNumber(c.entry) && !c.done && c.tokens.length ? { ...c, entry: '' } : empty };
    case 'back': {
      if (c.done) return { calc: empty };
      if (c.entry !== '') return { calc: { ...c, entry: c.entry.slice(0, -1) } };
      // Nothing typed: remove the operator and make the number before it editable again.
      const tokens = c.tokens.slice(0, -1);
      const last = tokens.at(-1);
      return { calc: typeof last === 'number' ? { ...c, tokens: tokens.slice(0, -1), entry: String(last) } : { ...c, tokens } };
    }
    case 'negate': {
      const entry = c.entry.startsWith('-') ? c.entry.slice(1) : `-${c.entry}`;
      return { calc: { ...c, entry, done: false } };
    }
    case 'percent':
      if (!hasNumber(c.entry)) return { calc: c };
      return { calc: { ...c, entry: String(clean(Number(c.entry) / 100)), done: false } };
    case 'load': {
      const entry = String(a.n);
      // After an operator the loaded value fills the right side; otherwise it starts a new calculation.
      return { calc: c.entry === '' && !c.done ? { ...c, entry } : { ...empty, entry } };
    }
  }
}

/** 1234567.5 -> "1,234,567.5". Very large or very small numbers use e-notation. */
export function formatNumber(n: number): string {
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-9) return n.toExponential(6).replace(/\.?0+e/, 'e');
  return n.toLocaleString('en-US', { maximumFractionDigits: 10 });
}

/** Format the entry while typing, keeping a trailing "." or "0" the user just typed. */
export function formatEntry(entry: string): string {
  if (entry === '' || entry === '-') return entry === '-' ? '−0' : '0';
  const neg = entry.startsWith('-');
  const [int, frac] = entry.replace('-', '').split('.');
  const grouped = Number(int || '0').toLocaleString('en-US');
  return `${neg ? '−' : ''}${grouped}${frac !== undefined ? `.${frac}` : ''}`;
}

export const exprText = (tokens: Token[]) =>
  tokens.map((t) => (typeof t === 'number' ? (t < 0 ? `(${formatNumber(t).replace('-', '−')})` : formatNumber(t)) : t)).join(' ');
