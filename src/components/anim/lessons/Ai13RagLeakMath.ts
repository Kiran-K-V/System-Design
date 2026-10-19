/**
 * Leak-window model for lesson A13.3. Pure functions.
 *
 * After an access revoke at time 0, the worst case is the SUM of every stage that still holds the old permission.
 * Sourced inputs: Microsoft Graph driveItem webhook latency (average under 1 minute, maximum 6 hours), Google Drive
 * channel default expiry 3,600 s with no automatic renewal. Every other input is ILLUSTRATIVE and is the learner's own.
 */

export type Kind = 'doc' | 'member-live' | 'member-expanded';
export type Detect = 'poll' | 'webhook';

export interface LeakIn {
  /** doc: a document is unshared from a group. member-live: a user leaves a group, groups resolved per query. member-expanded: groups are expanded into per-user ACL rows at index time. */
  kind: Kind;
  detect: Detect;
  /** Poll interval, minutes. A change made just after a run waits one full interval. */
  pollMin: number;
  /** Webhook: worst delivery latency, minutes. */
  deliverMin: number;
  /** Webhook: minutes a channel is dead between expiry and the renewal plus catch-up. */
  renewGapMin: number;
  /** Documents whose ACL rows must be rewritten (member-expanded only; other kinds touch 1). */
  docs: number;
  chunksPerDoc: number;
  /** ACL rows the index can rewrite per second. */
  ratePerSec: number;
  /** Seconds from write to searchable. */
  commitSec: number;
  /** TTL of the cache that holds a user's group list, seconds. */
  groupTtlSec: number;
  /** TTL of the answer cache, minutes. */
  answerTtlMin: number;
  /** True when a cache hit re-checks the sources of the cached answer. */
  answerRechecks: boolean;
  /** True when top chunks and cached answers are re-checked against the permission service. */
  finalCheck: boolean;
  /** Seconds the permission service itself can lag behind the identity system. */
  recheckLagSec: number;
}

export interface Stage {
  id: string;
  label: string;
  sec: number;
}

export function indexSec(i: LeakIn): number {
  const docs = i.kind === 'member-expanded' ? i.docs : 1;
  return (docs * i.chunksPerDoc) / i.ratePerSec + i.commitSec;
}

export function stages(i: LeakIn): Stage[] {
  if (i.finalCheck) return [{ id: 'recheck', label: 'Permission service lag', sec: i.recheckLagSec }];
  const out: Stage[] = [];
  if (i.kind === 'member-live') {
    out.push({ id: 'group', label: 'Group list cache', sec: i.groupTtlSec });
  } else {
    out.push(
      i.detect === 'poll'
        ? { id: 'detect', label: 'Wait for next poll', sec: i.pollMin * 60 }
        : { id: 'detect', label: 'Webhook delay and renewal gap', sec: (i.deliverMin + i.renewGapMin) * 60 },
    );
    out.push({ id: 'index', label: 'Rewrite ACL rows and commit', sec: indexSec(i) });
  }
  out.push({ id: 'answer', label: 'Answer cache', sec: i.answerRechecks ? 0 : i.answerTtlMin * 60 });
  return out;
}

export const total = (s: Stage[]): number => s.reduce((a, x) => a + x.sec, 0);

export function fmt(sec: number): string {
  if (sec < 1) return '0 s';
  if (sec < 90) return `${Math.round(sec)} s`;
  if (sec < 5400) return `${(sec / 60).toFixed(sec < 600 ? 1 : 0).replace(/\.0$/, '')} min`;
  return `${(sec / 3600).toFixed(1).replace(/\.0$/, '')} h`;
}

export const DEFAULTS: LeakIn = {
  kind: 'doc',
  detect: 'poll',
  pollMin: 15,
  deliverMin: 1,
  renewGapMin: 0,
  docs: 20000,
  chunksPerDoc: 8,
  ratePerSec: 200,
  commitSec: 1,
  groupTtlSec: 300,
  answerTtlMin: 60,
  answerRechecks: false,
  finalCheck: false,
  recheckLagSec: 5,
};

export interface Preset {
  id: string;
  label: string;
  patch: Partial<LeakIn>;
}

export const PRESETS: Preset[] = [
  { id: 'graph-typ', label: 'Graph webhook, typical', patch: { detect: 'webhook', deliverMin: 1, renewGapMin: 0 } },
  { id: 'graph-max', label: 'Graph webhook, maximum', patch: { detect: 'webhook', deliverMin: 360, renewGapMin: 30 } },
  { id: 'drive', label: 'Drive push, 1 h channel', patch: { detect: 'webhook', deliverMin: 5, renewGapMin: 15 } },
  { id: 'poll15', label: '15 min poll', patch: { detect: 'poll', pollMin: 15 } },
  { id: 'nightly', label: 'Nightly poll', patch: { detect: 'poll', pollMin: 1440 } },
];
