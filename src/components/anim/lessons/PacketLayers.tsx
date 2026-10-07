import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

const layers = [
  { y: 52, name: 'Application', sub: 'HTTP, DNS, your code', note: 'what the bytes mean', color: 'var(--fg)' },
  { y: 132, name: 'Transport', sub: 'TCP or UDP', note: 'which process:\nthe port', color: 'var(--accent)' },
  { y: 212, name: 'Internet', sub: 'IP', note: 'which machine:\nthe address', color: 'var(--ok)' },
  { y: 292, name: 'Link', sub: 'Ethernet, Wi-Fi', note: 'one hop only', color: 'var(--warn)' },
];

/** Static infographic: the four layers, and how one packet nests headers around data. */
export default function PacketLayers() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={900} height={350} label="Four network layers on the left. On the right, one Ethernet frame holding an IP packet, which holds a TCP segment, which holds data.">
        {layers.map((l, i) => (
          <g key={l.name}>
            <SketchBox cx={125} cy={l.y} w={220} h={58} stroke={l.color} seed={seedOf('layer' + l.name)} />
            <HandText x={125} y={l.y - 9} size={18}>
              {l.name}
            </HandText>
            <HandText x={125} y={l.y + 13} size={13} color="var(--muted)">
              {l.sub}
            </HandText>
            <HandText x={250} y={l.y} size={14} anchor="start" color={l.color}>
              {l.note}
            </HandText>
            {i < layers.length - 1 && (
              <SketchArrow points={[[125, l.y + 31], [125, layers[i + 1].y - 31]]} head="end" stroke="var(--muted)" seed={seedOf('la' + i)} />
            )}
          </g>
        ))}

        <SketchBox cx={655} cy={175} w={470} h={300} stroke={layers[3].color} seed={seedOf('frame')} r={14} />
        <HandText x={430} y={42} size={15} anchor="start" color={layers[3].color}>
          Ethernet frame (carries at most 1,500 B: the MTU)
        </HandText>
        <SketchBox cx={655} cy={196} w={440} h={240} stroke={layers[2].color} seed={seedOf('ip')} r={12} />
        <HandText x={450} y={94} size={15} anchor="start" color={layers[2].color}>
          IP packet: 20 B header (addresses)
        </HandText>
        <SketchBox cx={655} cy={216} w={410} h={180} stroke={layers[1].color} seed={seedOf('tcp')} r={10} />
        <HandText x={470} y={144} size={15} anchor="start" color={layers[1].color}>
          TCP segment: 20 B header (ports, seq, ack)
        </HandText>
        <SketchBox cx={655} cy={240} w={380} h={90} stroke="var(--fg)" seed={seedOf('data')} r={8} />
        <HandText x={655} y={232} size={17}>
          your data
        </HandText>
        <HandText x={655} y={256} size={14} color="var(--muted)">
          up to 1,460 B (MSS = 1,500 - 20 - 20)
        </HandText>
        <HandText x={655} y={334} size={14} color="var(--muted)">
          With UDP the header is 8 B, so up to 1,472 B of data
        </HandText>
      </SketchSvg>
    </figure>
  );
}
