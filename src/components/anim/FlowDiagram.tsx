import { motion } from 'motion/react';
import {
  Badge,
  HandText,
  INK,
  SketchArrow,
  SketchBox,
  SketchCylinder,
  SketchEllipse,
  SketchSvg,
  seedOf,
  type Pt,
} from './sketch';

export type Tone = 'default' | 'accent' | 'ok' | 'warn' | 'bad' | 'muted';

export interface FlowNode {
  id: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** Lines split on "\n". */
  label: string;
  sub?: string;
  shape?: 'box' | 'circle' | 'db' | 'dashed';
  tone?: Tone;
  /** Hatch-filled number badge on the top-left corner. */
  badge?: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  /** Label offset from the edge midpoint. */
  labelAt?: Pt;
  dashed?: boolean;
  tone?: Tone;
  head?: 'end' | 'both' | 'none';
  /** Bend the edge sideways by this many units. Positive bends to the left of travel. */
  bend?: number;
}

export interface FlowNote {
  x: number;
  y: number;
  text: string;
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
  tone?: Tone;
}

/** Dashed boundary around a set of nodes, such as one server or one region. */
export interface FlowGroup {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface FlowPacket {
  from: string;
  to: string;
  label?: string;
  tone?: Tone;
  /** Seconds to wait before this packet starts. */
  delay?: number;
}

interface Props {
  width: number;
  height: number;
  nodes: FlowNode[];
  edges?: FlowEdge[];
  notes?: FlowNote[];
  groups?: FlowGroup[];
  /** Packets animate once along their edge. Change `stepKey` to replay. */
  packets?: FlowPacket[];
  /** Node ids drawn highlighted. */
  active?: string[];
  stepKey?: string | number;
  /** Seconds a packet takes to travel. */
  travel?: number;
  label?: string;
}

export const TONE: Record<Tone, string> = {
  default: INK,
  accent: 'var(--accent)',
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
  muted: 'var(--muted)',
};

const DEFAULT_W = 130;
const DEFAULT_H = 64;

function size(n: FlowNode) {
  if (n.shape === 'circle') {
    const d = n.w ?? 100;
    return { w: d, h: n.h ?? d };
  }
  return { w: n.w ?? DEFAULT_W, h: n.h ?? DEFAULT_H };
}

/** Point where the ray from the node center toward (tx, ty) leaves the node outline, plus a small gap. */
function boundary(n: FlowNode, tx: number, ty: number, gap = 6): Pt {
  const { w, h } = size(n);
  const dx = tx - n.x;
  const dy = ty - n.y;
  const len = Math.hypot(dx, dy) || 1;
  if (n.shape === 'circle') {
    const a = Math.atan2(dy, dx);
    return [n.x + (w / 2 + gap) * Math.cos(a), n.y + (h / 2 + gap) * Math.sin(a)];
  }
  const scale = Math.min(Math.abs(w / 2 / (dx || 1e-9)), Math.abs(h / 2 / (dy || 1e-9)));
  return [n.x + dx * scale + (dx / len) * gap, n.y + dy * scale + (dy / len) * gap];
}

/** Start, control, and end points of an edge. */
export function edgePath(a: FlowNode, b: FlowNode, bend = 0): Pt[] {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const c: Pt = [mx + (dy / len) * bend, my - (dx / len) * bend];
  if (!bend) return [boundary(a, b.x, b.y), boundary(b, a.x, a.y)];
  return [boundary(a, c[0], c[1]), c, boundary(b, c[0], c[1])];
}

function midpoint(pts: Pt[]): Pt {
  if (pts.length === 3) return pts[1];
  return [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
}

export default function FlowDiagram({
  width,
  height,
  nodes,
  edges = [],
  notes = [],
  groups = [],
  packets = [],
  active = [],
  stepKey,
  travel = 0.9,
  label,
}: Props) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edgeFor = (from: string, to: string) =>
    edges.find((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from));

  return (
    <SketchSvg width={width} height={height} label={label}>
      {groups.map((g) => (
        <g key={g.label}>
          <SketchBox cx={g.x + g.w / 2} cy={g.y + g.h / 2} w={g.w} h={g.h} r={16} dashed stroke="var(--muted)" seed={seedOf(g.label)} />
          <HandText x={g.x + 12} y={g.y + 16} size={13} anchor="start" color="var(--muted)">
            {g.label}
          </HandText>
        </g>
      ))}
      {edges.map((e) => {
        const pts = edgePath(byId.get(e.from)!, byId.get(e.to)!, e.bend);
        const [mx, my] = midpoint(pts);
        const off = e.labelAt ?? [0, -16];
        return (
          <g key={`${e.from}-${e.to}`}>
            <SketchArrow
              points={pts}
              head={e.head}
              dashed={e.dashed}
              stroke={TONE[e.tone ?? 'default']}
              seed={seedOf(`${e.from}>${e.to}`)}
            />
            {e.label && (
              <HandText x={mx + off[0]} y={my + off[1]} size={14} color="var(--muted)">
                {e.label}
              </HandText>
            )}
          </g>
        );
      })}

      {nodes.map((n) => {
        const { w, h } = size(n);
        const isActive = active.includes(n.id);
        const stroke = isActive ? 'var(--accent)' : TONE[n.tone ?? 'default'];
        const seed = seedOf(n.id);
        const strokeWidth = isActive ? 2.2 : 1.4;
        return (
          <g key={n.id} opacity={n.tone === 'muted' ? 0.45 : 1}>
            <motion.rect
              x={n.x - w / 2 + 3}
              y={n.y - h / 2 + 3}
              width={w - 6}
              height={h - 6}
              rx={n.shape === 'circle' ? w / 2 : 10}
              fill="var(--accent-soft)"
              initial={false}
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
            {n.shape === 'circle' ? (
              <SketchEllipse cx={n.x} cy={n.y} w={w} h={h} seed={seed} stroke={stroke} strokeWidth={strokeWidth} />
            ) : n.shape === 'db' ? (
              <SketchCylinder cx={n.x} cy={n.y} w={w} h={h} seed={seed} stroke={stroke} strokeWidth={strokeWidth} />
            ) : (
              <SketchBox
                cx={n.x}
                cy={n.y}
                w={w}
                h={h}
                seed={seed}
                stroke={stroke}
                strokeWidth={strokeWidth}
                dashed={n.shape === 'dashed'}
              />
            )}
            <HandText x={n.x} y={n.sub ? n.y - 9 : n.y} size={18}>
              {n.label}
            </HandText>
            {n.sub && (
              <HandText x={n.x} y={n.y + 14} size={13} color="var(--muted)">
                {n.sub}
              </HandText>
            )}
            {n.badge !== undefined && <Badge cx={n.x - w / 2 + 4} cy={n.y - h / 2 + 2} n={n.badge} seed={seed + 7} />}
          </g>
        );
      })}

      {notes.map((note, i) => (
        <HandText
          key={i}
          x={note.x}
          y={note.y}
          size={note.size ?? 14}
          anchor={note.anchor ?? 'start'}
          color={note.tone ? TONE[note.tone] : 'var(--muted)'}
        >
          {note.text}
        </HandText>
      ))}

      {packets.map((pk, i) => {
        const a = byId.get(pk.from)!;
        const b = byId.get(pk.to)!;
        const e = edgeFor(pk.from, pk.to);
        const sign = e && e.from === pk.to ? -1 : 1;
        const pts = edgePath(a, b, (e?.bend ?? 0) * sign);
        const color = TONE[pk.tone ?? 'accent'];
        return (
          <motion.g
            key={`${stepKey}-${i}`}
            initial={{ x: pts[0][0], y: pts[0][1], opacity: 0 }}
            animate={{ x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), opacity: [0, 1, 1] }}
            transition={{ duration: travel, ease: 'easeInOut', delay: pk.delay ?? 0 }}
          >
            <circle r={7} fill={color} />
            {pk.label && (
              <text y={-13} textAnchor="middle" fontSize={13} fontWeight={700} fill={color} style={{ fontFamily: 'var(--font-hand)' }}>
                {pk.label}
              </text>
            )}
          </motion.g>
        );
      })}
    </SketchSvg>
  );
}
