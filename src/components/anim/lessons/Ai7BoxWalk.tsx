import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Row {
  layer: string;
  target: string;
  direct: boolean;
}

const ROWS: Row[] = [
  { layer: 'Process', target: 'Host kernel', direct: true },
  { layer: 'Container', target: 'Host kernel', direct: true },
  { layer: 'gVisor', target: 'Sentry', direct: false },
  { layer: 'microVM', target: 'Guest kernel', direct: false },
];

interface Step {
  caption: string;
  row: number;
  policy?: boolean;
}

const steps: Step[] = [
  { caption: 'A plain process. The agent code runs as your user. Its system calls go straight to the host kernel, and it can read whatever your user can read, including ~/.ssh and the environment variables of the parent. Nothing stops it.', row: 0 },
  { caption: 'A container. Namespaces and resource limits change what the process can see and use, but its system calls still reach the one host kernel. A kernel bug can break out. Fast and cheap, and the weakest of the boxes below.', row: 1 },
  { caption: 'gVisor. A user-space kernel written in Go. The Sentry answers the container\'s system calls itself. The gVisor docs say it does not pass system calls through to the host kernel. A Gofer process mediates file access. The price: higher cost per system call and some programs that do not run.', row: 2 },
  { caption: 'A microVM, such as Firecracker. A small virtual machine with its own guest kernel behind a hardware (KVM) boundary, plus a jailer as a second line of defense. Firecracker states under 125 ms boot and under 5 MiB overhead per VM. Those are vendor figures.', row: 3 },
  { caption: 'The box is only half of it. Inside any of them the policy decides the damage: no ambient credentials, an egress allow list, a limited file view, and time and memory caps. A strong box with your ~/.ssh mounted in it is still a leak.', row: -1, policy: true },
];

const Y = [70, 130, 190, 250];

export default function Ai7BoxWalk() {
  return (
    <AnimFrame title="Isolation layers, weakest to strongest" steps={steps} interval={5500}>
      {(_, s) => (
        <SketchSvg width={720} height={350} label="Four isolation layers: process, container, gVisor, microVM. Each row shows where the agent's system calls go.">
          <HandText x={110} y={24} size={TEXT_SIZES.heading} color="var(--muted)">
            Agent code runs in
          </HandText>
          <HandText x={380} y={24} size={TEXT_SIZES.heading} color="var(--muted)">
            Its system calls go to
          </HandText>
          <HandText x={620} y={24} size={TEXT_SIZES.heading} color="var(--muted)">
            Host
          </HandText>
          {ROWS.map((r, i) => {
            const on = s.row === i;
            const all = s.policy;
            const tone = on ? (r.direct ? 'var(--warn)' : 'var(--ok)') : undefined;
            return (
              <g key={r.layer}>
                <SketchBox cx={110} cy={Y[i]} w={150} h={44} r={8} seed={seedOf(`bl${i}`)} stroke={tone ?? 'var(--muted)'} fill={tone} dashed={!on && !all} strokeWidth={on ? 2.2 : 1.4} />
                <HandText x={110} y={Y[i]} size={TEXT_SIZES.label} color={on || all ? 'var(--fg)' : 'var(--muted)'}>
                  {r.layer}
                </HandText>
                <SketchArrow points={[[190, Y[i]], [290, Y[i]]]} stroke={on ? 'var(--accent)' : 'var(--border)'} strokeWidth={on ? 2.2 : 1.4} seed={seedOf(`ba${i}`)} />
                <SketchBox cx={380} cy={Y[i]} w={170} h={44} r={8} seed={seedOf(`bt${i}`)} stroke={on ? 'var(--accent)' : 'var(--muted)'} fill={on ? 'var(--accent)' : undefined} dashed={!on && !all} />
                <HandText x={380} y={Y[i]} size={TEXT_SIZES.label} color={on || all ? 'var(--fg)' : 'var(--muted)'}>
                  {r.target}
                </HandText>
                <SketchArrow points={[[470, Y[i]], [550, Y[i]]]} stroke={on ? (r.direct ? 'var(--warn)' : 'var(--ok)') : 'var(--border)'} strokeWidth={on ? 2.2 : 1.4} dashed={!r.direct} seed={seedOf(`bh${i}`)} />
                <HandText x={620} y={Y[i]} size={TEXT_SIZES.label} color={on ? (r.direct ? 'var(--warn)' : 'var(--ok)') : 'var(--muted)'}>
                  {r.direct ? 'direct' : 'filtered'}
                </HandText>
              </g>
            );
          })}
          {s.policy && (
            <g>
              <SketchBox cx={360} cy={316} w={640} h={44} r={8} seed={seedOf('bpol')} stroke="var(--accent)" fill="var(--accent)" strokeWidth={2.2} />
              <HandText x={360} y={316} size={TEXT_SIZES.label}>
                Policy: no ambient credentials, egress allow list, limited files, caps
              </HandText>
            </g>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
