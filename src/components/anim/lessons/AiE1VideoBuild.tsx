import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** Video recommendation feed: the high-level design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'viewer', x: 90, y: 70, w: 120, label: 'Viewer', step: 0 },
  { id: 'feed', x: 250, y: 70, w: 130, label: 'Feed API', sub: 'one call per feed', step: 0 },
  { id: 'cand', x: 410, y: 70, w: 130, label: 'Candidates', sub: 'two-tower', step: 1 },
  { id: 'ann', x: 590, y: 70, w: 130, h: 80, label: 'ANN index', sub: 'video vectors', shape: 'db', step: 1 },
  { id: 'emb', x: 590, y: 200, w: 130, label: 'Embedding job', sub: 'daily batch', step: 2 },
  { id: 'rank', x: 410, y: 200, w: 130, label: 'Ranker', sub: 'several goals', step: 3 },
  { id: 'feat', x: 590, y: 330, w: 130, h: 80, label: 'Feature store', sub: 'user, video', shape: 'db', step: 3 },
  { id: 'rerank', x: 250, y: 200, w: 130, label: 'Re-rank', sub: 'policy, diversity', step: 4 },
  { id: 'explore', x: 90, y: 200, w: 120, label: 'Explore slot', sub: 'new videos', step: 5 },
  { id: 'log', x: 250, y: 330, w: 130, h: 80, label: 'Impression log', sub: 'with propensity', shape: 'db', step: 6 },
  { id: 'hold', x: 90, y: 330, w: 120, label: 'Holdout', sub: 'long-term', step: 7 },
];

const edges: BuildEdge[] = [
  { from: 'viewer', to: 'feed', head: 'both', step: 0 },
  { from: 'feed', to: 'cand', step: 1 },
  { from: 'cand', to: 'ann', step: 1 },
  { from: 'emb', to: 'ann', label: 'refresh', labelAt: [38, 0], step: 2 },
  { from: 'cand', to: 'rank', step: 3 },
  { from: 'rank', to: 'feat', step: 3 },
  { from: 'rank', to: 'rerank', step: 4 },
  { from: 'rerank', to: 'feed', step: 4 },
  { from: 'explore', to: 'rerank', step: 5 },
  { from: 'rerank', to: 'log', step: 6 },
  { from: 'log', to: 'hold', label: 'compare', labelAt: [0, -16], step: 7 },
];

const steps: BuildStep[] = [
  { req: 'FR1: show a feed', caption: 'The viewer opens the app. The app makes one feed call. The feed service must answer with about twenty videos while the viewer waits, so every later box has a time budget.', packets: [{ from: 'viewer', to: 'feed', label: 'open' }] },
  { req: 'FR1: pick from millions', caption: 'We cannot score millions of videos per request. The candidate stage turns the viewer into a vector and asks an ANN index (approximate nearest neighbor search, lesson E1.5) for the closest few hundred videos.', packets: [{ from: 'feed', to: 'cand', label: 'viewer' }, { from: 'cand', to: 'ann', label: 'vector', delay: 0.9 }] },
  { req: 'NFR: fresh enough', caption: 'A daily batch job rebuilds the viewer vectors and the video vectors, then loads them into the index. Between runs the vectors age. Deep dive 1 shows what that costs.', packets: [{ from: 'emb', to: 'ann', label: 'new vectors' }] },
  { req: 'FR2: rank for satisfaction', caption: 'The ranker is a heavier model. It scores each candidate against several goals: expected watch time, a satisfaction signal, and long-term return. It reads user and video features from the feature store.', packets: [{ from: 'cand', to: 'rank', label: '~500' }, { from: 'rank', to: 'feat', label: 'read', delay: 0.9 }] },
  { req: 'FR3: diverse and safe', caption: 'The re-rank step applies rules the scores cannot hold: remove banned videos, cap one creator, and mix topics. It sends the final list to the feed service.', packets: [{ from: 'rank', to: 'rerank', label: 'scores' }, { from: 'rerank', to: 'feed', label: '~20', delay: 0.9 }] },
  { req: 'FR4: new videos get a chance', caption: 'A small share of slots goes to videos the system has little data on. Without this, a new video never gets the views it needs to prove itself. Deep dive 2 sets the size of that share.', packets: [{ from: 'explore', to: 'rerank', label: 'new' }] },
  { req: 'NFR: learn without fooling ourselves', caption: 'Every shown list is logged with the position, the scores, and the chance each video had of being shown (the propensity). Training and evaluation read this log. Deep dive 3 explains why it is biased.', packets: [{ from: 'rerank', to: 'log', label: 'what we showed' }] },
  { req: 'NFR: long-term bar', caption: 'A small group of viewers stays on an old, frozen version for months. Comparing them with everyone else shows effects that a two-week test cannot see. The 28-day retention bar is measured here.', packets: [{ from: 'log', to: 'hold', label: 'compare' }] },
];

export default function AiE1VideoBuild() {
  return <DesignBuild title="Video recommendation feed, built up" steps={steps} nodes={nodes} edges={edges} height={400} label="Video recommendation architecture growing from feed API to long-term holdout" />;
}
