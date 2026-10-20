import DesignBuild, { type BuildEdge, type BuildGroup, type BuildNode, type BuildStep } from '../DesignBuild';

/** Coding agent: the high-level design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'dev', x: 90, y: 70, w: 120, label: 'Developer', sub: 'issue or prompt', step: 0 },
  { id: 'queue', x: 250, y: 70, w: 120, label: 'Task queue', sub: 'one run id', step: 0 },
  { id: 'loop', x: 250, y: 200, w: 120, label: 'Agent loop', sub: 'one worker', step: 0 },
  { id: 'model', x: 90, y: 200, w: 120, label: 'Model API', step: 0 },
  { id: 'tools', x: 420, y: 200, w: 120, label: 'Tool runner', sub: 'grep, edit, bash', step: 1 },
  { id: 'repo', x: 600, y: 200, w: 120, label: 'Repo clone', sub: 'one per run', step: 1 },
  { id: 'tests', x: 420, y: 330, w: 120, label: 'Test runner', sub: 'tests, linters', step: 3 },
  { id: 'pr', x: 420, y: 70, w: 120, label: 'Pull request', sub: 'diff, summary', step: 4 },
  { id: 'proxy', x: 600, y: 330, w: 120, label: 'Egress proxy', sub: 'allow list', step: 5 },
  { id: 'guard', x: 90, y: 330, w: 120, label: 'Loop guard', sub: 'caps, kill switch', step: 6 },
  { id: 'trace', x: 250, y: 330, w: 120, label: 'Trace + eval', sub: 'held-out suite', step: 8 },
];

const edges: BuildEdge[] = [
  { from: 'dev', to: 'queue', step: 0 },
  { from: 'queue', to: 'loop', step: 0 },
  { from: 'loop', to: 'model', head: 'both', step: 0 },
  { from: 'loop', to: 'tools', step: 1 },
  { from: 'tools', to: 'repo', head: 'both', step: 1 },
  { from: 'tools', to: 'tests', label: 'run', labelAt: [-22, 0], step: 3 },
  { from: 'loop', to: 'pr', step: 4 },
  { from: 'tools', to: 'proxy', label: 'fetch', labelAt: [30, 8], step: 5 },
  { from: 'guard', to: 'loop', label: 'stop', labelAt: [-8, 24], step: 6 },
  { from: 'loop', to: 'trace', step: 8 },
];

const groups: BuildGroup[] = [{ x: 335, y: 146, w: 345, h: 250, label: 'Sandbox: repo-only writes, no secrets', step: 5 }];

const steps: BuildStep[] = [
  { req: 'FR1: take a task, run it in the background', caption: 'A task enters a queue and gets a run id. One worker owns one run. It calls the model in a loop and keeps the history. The developer does not hold a connection open for minutes.', packets: [{ from: 'dev', to: 'queue', label: 'task' }, { from: 'queue', to: 'loop', label: 'run', delay: 0.9 }] },
  { req: 'FR2: find the code', caption: 'The model asks for tools. The runner searches the clone with grep and glob and reads files. Search reads the live disk, so it sees the edits the agent made a minute ago.', packets: [{ from: 'loop', to: 'tools', label: 'grep' }, { from: 'tools', to: 'repo', label: 'read', delay: 0.9 }] },
  { req: 'FR3: change the code', caption: 'No new box. An edit is a tool call that writes a file in the clone. The result goes back into the history as a short diff, not the whole file.', active: ['repo'], packets: [{ from: 'tools', to: 'repo', label: 'edit' }] },
  { req: 'FR4: check the change with tests', caption: 'The runner runs the tests and linters. The pass or fail result is the reward signal. A red result goes back to the model with the failing assertion, and the loop goes round again.', packets: [{ from: 'tools', to: 'tests', label: 'pytest' }, { from: 'tests', to: 'loop', label: 'red', tone: 'bad', delay: 0.9 }] },
  { req: 'FR5: hand back a pull request', caption: 'When the tests pass and the model stops asking for tools, the worker pushes a branch and opens a pull request with a summary. A person reviews and merges. The agent never pushes to the main branch.', packets: [{ from: 'loop', to: 'pr', label: 'branch' }] },
  { req: 'NFR: stay in the box', caption: 'A dashed boundary goes round everything that runs code. Writes land only in the clone. The only way out is a proxy with a host allow list. No cloud keys or SSH keys exist inside.', packets: [{ from: 'tools', to: 'proxy', label: 'npm', tone: 'ok' }] },
  { req: 'NFR: stop a runaway loop', caption: 'A guard outside the loop counts calls, dollars, and repeated identical failures. It can end the run and tear down the sandbox. A kill switch lives here too. The model cannot turn it off.', packets: [{ from: 'guard', to: 'loop', label: 'stop', tone: 'bad' }] },
  { req: 'NFR: keep the context small', caption: 'No new box. Compaction, tool output caps, and subagents all live inside the loop. They keep the history small, because every call re-sends it. The context deep dive explains the numbers.', active: ['loop'] },
  { req: 'NFR: know it still works', caption: 'Every run writes a trace. Every prompt or model change runs the held-out suite first. If the pass rate falls or the cost per task rises, the change does not ship.', packets: [{ from: 'loop', to: 'trace', label: 'trace' }] },
];

export default function Ai13CodeBuild() {
  return <DesignBuild title="Coding agent, built up" steps={steps} nodes={nodes} edges={edges} groups={groups} height={420} label="Coding agent architecture growing from task queue to a trace and eval gate" />;
}
