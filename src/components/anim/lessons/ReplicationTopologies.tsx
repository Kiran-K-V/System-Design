import { HandText, SketchArrow, SketchBox, SketchCylinder, SketchSvg, seedOf } from '../sketch';

/** Static infographic: three ways to arrange copies. */
function Node({ cx, cy, w = 96, h = 54, text, id, color }: { cx: number; cy: number; w?: number; h?: number; text: string; id: string; color?: string }) {
  return (
    <g>
      <SketchCylinder cx={cx} cy={cy} w={w} h={h} seed={seedOf(id)} stroke={color} />
      <HandText x={cx} y={cy + 2} size={14} color={color}>
        {text}
      </HandText>
    </g>
  );
}

function Title({ x, text }: { x: number; text: string }) {
  return (
    <HandText x={x} y={24} size={18} weight={700}>
      {text}
    </HandText>
  );
}

export default function ReplicationTopologies() {
  return (
    <SketchSvg width={720} height={350} label="Three replication layouts: single leader, multi-leader, and leaderless">
      {/* Panel dividers */}
      <SketchArrow points={[[240, 14], [240, 335]]} head="none" dashed stroke="var(--muted)" strokeWidth={1} seed={seedOf('div1')} />
      <SketchArrow points={[[480, 14], [480, 335]]} head="none" dashed stroke="var(--muted)" strokeWidth={1} seed={seedOf('div2')} />

      {/* 1. Single leader */}
      <Title x={120} text="Single leader" />
      <HandText x={120} y={58} size={14} color="var(--accent)">
        all writes
      </HandText>
      <SketchArrow points={[[120, 68], [120, 92]]} seed={seedOf('s-in')} stroke="var(--accent)" />
      <Node id="s-l" cx={120} cy={122} w={110} text="Leader" color="var(--accent)" />
      <SketchArrow points={[[96, 152], [62, 202]]} seed={seedOf('s-a')} dashed />
      <SketchArrow points={[[144, 152], [178, 202]]} seed={seedOf('s-b')} dashed />
      <Node id="s-f1" cx={54} cy={230} w={84} text="Follower" />
      <Node id="s-f2" cx={186} cy={230} w={84} text="Follower" />
      <HandText x={120} y={300} size={14} color="var(--muted)">
        {'One write order.\nNeeds failover.\nPostgreSQL, MySQL'}
      </HandText>

      {/* 2. Multi-leader */}
      <Title x={360} text="Multi-leader" />
      <HandText x={300} y={58} size={14} color="var(--accent)">
        region A writes
      </HandText>
      <HandText x={425} y={80} size={14} color="var(--accent)">
        region B writes
      </HandText>
      <Node id="m-l1" cx={300} cy={122} w={96} text="Leader A" color="var(--accent)" />
      <Node id="m-l2" cx={420} cy={142} w={96} text="Leader B" color="var(--accent)" />
      <SketchArrow points={[[350, 128], [370, 136]]} head="both" seed={seedOf('m-x')} stroke="var(--warn)" />
      <SketchArrow points={[[300, 152], [300, 202]]} seed={seedOf('m-a')} dashed />
      <SketchArrow points={[[420, 172], [420, 222]]} seed={seedOf('m-b')} dashed />
      <Node id="m-f1" cx={300} cy={230} w={84} text="Follower" />
      <Node id="m-f2" cx={420} cy={250} w={84} text="Follower" />
      <HandText x={360} y={308} size={14} color="var(--muted)">
        {'Local writes in each region.\nConflicts must be merged.'}
      </HandText>

      {/* 3. Leaderless */}
      <Title x={600} text="Leaderless" />
      <HandText x={600} y={58} size={14} color="var(--accent)">
        write to W of N
      </HandText>
      <SketchArrow points={[[570, 68], [545, 110]]} seed={seedOf('l-a')} stroke="var(--accent)" />
      <SketchArrow points={[[600, 68], [600, 110]]} seed={seedOf('l-b')} stroke="var(--accent)" />
      <SketchArrow points={[[630, 68], [655, 110]]} seed={seedOf('l-c')} stroke="var(--accent)" />
      <Node id="l-1" cx={540} cy={140} w={84} text="Node 1" />
      <Node id="l-2" cx={600} cy={214} w={84} text="Node 2" />
      <Node id="l-3" cx={660} cy={140} w={84} text="Node 3" />
      <SketchArrow points={[[583, 140], [617, 140]]} head="both" dashed seed={seedOf('l-12')} stroke="var(--muted)" />
      <SketchArrow points={[[560, 164], [585, 190]]} head="both" dashed seed={seedOf('l-13')} stroke="var(--muted)" />
      <SketchArrow points={[[640, 164], [615, 190]]} head="both" dashed seed={seedOf('l-23')} stroke="var(--muted)" />
      <HandText x={600} y={296} size={14} color="var(--muted)">
        {'No failover. Quorum reads.\nConflicts must be merged.\nDynamo, Cassandra'}
      </HandText>
    </SketchSvg>
  );
}
