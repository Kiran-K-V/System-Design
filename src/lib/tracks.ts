// The one place that knows about tracks: names, parts, accents and every lesson URL.
import { syllabus, type ModuleOutline, type TrackKey } from './syllabus';
import { aiSyllabus } from './ai-syllabus';

export type TrackId = TrackKey;

export interface Part {
  title: string;
  modules: number[];
}

export interface Track {
  id: TrackId;
  name: string;
  short: string;
  tagline: string;
  outline: ModuleOutline[];
  parts: Part[];
  /** '' for backend (4.11), 'A' for ai (A5.1). */
  numberPrefix: string;
  /** Three "you will be able to" lines. Placeholder copy. */
  bullets: string[];
  /** Modules at or below this index are Beginner, then Intermediate up to `intermediateTo`, then Advanced. */
  levels: [number, number];
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export const tracks: Record<TrackId, Track> = {
  backend: {
    id: 'backend',
    name: 'Backend System Design',
    short: 'Backend',
    tagline: 'How real systems stay fast, correct and up, from one machine to planet scale.',
    outline: syllabus,
    numberPrefix: '',
    parts: [
      { title: 'Foundations', modules: [0, 1, 2] },
      { title: 'Building blocks', modules: [3, 4, 5] },
      { title: 'Distributed systems', modules: [6, 7, 8] },
      { title: 'Patterns and advanced', modules: [9, 10] },
      { title: 'Practice', modules: [11, 12] },
    ],
    bullets: [
      'Size a system on the back of an envelope.',
      'Pick the database and say why.',
      'Survive a failure you did not plan for.',
    ],
    levels: [1, 5],
  },
  ai: {
    id: 'ai',
    name: 'AI System Design',
    short: 'AI',
    tagline: 'How models are trained, served, grounded and kept safe in production.',
    outline: aiSyllabus,
    numberPrefix: 'A',
    parts: [
      { title: 'Foundations', modules: [0, 1, 2] },
      { title: 'Models and training', modules: [3, 4] },
      { title: 'Serving and retrieval', modules: [5, 6] },
      { title: 'Applications and agents', modules: [7, 8] },
      { title: 'Running it in production', modules: [9, 10, 11] },
      { title: 'Frontier and practice', modules: [12, 13, 14] },
    ],
    bullets: [
      'Work out GPU memory and cost per request.',
      'Build retrieval that finds the right page.',
      'Ship an agent you can evaluate and trust.',
    ],
    levels: [2, 8],
  },
};

export const trackIds: TrackId[] = ['backend', 'ai'];

export const trackOf = (id: string): TrackId => (id.startsWith('ai/') ? 'ai' : 'backend');

/** Reader-facing difficulty from the module position inside its track. */
export function levelOf(track: TrackId, moduleIndex: number): 'Beginner' | 'Intermediate' | 'Advanced' {
  const [a, b] = tracks[track].levels;
  return moduleIndex <= a ? 'Beginner' : moduleIndex <= b ? 'Intermediate' : 'Advanced';
}

/** URL of a track home. */
export const trackHref = (track: TrackId) => `${BASE}/learn/${track}/`;

/** URL of a lesson page. The only place that builds one. AI ids lose their `ai/` prefix in the URL. */
export function lessonHref(id: string): string {
  return trackOf(id) === 'ai' ? `${BASE}/learn/ai/${id.slice(3)}/` : `${BASE}/learn/backend/${id}/`;
}
