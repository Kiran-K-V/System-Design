/** Pure maths for lesson E2.4: pipeline timeline and layout checks. */

export interface Cell {
  stage: number;
  micro: number;
  kind: 'f' | 'b';
  start: number;
  len: number;
}

/**
 * All-forward-then-all-backward pipeline (GPipe style), p stages, m micro-batches.
 * Illustrative time units: a forward step takes 1, a backward step takes 2.
 */
export function pipelineCells(p: number, m: number): { cells: Cell[]; total: number; busy: number } {
  const cells: Cell[] = [];
  const fEnd = m + p - 1;
  for (let s = 0; s < p; s++) {
    for (let i = 0; i < m; i++) {
      cells.push({ stage: s, micro: i, kind: 'f', start: s + i, len: 1 });
      cells.push({ stage: s, micro: i, kind: 'b', start: fEnd + 2 * i + 2 * (p - 1 - s), len: 2 });
    }
  }
  const total = fEnd + 2 * (m + p - 1);
  const busy = cells.reduce((a, c) => a + c.len, 0);
  return { cells, total, busy };
}

/** Idle share of the whole step across all stages: 1 - busy / (p * total). */
export function idleShare(p: number, m: number): number {
  const { total, busy } = pipelineCells(p, m);
  return 1 - busy / (p * total);
}

/** Bubble time relative to ideal time, the form in the Megatron paper: (p - 1) / m. */
export function bubbleOverIdeal(p: number, m: number): number {
  return (p - 1) / m;
}

export interface Layout {
  tp: number;
  cp: number;
  pp: number;
  dp: number;
}

export interface LayoutReport {
  gpus: number;
  nodes: number;
  tpInNode: boolean;
  note: string;
}

export function checkLayout(l: Layout, gpusPerNode: number): LayoutReport {
  const gpus = l.tp * l.cp * l.pp * l.dp;
  const nodes = Math.ceil(gpus / gpusPerNode);
  const tpInNode = l.tp <= gpusPerNode && gpusPerNode % l.tp === 0;
  const note = tpInNode
    ? 'Every tensor group fits in one node, so its all-reduce runs on the fast link.'
    : 'A tensor group spans more than one node, so its all-reduce runs on the slow link at every layer.';
  return { gpus, nodes, tpInNode, note };
}
