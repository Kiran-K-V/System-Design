/** Logic for the skills token widget in lesson A6.11. Pure functions, no React. */

/** Metadata (name + description) per skill. The Agent Skills spec says "~100 tokens". */
export const META = 100;
/** Sonnet 5.5 input price, $ per MTok, as of 2026-10-16. Cache read is 0.05x. */
export const PRICE_IN = 2;
export const CACHE_READ = 0.05;

export interface SkillOpts {
  /** Number of installed skills. */
  n: number;
  /** Tokens in each procedure (a SKILL.md body, or the same text pasted in a prompt). */
  body: number;
  /** Skills the request actually uses. */
  used: number;
  /** Extra reference tokens loaded for each used skill. */
  ref: number;
  /** Requests to price. */
  requests: number;
  /** Is the stable prefix served from the prompt cache? */
  cached: boolean;
}

export interface Compare {
  allTokens: number;
  skillTokens: number;
  allCost: number;
  skillCost: number;
}

/** Tokens added per request, and the dollar cost for `requests` requests. Cache writes are ignored. */
export function compare(o: SkillOpts): Compare {
  const allPrefix = o.n * o.body;
  const skillPrefix = o.n * META;
  const skillLoaded = o.used * (o.body + o.ref);
  const rate = (prefix: number, dynamic: number) => ((prefix * (o.cached ? CACHE_READ : 1) + dynamic) * o.requests * PRICE_IN) / 1e6;
  return {
    allTokens: allPrefix,
    skillTokens: skillPrefix + skillLoaded,
    allCost: rate(allPrefix, 0),
    skillCost: rate(skillPrefix, skillLoaded),
  };
}
