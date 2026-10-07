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
        className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)] outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`${title}. Use left and right arrow keys to step.`}
      >
        <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs tabular-nums text-muted">
            Step {index + 1} / {steps.length}
          </span>
        </div>

        <div className="px-2 py-4 sm:px-4">{children(index, steps[index])}</div>

        <figcaption
          aria-live="polite"
          className="min-h-[4.5rem] border-t border-line px-4 py-3 text-[0.95rem] leading-relaxed"
        >
          {steps[index].caption}
        </figcaption>

        <div className="flex items-center gap-1 border-t border-line px-3 py-2">
          <CtrlButton label="Restart" onClick={() => go(0)} disabled={index === 0}>
            <path d="M4 4v12M16 4l-8 6 8 6z" />
          </CtrlButton>
          <CtrlButton label="Previous step" onClick={() => go(index - 1)} disabled={index === 0}>
            <path d="M13 4l-6 6 6 6" />
          </CtrlButton>
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-white hover:opacity-90"
          >
            {playing ? 'Pause' : index >= last ? 'Replay' : 'Play'}
          </button>
          <CtrlButton label="Next step" onClick={() => go(index + 1)} disabled={index >= last}>
            <path d="M7 4l6 6-6 6" />
          </CtrlButton>
          <div className="flex-1" />
          <div className="flex overflow-hidden rounded-md border border-line text-xs">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 ${s === speed ? 'bg-surface font-semibold' : 'text-muted'}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
        <div className="h-1 bg-surface">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${(index / Math.max(1, last)) * 100}%` }}
          />
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
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-fg disabled:opacity-30"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        {props.children}
      </svg>
    </button>
  );
}
