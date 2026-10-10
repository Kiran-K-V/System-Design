/** Pure model of a Redis sorted set, enough for a leaderboard. Same ordering rules as ZADD and ZRANGE ... REV. */

export type Zset = Record<string, number>;

/** ZADD key score member: add the member, or move it when it exists. */
export function zadd(z: Zset, member: string, score: number): Zset {
  return { ...z, [member]: score };
}

/** ZINCRBY key delta member: a missing member starts at 0. */
export function zincrby(z: Zset, member: string, delta: number): Zset {
  return { ...z, [member]: (z[member] ?? 0) + delta };
}

/** Binary byte order, like Redis. Plain code-unit comparison is the same for ASCII. */
const lex = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Members from the highest score down. Score ties go in reverse lexicographic order (ZRANGE ... REV). */
export function ranked(z: Zset): { member: string; score: number }[] {
  return Object.entries(z)
    .map(([member, score]) => ({ member, score }))
    .sort((a, b) => b.score - a.score || lex(b.member, a.member));
}

/** ZRANGE key 0 n-1 REV WITHSCORES */
export function top(z: Zset, n: number) {
  return ranked(z).slice(0, n);
}

/** ZREVRANK: zero-based position from the top, or null when the member is missing. */
export function revRank(z: Zset, member: string): number | null {
  const i = ranked(z).findIndex((r) => r.member === member);
  return i < 0 ? null : i;
}
