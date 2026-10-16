/** Data and arithmetic for the multi-server host widget in lesson A6.6. Server contents are illustrative, not real servers. */

export type ClientFeature = 'roots' | 'sampling' | 'elicitation';

export interface DemoServer {
  id: string;
  name: string;
  transport: 'stdio' | 'Streamable HTTP';
  tools: number;
  resources: boolean;
  prompts: number;
  /** The client feature this server would like to use. */
  wants: ClientFeature;
}

export const SERVERS: DemoServer[] = [
  { id: 'files', name: 'files', transport: 'stdio', tools: 4, resources: true, prompts: 0, wants: 'roots' },
  { id: 'db', name: 'database', transport: 'Streamable HTTP', tools: 3, resources: true, prompts: 0, wants: 'elicitation' },
  { id: 'issues', name: 'issues', transport: 'Streamable HTTP', tools: 6, resources: false, prompts: 2, wants: 'sampling' },
];

/** Assumed tokens per tool definition. Illustrative. */
export const TOKENS_PER_TOOL = 250;

export function summarize(on: Record<string, boolean>) {
  const live = SERVERS.filter((s) => on[s.id]);
  const tools = live.reduce((a, s) => a + s.tools, 0);
  return {
    servers: live.length,
    tools,
    resourceServers: live.filter((s) => s.resources).length,
    prompts: live.reduce((a, s) => a + s.prompts, 0),
    toolTokens: tools * TOKENS_PER_TOOL,
  };
}

/** The spec says both sides may only use capabilities that were negotiated. */
export const usable = (s: DemoServer, caps: Record<ClientFeature, boolean>) => caps[s.wants];
