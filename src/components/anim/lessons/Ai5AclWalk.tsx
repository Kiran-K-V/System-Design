import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Tone = 'ok' | 'bad' | 'muted' | 'warn';
interface Row { t: string; tone: Tone }
interface Step {
  caption: string;
  view: 'lists' | 'timeline';
  left?: Row[];
  right?: Row[];
  leftNote?: string;
  rightNote?: string;
  head?: string;
}

const R = (t: string, tone: Tone = 'muted'): Row => ({ t, tone });
const TOP4 = ['HR: salary bands', 'Globex: pay policy', 'HR: raise cycle', 'HR: bonus pool'];

const steps: Step[] = [
  { caption: 'Ana (engineering) and Raj (HR) ask the same question: "salary bands for engineers". The index is shared by every user and tenant. Each chunk carries an ACL: the groups that may read it, and its tenant. We want k = 4 results.', view: 'lists', head: 'same query', left: [], right: [], leftNote: 'Ana: acme, eng', rightNote: 'Raj: acme, hr' },
  { caption: 'The vector search ranks by similarity only. It does not know who is asking. Both users get the same top 4. Three are HR documents and one belongs to another tenant, Globex.', view: 'lists', head: 'top 4 by similarity', left: TOP4.map((t) => R(t)), right: TOP4.map((t) => R(t)), leftNote: 'Ana: acme, eng', rightNote: 'Raj: acme, hr' },
  { caption: 'No permission check: both users see all four chunks. For Ana that is a leak. She reads HR salary bands and a Globex policy. The model will quote them in its answer. This is the failure OWASP calls cross-context leakage.', view: 'lists', head: 'no check', left: TOP4.map((t) => R(t, 'bad')), right: [R(TOP4[0], 'ok'), R(TOP4[1], 'bad'), R(TOP4[2], 'ok'), R(TOP4[3], 'ok')], leftNote: 'Ana sees 4 forbidden chunks', rightNote: 'Raj sees 1 forbidden chunk' },
  { caption: 'Post-filter: take the top 4, then drop what the user cannot read. Nothing leaks. But Ana is left with zero chunks, and Raj with three. The answer for Ana is empty or made up. If the UI prints "4 matches, 0 shown", it also leaks that HR documents on this topic exist.', view: 'lists', head: 'post-filter, k = 4', left: [], right: [R(TOP4[0], 'ok'), R(TOP4[2], 'ok'), R(TOP4[3], 'ok')], leftNote: 'Ana: 0 of 4 survive', rightNote: 'Raj: 3 of 4 survive' },
  { caption: 'Pre-filter: the permission test runs inside the search, so the top 4 come only from chunks Ana can read. She gets the engineering ladder and the handbook, all readable. Fewer than 4 appear only because fewer readable chunks exist, not because the filter ate them.', view: 'lists', head: 'pre-filter, k = 4', left: [R('Eng: level ladder', 'ok'), R('Handbook: pay FAQ', 'ok'), R('Handbook: benefits', 'ok')], right: [R(TOP4[0], 'ok'), R(TOP4[2], 'ok'), R(TOP4[3], 'ok'), R('Handbook: pay FAQ', 'ok')], leftNote: 'Ana: 3 readable chunks', rightNote: 'Raj: full 4' },
  { caption: 'Now HR removes Raj at time T. The source system knows at once. The index copy of the ACL updates later (30 s here), and a cached answer lives for its TTL (10 min here). Until each layer catches up, Raj can still read HR text. Times are illustrative.', view: 'timeline' },
];

const toneCol: Record<Tone, string> = { ok: 'var(--ok)', bad: 'var(--bad)', muted: 'var(--muted)', warn: 'var(--warn)' };

function Col({ x, name, rows }: { x: number; name: string; rows: Row[] }) {
  return (
    <g>
      <HandText x={x + 160} y={92} size={TEXT_SIZES.note} color="var(--muted)">{name}</HandText>
      {rows.map((r, k) => (
        <g key={r.t + k}>
          <SketchBox cx={x + 160} cy={130 + k * 48} w={316} h={38} r={8} seed={seedOf(`ar-${x}-${r.t}`)} stroke={toneCol[r.tone]} strokeWidth={r.tone === 'bad' ? 2.2 : 1.4} fill={r.tone === 'muted' ? undefined : toneCol[r.tone]} />
          <HandText x={x + 160} y={131 + k * 48} size={TEXT_SIZES.label}>{r.t}</HandText>
        </g>
      ))}
    </g>
  );
}

const LAYERS = [
  { name: 'Source ACL', end: 0, tone: 'ok' as const },
  { name: 'Index metadata', end: 1, tone: 'warn' as const },
  { name: 'Answer cache', end: 4, tone: 'bad' as const },
];

export default function Ai5AclWalk() {
  return (
    <AnimFrame title="Two users, one query, different permissions" steps={steps} interval={7000}>
      {(_, s) => {
        if (s.view === 'timeline') {
          const x0 = 190;
          const xs = [x0, x0 + 20, x0 + 470];
          return (
            <SketchSvg width={720} height={300} label="Timeline of an access revocation reaching each layer">
              <HandText x={24} y={34} anchor="start" size={TEXT_SIZES.heading}>Raj is removed from HR at T</HandText>
              {LAYERS.map((l, k) => {
                const y = 90 + k * 62;
                const w = xs[k] - x0;
                return (
                  <g key={l.name}>
                    <HandText x={24} y={y} anchor="start" size={TEXT_SIZES.label}>{l.name}</HandText>
                    <line x1={x0} y1={y} x2={x0 + 500} y2={y} stroke="var(--border)" strokeWidth={1.4} />
                    {w > 0 && <rect x={x0} y={y - 12} width={w} height={24} rx={6} fill={toneCol[l.tone]} fillOpacity={0.25} stroke={toneCol[l.tone]} strokeWidth={1.4} />}
                    <circle cx={xs[k]} cy={y} r={6} fill={toneCol[l.tone]} />
                    <HandText x={Math.min(xs[k] + 14, x0 + 410)} y={y - 22} anchor="start" size={TEXT_SIZES.note} mono color="var(--muted)">{k === 0 ? 'T + 0' : k === 1 ? 'T + 30 s' : 'T + 10 min'}</HandText>
                  </g>
                );
              })}
              <SketchArrow points={[[x0, 270], [x0 + 500, 270]]} seed={seedOf('al-ax')} stroke="var(--muted)" />
              <HandText x={x0} y={292} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">time, not to scale</HandText>
              <HandText x={x0 + 500} y={292} anchor="end" size={TEXT_SIZES.note} color="var(--bad)">leak window ends here</HandText>
            </SketchSvg>
          );
        }
        return (
          <SketchSvg width={720} height={330} label="Search results for two users under different permission strategies">
            <HandText x={360} y={36} size={TEXT_SIZES.heading} color="var(--accent)">{s.head ?? ''}</HandText>
            <Col x={24} name="Ana (acme, eng)" rows={s.left ?? []} />
            <Col x={376} name="Raj (acme, hr)" rows={s.right ?? []} />
            <HandText x={184} y={318} size={TEXT_SIZES.note} color={s.leftNote?.includes('forbidden') || s.leftNote?.includes('0 of') ? 'var(--bad)' : 'var(--muted)'}>{s.leftNote ?? ''}</HandText>
            <HandText x={536} y={318} size={TEXT_SIZES.note} color="var(--muted)">{s.rightNote ?? ''}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
