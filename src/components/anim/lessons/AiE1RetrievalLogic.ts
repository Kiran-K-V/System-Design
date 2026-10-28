/**
 * Logic for lesson E1.5 (two-tower retrieval and the ranking cascade). Pure functions. All numbers illustrative.
 * The shape (cheap stage on many items, heavy stage on few) follows the YouTube two-stage design:
 * candidate generation winnows millions to hundreds, then ranking scores those with richer features.
 */

export type Part = 'user' | 'item' | 'index' | 'store' | 'ranker' | 'rerank';

export interface Change {
  id: string;
  label: string;
  /** Parts that must run again. Every other part is unchanged. */
  redo: Part[];
  note: string;
}

export const CHANGES: Change[] = [
  {
    id: 'new-item',
    label: 'New item uploaded',
    redo: ['item', 'index'],
    note: 'Run the item tower once on the new item, then insert its vector into the index. The user tower, the ranker and every other item are untouched.',
  },
  {
    id: 'user-action',
    label: 'User watches a video',
    redo: ['user'],
    note: 'The user tower runs again on the new history, at the next request or at the next refresh. Item vectors and the index stay the same.',
  },
  {
    id: 'popularity',
    label: 'Item gets popular today',
    redo: ['store'],
    note: 'A fresh count lands in the feature store. The ranker reads it at request time. No tower runs and the index is unchanged, unless the item tower used this count as an input.',
  },
  {
    id: 'ranker-retrain',
    label: 'Ranker retrained',
    redo: ['ranker'],
    note: 'Only the ranker model is replaced. Candidate generation still returns the same candidates, so the index is not rebuilt.',
  },
  {
    id: 'tower-retrain',
    label: 'Item tower retrained',
    redo: ['item', 'index', 'user'],
    note: 'New weights make a new vector space. All item vectors must be recomputed and the index rebuilt. The user tower must be replaced with it, because both towers must agree on the space. This is the expensive change.',
  },
  {
    id: 'policy',
    label: 'Policy rule changes',
    redo: ['rerank'],
    note: 'A new diversity or safety rule changes only the last stage. No model is retrained.',
  },
];

export function redoes(id: string): Part[] {
  return CHANGES.find((c) => c.id === id)?.redo ?? [];
}

/** Illustrative stage costs for a 100 ms request budget. */
export interface Plan {
  candidates: number;
  /** Milliseconds the ranker spends on one candidate, per lane. */
  perItemMs: number;
  lanes: number;
}

export const FIXED_MS = { network: 10, ann: 15, rerank: 5 };
export const BUDGET_MS = 100;

export function rankerMs(p: Plan): number {
  return Math.round(((p.candidates * p.perItemMs) / p.lanes) * 10) / 10;
}

export function totalMs(p: Plan): number {
  return Math.round((FIXED_MS.network + FIXED_MS.ann + FIXED_MS.rerank + rankerMs(p)) * 10) / 10;
}

/**
 * Share of the truly good items that are inside the candidate set. Illustrative curve:
 * it rises quickly, then flattens, so each extra candidate adds less.
 */
export function recall(candidates: number): number {
  return Math.round((1 - Math.exp(-candidates / 400)) * 1000) / 1000;
}

/** The most candidates the ranker can score inside the budget. */
export function maxCandidates(perItemMs: number, lanes: number): number {
  const room = BUDGET_MS - FIXED_MS.network - FIXED_MS.ann - FIXED_MS.rerank;
  return Math.max(0, Math.floor((room * lanes) / perItemMs));
}
