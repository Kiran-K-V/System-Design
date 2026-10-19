import { DesignCompare, type CompareVariant } from '../DesignBuild';
import type { FlowEdge, FlowNode } from '../FlowDiagram';

/** Eval platform drill: the same pull request meets the CI gate twice, once with a regression and once fixed. */

const nodes = (): FlowNode[] => [
  { id: 'pr', x: 90, y: 100, w: 120, label: 'Pull request', sub: 'prompt change' },
  { id: 'run', x: 260, y: 100, w: 130, label: 'Eval runner', sub: '400 cases' },
  { id: 'judge', x: 430, y: 100, w: 130, label: 'Judge', sub: 'pinned version' },
  { id: 'board', x: 600, y: 100, w: 130, label: 'Scoreboard', sub: 'by slice' },
  { id: 'gate', x: 430, y: 250, w: 130, label: 'CI gate', sub: 'exit code' },
  { id: 'merge', x: 600, y: 250, w: 130, label: 'Merge button' },
  { id: 'base', x: 260, y: 250, w: 130, label: 'Baseline', sub: 'main branch' },
];

const edges: FlowEdge[] = [
  { from: 'pr', to: 'run' },
  { from: 'run', to: 'judge' },
  { from: 'judge', to: 'board' },
  { from: 'board', to: 'gate' },
  { from: 'base', to: 'gate' },
  { from: 'gate', to: 'merge' },
];

const note = (text: string, tone: FlowNode['tone']) => ({ x: 360, y: 340, text, anchor: 'middle' as const, size: 16, tone });

const variants: CompareVariant[] = [
  {
    id: 'bad',
    label: 'A regression',
    nodes: nodes(),
    edges,
    steps: [
      { notes: [note('Branch: new refund prompt. Main passes 95.8% (383 of 400).', 'muted')], caption: 'A pull request changes the refund prompt. CI starts the eval run on the 400-case golden set. The baseline is the last run on the main branch, 383 of 400 passing.', active: ['pr'] },
      { notes: [note('400 answers made. Each is checked by code or by the judge.', 'muted')], caption: 'The runner sends all 400 cases through the gateway under the evals tenant, so the run cannot starve production. Each answer goes to a code check or to the pinned judge.', packets: [{ from: 'pr', to: 'run', label: 'cases' }, { from: 'run', to: 'judge', label: 'answers', delay: 0.9 }] },
      { notes: [note('Branch passes 373 of 400 = 93.3%. Refund slice: 38 of 50 = 76%.', 'bad')], caption: 'The scoreboard shows the whole set at 93.3%, down 2.5 points. The refund slice fell from 92% to 76%. The average hides it. The slice shows it.', packets: [{ from: 'judge', to: 'board', label: 'verdicts' }], tones: { board: 'bad' } },
      { notes: [note('Rule: no slice may fall 5 points, and the total must stay at 95%.', 'warn')], caption: 'The gate compares the branch with the baseline. Two rules fire. The total is under 95%, and the refund slice fell 16 points, past the 5-point limit.', packets: [{ from: 'board', to: 'gate', label: 'scores' }, { from: 'base', to: 'gate', label: 'baseline', delay: 0.4 }], tones: { board: 'bad', gate: 'warn' } },
      { notes: [note('exit 1. The merge button is disabled. Nobody ships the regression.', 'bad')], caption: 'The gate script exits with code 1. The check fails, the merge button stays disabled, and the author reads the failing refund cases, found by clicking through to the traces.', packets: [{ from: 'gate', to: 'merge', label: 'exit 1', tone: 'bad' }], tones: { board: 'bad', gate: 'bad', merge: 'bad' } },
    ],
  },
  {
    id: 'ok',
    label: 'After the fix',
    nodes: nodes(),
    edges,
    steps: [
      { notes: [note('Branch: refund prompt, with the policy text restored.', 'muted')], caption: 'The author restores the policy text the refund cases need and pushes. CI starts again from the same 400 cases, so the two runs are comparable.', active: ['pr'] },
      { notes: [note('Same 400 cases, same pinned judge version.', 'muted')], caption: 'Same cases, same judge version. If the judge changed, the score line would break, so the judge is pinned in the run config.', packets: [{ from: 'pr', to: 'run', label: 'cases' }, { from: 'run', to: 'judge', label: 'answers', delay: 0.9 }] },
      { notes: [note('Branch passes 386 of 400 = 96.5%. Refund slice: 46 of 50 = 92%.', 'ok')], caption: 'The total is 96.5% and the refund slice is back to 92%. The other slices did not move by more than a point.', packets: [{ from: 'judge', to: 'board', label: 'verdicts' }], tones: { board: 'ok' } },
      { notes: [note('Total at least 95%. No slice down more than 5 points.', 'ok')], caption: 'Both rules pass. The gate also prints the noise. At 400 cases and a 95% pass rate the 95% margin is about plus or minus 2.1 points, so the paired flips against the baseline decide close calls.', packets: [{ from: 'board', to: 'gate', label: 'scores' }, { from: 'base', to: 'gate', label: 'baseline', delay: 0.4 }], tones: { board: 'ok', gate: 'ok' } },
      { notes: [note('exit 0. The merge button is enabled.', 'ok')], caption: 'The script exits with code 0. The check turns green and the merge is allowed. The release still goes through shadow and canary (lesson A8.8). The gate is the first check, not the only one.', packets: [{ from: 'gate', to: 'merge', label: 'exit 0', tone: 'ok' }], tones: { board: 'ok', gate: 'ok', merge: 'ok' } },
    ],
  },
];

export default function Ai13GatewayCiGate() {
  return <DesignCompare title="CI gate" prompt="Pull request:" variants={variants} height={380} label="A CI gate blocks a prompt change that lowers the refund slice, then passes after the fix" />;
}
