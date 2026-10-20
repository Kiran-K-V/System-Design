import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { ENDPOINT, LLM_FIRST, NET, STT, TOOL_MS, breakEvenToolMs, withFiller, withoutFiller, type Run } from './Ai13VoiceGanttMath';

const X0 = 200;
const BAR_W = 490;
const ROW = 26;
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const ANSWER_SHOWN = 300;

interface Step {
  caption: string;
  tool: number;
  /** Show the run without filler, the run with filler, or both. */
  show: 'plain' | 'both';
  maxT: number;
}

const steps: Step[] = [
  {
    caption: `A turn that needs a tool. The caller asks for something the agent must look up. Endpointing, STT, and the network take ${ENDPOINT + STT + NET} ms. The model needs ${LLM_FIRST + 100} ms to write the tool call. The tool takes ${TOOL_MS} ms (illustrative). Then the model writes the answer and TTS speaks it. The caller hears nothing for ${fmt(withoutFiller(TOOL_MS).answerStart)} ms.`,
    tool: TOOL_MS,
    show: 'plain',
    maxT: 2400,
  },
  {
    caption: `Add filler. The model's first words are "Let me check that for you", so TTS can speak them at ${fmt(withFiller(TOOL_MS).firstSound)} ms, the same time as a normal reply. The tool runs underneath. The silence falls from ${fmt(withoutFiller(TOOL_MS).longestSilence)} ms to ${fmt(withFiller(TOOL_MS).firstSound)} ms, with a gap of 150 ms before the answer. The 1,100 ms filler clip length is an assumption.`,
    tool: TOOL_MS,
    show: 'both',
    maxT: 2400,
  },
  {
    caption: `A slow tool, 3,000 ms. The filler ends at 1,780 ms. The answer is ready at ${fmt(withFiller(3000).answerStart)} ms. That leaves ${fmt(withFiller(3000).longestSilence)} ms of silence in the middle. One filler line is not enough. Say a second line at the point where the first ends, or say what is happening.`,
    tool: 3000,
    show: 'both',
    maxT: 4400,
  },
  {
    caption: `A fast tool, 300 ms. The answer is ready at ${fmt(withoutFiller(300).answerStart)} ms, but the filler clip plays until 1,780 ms and the answer waits behind it. The filler costs ${fmt(withFiller(300).answerStart - withoutFiller(300).answerStart)} ms here. Break-even is a tool time of about ${breakEvenToolMs()} ms. Start filler only when the tool is likely to be slower than that.`,
    tool: 300,
    show: 'both',
    maxT: 2400,
  },
];

function Bar({ x, w, y, tone, dashed, label }: { x: number; w: number; y: number; tone: string; dashed?: boolean; label?: string }) {
  const ww = Math.max(w, 4);
  return (
    <g>
      <SketchBox cx={x + ww / 2} cy={y} w={ww} h={18} r={6} seed={seedOf(`vg${x}${y}${tone}`)} stroke={tone} fill={tone} dashed={dashed} strokeWidth={1.4} />
      {label && ww > 110 && (
        <HandText x={x + ww / 2} y={y} size={TEXT_SIZES.note} mono color="var(--fg)">
          {label}
        </HandText>
      )}
    </g>
  );
}

function Panel({ title, run, y0, scale, filler, tool }: { title: string; run: Run; y0: number; scale: number; filler: boolean; tool: number }) {
  const x = (t: number) => X0 + t * scale;
  const seg = (id: string) => run.segs.find((s) => s.id === id);
  const ep = seg('ep')!;
  const net = seg('net')!;
  const llm1 = seg('llm1')!;
  const toolSeg = seg('tool')!;
  const llm2 = seg('llm2')!;
  const tts2 = seg('tts2');
  const hearTo = filler ? 0 : run.answerStart;
  const rows = ['Hear the turn', 'LLM writes call', `Tool runs`, 'LLM, then TTS', 'Caller hears'];
  const y = (r: number) => y0 + 30 + r * ROW;
  const ready = tts2 ? tts2.start + tts2.dur : llm2.start + llm2.dur;
  return (
    <g>
      <HandText x={24} y={y0 + 8} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
        {title}
      </HandText>
      {rows.map((r, i) => (
        <HandText key={r} x={X0 - 12} y={y(i)} anchor="end" size={TEXT_SIZES.note} color={i === 4 ? 'var(--fg)' : 'var(--muted)'}>
          {r}
        </HandText>
      ))}
      <Bar x={x(ep.start)} w={(net.start + net.dur) * scale} y={y(0)} tone="var(--muted)" />
      <Bar x={x(llm1.start)} w={llm1.dur * scale} y={y(1)} tone="var(--muted)" />
      <Bar x={x(toolSeg.start)} w={toolSeg.dur * scale} y={y(2)} tone="var(--warn)" label={`${fmt(tool)} ms`} />
      <Bar x={x(llm2.start)} w={(ready - llm2.start) * scale} y={y(3)} tone="var(--muted)" />
      {filler ? (
        <>
          <Bar x={x(0)} w={run.firstSound * scale} y={y(4)} tone="var(--bad)" dashed label={`silence ${fmt(run.firstSound)}`} />
          {(() => {
            const f = seg('filler')!;
            return <Bar x={x(f.start)} w={f.dur * scale} y={y(4)} tone="var(--ok)" label="filler" />;
          })()}
          {(() => {
            const g = seg('gap');
            return g ? <Bar x={x(g.start)} w={g.dur * scale} y={y(4)} tone="var(--bad)" dashed label={`silence ${fmt(g.dur)}`} /> : null;
          })()}
          <Bar x={x(run.answerStart)} w={ANSWER_SHOWN * scale} y={y(4)} tone="var(--accent)" label="answer" />
        </>
      ) : (
        <>
          <Bar x={x(0)} w={hearTo * scale} y={y(4)} tone="var(--bad)" dashed label={`silence ${fmt(hearTo)} ms`} />
          <Bar x={x(run.answerStart)} w={ANSWER_SHOWN * scale} y={y(4)} tone="var(--accent)" label="answer" />
        </>
      )}
    </g>
  );
}

export default function Ai13VoiceGantt() {
  return (
    <AnimFrame title="One turn with a tool call: dead air with and without filler" steps={steps} interval={8000}>
      {(_, s) => {
        const scale = BAR_W / s.maxT;
        const plain = withoutFiller(s.tool);
        const fill = withFiller(s.tool);
        const ticks = s.maxT > 2500 ? [0, 1000, 2000, 3000, 4000] : [0, 500, 1000, 1500, 2000];
        const both = s.show === 'both';
        const axisY = both ? 392 : 190;
        return (
          <SketchSvg width={720} height={both ? 420 : 214} label={`Timeline of one voice turn with a tool call of ${s.tool} milliseconds, with and without filler speech`}>
            <Panel title="No filler" run={plain} y0={10} scale={scale} filler={false} tool={s.tool} />
            {both && <Panel title="With filler" run={fill} y0={200} scale={scale} filler tool={s.tool} />}
            {ticks.map((t) => (
              <HandText key={t} x={X0 + t * scale} y={axisY + 6} size={TEXT_SIZES.note} mono color="var(--muted)">
                {String(t)}
              </HandText>
            ))}
            <HandText x={X0 - 12} y={axisY + 6} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
              ms after the caller stops
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
