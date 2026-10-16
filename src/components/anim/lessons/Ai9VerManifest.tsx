import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchArrow, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { R12, R13, ROWS, changedKeys, releaseId } from './Ai9VerLogic';

const ID12 = releaseId(R12);
const ID13 = releaseId(R13);
const CHANGED = changedKeys(R12, R13);

interface Step {
  caption: string;
  showNew: boolean;
  diff: boolean;
  ids: boolean;
  trace: boolean;
}

const steps: Step[] = [
  { caption: 'Release r12 of a support bot. Its manifest is one list: the prompt, the model ID, the tools, the search index, and the settings. Prompt and tools are shown as a fingerprint (hash) of their text.', showNew: false, diff: false, ids: false, trace: false },
  { caption: 'Release r13 is the next version. Its manifest sits next to r12. Nothing is marked yet, so a reader has to compare six-character fingerprints by eye.', showNew: true, diff: false, ids: false, trace: false },
  { caption: 'Diff the two lists. Four rows changed: prompt, tools, search index, and settings. The model ID did not change. A diff turns "something changed" into a short list to check.', showNew: true, diff: true, ids: false, trace: false },
  { caption: 'Hash the whole list and you get one release id. A single changed row gives a new id. The id is the name of the release, so r12 and r13 cannot be mixed up.', showNew: true, diff: true, ids: true, trace: false },
  { caption: 'Now stamp the release id on every trace (the saved record of one request). A bad answer found next week carries a label that says which manifest produced it.', showNew: true, diff: true, ids: true, trace: true },
];

const LX = 24;
const C1 = 300;
const C2 = 560;
const W = 236;
const Y0 = 96;
const DY = 52;

export default function Ai9VerManifest() {
  return (
    <AnimFrame title="A release is one manifest" steps={steps} interval={5000}>
      {(_, s) => (
        <SketchSvg width={720} height={466} label="Two release manifests side by side. Four of five rows differ.">
          <HandText x={C1} y={34} size={TEXT_SIZES.heading} color="var(--fg)">
            Release r12
          </HandText>
          {s.showNew && (
            <HandText x={C2} y={34} size={TEXT_SIZES.heading} color="var(--accent)">
              Release r13
            </HandText>
          )}
          {ROWS.map((r, i) => {
            const y = Y0 + i * DY;
            const changed = s.diff && CHANGED.includes(r.key);
            const same = s.diff && !changed;
            return (
              <g key={r.key}>
                <HandText x={LX} y={y} anchor="start" size={TEXT_SIZES.label} color={same ? 'var(--muted)' : 'var(--fg)'}>
                  {r.label}
                </HandText>
                <SketchBox cx={C1} cy={y} w={W} h={44} r={8} seed={seedOf(`m12${r.key}`)} stroke={changed ? 'var(--warn)' : 'var(--muted)'} />
                <HandText x={C1} y={y} size={TEXT_SIZES.label} mono color={same ? 'var(--muted)' : 'var(--fg)'}>
                  {R12[r.key]}
                </HandText>
                {s.showNew && (
                  <>
                    <SketchBox cx={C2} cy={y} w={W} h={44} r={8} seed={seedOf(`m13${r.key}`)} stroke={changed ? 'var(--warn)' : 'var(--muted)'} fill={changed ? 'var(--warn)' : undefined} strokeWidth={changed ? 2.2 : 1.4} />
                    <HandText x={C2} y={y} size={TEXT_SIZES.label} mono color={same ? 'var(--muted)' : 'var(--fg)'}>
                      {R13[r.key]}
                    </HandText>
                  </>
                )}
              </g>
            );
          })}
          {s.ids && (
            <g>
              <HandText x={LX} y={Y0 + 5 * DY + 6} anchor="start" size={TEXT_SIZES.label} color="var(--accent)">
                Release id
              </HandText>
              <SketchBox cx={C1} cy={Y0 + 5 * DY + 6} w={W} h={44} r={8} seed={seedOf('id12')} stroke="var(--accent)" strokeWidth={2.2} />
              <HandText x={C1} y={Y0 + 5 * DY + 6} size={TEXT_SIZES.label} mono color="var(--accent)">{`rel-${ID12}`}</HandText>
              <SketchBox cx={C2} cy={Y0 + 5 * DY + 6} w={W} h={44} r={8} seed={seedOf('id13')} stroke="var(--accent)" fill="var(--accent)" strokeWidth={2.2} />
              <HandText x={C2} y={Y0 + 5 * DY + 6} size={TEXT_SIZES.label} mono color="var(--accent)">{`rel-${ID13}`}</HandText>
            </g>
          )}
          {s.trace && (
            <g>
              <SketchArrow points={[[C2, Y0 + 5 * DY + 34], [C2, Y0 + 5 * DY + 52]]} seed={seedOf('tarrow')} stroke="var(--accent)" />
              <SketchBox cx={C2 - 120} cy={Y0 + 5 * DY + 76} w={480} h={36} r={8} seed={seedOf('trace')} stroke="var(--ok)" fill="var(--ok)" />
              <HandText x={C2 - 120} y={Y0 + 5 * DY + 76} size={TEXT_SIZES.note} mono>
                {`trace 9c41  release rel-${ID13}  model claude-sonnet-5-5`}
              </HandText>
            </g>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
