// Hand-picked outside videos. Every id was checked against YouTube oEmbed (embeddable, right channel).
// Re-check with `node scripts/check-videos.mjs`.
import type { TrackId } from './tracks';
import playlists from '../data/playlists.json';

export interface Video {
  /** YouTube playlist id (series) or video id (talk). */
  yt: string;
  kind: 'series' | 'talk';
  track: TrackId;
  /** 'start' rows show first and are numbered; 'deeper' rows follow. */
  tier: 'start' | 'deeper';
  title: string;
  creator: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  /** Video id for the thumbnail. Playlists use their first video. */
  thumb: string;
  /** One line: why this one, and when to watch it. */
  why: string;
  /** Lesson id this video pairs with. The build fails if the lesson does not exist. */
  pairs: string;
}

export const videos: Video[] = [
  // Backend
  {
    yt: 'PLCRMIe5FDPsd0gVs500xeOewfySTsmEjf',
    kind: 'series',
    track: 'backend',
    tier: 'start',
    title: 'System Design Fundamentals',
    creator: 'ByteByteGo',
    level: 'Beginner',
    thumb: 'lX4CrbXMsNQ',
    why: 'Short animated explainers. Watch one before a lesson to get the picture, then read the lesson for the mechanism.',
    pairs: '00-orientation/design-method',
  },
  {
    yt: 'PLQnljOFTspQUNnO4p00ua_C5mKTfldiYT',
    kind: 'series',
    track: 'backend',
    tier: 'start',
    title: 'Backend Engineering (Beginner)',
    creator: 'Hussein Nasser',
    level: 'Beginner',
    thumb: 'V3ZPPPKEipA',
    why: 'Protocols, proxies and connections, explained from the wire up. Pairs with the networking module.',
    pairs: '02-networking/http-tls',
  },
  {
    yt: 'PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX',
    kind: 'series',
    track: 'backend',
    tier: 'start',
    title: 'System Design Playlist',
    creator: 'Gaurav Sen',
    level: 'Beginner',
    thumb: 'SqcXvc3ZmRU',
    why: 'Whiteboard walk-throughs of classic building blocks. His consistent hashing video is a common first stop.',
    pairs: '04-data/consistent-hashing',
  },
  {
    yt: 'PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB',
    kind: 'series',
    track: 'backend',
    tier: 'deeper',
    title: 'Distributed Systems',
    creator: 'Martin Kleppmann',
    level: 'Intermediate',
    thumb: 'UEAMfLPZZhE',
    why: 'The Cambridge lecture course by the author of DDIA. Clocks, replication and consensus, with free notes.',
    pairs: '04-data/consensus',
  },
  {
    yt: 'PLrw6a1wE39_tb2fErI4-WkMbsvGQk9_UB',
    kind: 'series',
    track: 'backend',
    tier: 'deeper',
    title: 'MIT 6.824 Distributed Systems (Spring 2020)',
    creator: 'MIT',
    level: 'Advanced',
    thumb: 'cQP8WApzIQQ',
    why: 'The gold standard. Paper-by-paper lectures on MapReduce, Raft, Spanner and more. Do the Go labs for full value.',
    pairs: '04-data/replication',
  },
  {
    yt: 'PLSE8ODhjZXjbj8BMuIrRcacnQh20hmY9g',
    kind: 'series',
    track: 'backend',
    tier: 'deeper',
    title: 'Intro to Database Systems (Fall 2023)',
    creator: 'CMU Database Group',
    level: 'Intermediate',
    thumb: 'vdPALZ-GCfI',
    why: 'Andy Pavlo builds a database from the disk up: pages, indexes, joins, transactions and recovery.',
    pairs: '04-data/storage-engines',
  },

  // AI
  {
    yt: 'PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi',
    kind: 'series',
    track: 'ai',
    tier: 'start',
    title: 'Neural Networks',
    creator: '3Blue1Brown',
    level: 'Beginner',
    thumb: 'aircAruvnKk',
    why: 'The best visual intuition for neurons, gradient descent, backprop and transformers. Watch before module A1.',
    pairs: 'ai/a1-model-function/forward-pass',
  },
  {
    yt: 'zjkBMFhNj_g',
    kind: 'talk',
    track: 'ai',
    tier: 'start',
    title: 'Intro to Large Language Models',
    creator: 'Andrej Karpathy',
    level: 'Beginner',
    thumb: 'zjkBMFhNj_g',
    why: 'One hour, no maths. What an LLM is, how it is trained and where it fails. The best first hour on LLMs.',
    pairs: 'ai/a1-model-function/tokens',
  },
  {
    yt: 'PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ',
    kind: 'series',
    track: 'ai',
    tier: 'start',
    title: 'Neural Networks: Zero to Hero',
    creator: 'Andrej Karpathy',
    level: 'Intermediate',
    thumb: 'VMj-3S1tku0',
    why: 'Code a neural net from scratch, then a GPT. Slow and worth it: you will know what every line does.',
    pairs: 'ai/a1-model-function/attention-cost',
  },
  {
    yt: '7xTGNNLPyMI',
    kind: 'talk',
    track: 'ai',
    tier: 'deeper',
    title: 'Deep Dive into LLMs like ChatGPT',
    creator: 'Andrej Karpathy',
    level: 'Beginner',
    thumb: '7xTGNNLPyMI',
    why: 'The long version of the intro talk: pretraining, fine-tuning, RLHF and why models hallucinate.',
    pairs: 'ai/a1-model-function/sampling-decoding',
  },
  {
    yt: 'PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF',
    kind: 'series',
    track: 'ai',
    tier: 'deeper',
    title: 'Machine Learning',
    creator: 'StatQuest',
    level: 'Beginner',
    thumb: 'Gv9_4yMHFhI',
    why: 'One idea per short video, clearly explained. The best way to fill gaps in classic ML before elective E1.',
    pairs: 'ai/e1-classic-ml/problem-framing',
  },
  {
    yt: 'PLfYUBJiXbdtSvpQjSnJJ_PmDQB_VyT5iU',
    kind: 'series',
    track: 'ai',
    tier: 'deeper',
    title: 'Practical Deep Learning for Coders',
    creator: 'fast.ai · Jeremy Howard',
    level: 'Intermediate',
    thumb: '8SF_h3xF3cE',
    why: 'Top-down: you train a working model in lesson 1 and learn the theory as you need it.',
    pairs: 'ai/a1-model-function/embeddings',
  },
  {
    yt: 'PLtBw6njQRU-rwp5__7C0oIVt26ZgjG9NI',
    kind: 'series',
    track: 'ai',
    tier: 'deeper',
    title: 'MIT 6.S191: Introduction to Deep Learning',
    creator: 'MIT · Alexander Amini',
    level: 'Intermediate',
    thumb: 'II4giR4vOOo',
    why: 'A fast university course, refreshed each year. Good for a wide view of deep learning in a few evenings.',
    pairs: 'ai/a1-model-function/scaling-laws',
  },
  {
    yt: 'PLoROMvodv4rNiJRchCzutFw5ItR_Z27CM',
    kind: 'series',
    track: 'ai',
    tier: 'deeper',
    title: 'CS25: Transformers United',
    creator: 'Stanford Online',
    level: 'Advanced',
    thumb: 'P127jhj-8-Y',
    why: 'Guest talks by the researchers who build frontier models. Watch the talks that match your interest.',
    pairs: 'ai/a1-model-function/attention-cost',
  },
  {
    yt: 'PLoROMvodv4rOY23Y0BoGoBGgQ1zmU_MT_',
    kind: 'series',
    track: 'ai',
    tier: 'deeper',
    title: 'CS336: Language Modeling from Scratch (2025)',
    creator: 'Stanford Online',
    level: 'Advanced',
    thumb: 'SQ3fZ1sAqXI',
    why: 'Build and train an LLM end to end: tokenizers, GPUs, parallelism, scaling and alignment. Pairs with the Training at Scale and Inference Systems Deep Dive modules.',
    pairs: 'ai/e2-training/data-parallel-zero',
  },
];

/** Privacy-enhanced embed URL. Autoplays, since the reader already clicked play. */
export const embedUrl = (v: Pick<Video, 'yt' | 'kind'>) =>
  v.kind === 'series'
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${v.yt}&autoplay=1&rel=0`
    : `https://www.youtube-nocookie.com/embed/${v.yt}?autoplay=1&rel=0`;

export const watchUrl = (v: Pick<Video, 'yt' | 'kind'>) =>
  v.kind === 'series' ? `https://www.youtube.com/playlist?list=${v.yt}` : `https://www.youtube.com/watch?v=${v.yt}`;

export const thumbUrl = (v: Pick<Video, 'thumb'>) => `https://i.ytimg.com/vi/${v.thumb}/hqdefault.jpg`;

// Watched state. Client only: call from effects or handlers.

const KEY = 'sd-videos';

export function loadWatched(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function setWatched(yt: string, on: boolean) {
  const all = loadWatched();
  if (on) all.add(yt);
  else all.delete(yt);
  try {
    localStorage.setItem(KEY, JSON.stringify([...all]));
  } catch {}
}

// Series pages: one page per playlist, with the episode list saved by scripts/sync-playlists.mjs.
export interface Episode {
  v: string;
  t: string;
  /** Length as YouTube shows it, e.g. "18:40". */
  d: string;
}

export const series = videos.filter((v) => v.kind === 'series');

export const slugOf = (v: Pick<Video, 'title'>) =>
  v.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const seriesHref = (v: Pick<Video, 'title'>) => `${BASE}/videos/${slugOf(v)}/`;

/** Where a link to a video goes: its series page, or the hub with the talk's player open. */
export const videoHref = (v: Video) => (v.kind === 'series' ? seriesHref(v) : `${BASE}/videos/?play=${v.yt}`);

/** Hub link filtered to one track. */
export const videosHref = (track?: TrackId) => `${BASE}/videos/${track ? `?track=${track}` : ''}`;

export const videosForLesson = (lessonId: string) => videos.filter((v) => v.pairs === lessonId);

export function episodesOf(v: Pick<Video, 'yt' | 'title'>): { total: number; items: Episode[] } {
  const p = (playlists as Record<string, { total: number; items: Episode[] }>)[v.yt];
  if (!p) throw new Error(`playlists.json has no episodes for "${v.title}". Run node scripts/sync-playlists.mjs`);
  return p;
}

/** Sum of "h:mm:ss" / "m:ss" lengths, as "12 h 30 min" or "45 min". */
export function totalLength(items: Episode[]) {
  const s = items.reduce((n, e) => n + e.d.split(':').reduce((a, x) => a * 60 + Number(x), 0), 0);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

// Episode progress per series: watched episode ids and the last one opened. Client only.

const EP_KEY = 'sd-episodes';
/** `at`: when `last` was set, so the hub can resume the most recent series. */
type EpStore = Record<string, { done: string[]; last?: string; at?: number }>;

export function loadEpisodes(): EpStore {
  try {
    return JSON.parse(localStorage.getItem(EP_KEY) ?? '{}') as EpStore;
  } catch {
    return {};
  }
}

export function saveEpisode(pl: string, patch: { done?: [string, boolean]; last?: string }) {
  const all = loadEpisodes();
  const s = (all[pl] ??= { done: [] });
  if (patch.done) {
    const [v, on] = patch.done;
    s.done = on ? [...new Set([...s.done, v])] : s.done.filter((x) => x !== v);
  }
  if (patch.last) {
    s.last = patch.last;
    s.at = Date.now();
  }
  try {
    localStorage.setItem(EP_KEY, JSON.stringify(all));
  } catch {}
}
