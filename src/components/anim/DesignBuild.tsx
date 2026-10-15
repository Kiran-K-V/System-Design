import { useState } from 'react';
import AnimFrame from './AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowGroup, type FlowNode, type FlowNote, type FlowPacket } from './FlowDiagram';
import { Seg } from './lessons/CacheWidgetFrame';

/** A node or edge that appears at `step` and stays for every later step. */
export type BuildNode = FlowNode & { step: number };
export type BuildEdge = FlowEdge & { step: number };
export type BuildGroup = FlowGroup & { step: number };

export interface BuildStep {
  caption: string;
  /** The requirement this step satisfies, shown top-left, e.g. "FR1: shorten a URL". */
  req?: string;
  packets?: FlowPacket[];
  /** Node ids to highlight. Defaults to the nodes added in this step. */
  active?: string[];
}

interface BuildProps {
  title: string;
  steps: BuildStep[];
  nodes: BuildNode[];
  edges?: BuildEdge[];
  groups?: BuildGroup[];
  width?: number;
  height: number;
  label: string;
  interval?: number;
}

/**
 * Case-study high-level design that grows one requirement at a time.
 * New nodes are highlighted, new edges drawn in the accent color.
 */
export default function DesignBuild({ title, steps, nodes, edges = [], groups = [], width = 720, height, label, interval = 3400 }: BuildProps) {
  return (
    <AnimFrame title={title} steps={steps} interval={interval}>
      {(i, s) => {
        const shownNodes = nodes.filter((n) => n.step <= i);
        const shownEdges: FlowEdge[] = edges
          .filter((e) => e.step <= i)
          .map((e) => (e.step === i && !e.tone ? { ...e, tone: 'accent' as const } : e));
        const notes: FlowNote[] = s.req ? [{ x: 24, y: 22, text: s.req, size: 16, tone: 'accent' }] : [];
        return (
          <FlowDiagram
            width={width}
            height={height}
            nodes={shownNodes}
            edges={shownEdges}
            groups={groups.filter((g) => g.step <= i)}
            notes={notes}
            active={s.active ?? shownNodes.filter((n) => n.step === i).map((n) => n.id)}
            packets={s.packets}
            stepKey={i}
            label={label}
          />
        );
      }}
    </AnimFrame>
  );
}

export interface CompareVariant {
  id: string;
  /** Button text, e.g. "Naive: one counter row". */
  label: string;
  nodes: FlowNode[];
  edges?: FlowEdge[];
  groups?: FlowGroup[];
  notes?: FlowNote[];
  steps: { caption: string; packets?: FlowPacket[]; active?: string[]; notes?: FlowNote[]; tones?: Record<string, FlowNode['tone']> }[];
}

interface CompareProps {
  title: string;
  /** Text before the toggle, e.g. "Design:". */
  prompt: string;
  variants: CompareVariant[];
  width?: number;
  height: number;
  label: string;
  interval?: number;
}

/** Deep dive: the same problem under a naive and an improved design, switched with a toggle. */
export function DesignCompare({ title, prompt, variants, width = 720, height, label, interval = 3400 }: CompareProps) {
  const [id, setId] = useState(variants[0].id);
  const v = variants.find((x) => x.id === id) ?? variants[0];
  return (
    <div>
      <div className="not-prose mt-8 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted">{prompt}</span>
        <Seg label={prompt} value={id} onChange={setId} options={variants.map((x) => ({ id: x.id, label: x.label }))} />
      </div>
      <AnimFrame key={v.id} title={`${title}: ${v.label}`} steps={v.steps} interval={interval}>
        {(i, s) => (
          <FlowDiagram
            width={width}
            height={height}
            nodes={s.tones ? v.nodes.map((n) => (s.tones![n.id] ? { ...n, tone: s.tones![n.id] } : n)) : v.nodes}
            edges={v.edges}
            groups={v.groups}
            notes={[...(v.notes ?? []), ...(s.notes ?? [])]}
            active={s.active}
            packets={s.packets}
            stepKey={`${v.id}-${i}`}
            label={label}
          />
        )}
      </AnimFrame>
    </div>
  );
}
