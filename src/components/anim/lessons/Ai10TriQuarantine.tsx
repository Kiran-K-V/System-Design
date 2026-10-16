import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Static diagram of the dual LLM pattern (Willison 2023; Beurer-Kellner et al. 2025, arXiv 2506.08837) and the symbolic-variable idea that CaMeL builds on. Names are illustrative. */
export default function Ai10TriQuarantine() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-2xl border border-line bg-surface/40 p-2">
      <SketchSvg width={720} height={330} label="Dual LLM pattern: a privileged model plans and calls tools, a quarantined model reads untrusted text, and plain code passes variables between them.">
        <HandText x={20} y={24} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
          Dual LLM: the model that reads attacker text has no tools
        </HandText>
        <SketchBox cx={65} cy={120} w={100} h={60} r={8} seed={seedOf('qUser')} />
        <HandText x={65} y={120} size={TEXT_SIZES.label}>{'User\nrequest'}</HandText>
        <SketchBox cx={245} cy={120} w={140} h={60} r={8} seed={seedOf('qPriv')} stroke="var(--ok)" fill="var(--ok)" />
        <HandText x={245} y={120} size={TEXT_SIZES.label}>{'Privileged\nLLM'}</HandText>
        <SketchBox cx={420} cy={120} w={130} h={60} r={8} seed={seedOf('qOrch')} stroke="var(--accent)" fill="var(--accent-soft)" strokeWidth={2.2} />
        <HandText x={420} y={120} size={TEXT_SIZES.label}>{'Plain code\n(orchestrator)'}</HandText>
        <SketchBox cx={620} cy={120} w={140} h={60} r={8} seed={seedOf('qQuar')} stroke="var(--bad)" fill="var(--bad)" />
        <HandText x={620} y={120} size={TEXT_SIZES.label}>{'Quarantined\nLLM'}</HandText>

        <SketchArrow seed={seedOf('riQuar1')} points={[[121, 120], [169, 120]]} />
        <SketchArrow seed={seedOf('riQuar2')} points={[[321, 120], [349, 120]]} head="both" />
        <SketchArrow seed={seedOf('riQuar3')} points={[[491, 120], [544, 120]]} head="both" />
        <HandText x={335} y={72} size={TEXT_SIZES.note} color="var(--muted)">$VAR1</HandText>
        <HandText x={518} y={72} size={TEXT_SIZES.note} color="var(--muted)">text</HandText>

        <SketchBox cx={420} cy={250} w={150} h={50} r={8} seed={seedOf('qTools')} />
        <HandText x={420} y={250} size={TEXT_SIZES.label}>Tools</HandText>
        <SketchArrow seed={seedOf('riQuar4')} points={[[420, 152], [420, 220]]} />
        <HandText x={436} y={190} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">send($VAR1)</HandText>

        <SketchBox cx={620} cy={250} w={150} h={50} r={8} seed={seedOf('qUntr')} stroke="var(--bad)" dashed />
        <HandText x={620} y={250} size={TEXT_SIZES.label} color="var(--bad)">Untrusted data</HandText>
        <SketchArrow seed={seedOf('riQuar5')} points={[[620, 222], [620, 154]]} stroke="var(--bad)" />

        <HandText x={245} y={190} size={TEXT_SIZES.note} color="var(--muted)">never sees</HandText>
        <HandText x={245} y={210} size={TEXT_SIZES.note} color="var(--muted)">the raw text</HandText>
      </SketchSvg>
      <figcaption className="px-3 pb-3 pt-1 text-[0.95rem] leading-relaxed">
        The quarantined model reads the hostile text and returns a variable. The privileged model only handles the name <span className="font-mono">$VAR1</span>. Plain code swaps in the real value when a tool runs.
      </figcaption>
    </figure>
  );
}
