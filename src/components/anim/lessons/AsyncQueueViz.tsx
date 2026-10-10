import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { TONE, type Tone } from '../FlowDiagram';

/**
 * Reusable picture of a queue: producer, buffer tray, workers, and a meter.
 * Static: it draws whatever props it is given. Animations and widgets pick the props per step.
 * Used by every lesson in Module 6.
 */

export interface QMsg {
  /** Short text inside the cell. One or two characters. */
  label: string;
  tone?: Tone;
  /** Drawn dashed: the message is in the queue but hidden from other workers. */
  hidden?: boolean;
}

export interface QWorker {
  label: string;
  state: 'idle' | 'busy' | 'down';
  msg?: QMsg;
}

export interface QMeter {
  /** Text under the bar. */
  label: string;
  /** 0 to 1. */
  fill: number;
  tone: Tone;
}

interface Props {
  /** Head of the queue first. The head is the cell next to the workers. */
  buffer: QMsg[];
  workers: QWorker[];
  /** Total messages waiting, when more than the tray can show. */
  depth?: number;
  producerNote?: string;
  producerTone?: Tone;
  meter?: QMeter;
  /** A second tray below the queue for failed messages. */
  dlq?: { items: QMsg[]; tone?: Tone };
  /** Which worker is the active element this step. */
  activeWorker?: number;
  /** Highlight the producer-to-queue arrow. */
  activeProducer?: boolean;
  trayLabel?: string;
  label?: string;
}

const W = 720;
const CELL = 26;
const PITCH = 30;
export const TRAY_CELLS = 10;
const TRAY_RIGHT = 462;
const TRAY_LEFT = TRAY_RIGHT - TRAY_CELLS * PITCH - 8;
const WORKER_X = 600;
const WORKER_W = 150;

function Cell({ cx, cy, m, seed }: { cx: number; cy: number; m: QMsg; seed: string }) {
  const color = TONE[m.tone ?? 'default'];
  const hidden = m.hidden;
  return (
    <g>
      <SketchBox
        cx={cx}
        cy={cy}
        w={CELL}
        h={CELL}
        r={6}
        seed={seedOf(seed)}
        stroke={hidden ? 'var(--warn)' : color}
        dashed={hidden}
        fill={m.tone && m.tone !== 'default' && !hidden ? color : undefined}
        fillStyle="solid"
      />
      <HandText x={cx} y={cy + 1} size={TEXT_SIZES.note} color={hidden ? 'var(--warn)' : 'var(--fg)'}>
        {m.label}
      </HandText>
    </g>
  );
}

export default function AsyncQueueViz({
  buffer,
  workers,
  depth,
  producerNote,
  producerTone,
  meter,
  dlq,
  activeWorker,
  activeProducer,
  trayLabel = 'Queue',
  label = 'A queue between a producer and workers',
}: Props) {
  const total = depth ?? buffer.length;
  const shown = buffer.slice(0, TRAY_CELLS);
  const trayY = 74;
  const workerTop = 74;
  const workerPitch = 56;
  const meterY = trayY + 60;
  const dlqY = meterY + 100;
  const workersBottom = workerTop + (workers.length - 1) * workerPitch + 30;
  const leftBottom = (dlq ? dlqY + 30 : meter ? meterY + 40 : trayY + 30) + 10;
  const H = Math.max(workersBottom, leftBottom) + 14;
  const trayW = TRAY_RIGHT - TRAY_LEFT;
  const trayCx = (TRAY_LEFT + TRAY_RIGHT) / 2;

  return (
    <SketchSvg width={W} height={H} label={label}>
      <HandText x={TRAY_LEFT} y={26} size={TEXT_SIZES.heading} anchor="start">
        {trayLabel}
      </HandText>
      <HandText x={TRAY_RIGHT} y={26} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">
        {`${total} waiting`}
      </HandText>

      <SketchBox cx={62} cy={trayY} w={96} h={44} seed={seedOf('prod')} stroke={TONE[producerTone ?? 'default']} />
      <HandText x={62} y={trayY} size={TEXT_SIZES.label}>
        Producer
      </HandText>
      {producerNote && (
        <HandText x={62} y={trayY + 40} size={TEXT_SIZES.note} color="var(--muted)">
          {producerNote}
        </HandText>
      )}
      <SketchArrow
        points={[[116, trayY], [TRAY_LEFT - 6, trayY]]}
        stroke={activeProducer ? 'var(--accent)' : 'var(--muted)'}
        strokeWidth={activeProducer ? 2.2 : 1.4}
        seed={seedOf('prod-arrow')}
      />

      <SketchBox cx={trayCx} cy={trayY} w={trayW} h={44} r={8} seed={seedOf('tray')} />
      {shown.map((m, i) => (
        <Cell key={i} cx={TRAY_RIGHT - 16 - i * PITCH} cy={trayY} m={m} seed={`cell-${i}`} />
      ))}
      {workers.map((w, i) => {
        const y = workerTop + i * workerPitch;
        const active = activeWorker === i;
        const stroke = w.state === 'down' ? 'var(--bad)' : active ? 'var(--accent)' : w.state === 'busy' ? 'var(--fg)' : 'var(--muted)';
        return (
          <g key={i}>
            <SketchArrow
              points={[[TRAY_RIGHT + 6, trayY], [WORKER_X - WORKER_W / 2 - 6, y]]}
              stroke={active ? 'var(--accent)' : 'var(--muted)'}
              strokeWidth={active ? 2.2 : 1.4}
              dashed={w.state === 'down'}
              seed={seedOf(`take-${i}`)}
            />
            <SketchBox
              cx={WORKER_X}
              cy={y}
              w={WORKER_W}
              h={44}
              seed={seedOf(`worker-${i}`)}
              stroke={stroke}
              strokeWidth={active ? 2.2 : 1.4}
              dashed={w.state === 'down'}
              fill={active ? 'var(--accent-soft)' : undefined}
              fillStyle="solid"
            />
            <HandText x={w.msg ? WORKER_X + 18 : WORKER_X} y={y} size={TEXT_SIZES.label} color={w.state === 'down' ? 'var(--bad)' : 'var(--fg)'}>
              {w.state === 'down' ? `${w.label} down` : w.label}
            </HandText>
            {w.msg && <Cell cx={WORKER_X - WORKER_W / 2 + 22} cy={y} m={w.msg} seed={`wm-${i}`} />}
          </g>
        );
      })}

      {meter && (
        <g>
          <SketchBox cx={trayCx} cy={meterY} w={trayW} h={14} r={6} seed={seedOf('meter')} stroke="var(--muted)" strokeWidth={1.4} />
          {meter.fill > 0 && (
            <SketchBox
              cx={TRAY_LEFT + (trayW * Math.min(1, meter.fill)) / 2}
              cy={meterY}
              w={Math.max(12, trayW * Math.min(1, meter.fill))}
              h={14}
              r={6}
              seed={seedOf('meter-fill')}
              stroke={TONE[meter.tone]}
              fill={TONE[meter.tone]}
              fillStyle="solid"
            />
          )}
          <HandText x={TRAY_LEFT} y={meterY + 26} size={TEXT_SIZES.note} anchor="start" color={TONE[meter.tone]}>
            {meter.label}
          </HandText>
        </g>
      )}

      {dlq && (
        <g>
          <HandText x={TRAY_LEFT} y={dlqY - 30} size={TEXT_SIZES.heading} anchor="start" color={dlq.items.length ? 'var(--bad)' : 'var(--muted)'}>
            Dead-letter queue
          </HandText>
          <SketchBox cx={TRAY_LEFT + 94} cy={dlqY} w={180} h={44} r={8} seed={seedOf('dlq')} stroke={TONE[dlq.tone ?? (dlq.items.length ? 'bad' : 'muted')]} dashed={dlq.items.length === 0} />
          {dlq.items.slice(0, 5).map((m, i) => (
            <Cell key={i} cx={TRAY_LEFT + 24 + i * PITCH} cy={dlqY} m={m} seed={`dlq-${i}`} />
          ))}
        </g>
      )}
    </SketchSvg>
  );
}
