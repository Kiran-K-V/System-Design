import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { motion, MotionConfig, AnimatePresence } from 'motion/react';
import { activeOp, empty, exprText, formatEntry, formatNumber, preview, reduce, type Action, type Calc, type Op } from '../../lib/calc';

interface Entry {
  expr: string;
  result: number;
}

const HISTORY_KEY = 'sd-calc-history';
const HISTORY_MAX = 6;

const readHistory = (): Entry[] => {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(v) ? v.slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
};

interface State {
  calc: Calc;
  history: Entry[];
}

function step(s: State, a: Action | { type: 'history'; history: Entry[] }): State {
  if (a.type === 'history') return { ...s, history: a.history };
  const { calc, finished } = reduce(s.calc, a);
  if (!finished) return { ...s, calc };
  // Pressing '=' twice on the same sum should not fill the list with copies.
  const rest = s.history.filter((h) => h.expr !== finished.expr);
  return { calc, history: [finished, ...rest].slice(0, HISTORY_MAX) };
}

const KEY_OPS: Record<string, Op> = { '+': '+', '-': '−', '*': '×', x: '×', X: '×', '/': '÷' };

/** Floating phone-style calculator for the lesson exercises. Keeps the last results so you can reuse them. */
export default function Calculator() {
  const [open, setOpen] = useState(false);
  const [s, dispatch] = useReducer(step, { calc: empty, history: [] });
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    dispatch({ type: 'history', history: readHistory() });
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(s.history));
    } catch {}
  }, [s.history]);

  useEffect(() => {
    if (open) panel.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement;
      // Only take keys aimed at the calculator, so answer boxes and page links keep working.
      if (!panel.current?.contains(el) && el !== document.body) return;
      // A focused key button handles Enter and Space itself.
      if ((e.key === 'Enter' || e.key === ' ') && el.tagName === 'BUTTON') return;
      let a: Action | null = null;
      if (/^[0-9]$/.test(e.key)) a = { type: 'digit', d: e.key };
      else if (e.key === '.' || e.key === ',') a = { type: 'dot' };
      else if (KEY_OPS[e.key]) a = { type: 'op', op: KEY_OPS[e.key] };
      else if (e.key === 'Enter' || e.key === '=') a = { type: 'equals' };
      else if (e.key === 'Backspace') a = { type: 'back' };
      else if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') a = { type: 'clear' };
      else if (e.key === '%') a = { type: 'percent' };
      else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      if (!a) return;
      // Stop here so page shortcuts ("/" opens search) do not also fire.
      e.preventDefault();
      e.stopPropagation();
      dispatch(a);
    };
    // Capture phase runs before the layout's own window key handlers.
    addEventListener('keydown', onKey, true);
    return () => removeEventListener('keydown', onKey, true);
  }, [open]);

  const { calc } = s;
  const live = preview(calc);
  const op = activeOp(calc);
  const shown = calc.error ? 'Error' : formatEntry(calc.entry === '' && calc.tokens.length === 0 ? '0' : calc.entry || '');
  const upper = calc.done ? (calc.last ? `${calc.last} =` : '') : exprText(calc.tokens);
  const value = calc.error ? null : calc.entry !== '' && calc.entry !== '-' ? Number(calc.entry) : null;
  const clearLabel = calc.entry !== '' && !calc.done && calc.tokens.length ? 'C' : 'AC';

  const copy = async () => {
    if (value === null) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-30 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:bottom-5" data-pagefind-ignore>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panel}
              id="calc-panel"
              key="calc"
              role="dialog"
              aria-label="Calculator"
              tabIndex={-1}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ transformOrigin: 'bottom right' }}
              className="pointer-events-auto w-full max-w-[300px] overflow-hidden rounded-2xl border border-line bg-bg shadow-[0_18px_50px_-12px_rgba(0,0,0,0.35)] outline-none"
            >
              <div className="flex items-center justify-between border-b border-line px-3.5 py-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Calculator</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close calculator"
                  className="-mr-1.5 grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface hover:text-fg"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                    <path d="M2 2l8 8M10 2l-8 8" />
                  </svg>
                </button>
              </div>

              {s.history.length > 0 && (
                <ol className="scroll-thin max-h-[92px] overflow-y-auto border-b border-line px-1.5 py-1" aria-label="Recent results">
                  {s.history
                    .slice()
                    .reverse()
                    .map((h, i) => (
                      <li key={`${i}-${h.expr}`}>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'load', n: h.result })}
                          title="Use this result"
                          className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1 text-left font-mono text-[12px] tabular-nums hover:bg-surface"
                        >
                          <span className="truncate text-muted">{h.expr}</span>
                          <span className="shrink-0 text-fg">= {formatNumber(h.result)}</span>
                        </button>
                      </li>
                    ))}
                </ol>
              )}

              <div className="px-4 pt-3 pb-2 text-right">
                <div className="min-h-[18px] truncate font-mono text-[12px] tabular-nums text-muted">{upper || ' '}</div>
                <div className="flex items-end justify-end gap-2">
                  <button
                    type="button"
                    onClick={copy}
                    disabled={value === null}
                    aria-label="Copy result"
                    className="mb-1.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted hover:bg-surface hover:text-fg disabled:opacity-0"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <output
                    aria-live="polite"
                    className={`block min-w-0 truncate font-mono font-medium tabular-nums tracking-[-0.03em] ${shown.length > 12 ? 'text-[1.5rem]' : 'text-[2.1rem]'} leading-tight ${calc.error ? 'text-bad' : 'text-fg'}`}
                  >
                    {shown}
                  </output>
                </div>
                <div className="min-h-[18px] font-mono text-[12px] tabular-nums text-muted">{live !== null ? `= ${formatNumber(live)}` : ' '}</div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 p-2.5 pt-1">
                <Key label={clearLabel} aria={clearLabel === 'AC' ? 'All clear' : 'Clear entry'} kind="fn" onClick={() => dispatch({ type: 'clear' })} />
                <Key
                  label={
                    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
                      <path d="M6.5 1H18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6.5L1 7z" />
                      <path d="M10 4.5l5 5M15 4.5l-5 5" />
                    </svg>
                  }
                  aria="Backspace"
                  kind="fn"
                  onClick={() => dispatch({ type: 'back' })}
                />
                <Key label="%" aria="Percent" kind="fn" onClick={() => dispatch({ type: 'percent' })} />
                <Key label="÷" aria="Divide" kind="op" active={op === '÷'} onClick={() => dispatch({ type: 'op', op: '÷' })} />
                {['7', '8', '9'].map((d) => <Key key={d} label={d} onClick={() => dispatch({ type: 'digit', d })} />)}
                <Key label="×" aria="Multiply" kind="op" active={op === '×'} onClick={() => dispatch({ type: 'op', op: '×' })} />
                {['4', '5', '6'].map((d) => <Key key={d} label={d} onClick={() => dispatch({ type: 'digit', d })} />)}
                <Key label="−" aria="Subtract" kind="op" active={op === '−'} onClick={() => dispatch({ type: 'op', op: '−' })} />
                {['1', '2', '3'].map((d) => <Key key={d} label={d} onClick={() => dispatch({ type: 'digit', d })} />)}
                <Key label="+" aria="Add" kind="op" active={op === '+'} onClick={() => dispatch({ type: 'op', op: '+' })} />
                <Key label="±" aria="Change sign" kind="fn" onClick={() => dispatch({ type: 'negate' })} />
                <Key label="0" onClick={() => dispatch({ type: 'digit', d: '0' })} />
                <Key label="." aria="Decimal point" onClick={() => dispatch({ type: 'dot' })} />
                <Key label="=" aria="Equals" kind="eq" onClick={() => dispatch({ type: 'equals' })} />
              </div>
              <p className="hidden border-t border-line px-3.5 py-1.5 font-mono text-[10.5px] text-muted sm:block">
                Type with keyboard · Enter = · Esc closes
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          ref={toggle}
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-expanded={open}
          aria-label={open ? 'Close calculator' : 'Open calculator'}
          title="Calculator"
          className={`press pointer-events-auto grid h-12 w-12 place-items-center rounded-full border shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] ${
            open ? 'border-accent bg-accent text-on-accent' : 'border-line bg-bg text-fg hover:border-fg/30'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <rect x="3.5" y="2" width="13" height="16" rx="2.5" />
            <path d="M6.5 5.5h7" />
            <path d="M7 10h.01M10 10h.01M13 10h.01M7 13.5h.01M10 13.5h.01M13 13.5h.01" strokeWidth="2.2" />
          </svg>
        </button>
      </div>
    </MotionConfig>
  );
}

function Key({
  label,
  aria,
  kind = 'num',
  active = false,
  onClick,
}: {
  label: ReactNode;
  aria?: string;
  kind?: 'num' | 'fn' | 'op' | 'eq';
  active?: boolean;
  onClick: () => void;
}) {
  const look = {
    num: 'bg-surface text-fg hover:bg-line/70',
    fn: 'bg-surface text-muted hover:bg-line/70 hover:text-fg',
    op: active ? 'bg-accent text-on-accent' : 'bg-accent-soft text-accent hover:bg-accent/20',
    eq: 'bg-accent text-on-accent hover:opacity-90',
  }[kind];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      aria-pressed={kind === 'op' ? active : undefined}
      className={`press grid h-11 place-items-center rounded-xl font-mono text-[1.05rem] tabular-nums select-none ${look}`}
    >
      {label}
    </button>
  );
}
