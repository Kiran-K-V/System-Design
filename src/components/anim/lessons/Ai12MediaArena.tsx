import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { fitBT, mulberry32, seLogit, winProb, type Vote } from './Ai12MediaMath';

const NAMES = ['Model A', 'Model B', 'Model C'];
/** Hidden strengths of the simulated crowd. Illustrative. */
const TRUTH = [0.3, 0, -0.3];
const PAIRS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
];

/** Pairwise vote UI feeding a Bradley-Terry leaderboard. */
export default function Ai12MediaArena() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const k = votes.length;
  const [a, b] = PAIRS[k % 3];
  const flip = Math.floor(k / 3) % 2 === 1;
  const left = flip ? b : a;
  const right = flip ? a : b;

  const cast = (w: number, l: number) => setVotes((v) => [...v, { w, l }]);
  const crowd = (count: number) =>
    setVotes((v) => {
      const out = [...v];
      const rng = mulberry32(1000 + v.length);
      for (let i = 0; i < count; i++) {
        const [x, y] = PAIRS[out.length % 3];
        out.push(rng() < winProb(TRUTH[x], TRUTH[y]) ? { w: x, l: y } : { w: y, l: x });
      }
      return out;
    });

  const strength = fitBT(3, votes);
  const order = [0, 1, 2].sort((i, j) => strength[j] - strength[i]);
  const wins = [0, 0, 0];
  const games = [0, 0, 0];
  for (const v of votes) {
    wins[v.w]++;
    games[v.w]++;
    games[v.l]++;
  }

  const top = order[0];
  const second = order[1];
  const nPair = votes.filter((v) => (v.w === top && v.l === second) || (v.w === second && v.l === top)).length;
  const pHat = nPair > 0 ? votes.filter((v) => v.w === top && v.l === second).length / nPair : 0.5;
  const pc = Math.min(0.95, Math.max(0.05, pHat));
  const gap = strength[top] - strength[second];
  const half = nPair > 0 ? 1.96 * seLogit(nPair, pc) : Infinity;
  const separated = nPair > 0 && gap - half > 0;

  return (
    <CacheWidgetFrame title="Pairwise votes feed a leaderboard" hint="Illustrative models and crowd">
      <p className="mb-2 text-sm text-muted">Which output is better? Click a card, or let a simulated crowd vote. The crowd has hidden strengths A 0.3, B 0, C -0.3.</p>
      <div className="mb-3 grid grid-cols-2 gap-3">
        {[left, right].map((m, i) => (
          <button
            key={i}
            type="button"
            onClick={() => cast(m, m === left ? right : left)}
            className="rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-accent"
          >
            <span className="block text-xs uppercase tracking-wide text-muted">{i === 0 ? 'Left' : 'Right'} (name hidden until you vote)</span>
            <span className="mt-1 block text-sm">Image from an anonymous model</span>
            <span className="mt-2 block font-mono text-xs text-muted">{votes.length > 0 ? `last winner: ${NAMES[votes[votes.length - 1].w]}` : 'pick one'}</span>
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => crowd(10)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent">+10 crowd votes</button>
        <button type="button" onClick={() => crowd(100)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent">+100 crowd votes</button>
        <button type="button" onClick={() => setVotes([])} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-accent">Reset</button>
      </div>
      <div className="overflow-x-auto" aria-live="polite">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-1 pr-3">Rank</th>
              <th className="py-1 pr-3">Model</th>
              <th className="py-1 pr-3">Votes</th>
              <th className="py-1 pr-3">Win rate</th>
              <th className="py-1">Strength</th>
            </tr>
          </thead>
          <tbody>
            {order.map((m, r) => (
              <tr key={m} className="border-t border-line">
                <td className="py-1.5 pr-3 font-mono">{r + 1}</td>
                <td className="py-1.5 pr-3">{NAMES[m]}</td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">{games[m]}</td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">{games[m] ? `${Math.round((wins[m] / games[m]) * 100)}%` : '-'}</td>
                <td className="py-1.5 font-mono tabular-nums">{strength[m].toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm" style={{ color: separated ? 'var(--ok)' : 'var(--warn)' }}>
        {nPair === 0
          ? 'No votes yet.'
          : `${NAMES[top]} leads ${NAMES[second]} by ${gap.toFixed(2)} on the strength scale, 95% error bar about plus or minus ${Number.isFinite(half) ? half.toFixed(2) : 'wide'} from ${nPair} votes on that pair. ${separated ? 'Rank 1 and 2 are separated.' : 'Not separated yet: the order could flip with more votes.'}`}
      </p>
      <p className="mt-2 text-sm text-muted">
        Model: Bradley-Terry strengths fitted from all votes, with half a vote of prior per pair so a model with no losses stays finite. Error bar: 1.96 x sqrt(1 / (n x p x (1 - p))) on the pair's win rate. Pairs rotate A-B, A-C, B-C.
      </p>
    </CacheWidgetFrame>
  );
}
