import { motion } from 'motion/react';
import { TONE, type Tone } from './FlowDiagram';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from './sketch';

export interface SeqMessage {
  from: string;
  to: string;
  label: string;
  tone?: Tone;
  /** The message never arrives. Drawn half way with a cross. */
  lost?: boolean;
  /** A note on the actor instead of an arrow. Use from === to. */
  note?: boolean;
}

interface Props {
  actors: string[];
  messages: SeqMessage[];
  /** Number of messages to show. The last shown one animates in. */
  visible: number;
  width?: number;
}

const HEAD = 52;
const ROW = 46;

export default function SequenceDiagram({ actors, messages, visible, width = 640 }: Props) {
  const height = HEAD + 24 + messages.length * ROW;
  const gap = width / actors.length;
  const xOf = (a: string) => gap * actors.indexOf(a) + gap / 2;

  return (
    <SketchSvg width={width} height={height}>
      {actors.map((a) => (
        <g key={a}>
          <SketchBox cx={xOf(a)} cy={24} w={Math.min(130, gap - 16)} h={38} r={10} seed={seedOf(a)} />
          <HandText x={xOf(a)} y={24} size={15}>
            {a}
          </HandText>
          <SketchArrow points={[[xOf(a), 46], [xOf(a), height - 4]]} head="none" dashed stroke="var(--muted)" strokeWidth={1} seed={seedOf(a + 'life')} />
        </g>
      ))}

      {messages.slice(0, visible).map((m, i) => {
        const y = HEAD + 26 + i * ROW;
        const color = TONE[m.tone ?? 'default'];
        const isNew = i === visible - 1;
        const x1 = xOf(m.from);
        const full = xOf(m.to);
        const dir = Math.sign(full - x1) || 1;
        const x2 = m.lost ? x1 + (full - x1) / 2 : full - dir * 4;
        const seed = seedOf(`${i}:${m.label}`);

        return (
          <motion.g
            key={i}
            initial={isNew ? { opacity: 0, x: -dir * 24 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {m.note || m.from === m.to ? (
              <>
                <SketchBox cx={x1} cy={y} w={Math.min(200, gap * 1.6)} h={30} r={6} seed={seed} stroke={color} fill="var(--surface)" fillStyle="solid" />
                <HandText x={x1} y={y} size={13} color={color}>
                  {m.label}
                </HandText>
              </>
            ) : (
              <>
                <SketchArrow points={[[x1 + dir * 4, y], [x2, y]]} head={m.lost ? 'none' : 'end'} stroke={color} seed={seed} />
                {m.lost && (
                  <HandText x={x2 + dir * 8} y={y} size={20} weight={700} color="var(--bad)">
                    ✕
                  </HandText>
                )}
                <HandText x={(x1 + full) / 2} y={y - 13} size={13} color={color}>
                  {m.label}
                </HandText>
              </>
            )}
          </motion.g>
        );
      })}
    </SketchSvg>
  );
}
