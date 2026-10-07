import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: a table is a file of fixed-size pages. A page holds rows (tuples). */
export default function PageLayout() {
  const X = 190;
  const segs = [
    { label: 'header\n24 B', w: 78, fill: 'var(--accent-soft)', color: 'var(--accent)' },
    { label: 'item ptrs\n4 B each', w: 110, fill: 'var(--accent-soft)', color: 'var(--accent)' },
    { label: 'free\nspace', w: 112, fill: 'var(--surface)', color: 'var(--muted)' },
    { label: 'rows\n(tuples)', w: 230, fill: 'color-mix(in srgb, var(--warn) 14%, var(--bg))', color: 'var(--warn)' },
  ];
  let x = X;
  const bandY = 78;
  return (
    <SketchSvg width={720} height={350} label="Layout of one 8 kilobyte database page">
      <HandText x={4} y={16} size={17} weight={700} anchor="start">
        Table = file = array of pages
      </HandText>
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <SketchBox cx={66} cy={64 + k * 52} w={104} h={40} r={6} seed={seedOf('pg' + k)} stroke={k === 2 ? 'var(--accent)' : 'var(--fg)'} fill={k === 2 ? 'var(--accent-soft)' : 'var(--surface)'} fillStyle="solid" />
          <HandText x={66} y={64 + k * 52} size={16} color={k === 2 ? 'var(--accent)' : 'var(--fg)'}>
            {`page ${k}`}
          </HandText>
        </g>
      ))}
      <HandText x={66} y={270} size={15} color="var(--muted)">
        {'8 KB each\n(PostgreSQL)'}
      </HandText>
      <SketchArrow points={[[124, 168], [X - 8, bandY + 24]]} seed={seedOf('zoom')} stroke="var(--accent)" />

      <HandText x={X + 260} y={22} size={17} weight={700}>
        one page = 8,192 bytes
      </HandText>
      {segs.map((s, i) => {
        const cx = x + s.w / 2;
        x += s.w;
        return (
          <g key={i}>
            <SketchBox cx={cx} cy={bandY + 24} w={s.w - 4} h={70} r={4} seed={seedOf('seg' + i)} stroke={s.color} fill={s.fill} fillStyle="solid" />
            <HandText x={cx} y={bandY + 24} size={15} color={s.color} weight={600}>
              {s.label}
            </HandText>
          </g>
        );
      })}
      <HandText x={X + 140} y={bandY + 78} size={15} color="var(--muted)">
        grows right ↦
      </HandText>
      <HandText x={X + 400} y={bandY + 78} size={15} color="var(--muted)">
        ↤ grows left
      </HandText>

      <HandText x={X - 20} y={206} size={15.5} anchor="start">
        {'1) Each row gets a stable address: (page, slot).'}
      </HandText>
      <HandText x={X - 20} y={232} size={15.5} anchor="start">
        {'2) Rows may move inside the page. Only the pointer changes.'}
      </HandText>
      <HandText x={X - 20} y={258} size={15.5} anchor="start">
        {'3) The header stores the log position (LSN) of the last change.'}
      </HandText>
      <HandText x={X - 20} y={296} size={16} anchor="start" color="var(--accent)" weight={700}>
        {'The page is the unit of I/O.'}
      </HandText>
      <HandText x={X - 20} y={320} size={15.5} anchor="start" color="var(--accent)">
        {'To get one 200 B row you read a whole 8 KB page.'}
      </HandText>
    </SketchSvg>
  );
}
