import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { RULE_LABELS, score, type Rule } from './Ai15BenchMath';

const P_A = 0.55;
const P_B = 0.65;
const KS = [4, 16, 64];
const RULES = (Object.keys(RULE_LABELS) as Rule[]).map((id) => ({ id, label: RULE_LABELS[id] }));

function Bar({ name, rule, k, value, color }: { name: string; rule: Rule; k: number; value: number; color: string }) {
  const label = rule === 'one' ? 'one try' : `${RULE_LABELS[rule].toLowerCase().replace(' k', ` ${k}`)}`;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>
          {name} <span className="text-muted">({label})</span>
        </span>
        <span className="font-mono tabular-nums">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-5 w-full rounded bg-surface" role="img" aria-label={`${name}: ${(value * 100).toFixed(1)} percent`}>
        <div className="h-5 rounded" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Ai15BenchTries() {
  const [ruleA, setRuleA] = useState<Rule>('one');
  const [ruleB, setRuleB] = useState<Rule>('one');
  const [k, setK] = useState(64);
  const a = score(ruleA, P_A, k);
  const b = score(ruleB, P_B, k);
  const diff = (a - b) * 100;
  const verdict =
    Math.abs(diff) < 0.5
      ? 'The chart shows a tie.'
      : diff > 0
        ? `The chart shows Model A ahead by ${diff.toFixed(1)} points.`
        : `The chart shows Model B ahead by ${(-diff).toFixed(1)} points.`;
  const misled = diff > 0.5;

  return (
    <CacheWidgetFrame title="Same models, different scoring rule" hint="Illustrative. Independent tries, one fixed chance per try, two possible answers.">
      <p className="mb-3 text-sm">
        Model A gets a task right <b>55%</b> of the time per try. Model B gets it right <b>65%</b> of the time. B is the better model for a job that makes one call. Pick the rule a launch chart uses for each.
      </p>
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-muted">Rule for Model A</p>
          <Seg label="Rule for Model A" value={ruleA} options={RULES} onChange={setRuleA} />
        </div>
        <div>
          <p className="mb-1 text-xs text-muted">Rule for Model B</p>
          <Seg label="Rule for Model B" value={ruleB} options={RULES} onChange={setRuleB} />
        </div>
      </div>
      <div className="mb-3">
        <p className="mb-1 text-xs text-muted">Number of tries, k</p>
        <Seg label="Number of tries" value={k} options={KS.map((x) => ({ id: x, label: String(x) }))} onChange={setK} />
      </div>
      <div className="space-y-3 rounded-lg border border-line bg-surface p-3" aria-live="polite">
        <Bar name="Model A" rule={ruleA} k={k} value={a} color="var(--accent)" />
        <Bar name="Model B" rule={ruleB} k={k} value={b} color="var(--muted)" />
        <p className="text-sm" style={{ color: misled ? 'var(--bad)' : undefined }}>
          {verdict} {misled ? 'The chart and the one-try truth now disagree.' : ''}
        </p>
      </div>
      <p className="mt-3 text-sm text-muted">
        Set both to one try: B leads by 10 points. Give A a majority vote and B a single try at k = 64: the lead flips, with no change to either model. Set both to all k right and the numbers fall for both, which is the bar a customer-facing agent must clear.
      </p>
    </CacheWidgetFrame>
  );
}
