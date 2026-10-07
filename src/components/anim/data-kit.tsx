import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { HandText, SketchBox, seedOf } from './sketch';
import { TONE, type Tone } from './FlowDiagram';

/** Fades children in when they first appear on this step. Pure function of (step, born). */
export function Fade({ step, born = 0, children }: { step: number; born?: number; children: ReactNode }) {
  const isNew = step === born && step > 0;
  return (
    <motion.g initial={isNew ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {children}
    </motion.g>
  );
}

/** A sketch box with centered text. Lines split on "\n". */
export function Labeled({
  cx,
  cy,
  w,
  h,
  text,
  tone = 'default',
  size = 15,
  fill,
  dashed,
  mono,
  seedKey,
  color,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  text: string;
  tone?: Tone;
  size?: number;
  fill?: string;
  dashed?: boolean;
  mono?: boolean;
  seedKey?: string;
  color?: string;
}) {
  return (
    <g>
      <SketchBox
        cx={cx}
        cy={cy}
        w={w}
        h={h}
        r={8}
        seed={seedOf(seedKey ?? `${text}@${cx},${cy}`)}
        stroke={TONE[tone]}
        fill={fill}
        fillStyle="solid"
        dashed={dashed}
      />
      <HandText x={cx} y={cy} size={size} mono={mono} color={color}>
        {text}
      </HandText>
    </g>
  );
}

/** Card wrapper for interactive widgets (no stepper). */
export function WidgetFrame({ title, children, caption }: { title: string; children: ReactNode; caption?: ReactNode }) {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="border-b border-line bg-surface px-4 py-2 text-sm font-medium">{title}</div>
      <div className="p-4">{children}</div>
      {caption && <figcaption className="border-t border-line px-4 py-3 text-[0.95rem] leading-relaxed">{caption}</figcaption>}
    </figure>
  );
}
