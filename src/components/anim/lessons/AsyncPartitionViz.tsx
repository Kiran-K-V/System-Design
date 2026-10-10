import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { TONE } from '../FlowDiagram';

/**
 * Reusable picture of a partitioned log and a consumer group.
 * Static: it draws the props. Animations and widgets choose the props per step.
 */

export interface LogCell {
  /** The record's key, one character. */
  key: string;
  /** consumed: a consumer read it and committed. next: the consumer reads it next. Omit for unread. */
  state?: 'consumed' | 'next';
}

export interface PartitionRow {
  cells: LogCell[];
  /** Highlight the producer arrow into this partition. */
  incoming?: boolean;
}

export interface GroupMember {
  name: string;
  /** Partition numbers this consumer owns. */
  owns: number[];
  state?: 'ok' | 'down' | 'new';
}

interface Props {
  partitions: PartitionRow[];
  members: GroupMember[];
  groupName?: string;
  label?: string;
}

const W = 720;
const ROW = 48;
const CELLS = 8;
const PITCH = 32;
const STRIP_X = 168;
const MEMBER_X = 604;
const MEMBER_W = 140;

export default function AsyncPartitionViz({ partitions, members, groupName = 'Consumer group', label = 'A topic with partitions and a consumer group' }: Props) {
  const rows = partitions.length;
  const span = Math.max(rows * ROW, members.length * ROW);
  const H = span + 96;
  const mid = 56 + span / 2;
  const rowY = (i: number) => mid - (rows * ROW) / 2 + ROW / 2 + i * ROW;
  const memberY = (i: number) => mid - (members.length * ROW) / 2 + ROW / 2 + i * ROW;
  const owner = new Map<number, number>();
  members.forEach((m, mi) => m.owns.forEach((p) => owner.set(p, mi)));
  const stripRight = STRIP_X + CELLS * PITCH;

  return (
    <SketchSvg width={W} height={H} label={label}>
      <HandText x={STRIP_X} y={22} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
        offset 0 →
      </HandText>
      <HandText x={MEMBER_X} y={22} size={TEXT_SIZES.heading} color="var(--muted)">
        {groupName}
      </HandText>

      <SketchBox cx={52} cy={mid} w={84} h={44} seed={seedOf('pv-prod')} />
      <HandText x={52} y={mid} size={TEXT_SIZES.label}>
        Producer
      </HandText>

      <SketchBox cx={MEMBER_X} cy={mid + 6} w={MEMBER_W + 36} h={span + 24} r={16} dashed stroke="var(--muted)" seed={seedOf('pv-group')} />

      {partitions.map((p, i) => {
        const y = rowY(i);
        const o = owner.get(i);
        const orphan = o === undefined;
        return (
          <g key={i}>
            <SketchArrow
              points={[[98, mid], [STRIP_X - 48, y]]}
              head="end"
              stroke={p.incoming ? 'var(--accent)' : 'var(--muted)'}
              strokeWidth={p.incoming ? 2.2 : 1.4}
              seed={seedOf(`pv-in-${i}`)}
            />
            <HandText x={STRIP_X - 20} y={y} size={TEXT_SIZES.note} color="var(--muted)">
              {`P${i}`}
            </HandText>
            <SketchBox cx={STRIP_X + (CELLS * PITCH) / 2 - 2} cy={y} w={CELLS * PITCH + 4} h={34} r={6} seed={seedOf(`pv-strip-${i}`)} dashed={orphan} stroke={orphan ? 'var(--bad)' : 'var(--fg)'} />
            {p.cells.slice(0, CELLS).map((c, k) => {
              const cx = STRIP_X + 14 + k * PITCH - 2;
              const color = c.state === 'consumed' ? 'var(--ok)' : c.state === 'next' ? 'var(--accent)' : 'var(--muted)';
              return (
                <g key={k}>
                  <SketchBox
                    cx={cx}
                    cy={y}
                    w={26}
                    h={26}
                    r={6}
                    seed={seedOf(`pv-cell-${i}-${k}`)}
                    stroke={color}
                    strokeWidth={c.state === 'next' ? 2.2 : 1.4}
                    fill={c.state === 'consumed' ? 'var(--ok)' : undefined}
                    fillStyle="solid"
                  />
                  <HandText x={cx} y={y + 1} size={TEXT_SIZES.note}>
                    {c.key}
                  </HandText>
                </g>
              );
            })}
            {o !== undefined && (
              <SketchArrow
                points={[[stripRight + 6, y], [MEMBER_X - MEMBER_W / 2 - 6, memberY(o)]]}
                stroke={members[o].state === 'down' ? 'var(--bad)' : 'var(--muted)'}
                seed={seedOf(`pv-own-${i}`)}
              />
            )}
          </g>
        );
      })}

      {members.map((m, i) => {
        const y = memberY(i);
        const idle = m.owns.length === 0 && m.state !== 'down';
        return (
          <g key={i}>
            <SketchBox
              cx={MEMBER_X}
              cy={y}
              w={MEMBER_W}
              h={44}
              seed={seedOf(`pv-m-${m.name}`)}
              stroke={m.state === 'down' ? 'var(--bad)' : m.state === 'new' ? 'var(--ok)' : idle ? 'var(--muted)' : 'var(--fg)'}
              dashed={m.state === 'down' || idle}
              fill={m.state === 'new' ? TONE.ok : undefined}
              fillStyle="solid"
            />
            <HandText x={MEMBER_X} y={y} size={TEXT_SIZES.label} color={m.state === 'down' ? 'var(--bad)' : idle ? 'var(--muted)' : 'var(--fg)'}>
              {m.state === 'down' ? `${m.name} down` : idle ? `${m.name} idle` : m.name}
            </HandText>
          </g>
        );
      })}
      <HandText x={STRIP_X} y={H - 14} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
        green: committed · bold outline: read next · grey: unread
      </HandText>
    </SketchSvg>
  );
}
