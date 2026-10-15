import AnimFrame from '../AnimFrame';
import { HandText, SketchSvg, TEXT_SIZES } from '../sketch';
import { Cell, type TT } from './TechParts';

/** Rungs from top (best) to bottom (lowest). Bitrates in Mbit/s are assumptions for the demo. */
const RUNGS = [
  { name: '1080p', rate: 5 },
  { name: '720p', rate: 3 },
  { name: '480p', rate: 1.5 },
  { name: '240p', rate: 0.4 },
];
/** Rung index (into RUNGS) chosen for each segment so far. */
interface Step {
  caption: string;
  chosen: number[];
  line: string;
  tone: TT;
}

const steps: Step[] = [
  {
    caption:
      'The player has the manifest: one video, four rungs, many 6-second segments per rung. It has no speed measurement yet, so it plays safe and asks for segment 1 from the lowest rung. A low-rung segment is small, so the picture starts fast.',
    chosen: [3],
    line: 'No measurement yet: start low',
    tone: 'accent',
  },
  {
    caption:
      'Segment 1 is 0.4 Mbit/s × 6 s = 2.4 Mbit. It arrived at about 8 Mbit/s. The demo rule is: take the highest rung at or below half the measured speed. Half of 8 is 4, so 720p (3 Mbit/s) fits. Segments 2 and 3 come at 720p.',
    chosen: [3, 1, 1],
    line: 'Measured 8 Mbit/s: pick 720p',
    tone: 'ok',
  },
  {
    caption:
      'The viewer walks into a weaker area. A 720p segment is 3 × 6 = 18 Mbit. At 4 Mbit/s that takes 4.5 s of a 6 s window, which is close to a stall. Half of 4 is 2, so the player moves down to 480p (1.5 Mbit/s) for segment 4.',
    chosen: [3, 1, 1, 2],
    line: 'Measured 4 Mbit/s: drop to 480p',
    tone: 'warn',
  },
  {
    caption:
      'Speed falls to 1 Mbit/s. Half of 1 is 0.5, so only 240p (0.4 Mbit/s) fits. Segment 5 is small but arrives in time. The picture is soft, and it keeps playing. A single-bitrate file would have stopped to buffer here.',
    chosen: [3, 1, 1, 2, 3],
    line: 'Measured 1 Mbit/s: drop to 240p',
    tone: 'bad',
  },
  {
    caption:
      'The network recovers to 8 Mbit/s. The player climbs back to 720p for segments 6 and 7. Every switch happens at a segment boundary, because each segment can be decoded without the one before it. The server did nothing different for this viewer: it only served files.',
    chosen: [3, 1, 1, 2, 3, 1, 1],
    line: 'Measured 8 Mbit/s: back to 720p',
    tone: 'ok',
  },
];

const COLS = 8;
const X = (c: number) => 175 + c * 68;
const Y = (r: number) => 85 + r * 50;

export default function YoutubeAbrWalk() {
  return (
    <AnimFrame title="Adaptive bitrate: the player picks a rung per segment" steps={steps} interval={4800}>
      {(_i, s) => (
        <SketchSvg width={720} height={330} label="A grid of segments over time and four bitrate rungs, with the chosen segment highlighted in each column">
          <HandText x={360} y={20} size={TEXT_SIZES.label} color={`var(--${s.tone === 'ok' ? 'ok' : s.tone})`}>
            {s.line}
          </HandText>
          {RUNGS.map((r, ri) => (
            <HandText key={r.name} x={24} y={Y(ri)} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
              {`${r.name}\n${r.rate} Mbit/s`}
            </HandText>
          ))}
          {Array.from({ length: COLS }, (_, c) =>
            RUNGS.map((_, ri) => {
              const picked = s.chosen[c] === ri;
              const latest = picked && c === s.chosen.length - 1;
              const tone: TT = latest ? 'accent' : picked ? 'ok' : 'fg';
              return <Cell key={`${c}-${ri}`} cx={X(c)} cy={Y(ri)} w={58} h={40} label={picked ? `s${c + 1}` : ''} tone={tone} dashed={!picked} sk={`abr-${c}-${ri}`} />;
            }),
          )}
          {Array.from({ length: COLS }, (_, c) => (
            <HandText key={c} x={X(c)} y={Y(3) + 40} size={TEXT_SIZES.note} color="var(--muted)">
              {`${c * 6}-${c * 6 + 6} s`}
            </HandText>
          ))}
          <HandText x={360} y={310} size={TEXT_SIZES.note} color="var(--muted)">
            time in the video, one column per 6-second segment
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
