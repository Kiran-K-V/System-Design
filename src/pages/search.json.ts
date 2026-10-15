import { loadSyllabus } from '../lib/lessons';
import { lessonHref } from '../lib/tracks';

/** Search index for the Ctrl+K palette: one row per lesson in both tracks. Lessons without a page are marked `soon`. */
export async function GET() {
  const { entries, flat } = await loadSyllabus();
  const summary = new Map(entries.map((e) => [e.id, e.data.summary]));
  const rows = flat.map((l) => ({
    id: l.id,
    title: l.title,
    number: l.number,
    module: l.moduleTitle,
    summary: summary.get(l.id) ?? '',
    track: l.track,
    soon: !l.written,
    href: l.written ? lessonHref(l.id) : '',
  }));
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
}
