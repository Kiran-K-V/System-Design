import { createContext, useContext, useMemo, type ReactNode } from 'react';
import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core';

/**
 * Hand-drawn SVG primitives in the Excalidraw style.
 * Every shape takes a `seed` so its wobble is stable across renders and steps.
 */

const gen = rough.generator();

export type Pt = [number, number];

export const INK = 'var(--fg)';
export const HAND_FONT = 'var(--font-hand)';

/**
 * The article column is ~720px wide, so a viewBox wider than that shrinks every glyph.
 * SketchSvg publishes a text boost so a size written for a 720-wide canvas still renders at the same pixel size.
 */
const TextBoost = createContext(1);
const COLUMN_PX = 720;
const MIN_BOOST_PX = 14;
export const textBoost = (viewBoxWidth: number) => Math.max(1, viewBoxWidth / COLUMN_PX);

/** Stable small integer from any string, for rough.js seeds. */
export function seedOf(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return (Math.abs(h) % 2_000_000) + 1;
}

/**
 * Diagram standard (design/DIAGRAMS.md). The primitives enforce it, so a diagram cannot drift:
 * - Text uses one of five sizes. Any other size snaps to the nearest step.
 * - The hand font has no bold cut, so hand text is always weight 400. Show emphasis with color.
 * - Strokes are 1.4 (normal) or 2.2 (emphasis). Wider values (rings, tracks) pass through.
 * - Colored fills render as a soft tint, so text on top stays readable in both themes.
 */
export const TEXT_SIZES = { note: 14, label: 16, heading: 18, title: 22, display: 28 } as const;
const SIZE_STEPS = Object.values(TEXT_SIZES);
const snapSize = (s: number) => SIZE_STEPS.reduce((best, step) => (Math.abs(step - s) < Math.abs(best - s) ? step : best));

export const STROKE = { normal: 1.4, emphasis: 2.2 } as const;
const snapStroke = (w: number) => (w > 3 ? w : w >= 1.8 ? STROKE.emphasis : STROKE.normal);

/** Neutral fills stay as they are. Any other color becomes a tint of itself over the page background. */
const NEUTRAL_FILL = /^var\(--(bg|surface|node|accent-soft)\)$/;
const TINT = 20;
const tint = (fill: string) => (NEUTRAL_FILL.test(fill) ? fill : `color-mix(in srgb, ${fill} ${TINT}%, var(--bg))`);

const BASE: Options = { roughness: 0.9, bowing: 0.7, strokeWidth: STROKE.normal, stroke: INK };

/** Server and browser math can differ in the last float digits. Rounding keeps hydration stable. */
function roundPath(d: string) {
  return d.replace(/-?\d+\.\d+(e-?\d+)?/g, (n) => String(Math.round(+n * 10) / 10));
}

function Drawn({ make, deps }: { make: () => ReturnType<typeof gen.path>; deps: unknown[] }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const paths = useMemo(() => gen.toPaths(make()).map((p) => ({ ...p, d: roundPath(p.d) })), deps);
  return (
    <>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          fill={p.fill ?? 'none'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  );
}

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  return `M${x + r} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} Z`;
}

interface ShapeStyle {
  seed: number;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  fill?: string;
  /** Omit for a flat tint. Cross-hatch is for small badges only. */
  fillStyle?: 'solid' | 'cross-hatch';
}

function opts(s: ShapeStyle): Options {
  // Cross-hatch is kept for small badges. Every other fill is a flat tint: hatching behind text is noise.
  const hatched = s.fillStyle === 'cross-hatch';
  return {
    ...BASE,
    seed: s.seed,
    stroke: s.stroke ?? INK,
    strokeWidth: snapStroke(s.strokeWidth ?? STROKE.normal),
    strokeLineDash: s.dashed ? [8, 7] : undefined,
    disableMultiStroke: s.dashed,
    fill: s.fill && !hatched ? tint(s.fill) : s.fill,
    fillStyle: hatched ? 'cross-hatch' : 'solid',
    hachureGap: 5,
    fillWeight: 1,
  };
}

/** Rounded rectangle centered on (cx, cy). */
export function SketchBox({ cx, cy, w, h, r = 12, ...s }: { cx: number; cy: number; w: number; h: number; r?: number } & ShapeStyle) {
  const o = opts(s);
  return <Drawn make={() => gen.path(roundedRect(cx - w / 2, cy - h / 2, w, h, r), o)} deps={[cx, cy, w, h, r, JSON.stringify(o)]} />;
}

/** Ellipse centered on (cx, cy). */
export function SketchEllipse({ cx, cy, w, h, ...s }: { cx: number; cy: number; w: number; h: number } & ShapeStyle) {
  const o = opts(s);
  return <Drawn make={() => gen.ellipse(cx, cy, w, h, o)} deps={[cx, cy, w, h, JSON.stringify(o)]} />;
}

/** Database cylinder centered on (cx, cy). */
export function SketchCylinder({ cx, cy, w, h, ...s }: { cx: number; cy: number; w: number; h: number } & ShapeStyle) {
  const o = opts(s);
  const rx = w / 2;
  const ry = Math.min(10, h / 6);
  const top = cy - h / 2 + ry;
  const bot = cy + h / 2 - ry;
  const d =
    `M${cx - rx} ${top} A${rx} ${ry} 0 0 1 ${cx + rx} ${top} A${rx} ${ry} 0 0 1 ${cx - rx} ${top} ` +
    `L${cx - rx} ${bot} A${rx} ${ry} 0 0 0 ${cx + rx} ${bot} L${cx + rx} ${top}`;
  return <Drawn make={() => gen.path(d, o)} deps={[cx, cy, w, h, JSON.stringify(o)]} />;
}

export interface ArrowProps extends ShapeStyle {
  /** Two points draw a straight line. Three or more draw a smooth curve through them. */
  points: Pt[];
  head?: 'end' | 'both' | 'none';
}

function headLines(tip: Pt, from: Pt, size = 11): string {
  const a = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
  const spread = 0.45;
  const l: Pt = [tip[0] - size * Math.cos(a - spread), tip[1] - size * Math.sin(a - spread)];
  const r: Pt = [tip[0] - size * Math.cos(a + spread), tip[1] - size * Math.sin(a + spread)];
  return `M${l[0]} ${l[1]} L${tip[0]} ${tip[1]} L${r[0]} ${r[1]}`;
}

export function SketchArrow({ points, head = 'end', ...s }: ArrowProps) {
  const o = opts(s);
  const headOpts = { ...o, strokeLineDash: undefined, disableMultiStroke: false, roughness: 0.8 };
  const n = points.length;
  return (
    <>
      <Drawn
        make={() => (n === 2 ? gen.line(points[0][0], points[0][1], points[1][0], points[1][1], o) : gen.curve(points, o))}
        deps={[JSON.stringify(points), JSON.stringify(o)]}
      />
      {head !== 'none' && (
        <Drawn make={() => gen.path(headLines(points[n - 1], points[n - 2]), headOpts)} deps={[JSON.stringify(points), JSON.stringify(o)]} />
      )}
      {head === 'both' && (
        <Drawn make={() => gen.path(headLines(points[0], points[1]), headOpts)} deps={[JSON.stringify(points), JSON.stringify(o), 'start']} />
      )}
    </>
  );
}

/** Multi-line hand-written text. Lines split on "\n". */
export function HandText({
  x,
  y,
  children,
  size = 15,
  anchor = 'middle',
  color = INK,
  weight = 400,
  lineHeight = 1.25,
  mono = false,
  halo = false,
}: {
  x: number;
  y: number;
  children: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
  weight?: number;
  lineHeight?: number;
  mono?: boolean;
  /** Draw a background-colored outline so text stays readable over hatching. */
  halo?: boolean;
}) {
  const boost = useContext(TextBoost);
  size = Math.max(snapSize(size), MIN_BOOST_PX) * boost;
  // Faux bold on the hand font smears. Mono text may go to 500, no further.
  weight = mono ? Math.min(weight, 500) : 400;
  const lines = children.split('\n');
  const first = y - ((lines.length - 1) * size * lineHeight) / 2;
  return (
    <text
      x={x}
      textAnchor={anchor}
      fontSize={size}
      fill={color}
      fontWeight={weight}
      style={{ fontFamily: mono ? 'var(--font-mono)' : HAND_FONT }}
      stroke={halo ? 'var(--bg)' : undefined}
      strokeWidth={halo ? 4 : undefined}
      paintOrder={halo ? 'stroke' : undefined}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} y={first + i * size * lineHeight} dominantBaseline="middle">
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** Hatch-filled numbered circle, like the step badges in the delivery framework. */
export function Badge({ cx, cy, n, seed, color = 'var(--badge)' }: { cx: number; cy: number; n: number | string; seed: number; color?: string }) {
  return (
    <g>
      <SketchEllipse cx={cx} cy={cy} w={30} h={30} seed={seed} fill={color} fillStyle="cross-hatch" />
      <HandText x={cx} y={cy + 1} size={16} weight={700} halo>
        {String(n)}
      </HandText>
    </g>
  );
}

/** SVG wrapper for sketch diagrams. */
export function SketchSvg({ width, height, label, children }: { width: number; height: number; label?: string; children: ReactNode }) {
  return (
    <TextBoost.Provider value={textBoost(width)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label}>
        {children}
      </svg>
    </TextBoost.Provider>
  );
}
