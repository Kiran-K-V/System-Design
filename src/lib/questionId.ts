export interface Question {
  /** Stable slug. Never positional, so reordering a quiz does not reset review history. */
  id?: string;
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

/** Fallback for questions with no explicit id: hash of the question text. */
export function questionId(q: Pick<Question, 'id' | 'q'>): string {
  if (q.id) return q.id;
  let h = 2166136261;
  for (let i = 0; i < q.q.length; i++) h = Math.imul(h ^ q.q.charCodeAt(i), 16777619);
  return `q-${(h >>> 0).toString(36)}`;
}
