import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: a table is a file of fixed-size pages. A page holds rows (tuples). */
export default function PageLayout() {
  const X = 330;
  const W = 540;
  const Y = 40;
  const H = 280;
  const segs = [
    { label: 'header\n24 B', w: 70, fill: 'var(--accent-soft)', color: 'var(--accent)' },
    { label: 'item pointers\n4 B each →', w: 120, fill: 'var(--accent-soft)', color: 'var(--accent)' },
    { label: 'free space', w: 140, fill: 'var(--surface)', color: 'var(--muted)' },
    { label: '← rows\n(tuples)', w: 210, fill: 'color-mix(in srgb, var(--warn) 14%, var(--bg))', color: 'var(--warn)' },
  ];
  let x = X;
  const bandY = Y + 70;
  return (
    <SketchSvg width={900} height={H} label="Layout of one 8 kilobyte database page">
      <HandText x={14} y={22} size={16} weight={700} anchor="start">
        Table = file = array of pages
      </HandText>
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <SketchBox cx={70} cy={70 + k * 52} w={110} h={40} r={6} seed={seedOf('pg' + k)} stroke={k === 2 ? 'var(--accent)' : 'var(--fg)'} fill={k === 2 ? 'var(--accent-soft)' : 'var(--surface)'} fillStyle="solid" />
          <HandText x={70} y={70 + k * 52} size={14} color={k === 2 ? 'var(--accent)' : 'var(--fg)'}>
            {`page ${k}`}
          </HandText>
        </g>
      ))}
      <HandText x={70} y={258} size={13} color="var(--muted)">
        8 KB each (PostgreSQL)
      </HandText>
      <SketchArrow points={[[130, 174], [X - 8, bandY + 20]]} seed={seedOf('zoom')} stroke="var(--accent)" />
      <HandText x={190} y={130} size={13} color="var(--accent)" anchor="middle">
        zoom in
      </HandText>

      <HandText x={X + W / 2} y={Y + 8} size={15} weight={700}>
        one page, 8,192 bytes
      </HandText>
      {segs.map((s, i) => {
        const cx = x + s.w / 2;
        x += s.w;
        return (
          <g key={i}>
            <SketchBox cx={cx} cy={bandY + 22} w={s.w - 4} h={64} r={4} seed={seedOf('seg' + i)} stroke={s.color} fill={s.fill} fillStyle="solid" />
            <HandText x={cx} y={bandY + 22} size={13.5} color={s.color} weight={600}>
              {s.label}
            </HandText>
          </g>
        );
      })}
      <HandText x={X + 150} y={bandY + 64} size={12.5} color="var(--muted)">
        grow right ↦
      </HandText>
      <HandText x={X + W - 105} y={bandY + 64} size={12.5} color="var(--muted)">
        ↤ grow left
      </HandText>

      <HandText x={X} y={bandY + 108} size={14} anchor="start">
        {'1) The pointer array gives each row a stable slot number: (page, slot).'}
      </HandText>
      <HandText x={X} y={bandY + 130} size={14} anchor="start">
        {'2) Rows can move inside the page. Only the pointer changes.'}
      </HandText>
      <HandText x={X} y={bandY + 152} size={14} anchor="start">
        {'3) The header stores the log position of the last change (LSN).'}
      </HandText>
      <HandText x={X} y={bandY + 174} size={14} anchor="start" color="var(--accent)">
        {'The page is the unit of I/O: you read 8 KB to get one 200 B row.'}
      </HandText>
    </SketchSvg>
  );
}
