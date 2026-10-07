import { motion } from 'motion/react';
import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** What the server does with an idempotency key in each case, step by step. */

interface Row {
  key: string;
  hash: string;
  status: 'in progress' | 'done';
  saved: string;
}

interface KStep {
  caption: string;
  req?: { lines: string[] };
  decision?: string;
  res?: { line: string; tone: 'ok' | 'bad' | 'warn' };
  rows: Row[];
  hl?: boolean;
}

const IN_PROGRESS: Row = { key: 'K1', hash: 'h1', status: 'in progress', saved: '-' };
const DONE: Row = { key: 'K1', hash: 'h1', status: 'done', saved: '201 ch_1' };

const steps: KStep[] = [
  {
    caption:
      'The key store is a table. Each row holds the key, a hash of the request body (a fingerprint), a status, and the saved response. Its main rule: the key column is unique, so "claim this key" is one atomic insert.',
    rows: [],
  },
  {
    caption:
      'First request with key K1, body hash h1. The key is absent, so the server claims it by inserting a row marked "in progress", then starts the work.',
    req: { lines: ['POST /charges', 'Idempotency-Key: K1', 'body hash: h1'] },
    decision: 'K1 absent: insert row, run it',
    rows: [IN_PROGRESS],
    hl: true,
  },
  {
    caption:
      'While the first run is still working, the client (or a proxy) sends K1 again. The row says "in progress". Running it again would double charge, so the server refuses with 409 Conflict. The client waits and retries.',
    req: { lines: ['POST /charges', 'Idempotency-Key: K1', 'body hash: h1'] },
    decision: 'K1 in progress: reject',
    res: { line: '409 Conflict', tone: 'warn' },
    rows: [IN_PROGRESS],
  },
  {
    caption: 'The first run ends. The server writes the charge and, in the same step, saves the final status and body on the row: "done, 201".',
    decision: 'work finished: save response',
    res: { line: '201 (lost in transit)', tone: 'bad' },
    rows: [DONE],
    hl: true,
  },
  {
    caption: 'The client retries with K1. The row is "done", and the hash matches. The server skips the work and replays the saved 201. The client sees one successful charge.',
    req: { lines: ['POST /charges', 'Idempotency-Key: K1', 'body hash: h1'] },
    decision: 'K1 done, same hash: replay',
    res: { line: '201 (saved copy)', tone: 'ok' },
    rows: [DONE],
  },
  {
    caption:
      'A bug in the client reuses K1 for a different purchase: the body hash is h2, not h1. Replaying the old answer would hide a mistake. The server compares fingerprints and rejects it with 422.',
    req: { lines: ['POST /charges', 'Idempotency-Key: K1', 'body hash: h2'] },
    decision: 'K1 done, hash differs: error',
    res: { line: '422 body differs', tone: 'bad' },
    rows: [DONE],
  },
  {
    caption:
      'Keys cannot live forever. Stripe may remove keys that are at least 24 hours old. After that, K1 is new again and the request runs as a fresh one. Pick a time-to-live longer than any retry window you allow.',
    req: { lines: ['POST /charges', 'Idempotency-Key: K1', 'body hash: h1'] },
    decision: '25 h later. K1 pruned: absent',
    res: { line: '201 (new charge)', tone: 'warn' },
    rows: [{ key: 'K1', hash: 'h1', status: 'in progress', saved: '-' }],
  },
];

const TX = 262;
const COLS = [
  { label: 'key', x: 0 },
  { label: 'hash', x: 48 },
  { label: 'status', x: 100 },
  { label: 'saved response', x: 214 },
];

const toneColor = (t: 'ok' | 'bad' | 'warn') => (t === 'ok' ? 'var(--ok)' : t === 'bad' ? 'var(--bad)' : 'var(--warn)');

export default function KeyLifecycle() {
  return (
    <AnimFrame title="Life of an idempotency key on the server" steps={steps} interval={3200}>
      {(i, s) => (
        <SketchSvg width={640} height={340} label="Idempotency key store with one row, and how the server answers each kind of request">
          <HandText x={8} y={14} size={13} anchor="start" color="var(--muted)">
            incoming request
          </HandText>
          <SketchBox cx={112} cy={72} w={216} h={86} r={10} seed={seedOf('kreq')} stroke={s.req ? 'var(--accent)' : 'var(--muted)'} fill="var(--surface)" fillStyle="solid" />
          {s.req ? (
            <HandText x={16} y={72} size={13} anchor="start" mono lineHeight={1.5}>
              {s.req.lines.join('\n')}
            </HandText>
          ) : (
            <HandText x={112} y={72} size={13} color="var(--muted)">
              {i === 3 ? '(first request finishes)' : '(none yet)'}
            </HandText>
          )}

          <SketchArrow points={[[112, 118], [112, 146]]} seed={seedOf('k1')} stroke="var(--muted)" />
          <HandText x={8} y={160} size={13} anchor="start" color="var(--muted)">
            server decides
          </HandText>
          <SketchBox cx={112} cy={198} w={216} h={50} r={25} seed={seedOf('kdec')} stroke="var(--accent)" />
          <HandText x={112} y={198} size={13} lineHeight={1.25}>
            {s.decision ?? '(waiting)'}
          </HandText>

          <SketchArrow points={[[112, 226], [112, 252]]} seed={seedOf('k2')} stroke="var(--muted)" />
          <SketchBox cx={112} cy={284} w={216} h={44} r={10} seed={seedOf('kres')} stroke={s.res ? toneColor(s.res.tone) : 'var(--muted)'} />
          <HandText x={112} y={284} size={13} mono color={s.res ? toneColor(s.res.tone) : 'var(--muted)'}>
            {s.res?.line ?? 'response'}
          </HandText>

          <SketchArrow points={[[226, 198], [TX - 4, 168]]} seed={seedOf('k3')} dashed stroke="var(--muted)" head="both" />

          <SketchBox cx={TX + 186} cy={168} w={372} h={290} r={12} seed={seedOf('ktable')} />
          <HandText x={TX + 186} y={46} size={16} weight={700}>
            idempotency key store
          </HandText>
          {COLS.map((c) => (
            <HandText key={c.label} x={TX + 16 + c.x} y={86} size={13} anchor="start" color="var(--muted)">
              {c.label}
            </HandText>
          ))}
          <SketchArrow points={[[TX + 12, 100], [TX + 360, 100]]} head="none" stroke="var(--border)" strokeWidth={1} seed={seedOf('kline')} />
          {s.rows.map((r, k) => (
            <motion.g key={`${i}-${k}`} initial={s.hl ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              {s.hl && <rect x={TX + 10} y={110 + k * 34} width={352} height={28} rx={6} fill="var(--accent-soft)" />}
              <HandText x={TX + 16} y={125 + k * 34} size={14} anchor="start" mono>
                {r.key}
              </HandText>
              <HandText x={TX + 64} y={125 + k * 34} size={14} anchor="start" mono>
                {r.hash}
              </HandText>
              <HandText x={TX + 116} y={125 + k * 34} size={14} anchor="start" color={r.status === 'done' ? 'var(--ok)' : 'var(--warn)'}>
                {r.status}
              </HandText>
              <HandText x={TX + 230} y={125 + k * 34} size={14} anchor="start" mono>
                {r.saved}
              </HandText>
            </motion.g>
          ))}
          {s.rows.length === 0 && (
            <HandText x={TX + 186} y={150} size={14} color="var(--muted)">
              (no rows yet)
            </HandText>
          )}
          <HandText x={TX + 186} y={290} size={13} color="var(--muted)">
            {'unique(key): "claim" is one atomic step'}
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
