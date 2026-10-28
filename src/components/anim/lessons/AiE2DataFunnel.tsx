import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/**
 * A pretraining data pipeline as a funnel. Every share and example is illustrative: real pipelines publish their own
 * ratios, and the ratios differ a lot by source. The point is the shape: each stage drops tokens, mixing only reweights.
 */

interface Stage {
  name: string;
  /** Share of the raw crawl tokens still left after this stage (illustrative). */
  keep: number;
  dropped: string;
  example: string;
}

const STAGES: Stage[] = [
  { name: 'Raw crawl', keep: 100, dropped: 'nothing yet', example: 'Every page the crawler fetched, as HTML.' },
  { name: 'Extract and language', keep: 55, dropped: 'menus, scripts, other languages', example: '"Home | About | Cart (0) | Login" and a page in a language you did not target.' },
  { name: 'Quality filter', keep: 25, dropped: 'spam, gibberish, boilerplate', example: '"Buy cheap pills buy cheap pills best price buy cheap pills"' },
  { name: 'Deduplicate', keep: 15, dropped: 'copies and near copies', example: 'The same product page on 40 mirror sites, each with a new footer.' },
];

interface Step {
  caption: string;
  stage: number;
}

const steps: Step[] = [
  { stage: 0, caption: 'Start with the raw crawl, as 100% of tokens. Everything the crawler fetched is here, including menus, spam, and copies. The percentages in this picture are illustrative. Real pipelines publish their own numbers.' },
  { stage: 1, caption: 'Stage 1: extract the text from the HTML and keep the target language. Menus, scripts, and other languages go. A rule-based step like this is cheap and runs first so later steps see less data.' },
  { stage: 2, caption: 'Stage 2: filter for quality. Rules and small classifiers drop spam and gibberish. This is the biggest cut, and the riskiest one. A filter that is too strict also drops rare but good text. So the filter needs its own evaluation.' },
  { stage: 3, caption: 'Stage 3: deduplicate. Remove exact copies and near copies. This shrinks the data and also removes a source of test leaks, since benchmark text that appears twice on the web ends up in training data twice.' },
  { stage: 4, caption: 'Stage 4: mix. Nothing is dropped here. You choose how often each source appears in training: more of the sources you trust, less of the noisy ones. The weights are a design choice you tune by training small models. These weights are illustrative.' },
  { stage: 5, caption: 'Stage 5: synthesize. A model writes new examples, such as worked solutions or rewritten text, to fill gaps the web does not cover. It adds tokens, but it is only as good as the model and the checks that filter its output.' },
];

const X0 = 190;
const BAR_W = 360;
const ROW_H = 56;
const Y0 = 34;

export default function AiE2DataFunnel() {
  return (
    <AnimFrame title="A pretraining data pipeline, stage by stage" steps={steps} interval={6500}>
      {(_, s) => {
        const st = s.stage;
        if (st >= 4) {
          const mix = [
            { n: 'Web text', w: 60, c: 'var(--accent)' },
            { n: 'Code', w: 25, c: 'var(--ok)' },
            { n: 'Books and papers', w: 15, c: 'var(--warn)' },
          ];
          let x = 60;
          return (
            <SketchSvg width={720} height={300} label={st === 4 ? 'Mixing weights across three sources.' : 'Synthetic data added to the mix.'}>
              <HandText x={360} y={30} size={TEXT_SIZES.heading} color="var(--muted)">
                {st === 4 ? 'Mix: share of training tokens per source (illustrative)' : 'Synthesize: a model writes extra examples'}
              </HandText>
              {mix.map((m) => {
                const w = (m.w / 100) * 600;
                const cx = x + w / 2;
                x += w;
                return (
                  <g key={m.n}>
                    <SketchBox cx={cx} cy={120} w={w - 6} h={60} r={8} seed={seedOf('fm-' + m.n)} stroke={m.c} fill={m.c} />
                    <HandText x={cx} y={112} size={TEXT_SIZES.label}>{m.n}</HandText>
                    <HandText x={cx} y={134} size={TEXT_SIZES.note} mono color="var(--muted)">{`${m.w}%`}</HandText>
                  </g>
                );
              })}
              {st === 5 && (
                <>
                  <SketchArrow points={[[360, 235], [360, 164]]} seed={seedOf('fm-syn-a')} stroke="var(--accent)" />
                  <SketchBox cx={360} cy={255} w={300} h={44} r={8} seed={seedOf('fm-syn')} stroke="var(--accent)" dashed />
                  <HandText x={360} y={255} size={TEXT_SIZES.label}>Synthetic data (filtered)</HandText>
                </>
              )}
              {st === 4 && (
                <HandText x={360} y={235} size={TEXT_SIZES.label} color="var(--muted)">Mixing reweights. It does not discard.</HandText>
              )}
            </SketchSvg>
          );
        }
        return (
          <SketchSvg width={720} height={330} label={`Funnel after stage ${st}. ${STAGES[st].keep} percent of raw tokens remain.`}>
            {STAGES.map((g, i) => {
              if (i > st) return null;
              const w = (g.keep / 100) * BAR_W;
              const active = i === st;
              const cy = Y0 + i * ROW_H + 20;
              return (
                <g key={g.name}>
                  <HandText x={X0 - 14} y={cy} anchor="end" size={TEXT_SIZES.label} color={active ? 'var(--accent)' : 'var(--muted)'}>{g.name}</HandText>
                  <SketchBox cx={X0 + w / 2} cy={cy} w={w} h={40} r={8} seed={seedOf('fb-' + g.name)} stroke={active ? 'var(--accent)' : 'var(--muted)'} fill={active ? 'var(--accent)' : undefined} />
                  <HandText x={X0 + w + 12} y={cy} anchor="start" size={TEXT_SIZES.note} mono color={active ? 'var(--accent)' : 'var(--muted)'}>{`${g.keep}%`}</HandText>
                </g>
              );
            })}
            {st > 0 && (
              <>
                <SketchBox cx={600} cy={Y0 + st * ROW_H + 20} w={170} h={92} r={8} seed={seedOf('fb-ex' + st)} stroke="var(--bad)" dashed />
                <HandText x={600} y={Y0 + st * ROW_H - 16} size={TEXT_SIZES.note} color="var(--bad)">Dropped here</HandText>
                <HandText x={600} y={Y0 + st * ROW_H + 24} size={TEXT_SIZES.note} color="var(--muted)">{wrap(STAGES[st].dropped, 22)}</HandText>
              </>
            )}
            {st > 0 && (
              <HandText x={24} y={296} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                {wrap(`Example dropped: ${STAGES[st].example}`, 84)}
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

function wrap(t: string, n: number): string {
  const out: string[] = [];
  let line = '';
  for (const w of t.split(' ')) {
    if ((line + ' ' + w).trim().length > n) {
      out.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  out.push(line);
  return out.join('\n');
}
