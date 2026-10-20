/** The seven shared layers of the tenant-isolation map in lesson A13.9, each with its leak path and the control that closes it. */

export type Evidence = 'spec' | 'press' | 'paper' | 'docs' | 'illustrative';

export interface Layer {
  id: string;
  /** Box label. Three words or fewer. */
  name: string;
  /** What tenants share here. */
  shared: string;
  /** How data crosses from tenant A to tenant B. */
  leak: string;
  /** The control that closes the path. */
  control: string;
  /** A canary test that proves it is closed. */
  test: string;
  evidence: Evidence;
  /** Where the claim comes from, in a few words. */
  source: string;
}

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  spec: 'primary: protocol spec',
  press: 'secondary: press report',
  paper: 'primary: research paper',
  docs: 'primary: vendor docs',
  illustrative: 'illustrative',
};

export const LAYERS: Layer[] = [
  {
    id: 'credentials',
    name: 'Credentials',
    shared: 'One service key or one OAuth token that serves every tenant.',
    leak: 'The tool server holds a broad key. A model-written argument such as tenant_id then picks whose rows it reads. The server has the rights. The caller does not. That is a confused deputy.',
    control: 'One Connection per tenant. The tool gateway adds that tenant token at call time. The tenant comes from the verified run, never from an argument. Token passthrough stays off.',
    test: 'Run tenant B with tenant A resource id. Expect 403 and an audit row.',
    evidence: 'spec',
    source: 'MCP security best practices',
  },
  {
    id: 'toolservers',
    name: 'Tool servers',
    shared: 'One MCP server process that answers every tenant.',
    leak: 'A logic flaw, or state kept under a guessable handle, returns another tenant data. In June 2025 Asana told customers that a flaw in its MCP server exposed data across organizations: roughly 1,000 customers, over a month.',
    control: 'The server checks the tenant on every request from the verified token and binds each state handle to that user. Sensitive tools get one instance per tenant. Run contract tests with canaries before each release.',
    test: 'Create a record as A. Ask for it as B by id, by search, and by handle. Expect nothing each time.',
    evidence: 'press',
    source: 'BleepingComputer, 2025-06-18',
  },
  {
    id: 'queues',
    name: 'Queues and workers',
    shared: 'One run queue and a pool of long-lived workers.',
    leak: 'A worker keeps files, memory, or environment variables from A when B starts on it. A burst from A also fills the queue, so B waits. That is a leak of time, not of data.',
    control: 'A queue per tenant with fair share. Shuffle sharding limits what one bad tenant can reach. A worker never serves two tenants without a full reset, or it runs each run in a fresh sandbox.',
    test: 'Let A write a canary to a temp file and an environment variable. Run B on the same worker. Expect none. Surge A 10 times and measure the p95 queue wait of B.',
    evidence: 'illustrative',
    source: 'our design reading',
  },
  {
    id: 'caches',
    name: 'Caches',
    shared: 'A tool-result cache, a semantic cache, or a provider prompt cache.',
    leak: 'A key without the tenant maps two tenants to one entry. A hit serves the result built for A to B, with no call to the tool. At the provider, one study found global cache sharing across users in seven API providers, and a timing signal that shows it.',
    control: 'Put the tenant id in every cache key. Use one provider workspace per tenant or tier where the provider isolates by workspace. Count cross-tenant hits and alert on any above 0.',
    test: 'A and B send the same query. Expect two misses. The cross-tenant hit counter stays at 0.',
    evidence: 'paper',
    source: 'arXiv 2502.07776',
  },
  {
    id: 'logs',
    name: 'Logs and traces',
    shared: 'One log index, one trace store, one eval dataset.',
    leak: 'Prompts and tool results land in the log. A support search, a dashboard, or an eval set built from traces has no tenant filter. One tenant staff, or one tenant agent, reads another tenant text.',
    control: 'Tag every record with the tenant at write time. Filter by tenant in the query layer, with the check in code. Redact secrets before the write. Never train or build evals from tenant traces without a contract.',
    test: 'Search as the admin of B for the canary string of A. Expect 0 hits.',
    evidence: 'illustrative',
    source: 'our design reading',
  },
  {
    id: 'embeddings',
    name: 'Embeddings',
    shared: 'One vector index for all tenants.',
    leak: 'The search takes the top 10 and filters by tenant after, or the filter is missing. Chunks of A come back into the context of B. If the filter runs last, B can also get fewer than 10 results.',
    control: 'One namespace or index per tenant, or a tenant filter that the query builder always adds in code before the search. A filter written in the prompt is not a control.',
    test: 'Plant a canary chunk in A. Query as B with its exact words. Expect no chunk.',
    evidence: 'illustrative',
    source: 'our design reading',
  },
  {
    id: 'sandboxes',
    name: 'Sandboxes',
    shared: 'A warm sandbox, a shared container, or a shared kernel.',
    leak: 'Code from A leaves files or tokens in a sandbox that B reuses. A container escape reaches the host, and the host holds every tenant.',
    control: 'One microVM per run, destroyed after the run. No ambient credentials. A network allow list. AgentCore Runtime, for example, gives each session its own microVM and sanitizes memory when the session ends.',
    test: 'Run code as A that writes a canary file and an environment variable. Start B on the same host. Expect none. Try to read the cloud metadata address. Expect it blocked.',
    evidence: 'docs',
    source: 'AWS AgentCore docs',
  },
];

/** Open leak paths, given the set of layers whose control is on. */
export const openCount = (closed: ReadonlySet<string>) => LAYERS.filter((l) => !closed.has(l.id)).length;
