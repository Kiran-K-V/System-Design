import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

export interface Step {
  caption: string;
}

interface Props<S extends Step> {
  title: string;
  steps: S[];
  /** Renders the diagram for one step. Must be a pure function of the step index. */
  children: (index: number, step: S) => ReactNode;
  /** Milliseconds per step at 1x speed. */
  interval?: number;
}

const SPEEDS = [0.5, 1, 2] as const;

/**
 * Stepper shell shared by every animation: diagram, caption, and controls.
 * State is only the step index, so back/next/replay are always exact.
 */
export default function AnimFrame<S extends Step>({ title, steps, children, interval = 2200 }: Props<S>) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const frame = useRef<HTMLDivElement>(null);
  const last = steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), interval / speed);
    return () => clearTimeout(t);
  }, [playing, index, last, interval, speed]);

  const go = (i: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(last, i)));
  };

  const togglePlay = () => {
    if (index >= last) setIndex(0);
    setPlaying((p) => !p);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target !== frame.current) return;
    if (e.key === 'ArrowRight') go(index + 1);
    else if (e.key === 'ArrowLeft') go(index - 1);
    else if (e.key === ' ') {
      e.preventDefault();
      togglePlay();
    } else return;
  };

  return (
    <MotionConfig reducedMotion="user">
      <figure
        ref={frame}
        tabIndex={0}
        onKeyDown={onKey}
        className="not-prose my-8 overflow-hidden rounded-2xl border border-line bg-surface/40 outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`${title}. Use left and right arrow keys to step.`}
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-muted" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M3.5 2.2v7.6L9.8 6z" /></svg>
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</span>
          {steps.length <= 14 && (
            <div className="hidden items-center gap-1.5 sm:flex" role="group" aria-label="Steps">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to step ${i + 1}`}
                  aria-current={i === index ? 'step' : undefined}
                  className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-accent' : i < index ? 'w-2 bg-accent/60' : 'w-2 bg-line hover:bg-muted'}`}
                />
              ))}
            </div>
          )}
          <span className="shrink-0 text-[13px] tabular-nums text-muted">
            Step {index + 1} / {steps.length}
          </span>
        </div>

        <div className="bg-bg px-2 py-4 sm:px-4">{children(index, steps[index])}</div>

        <figcaption
          aria-live="polite"
          className="m-3 flex min-h-[4.5rem] items-start gap-3.5 rounded-xl border border-line bg-surface px-4 py-3.5 text-[0.95rem] leading-relaxed"
        >
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-semibold tabular-nums text-white">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">{steps[index].caption}</span>
        </figcaption>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-3 pb-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              {playing ? <path d="M3 2h2v8H3zM7 2h2v8H7z" /> : <path d="M3.2 1.8v8.4L10 6z" />}
            </svg>
            {playing ? 'Pause' : index >= last ? 'Replay' : 'Play'}
          </button>
          <CtrlButton label="Previous step" onClick={() => go(index - 1)} disabled={index === 0}>
            <path d="M13 4l-6 6 6 6" />
          </CtrlButton>
          <CtrlButton label="Next step" onClick={() => go(index + 1)} disabled={index >= last}>
            <path d="M7 4l6 6-6 6" />
          </CtrlButton>
          <CtrlButton label="Restart" onClick={() => go(0)} disabled={index === 0}>
            <path d="M16 10a6 6 0 1 1-2-4.5M16 3.5V7h-3.5" />
          </CtrlButton>
          <input
            type="range"
            min={0}
            max={last}
            step={1}
            value={index}
            onChange={(e) => go(+e.target.value)}
            aria-label="Step"
            className="mx-1 h-1.5 min-w-[6rem] flex-1 cursor-pointer accent-[var(--accent)]"
          />
          <div className="flex overflow-hidden rounded-lg border border-line text-xs">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                aria-pressed={s === speed}
                className={`px-2.5 py-2 ${s === speed ? 'bg-accent-soft font-semibold text-accent' : 'text-muted hover:text-fg'}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </figure>
    </MotionConfig>
  );
}

function CtrlButton(props: { label: string; onClick: () => void; disabled: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      onClick={props.onClick}
      disabled={props.disabled}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-accent/50 hover:text-fg disabled:opacity-30"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        {props.children}
      </svg>
    </button>
  );
}
