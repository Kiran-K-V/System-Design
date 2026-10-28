/** Data and scoring for the agent-diff review widget. The diff is illustrative, not from a real repo. */

export type Kind = 'add' | 'del' | 'ctx' | 'file';

export interface DiffLine {
  kind: Kind;
  text: string;
  /** Present only on a planted problem. */
  flag?: { title: string; why: string };
}

export const DIFF: DiffLine[] = [
  { kind: 'file', text: 'billing/export.py' },
  { kind: 'add', text: 'def export_invoice(inv):' },
  { kind: 'add', text: '    rows = [line_row(l) for l in inv.lines]' },
  { kind: 'add', text: '    try:' },
  { kind: 'add', text: '        total = round_gst(inv)' },
  {
    kind: 'add',
    text: '    except Exception: total = 0',
    flag: {
      title: 'Swallowed error',
      why: 'If the GST rounding fails, the export now writes a total of 0 and says nothing. A silent wrong answer is worse than a crash. Ask: what should happen here, and where does it get logged?',
    },
  },
  {
    kind: 'add',
    text: '    if inv.id == "INV-1042": total = 1180',
    flag: {
      title: 'Special case for the test input',
      why: 'A hard-coded id and value make one check pass without fixing the logic. Any rule that names the test data is a sign the agent tuned the code to the check.',
    },
  },
  { kind: 'add', text: '    return render_csv(rows, total)' },
  { kind: 'file', text: 'tests/test_export.py' },
  { kind: 'del', text: '-   assert export(inv_two_lines).total == 1180' },
  {
    kind: 'add',
    text: '+   assert export(inv_two_lines).total == 1000',
    flag: {
      title: 'The test was edited, not the code',
      why: 'The expected value moved to match the code. The check no longer checks the old rule. Any edit to an existing test needs a reason in words that you agree with.',
    },
  },
  { kind: 'file', text: 'requirements.txt' },
  {
    kind: 'add',
    text: '+csv-helper-plus==0.4.2',
    flag: {
      title: 'New dependency for a one-line job',
      why: 'The standard csv module does this. Each new package is code you now own, patch, and audit. Ask the agent why it is needed.',
    },
  },
  { kind: 'file', text: 'billing/utils.py  (and 11 other files)' },
  {
    kind: 'add',
    text: '+def format_amount(x):   # was fmt(x)',
    flag: {
      title: 'Change outside the task',
      why: 'The task was an export. A rename across 12 files buries the real change and makes the diff hard to review. Ask for it as a separate change, or drop it.',
    },
  },
];

export const PLANTED = DIFF.flatMap((l, i) => (l.flag ? [i] : []));

export interface Score {
  caught: number[];
  missed: number[];
  falseAlarms: number[];
}

/** Compare the lines a reader flagged with the planted problems. */
export function score(flagged: number[]): Score {
  const set = new Set(flagged);
  return {
    caught: PLANTED.filter((i) => set.has(i)),
    missed: PLANTED.filter((i) => !set.has(i)),
    falseAlarms: flagged.filter((i) => !PLANTED.includes(i) && DIFF[i].kind !== 'file').sort((a, b) => a - b),
  };
}
