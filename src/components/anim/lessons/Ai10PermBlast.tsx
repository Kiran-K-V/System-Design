import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { blast, breachChance, type Gate, type TokenKind } from './Ai10PermLogic';

const WORST: Record<string, string> = {
  delete: 'delete records',
  send: 'send data or mail out',
  write: 'change records',
  read: 'read data (a leak needs a send path too)',
  none: 'nothing',
};

const CATCH = [0.9, 0.95, 0.99, 0.999];
const TRIES = [1, 10, 20, 100];

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = (value / total) * 100;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-[13px]">
          {value} of {total} cells ({Math.round(pct)}%)
        </span>
      </div>
      <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-surface" role="img" aria-label={`${label}: ${value} of ${total}`}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Ai10PermBlast() {
  const [token, setToken] = useState<TokenKind>('admin');
  const [gate, setGate] = useState<Gate>('none');
  const [catchRate, setCatchRate] = useState(0.95);
  const [tries, setTries] = useState(20);
  const b = blast(token, gate);
  const p = breachChance(catchRate, tries);
  const bad = b.unattended > 3;

  return (
    <CacheWidgetFrame title="Blast radius of one injected instruction" hint="Illustrative agent: 5 tools, 13 tool-and-action cells.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg
          label="Token"
          value={token}
          options={[
            { id: 'admin', label: 'Shared admin' },
            { id: 'user', label: "The user's rights" },
            { id: 'task', label: 'Scoped to task' },
          ]}
          onChange={setToken}
        />
        <Seg
          label="Human approval"
          value={gate}
          options={[
            { id: 'none', label: 'None' },
            { id: 'writes', label: 'Writes and deletes' },
            { id: 'writes-sends', label: 'Writes, deletes, sends' },
          ]}
          onChange={setGate}
        />
      </div>
      <div aria-live="polite">
        <Bar label="Reachable at all (token)" value={b.granted} total={b.total} color="var(--warn)" />
        <Bar label="Reachable with no human in the loop" value={b.unattended} total={b.total} color={bad ? 'var(--bad)' : 'var(--ok)'} />
        <p className="mt-2 text-sm">
          Worst thing an injection can do alone: <span className="font-semibold" style={{ color: bad ? 'var(--bad)' : 'var(--fg)' }}>{WORST[b.worst]}</span>.
        </p>
        <p className="mt-1 text-xs text-muted">Approval cuts the second bar, not the first. A prompt that people approve by reflex gives the first bar back (lesson A7.3).</p>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="mb-2 text-sm font-medium">Why a 95% filter is not a boundary</p>
        <div className="mb-3 flex flex-wrap gap-2">
          <Seg label="Filter catch rate" value={catchRate} options={CATCH.map((c) => ({ id: c, label: `catches ${c * 100}%` }))} onChange={setCatchRate} />
          <Seg label="Attempts" value={tries} options={TRIES.map((t) => ({ id: t, label: `${t} ${t === 1 ? 'attempt' : 'attempts'}` }))} onChange={setTries} />
        </div>
        <p className="text-sm" aria-live="polite">
          Chance at least one attempt gets through:{' '}
          <span className="font-mono text-[15px] font-semibold" style={{ color: p > 0.5 ? 'var(--bad)' : p > 0.1 ? 'var(--warn)' : 'var(--ok)' }}>
            {(p * 100).toFixed(p < 0.1 ? 1 : 0)}%
          </span>
        </p>
        <p className="mt-1 text-xs text-muted">
          Formula: 1 - c^n, with c the catch rate and n the attempts. It assumes every attempt is independent and the catch rate is fixed. Adaptive attackers tune each try, so real numbers are worse for the defender.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
