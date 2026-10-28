import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { BLOCK_SIZE, PHYS_BLOCKS, walk, type Snap } from './AiE3PagedLogic';

const SNAPS = walk();
const steps = SNAPS.map((s) => ({ caption: s.caption }));
const SEQS = [
  { id: 'A1', cx: 130 },
  { id: 'A2', cx: 360 },
  { id: 'B', cx: 590 },
];
const ROW_Y = [100, 146, 192];
const bx = (i: number) => 62 + i * 84;

function Scene({ s }: { s: Snap }) {
  const owners = (p: number) =>
    SEQS.filter((q) => (s.tables[q.id] ?? []).includes(p))
      .map((q) => q.id)
      .join(' ');
  return (
    <>
      <HandText x={24} y={24} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">Block tables: logical block to physical block</HandText>
      {SEQS.map((q) => {
        const t = s.tables[q.id];
        return (
          <g key={q.id}>
            <HandText x={q.cx} y={58} size={TEXT_SIZES.heading} color="var(--fg)">
              {t ? `${q.id}: ${s.lens[q.id]} tokens` : `${q.id}: not here`}
            </HandText>
            {(t ?? []).map((p, l) => {
              const f = s.focus && s.focus.seq === q.id && s.focus.logical === l;
              const shared = s.refs[p] > 1;
              return (
                <g key={l}>
                  <SketchBox cx={q.cx} cy={ROW_Y[l]} w={150} h={40} r={8} seed={seedOf(`e-${q.id}-${l}-${p}`)} stroke={f ? 'var(--accent)' : shared ? 'var(--warn)' : 'var(--muted)'} strokeWidth={f ? 2.2 : 1.4} fill={f ? 'var(--accent)' : shared ? 'var(--warn)' : undefined} />
                  <HandText x={q.cx} y={ROW_Y[l] + 1} size={TEXT_SIZES.label} color="var(--fg)">{`L${l} to #${p}`}</HandText>
                </g>
              );
            })}
          </g>
        );
      })}

      <HandText x={24} y={262} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">{`Physical pool: ${PHYS_BLOCKS} blocks of ${BLOCK_SIZE} slots. Amber: used by two tables.`}</HandText>
      {Array.from({ length: PHYS_BLOCKS }, (_, p) => {
        const used = s.refs[p] > 0;
        const f = s.focus?.phys === p;
        const shared = s.refs[p] > 1;
        const stroke = f ? 'var(--accent)' : shared ? 'var(--warn)' : used ? 'var(--ok)' : 'var(--muted)';
        return (
          <g key={p}>
            <SketchBox cx={bx(p)} cy={332} w={76} h={72} r={8} seed={seedOf(`pb-${p}`)} stroke={stroke} strokeWidth={f ? 2.2 : 1.4} fill={used ? stroke : undefined} dashed={!used} />
            <HandText x={bx(p)} y={310} size={TEXT_SIZES.label} color={used ? 'var(--fg)' : 'var(--muted)'}>{`#${p}`}</HandText>
            {Array.from({ length: BLOCK_SIZE }, (_, k) => (
              <SketchBox key={k} cx={bx(p) - 27 + k * 18} cy={340} w={14} h={14} r={3} seed={seedOf(`sl-${p}-${k}`)} stroke={k < s.fill[p] ? 'var(--fg)' : 'var(--muted)'} fill={k < s.fill[p] ? 'var(--fg)' : undefined} />
            ))}
            <HandText x={bx(p)} y={394} size={TEXT_SIZES.note} color="var(--muted)">{used ? `${owners(p)}\nref ${s.refs[p]}` : 'free'}</HandText>
          </g>
        );
      })}
      {s.copiedFrom !== undefined && s.focus && (
        <HandText x={696} y={290} anchor="end" size={TEXT_SIZES.note} color="var(--accent)">{`#${s.focus.phys} is a copy of #${s.copiedFrom}`}</HandText>
      )}
    </>
  );
}

export default function AiE3PagedWalk() {
  return (
    <AnimFrame title="Block tables and copy on write, one request with two samples" steps={steps} interval={7000}>
      {(i) => (
        <SketchSvg width={720} height={430} label="Each sequence has a block table that maps logical blocks to physical blocks in a shared pool. Two samples share prompt blocks by reference count, and a write to a shared block triggers a copy.">
          <Scene s={SNAPS[i]} />
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
