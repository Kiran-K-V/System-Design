import AnimFrame from '../AnimFrame';
import { HandText, SketchSvg } from '../sketch';
import { Labeled } from '../data-kit';
import { hex, tag, varint } from './protoWire';

/** Step-through: how the number 150 in field 1 becomes the bytes 08 96 01. */

const VALUE = 150;
const bits8 = VALUE.toString(2).padStart(8, '0'); // 10010110
const lo7 = (VALUE % 128).toString(2).padStart(7, '0'); // 0010110
const hi7 = Math.floor(VALUE / 128).toString(2).padStart(7, '0'); // 0000001
const bytes = varint(VALUE); // [0x96, 0x01]
const tagBytes = tag(1, 0); // [0x08]

const steps = [
  { caption: 'A message has one field: int32 id = 1, and we set id to 150. Protobuf must turn "field 1 = 150" into bytes. It writes a tag (which field, and what type) and then the value.' },
  { caption: 'First, the value in binary: 150 = 128 + 16 + 4 + 2 = 10010110. That is 8 bits. A varint (variable-length integer) carries only 7 bits per byte, because the 8th bit has another job. So 150 needs 2 bytes.' },
  { caption: 'Split the bits into groups of 7, starting from the low end: the low group is 0010110 and the high group is 0000001. Small numbers fit in one group and cost 1 byte. This is why small ids are cheap.' },
  { caption: 'Write the low group first. In every byte except the last, set the top bit to 1. It means "more bytes follow". That gives 1 0010110 = 0x96 and 0 0000001 = 0x01. The reader stops at the first byte whose top bit is 0.' },
  { caption: 'Now the tag. It is (field number << 3) | wire type. Field 1, wire type 0 (varint): (1 << 3) | 0 = 8 = 0x08. The field name "id" is never sent. Both sides know field 1 from the .proto file.' },
  { caption: 'The whole field is 08 96 01: 3 bytes. In JSON the same data, "id":150, costs 8 bytes because the name is sent as text every time. To decode, a reader sums 7-bit groups in the reverse order: 0000001 0010110 = 150.' },
];

const CELL = 34;

function Row({ x, y, bits, flagFirst, tone }: { x: number; y: number; bits: string; flagFirst?: boolean; tone?: 'accent' | 'warn' | 'ok' | 'default' }) {
  return (
    <g>
      {bits.split('').map((b, i) => (
        <Labeled
          key={i}
          cx={x + i * CELL + CELL / 2}
          cy={y}
          w={CELL - 3}
          h={CELL}
          text={b}
          mono
          size={18}
          tone={flagFirst && i === 0 ? 'warn' : (tone ?? 'default')}
          fill={flagFirst && i === 0 ? 'var(--accent-soft)' : undefined}
          seedKey={`${x}-${y}-${i}`}
        />
      ))}
    </g>
  );
}

export default function VarintWalk() {
  return (
    <AnimFrame title="Protobuf: how 150 in field 1 becomes 08 96 01" steps={steps} interval={4200}>
      {(i) => (
        <SketchSvg width={720} height={230} label="Step by step encoding of the number 150 as a protobuf varint">
          {i === 0 && (
            <g>
              <HandText x={360} y={70} size={26} mono>
                int32 id = 1;
              </HandText>
              <HandText x={360} y={125} size={22}>
                set id = 150
              </HandText>
              <HandText x={360} y={180} size={15} color="var(--muted)">
                tag (which field + type), then value
              </HandText>
            </g>
          )}
          {i === 1 && (
            <g>
              <HandText x={360} y={32} size={18}>
                150 in binary
              </HandText>
              <Row x={360 - 4 * CELL} y={95} bits={bits8} />
              <HandText x={360} y={150} size={16} color="var(--muted)">
                128 + 16 + 4 + 2 = 150
              </HandText>
              <HandText x={360} y={190} size={16} color="var(--bad)">
                8 bits. One byte holds only 7 payload bits.
              </HandText>
            </g>
          )}
          {i === 2 && (
            <g>
              <HandText x={360} y={32} size={18}>
                regroup into 7 bits, low end first
              </HandText>
              <Row x={90} y={95} bits={hi7} />
              <Row x={390} y={95} bits={lo7} />
              <HandText x={90 + 3.5 * CELL} y={140} size={16} color="var(--muted)">
                high group
              </HandText>
              <HandText x={390 + 3.5 * CELL} y={140} size={16} color="var(--muted)">
                low group
              </HandText>
              <HandText x={360} y={195} size={16} color="var(--muted)">
                the low group is written first
              </HandText>
            </g>
          )}
          {i === 3 && (
            <g>
              <HandText x={360} y={32} size={18}>
                add the continuation bit (top bit)
              </HandText>
              <Row x={70} y={95} bits={'1' + lo7} flagFirst />
              <Row x={400} y={95} bits={'0' + hi7} flagFirst />
              <HandText x={70 + 4 * CELL} y={140} size={16} color="var(--ok)">{`byte 1 = 0x${hex(bytes[0])}`}</HandText>
              <HandText x={400 + 4 * CELL} y={140} size={16} color="var(--ok)">{`byte 2 = 0x${hex(bytes[1])}`}</HandText>
              <HandText x={70 + 4 * CELL} y={170} size={14} color="var(--warn)">
                1 = more bytes follow
              </HandText>
              <HandText x={400 + 4 * CELL} y={170} size={14} color="var(--warn)">
                0 = last byte
              </HandText>
            </g>
          )}
          {i === 4 && (
            <g>
              <HandText x={360} y={32} size={18}>
                tag = (field number &lt;&lt; 3) | wire type
              </HandText>
              <HandText x={360} y={85} size={22} mono>
                {`(1 << 3) | 0 = ${tagBytes[0]} = 0x${hex(tagBytes[0])}`}
              </HandText>
              <HandText x={360} y={140} size={16} color="var(--muted)">
                field number 1, wire type 0 = varint
              </HandText>
              <HandText x={360} y={185} size={16} color="var(--muted)">
                the name "id" is not on the wire
              </HandText>
            </g>
          )}
          {i === 5 && (
            <g>
              <Labeled cx={190} cy={80} w={90} h={56} text={hex(tagBytes[0])} mono size={26} tone="accent" seedKey="f-tag" />
              <Labeled cx={310} cy={80} w={90} h={56} text={hex(bytes[0])} mono size={26} tone="ok" seedKey="f-b1" />
              <Labeled cx={410} cy={80} w={90} h={56} text={hex(bytes[1])} mono size={26} tone="ok" seedKey="f-b2" />
              <HandText x={190} y={128} size={15} color="var(--accent)">
                tag
              </HandText>
              <HandText x={360} y={128} size={15} color="var(--ok)">
                varint(150)
              </HandText>
              <HandText x={560} y={70} size={22}>
                = 3 bytes
              </HandText>
              <HandText x={360} y={185} size={20} mono color="var(--muted)">
                {'"id":150'}
              </HandText>
              <HandText x={560} y={185} size={20} color="var(--bad)">
                = 8 bytes as JSON
              </HandText>
            </g>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
