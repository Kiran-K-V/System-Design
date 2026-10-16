/** Data and math for lesson A10.6. Every number is copied from the source named in the lesson; check the label before you change one. */

export interface Bar {
  label: string;
  /** Percent, 0 to 100. */
  a: number;
  b?: number;
}

export interface View {
  id: 'stack' | 'transfer' | 'defence';
  tab: string;
  title: string;
  aName: string;
  bName?: string;
  rows: Bar[];
  source: string;
}

export const VIEWS: View[] = [
  {
    id: 'stack',
    tab: 'Stacking tricks',
    title: 'Share of 32 harmful requests that got a harmful answer (2023 models)',
    aName: 'GPT-4',
    bName: 'Claude v1.3',
    source: 'Wei, Haghtalab, Steinhardt, NeurIPS 2023, Table 1 (curated set of 32 requests).',
    rows: [
      { label: 'No trick', a: 3, b: 0 },
      { label: 'Prefix injection', a: 22, b: 0 },
      { label: 'Refusal suppression', a: 25, b: 16 },
      { label: 'Base64 encoding', a: 34, b: 38 },
      { label: 'Three tricks combined', a: 94, b: 81 },
    ],
  },
  {
    id: 'transfer',
    tab: 'Transfer to other models',
    title: 'Success of one machine-made suffix, tuned on open models, against other models',
    aName: 'Several suffixes tried together, tuned on open Vicuna and Guanaco models',
    source: 'Zou et al., 2023, Table 2 (388 behaviours; success when any one of the suffixes works).',
    rows: [
      { label: 'GPT-3.5', a: 86.6 },
      { label: 'PaLM-2', a: 66.0 },
      { label: 'Claude 1', a: 47.9 },
      { label: 'GPT-4', a: 46.9 },
      { label: 'Claude 2', a: 2.1 },
    ],
  },
  {
    id: 'defence',
    tab: 'A classifier defence',
    title: 'Success of 10,000 synthetic jailbreak prompts against Claude 3.5 Sonnet',
    aName: 'Jailbreak success',
    source: 'Anthropic, Constitutional Classifiers, 3 Feb 2025 (automated test).',
    rows: [
      { label: 'No classifiers', a: 86 },
      { label: 'With input and output classifiers', a: 4.4 },
    ],
  },
];

/** Chance that at least one of n independent attempts works, when each works with probability p. */
export function atLeastOne(p: number, n: number): number {
  return 1 - Math.pow(1 - p, n);
}

/** Attempts needed to reach a target chance, when each works with probability p. */
export function attemptsFor(p: number, target: number): number {
  return Math.ceil(Math.log(1 - target) / Math.log(1 - p));
}
