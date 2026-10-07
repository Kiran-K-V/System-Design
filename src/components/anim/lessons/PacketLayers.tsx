import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

const layers = [
  { y: 45, name: 'Application', sub: 'HTTP, DNS, your code', note: 'what the bytes\nmean', color: 'var(--fg)' },
  { y: 115, name: 'Transport', sub: 'TCP or UDP', note: 'which process:\nthe port', color: 'var(--accent)' },
  { y: 185, name: 'Internet', sub: 'IP', note: 'which machine:\nthe address', color: 'var(--ok)' },
  { y: 255, name: 'Link', sub: 'Ethernet, Wi-Fi', note: 'one hop only', color: 'var(--warn)' },
];

/** Static infographic: the four layers, and how one packet nests headers around data. */
export default function PacketLayers() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={720} height={312} label="Four network layers on the left. On the right, one Ethernet frame holding an IP packet, which holds a TCP segment, which holds data.">
        {layers.map((l, i) => (
          <g key={l.name}>
            <SketchBox cx={92} cy={l.y} w={170} h={54} stroke={l.color} seed={seedOf('layer' + l.name)} />
            <HandText x={92} y={l.y - 8} size={17}>
              {l.name}
            </HandText>
            <HandText x={92} y={l.y + 13} size={13} color="var(--muted)">
              {l.sub}
            </HandText>
            <HandText x={186} y={l.y} size={14} anchor="start" color={l.color}>
              {l.note}
            </HandText>
            {i < layers.length - 1 && (
              <SketchArrow points={[[92, l.y + 29], [92, layers[i + 1].y - 29]]} head="end" stroke="var(--muted)" seed={seedOf('la' + i)} />
            )}
          </g>
        ))}

        <SketchBox cx={510} cy={150} w={420} h={270} stroke={layers[3].color} seed={seedOf('frame')} r={14} />
        <HandText x={312} y={34} size={14} anchor="start" color={layers[3].color}>
          Ethernet frame (carries at most 1,500 B: the MTU)
        </HandText>
        <SketchBox cx={510} cy={168} w={396} h={215} stroke={layers[2].color} seed={seedOf('ip')} r={12} />
        <HandText x={326} y={78} size={14} anchor="start" color={layers[2].color}>
          IP packet: 20 B header (addresses)
        </HandText>
        <SketchBox cx={510} cy={186} w={372} h={160} stroke={layers[1].color} seed={seedOf('tcp')} r={10} />
        <HandText x={340} y={122} size={14} anchor="start" color={layers[1].color}>
          TCP segment: 20 B header (ports, seq, ack)
        </HandText>
        <SketchBox cx={510} cy={208} w={340} h={84} stroke="var(--fg)" seed={seedOf('data')} r={8} />
        <HandText x={510} y={196} size={17}>
          your data
        </HandText>
        <HandText x={510} y={221} size={14} color="var(--muted)">
          up to 1,460 B (MSS = 1,500 - 20 - 20)
        </HandText>
        <HandText x={510} y={299} size={14} color="var(--muted)">
          With UDP the header is 8 B, so up to 1,472 B of data
        </HandText>
      </SketchSvg>
    </figure>
  );
}
