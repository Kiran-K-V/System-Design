import { loadSyllabus } from '../lib/lessons';
import { questionId, type Question } from '../lib/questionId';

const raw = import.meta.glob<string>('/src/content/lessons/**/*.mdx', { query: '?raw', import: 'default', eager: true });

/** Index of the `[` that starts the questions array, and the index just past its matching `]`. */
function arrayEnd(src: string, start: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '[') depth++;
    else if (c === ']' && --depth === 0) return i + 1;
  }
  throw new Error('Unclosed questions array');
}

/** Pull every `questions={[...]}` literal out of an MDX body. Content is our own, so evaluating it is safe. */
function extract(src: string): Question[] {
  const out: Question[] = [];
  for (const m of src.matchAll(/questions=\{\s*\[/g)) {
    const start = m.index! + m[0].length - 1;
    out.push(...(new Function(`return ${src.slice(start, arrayEnd(src, start))}`)() as Question[]));
  }
  return out;
}

/** Question index for the /review page: one row per Quiz question across all lessons. */
export async function GET() {
  const { flat } = await loadSyllabus();
  const rows: unknown[] = [];
  const seen = new Set<string>();
  for (const [path, src] of Object.entries(raw)) {
    const lesson = path.replace('/src/content/lessons/', '').replace(/\.mdx$/, '');
    const meta = flat.find((l) => l.id === lesson);
    for (const q of extract(src)) {
      const id = questionId(q);
      if (seen.has(id)) throw new Error(`Duplicate question id "${id}" in ${lesson}`);
      seen.add(id);
      rows.push({ id, lesson, lessonTitle: meta?.title ?? lesson, number: meta?.number ?? '', q: q.q, options: q.options, answer: q.answer, explain: q.explain });
    }
  }
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
}
