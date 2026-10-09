import { loadSyllabus } from '../lib/lessons';

/** Search index for the Ctrl+K palette: one row per written lesson. */
export async function GET() {
  const { entries, flat } = await loadSyllabus();
  const rows = entries.map((e) => {
    const l = flat.find((x) => x.id === e.id)!;
    return { id: e.id, title: l.title, number: l.number, module: l.moduleTitle, summary: e.data.summary };
  });
  rows.sort((a, b) => flat.findIndex((x) => x.id === a.id) - flat.findIndex((x) => x.id === b.id));
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
}
