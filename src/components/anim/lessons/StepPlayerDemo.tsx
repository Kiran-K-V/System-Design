import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

const steps = [
  { caption: 'This is a step player. The diagram shows one idea. The caption below it explains that idea. Use Play to run all steps, Previous and Next to move one step, and Restart to go back to step 1.' },
  { caption: 'The dots in the header and the slider under the caption both jump to a step. Drag the slider to scrub back and forth. Every step is a pure function of its number, so jumping never breaks the picture.' },
  { caption: 'Speed changes how fast Play runs: 0.5x, 1x, or 2x. For keyboard use, click the figure once, then press Left and Right to step and Space to play or pause.' },
];

const flow = ['Question', 'Guess', 'Check'];

function Ctl({ cx, w, label, on, seed }: { cx: number; w: number; label: string; on: boolean; seed: string }) {
  return (
    <g>
      <SketchBox cx={cx} cy={210} w={w} h={44} r={10} seed={seedOf(seed)} stroke={on ? 'var(--accent)' : 'var(--muted)'} strokeWidth={on ? 2.4 : 1.2} fill={on ? 'var(--accent)' : undefined} fillStyle="solid" />
      <HandText x={cx} y={211} size={15} color={on ? '#fff' : 'var(--muted)'}>{label}</HandText>
    </g>
  );
}

export default function StepPlayerDemo() {
  return (
    <AnimFrame title="Try the controls (a 3-step demo)" steps={steps}>
      {(i) => (
        <SketchSvg width={720} height={300} label="A miniature step player with a three-box flow and a drawn control bar">
          {flow.map((f, k) => (
            <g key={f}>
              <SketchBox cx={150 + k * 210} cy={55} w={130} h={56} seed={seedOf('f' + k)} stroke={k === i ? 'var(--accent)' : 'var(--muted)'} strokeWidth={k === i ? 2.6 : 1.2} fill={k === i ? 'var(--accent)' : undefined} fillStyle="hachure" />
              <HandText x={150 + k * 210} y={56} size={17} halo weight={k === i ? 700 : 400} color={k === i ? 'var(--fg)' : 'var(--muted)'}>{f}</HandText>
            </g>
          ))}
          {[0, 1].map((k) => (
            <SketchArrow key={k} points={[[222 + k * 210, 55], [288 + k * 210, 55]]} seed={seedOf('fa' + k)} stroke="var(--muted)" />
          ))}

          {i === 2 && (
            <g>
              {[['←', 250], ['→', 310], ['Space', 400]].map(([k, x]) => (
                <g key={k}>
                  <SketchBox cx={+x} cy={125} w={k === 'Space' ? 100 : 46} h={40} r={8} seed={seedOf('k' + k)} stroke="var(--accent)" strokeWidth={2} />
                  <HandText x={+x} y={126} size={16}>{String(k)}</HandText>
                </g>
              ))}
              <HandText x={590} y={125} size={14} color="var(--accent)">{'focus the figure first'}</HandText>
            </g>
          )}

          <Ctl cx={70} w={92} label="Play" on={i === 0} seed="play" />
          <Ctl cx={145} w={46} label="‹" on={i === 0} seed="prev" />
          <Ctl cx={200} w={46} label="›" on={i === 0} seed="next" />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={262 + k * 26 - (k === i ? 6 : 0)} y={205} width={k === i ? 20 : 10} height={10} rx={5} fill={i === 1 ? 'var(--accent)' : 'var(--muted)'} opacity={k === i ? 1 : 0.5} />
          ))}
          <SketchArrow points={[[360, 210], [520, 210]]} head="none" seed={seedOf('scrub')} stroke={i === 1 ? 'var(--accent)' : 'var(--muted)'} strokeWidth={i === 1 ? 2.4 : 1.2} />
          <circle cx={360 + i * 80} cy={210} r={9} fill={i === 1 ? 'var(--accent)' : 'var(--muted)'} />
          {['0.5x', '1x', '2x'].map((s, k) => (
            <g key={s}>
              <SketchBox cx={565 + k * 50} cy={210} w={46} h={40} r={8} seed={seedOf('sp' + k)} stroke={i === 2 ? 'var(--accent)' : 'var(--muted)'} strokeWidth={i === 2 ? 2.2 : 1.2} />
              <HandText x={565 + k * 50} y={211} size={14} color={i === 2 ? 'var(--accent)' : 'var(--muted)'}>{s}</HandText>
            </g>
          ))}
          <HandText x={108} y={262} size={14} color={i === 0 ? 'var(--accent)' : 'var(--muted)'}>{'Play · Back · Next'}</HandText>
          <HandText x={300} y={262} size={14} color={i === 1 ? 'var(--accent)' : 'var(--muted)'}>{'Dots'}</HandText>
          <HandText x={440} y={262} size={14} color={i === 1 ? 'var(--accent)' : 'var(--muted)'}>{'Scrub bar'}</HandText>
          <HandText x={615} y={262} size={14} color={i === 2 ? 'var(--accent)' : 'var(--muted)'}>{'Speed'}</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
