import { getCollection } from 'astro:content';
import { buildSyllabus, checkSyllabus, type SyllabusLesson, type SyllabusModule } from './syllabus';
import { tracks, type TrackId } from './tracks';

export interface TrackSyllabus {
  modules: SyllabusModule[];
  flat: SyllabusLesson[];
}

export async function loadSyllabus() {
  const entries = await getCollection('lessons');
  const written = entries.map((e) => ({ id: e.id, requires: e.data.requires }));
  const backend = buildSyllabus(tracks.backend.outline, written, tracks.backend.numberPrefix, 'backend', 0);
  const ai = buildSyllabus(tracks.ai.outline, written, tracks.ai.numberPrefix, 'ai', backend.flat.length);
  const flat = [...backend.flat, ...ai.flat];
  checkSyllabus(flat, written);
  const byTrack: Record<TrackId, TrackSyllabus> = { backend, ai };
  return { tracks: byTrack, flat, entries };
}
