/** Logic for lesson A10.2 (prompt injection). Pure functions. The tool list and counts are illustrative. */

export interface Tool {
  id: string;
  name: string;
  /** Text sources an outsider can write into, brought in by this tool. */
  sources: number;
  /** Ways data can leave: a request, a message, a write to a public place. */
  exits: number;
  note: string;
}

export const TOOLS: Tool[] = [
  { id: 'calc', name: 'Calculator', sources: 0, exits: 0, note: 'Pure function. No outside text, no way out.' },
  { id: 'files', name: 'Read your own docs', sources: 0, exits: 0, note: 'Text you wrote. No outside author.' },
  { id: 'kb', name: 'Search tickets', sources: 1, exits: 0, note: 'Customers write ticket text.' },
  { id: 'mail', name: 'Read email', sources: 1, exits: 0, note: 'Anyone can send you an email.' },
  { id: 'issues', name: 'Read GitHub issues', sources: 1, exits: 0, note: 'Anyone can open an issue on a public repo.' },
  { id: 'web', name: 'Fetch web page', sources: 1, exits: 1, note: 'Page text comes in. The URL goes out, and a URL can carry data.' },
  { id: 'send', name: 'Send email', sources: 0, exits: 1, note: 'A message to any address.' },
  { id: 'pr', name: 'Create pull request', sources: 0, exits: 1, note: 'A write to a repo that may be public.' },
  { id: 'mcp', name: 'Third-party MCP server', sources: 2, exits: 1, note: 'Its tool descriptions and its results are both outside text. It runs its own network calls.' },
  { id: 'img', name: 'Chat UI loads images', sources: 0, exits: 1, note: 'Not a tool. A rendered image URL is a request to any host.' },
];

export interface Surface {
  sources: number;
  exits: number;
  /** Upper bound: every outside text source paired with every exit. */
  pairs: number;
}

export function surface(on: Record<string, boolean>): Surface {
  let sources = 0;
  let exits = 0;
  for (const t of TOOLS) {
    if (!on[t.id]) continue;
    sources += t.sources;
    exits += t.exits;
  }
  return { sources, exits, pairs: sources * exits };
}

/** How many pairs adding tool `id` would change, given the current set. */
export function deltaIfAdded(on: Record<string, boolean>, id: string): number {
  return surface({ ...on, [id]: true }).pairs - surface(on).pairs;
}

/** Chance of at least one success in n independent attempts at per-attempt rate p. */
export function atLeastOne(p: number, n: number): number {
  return 1 - Math.pow(1 - p, n);
}
