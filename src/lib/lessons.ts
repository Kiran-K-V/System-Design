import { getCollection } from 'astro:content';
import { buildSyllabus } from './syllabus';

export async function loadSyllabus() {
  const entries = await getCollection('lessons');
  const { modules, flat } = buildSyllabus(entries.map((e) => ({ id: e.id, requires: e.data.requires })));
  return { entries, modules, flat };
}
