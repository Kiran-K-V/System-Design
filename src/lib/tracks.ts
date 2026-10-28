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
  /** Not needed for the core path. The track home shows an "optional" tag and a muted line. */
  optional?: boolean;
}

export interface Track {
  id: TrackId;
  name: string;
  short: string;
  tagline: string;
  outline: ModuleOutline[];
  parts: Part[];
  /** '' for backend (4.11), 'A' for ai (A5.1). A module `label` overrides it (E1.3). */
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
    tagline: 'How to build with models: APIs, context, retrieval, agents, evals and safety, in production.',
    outline: aiSyllabus,
    numberPrefix: 'A',
    parts: [
      { title: 'Foundations', modules: [0, 1, 2],
        can: ['Explain what a model does from tokens to output.', 'Say why it hallucinates and what the context window costs.', 'Estimate GPU memory, latency and cost for a model call on paper.'],
        next: 'Call models from your code, and give them the right context.' },
      { title: 'Building with models', modules: [3, 4, 5],
        can: ['Wire an LLM API with streaming, structured output, tools, retries and cost metering.', 'Budget the context window and lay out a cache-friendly prompt.', 'Build retrieval that finds the right chunk, with permissions.'],
        next: 'Let the model act: loops, tools and graphs.' },
      { title: 'Agents', modules: [6, 7],
        can: ['Draw an agent as a graph with state, tools and an exit rule.', 'Stop a runaway loop with budgets, and resume a run after a crash.', 'Add approvals, sandboxes and per-user auth to an agent.'],
        next: 'Prove it works, and keep it working.' },
      { title: 'Quality and trust', modules: [8, 9, 10],
        can: ['Build an eval set and grade agent trajectories.', 'Trace, cost and roll back a model or prompt change.', 'Threat-model prompt injection and lock down tools.'],
        next: 'Tune the model, and add media and voice.' },
      { title: 'Customization and media', modules: [11, 12],
        can: ['Choose between prompting, RAG and fine-tuning.', 'Explain SFT, LoRA, preference tuning and reinforcement fine-tuning.', 'Budget latency for a voice or image pipeline.'],
        next: 'Full designs end to end.' },
      { title: 'Practice', modules: [13, 14],
        can: ['Drive a full agent design from goal to evals.', 'Price and budget a case with live numbers.', 'Compare your design with how real teams built it.'],
        next: 'Sharpen the daily skills that make you fast.' },
      { title: 'Craft', modules: [15],
        can: ['Drive coding agents with plans, specs and verify loops.', 'Tune prompts against an eval set, and move to a new model safely.', 'Debug a bad output, and read a benchmark with doubt.'],
        next: 'Ship something small and measure it. That is the real test.' },
      { title: 'Electives', modules: [16, 17, 18], optional: true,
        can: ['Design a feature store, a ranking cascade and a fraud scorer.', 'Plan a training run across many GPUs.', 'Explain PagedAttention, speculative decoding and prefill/decode splits.'],
        next: 'Go deeper in the area your role needs.' },
    ],
    bullets: [
      'Call a model from your code, and price each request.',
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
