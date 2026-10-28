import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { EXAMPLES, SNAPSHOTS, joinLatest, joinPit, ruleHits } from './AiE1PitLogic';

/** Toggle between a leaky join and a point-in-time join on a tiny, illustrative table. */
export default function AiE1PointInTime() {
  const [mode, setMode] = useState<'latest' | 'pit'>('latest');
  const vals = EXAMPLES.map((e) => (mode === 'latest' ? joinLatest(e) : joinPit(e)));
  const hits = ruleHits(vals);
  const leaky = mode === 'latest';
  return (
    <CacheWidgetFrame title="Point-in-time join" hint="Illustrative data">
      <div className="mb-3">
        <Seg label="Join type" value={mode} options={[{ id: 'latest', label: 'Join on user only (newest value)' }, { id: 'pit', label: 'Point-in-time join' }]} onChange={setMode} />
      </div>
      <p className="mb-1 text-xs uppercase tracking-wide text-muted">Feature history: disputes opened against the user</p>
      <ul className="mb-4 flex flex-wrap gap-2 text-xs">
        {SNAPSHOTS.map((s) => (
          <li key={`${s.user}${s.day}`} className="rounded-md border border-line px-2 py-1 tabular-nums">User {s.user}, day {s.day}: {s.disputes}</li>
        ))}
      </ul>
      <p className="mb-1 text-xs uppercase tracking-wide text-muted">Training rows</p>
      <div className="overflow-x-auto" aria-live="polite">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr><th className="pb-1 pr-2 font-normal">Payment</th><th className="pb-1 pr-2 font-normal">Label</th><th className="pb-1 font-normal">Feature value attached</th></tr>
          </thead>
          <tbody>
            {EXAMPLES.map((e, i) => (
              <tr key={e.user} className="border-t border-line">
                <td className="py-1.5 pr-2">User {e.user}, day {e.day}</td>
                <td className="py-1.5 pr-2" style={{ color: e.fraud ? 'var(--bad)' : 'var(--muted)' }}>{e.fraud ? 'fraud' : 'good'}</td>
                <td className="py-1.5 tabular-nums" style={{ color: leaky && e.fraud ? 'var(--bad)' : undefined }}>{vals[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm" style={{ color: leaky ? 'var(--bad)' : 'var(--ok)' }}>
        {leaky
          ? `The rule "disputes above 0 means fraud" is right on ${hits} of ${EXAMPLES.length} rows. It looks perfect, because the dispute came after the payment. In production the value is 0 at payment time.`
          : `The rule is right on ${hits} of ${EXAMPLES.length} rows. It misses the fraud, because on day 8 nobody had opened a dispute yet. This is what serving will see.`}
      </p>
    </CacheWidgetFrame>
  );
}
