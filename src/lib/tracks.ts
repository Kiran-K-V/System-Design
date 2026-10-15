// The one place that knows about tracks: names, parts, accents and every lesson URL.
import { syllabus, type ModuleOutline, type TrackKey } from './syllabus';
import { aiSyllabus } from './ai-syllabus';

export type TrackId = TrackKey;

export interface Part {
  title: string;
  modules: number[];
  /** Checkpoint note after the part: three skills the reader can test on themselves. */
  can: string[];
  /** The gap the next part fills. On the last part, what to do after the track. */
  next: string;
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
      { title: 'Foundations', modules: [0, 1, 2],
        can: ['Trace a request from DNS to the server and back.', 'Estimate QPS, storage and bandwidth on paper.', 'Pick TCP, UDP, WebSockets or gRPC and say why.'],
        next: 'Where the data lives, and how an API exposes it.' },
      { title: 'Building blocks', modules: [3, 4, 5],
        can: ['Design a clean API with safe retries.', 'Choose a database, index and shard key, and defend it.', 'Put a cache in front of it without serving stale data by accident.'],
        next: 'What happens when the parts talk to each other, and fail.' },
      { title: 'Distributed systems', modules: [6, 7, 8],
        can: ['Move slow work onto a queue and keep delivery correct.', 'Survive timeouts, retries and overload without a cascade.', 'Name the right tool (Kafka, Redis, Cassandra) for each job.'],
        next: 'Repeatable answers for hard, recurring problems.' },
      { title: 'Patterns and advanced', modules: [9, 10],
        can: ['Scale reads and writes past one database.', 'Handle contention, large files and long jobs.', 'Reach for geo, time-series or vector stores when they fit.'],
        next: 'Put it all together under a clock.' },
      { title: 'Practice', modules: [11, 12],
        can: ['Drive a full design from requirements to deep dives.', 'Trade off cost, latency and consistency out loud.', 'Compare your design with how real companies built it.'],
        next: 'Teach a design to someone else. That is the real test.' },
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
      { title: 'Foundations', modules: [0, 1, 2],
        can: ['Explain what a model does from tokens to output.', 'Say why it hallucinates and what the context window costs.', 'Estimate GPU memory and cost for a model on paper.'],
        next: 'How models are built, trained and tuned.' },
      { title: 'Models and training', modules: [3, 4],
        can: ['Turn a business goal into an ML objective and metrics.', 'Plan a training run across many GPUs.', 'Choose between prompting, RAG and fine-tuning.'],
        next: 'Serve the model fast and give it the right facts.' },
      { title: 'Serving and retrieval', modules: [5, 6],
        can: ['Explain the KV cache, batching and where latency goes.', 'Pick quantization or speculative decoding for a latency goal.', 'Build retrieval that finds the right chunk, with permissions.'],
        next: 'Turn the model into a product people use.' },
      { title: 'Applications and agents', modules: [7, 8],
        can: ['Get structured output and safe tool calls from a model.', 'Add caching, routing and fallbacks across providers.', 'Design an agent loop that you can stop, resume and audit.'],
        next: 'Prove it works, and keep it working.' },
      { title: 'Running it in production', modules: [9, 10, 11],
        can: ['Build an eval set and catch a regression before users do.', 'Trace, cost and roll back a model or prompt change.', 'Threat-model prompt injection and lock down tools.'],
        next: 'Media models, and full designs end to end.' },
      { title: 'Frontier and practice', modules: [12, 13, 14],
        can: ['Budget latency for a voice or image pipeline.', 'Drive a full AI design from goal to evals.', 'Compare your design with how real teams built it.'],
        next: 'Ship something small and measure it. That is the real test.' },
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
