/** Logic for lesson A10.3 (lethal trifecta). Pure functions, no React. The tools and their leg assignments are illustrative design choices, not a standard. */

/** A: untrusted content. B: private data. C: external communication or state change. */
export type Leg = 'A' | 'B' | 'C';

export const LEGS: Leg[] = ['A', 'B', 'C'];

export const LEG_NAME: Record<Leg, string> = {
  A: 'Untrusted content',
  B: 'Private data',
  C: 'External communication',
};

export interface Tool {
  id: string;
  label: string;
  /** Legs this tool gives the agent. */
  legs: Leg[];
  why: string;
  /** A hardened variant with fewer legs. */
  hardened?: { label: string; legs: Leg[]; why: string };
}

export const TOOLS: Tool[] = [
  {
    id: 'read_inbox',
    label: 'Read the inbox',
    legs: ['A', 'B'],
    why: 'The inbox holds private mail (B). Anyone can send mail into it, so it also holds attacker text (A).',
    hardened: { label: 'Read mail from trusted senders only', legs: ['B'], why: 'Only senders on an allowlist reach the model, so attacker text no longer arrives.' },
  },
  {
    id: 'search_web',
    label: 'Search the web',
    legs: ['A'],
    why: 'Any page in the results can be written by an attacker (A).',
  },
  {
    id: 'read_wiki',
    label: 'Read the internal wiki',
    legs: ['B'],
    why: 'Internal pages are private data (B). Only staff write them, so they are not untrusted here.',
  },
  {
    id: 'send_email',
    label: 'Send email',
    legs: ['C'],
    why: 'Mail leaves the company (C). The recipient and body come from the model.',
    hardened: { label: 'Save a draft; a person presses send', legs: [], why: 'A person reviews each message before it leaves, so the agent has no send path of its own.' },
  },
  {
    id: 'render_images',
    label: 'Render images and links in replies',
    legs: ['C'],
    why: 'The chat client fetches an image URL by itself. Data placed in that URL reaches the attacker (C).',
    hardened: { label: 'Render only images from our own host', legs: [], why: 'A URL on another host is shown as text and is not fetched.' },
  },
  {
    id: 'fetch_url',
    label: 'Fetch any URL',
    legs: ['A', 'C'],
    why: 'The page text can be hostile (A). The request itself can carry data in the URL (C).',
    hardened: { label: 'Fetch allowlisted hosts, no query strings', legs: ['A'], why: 'Page text can still be hostile (A). Allowlisted hosts and no query strings narrow the channel. They do not prove it closed.' },
  },
  {
    id: 'post_slack',
    label: 'Post to a Slack channel',
    legs: ['C'],
    why: 'A post is visible to other people, and a public channel is outside the company boundary (C).',
  },
];

export type Selection = Record<string, 'off' | 'on' | 'hardened'>;

export interface Verdict {
  present: Leg[];
  /** Tool labels that supply each leg. */
  by: Record<Leg, string[]>;
  trifecta: boolean;
  /** Meta's Rule of Two counts properties per session. */
  rule: 'all-three' | 'two' | 'one-or-none';
  /** How many tools must change to cut each leg. */
  cutCost: Record<Leg, number>;
}

function legsOf(t: Tool, mode: 'on' | 'hardened'): Leg[] {
  return mode === 'hardened' && t.hardened ? t.hardened.legs : t.legs;
}

export function assess(sel: Selection): Verdict {
  const by: Record<Leg, string[]> = { A: [], B: [], C: [] };
  for (const t of TOOLS) {
    const mode = sel[t.id] ?? 'off';
    if (mode === 'off') continue;
    for (const leg of legsOf(t, mode)) by[leg].push(t.label);
  }
  const present = LEGS.filter((l) => by[l].length > 0);
  const cutCost = { A: by.A.length, B: by.B.length, C: by.C.length };
  return {
    present,
    by,
    trifecta: present.length === 3,
    rule: present.length === 3 ? 'all-three' : present.length === 2 ? 'two' : 'one-or-none',
    cutCost,
  };
}

/** Eight combinations of three properties. Only the full set is forbidden in one session. */
export function allowedCombos(): { allowed: number; total: number } {
  const total = 2 ** 3;
  return { total, allowed: total - 1 };
}
