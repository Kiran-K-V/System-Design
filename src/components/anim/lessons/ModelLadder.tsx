import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: the consistency ladder, strongest at the top, with what each rung costs in availability. */
function Rung({ cx, cy, w, h = 54, title, sub, color, id, dashed, size = 16 }: { cx: number; cy: number; w: number; h?: number; title: string; sub?: string; color: string; id: string; dashed?: boolean; size?: number }) {
  return (
    <g>
      <SketchBox cx={cx} cy={cy} w={w} h={h} seed={seedOf(id)} stroke={color} dashed={dashed} />
      <HandText x={cx} y={sub ? cy - 10 : cy} size={size} weight={700} color={color}>
        {title}
      </HandText>
      {sub && (
        <HandText x={cx} y={cy + 12} size={14} color="var(--muted)">
          {sub}
        </HandText>
      )}
    </g>
  );
}

function Down({ x, y1, y2, id }: { x: number; y1: number; y2: number; id: string }) {
  return <SketchArrow points={[[x, y1], [x, y2]]} seed={seedOf(id)} stroke="var(--muted)" />;
}

export default function ModelLadder() {
  const bad = 'var(--bad)';
  const warn = 'var(--warn)';
  const ok = 'var(--ok)';
  return (
    <SketchSvg width={720} height={470} label="Ladder of consistency models from strict serializable down to eventual, with the availability cost of each">
      <HandText x={12} y={16} size={14} anchor="start" color="var(--muted)">
        Stronger at the top. Each rung implies the ones below.
      </HandText>

      <Rung id="ss" cx={215} cy={62} w={410} title="Strict serializable" sub="transactions, in real-time order" color={bad} />
      <Down x={215} y1={92} y2={112} id="d1" />
      <Rung id="lin" cx={215} cy={142} w={410} title="Linearizable" sub="one object, real-time order" color={bad} />
      <Down x={215} y1={172} y2={192} id="d2" />
      <Rung id="seq" cx={215} cy={222} w={410} title="Sequential" sub="one order for all; each client's order kept" color={bad} />
      <Down x={215} y1={252} y2={272} id="d3" />
      <Rung id="cau" cx={215} cy={302} w={410} title="Causal" sub="causes are seen before their effects" color={warn} />
      <Down x={76} y1={332} y2={352} id="d4a" />
      <Down x={215} y1={332} y2={352} id="d4b" />
      <Down x={354} y1={332} y2={352} id="d4c" />
      <Rung id="ryw" cx={76} cy={384} w={132} h={60} title={"Read your\nwrites"} color={warn} size={14} />
      <Rung id="mr" cx={215} cy={384} w={132} h={60} title={"Monotonic\nreads"} color={ok} size={14} />
      <Rung id="mw" cx={354} cy={384} w={132} h={60} title={"Monotonic\nwrites"} color={ok} size={14} />
      <Down x={215} y1={416} y2={434} id="d5" />
      <Rung id="ev" cx={215} cy={452} w={410} h={34} title="Eventual: replicas converge when writes stop" color="var(--muted)" dashed />

      {/* Availability brackets */}
      <SketchArrow points={[[438, 38], [438, 250]]} head="none" stroke={bad} strokeWidth={3} seed={seedOf('b1')} />
      <HandText x={452} y={144} size={16} anchor="start" color={bad} weight={700}>
        {'Cannot be totally or\nsticky available.'}
      </HandText>
      <HandText x={452} y={196} size={14} anchor="start" color="var(--muted)">
        {'During a partition, some\nnodes must stop answering.'}
      </HandText>

      <SketchArrow points={[[438, 280], [438, 328]]} head="none" stroke={warn} strokeWidth={3} seed={seedOf('b2')} />
      <HandText x={452} y={304} size={16} anchor="start" color={warn} weight={700}>
        Sticky available.
      </HandText>

      <SketchArrow points={[[438, 358], [438, 412]]} head="none" stroke={warn} strokeWidth={3} seed={seedOf('b3')} />
      <HandText x={452} y={374} size={14} anchor="start" color={warn}>
        Read your writes: sticky
      </HandText>
      <HandText x={452} y={398} size={14} anchor="start" color={ok}>
        Monotonic reads: totally
      </HandText>

      <HandText x={452} y={448} size={14} anchor="start" color="var(--muted)">
        {'Sticky: a client keeps\nusing the same server.'}
      </HandText>
    </SketchSvg>
  );
}
