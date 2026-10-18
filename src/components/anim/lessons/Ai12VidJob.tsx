import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Who = 'app' | 'api' | 'gpu' | 'store';

interface Step {
  caption: string;
  active: Who;
  arrow?: { from: number; to: number; y: number; label: string; tone: string };
  clock: string;
  done: 'false' | 'true' | '-';
  storeTone?: string;
  storeText: string;
}

const X = { app: 110, api: 330, gpu: 560 } as const;

const steps: Step[] = [
  {
    caption:
      'Your app sends a create request. A clip takes seconds to minutes, so the API does not hold the request open. It returns an operation name at once. That name is the ticket for the job. This is the accept-and-return-an-id pattern from the long-running tasks lesson.',
    active: 'api',
    arrow: { from: X.app, to: X.api, y: 118, label: 'create: prompt, length', tone: 'var(--accent)' },
    clock: 't = 0 s',
    done: '-',
    storeText: 'no video yet',
  },
  {
    caption:
      'A GPU worker renders the frames. Your app asks "done?" by sending the operation name. The Veo guide shows a 10-second sleep between checks. The answer is done = false.',
    active: 'gpu',
    arrow: { from: X.app, to: X.api, y: 118, label: 'poll: done?', tone: 'var(--warn)' },
    clock: 't = 10 s',
    done: 'false',
    storeText: 'no video yet',
  },
  {
    caption:
      'The wait repeats. The Veo guide lists a latency from 11 seconds up to 6 minutes at peak. At a 10-second poll, a 6-minute job costs up to 36 polls. Each poll is cheap. The wait is the cost.',
    active: 'app',
    arrow: { from: X.app, to: X.api, y: 118, label: 'poll again', tone: 'var(--warn)' },
    clock: 't = 20 s ... 360 s',
    done: 'false',
    storeText: 'no video yet',
  },
  {
    caption:
      'The worker finishes. The next poll returns done = true, and the response holds the video location. Time shown is illustrative. A blocked clip finishes without a video, and Veo does not charge for it.',
    active: 'api',
    arrow: { from: X.api, to: X.app, y: 150, label: 'done = true, video URL', tone: 'var(--ok)' },
    clock: 't = 60 s (illustrative)',
    done: 'true',
    storeText: 'video held by vendor',
    storeTone: 'var(--ok)',
  },
  {
    caption:
      'Download now and copy the file into your own storage. The vendor keeps it only for a short time. Your product should serve users from your copy, through your CDN.',
    active: 'store',
    arrow: { from: X.app, to: X.api, y: 118, label: 'download video', tone: 'var(--ok)' },
    clock: 't = 70 s',
    done: 'true',
    storeText: 'copied to your storage',
    storeTone: 'var(--ok)',
  },
  {
    caption:
      'Veo stores generated videos for 2 days, then removes them. A link saved in your database and opened on day 3 returns nothing. Other vendors may use other windows. Read each vendor page, and store your own copy.',
    active: 'api',
    clock: 't = 2 days',
    done: 'true',
    storeText: 'vendor copy removed',
    storeTone: 'var(--bad)',
  },
];

export default function Ai12VidJob() {
  return (
    <AnimFrame title="A video job: create, poll, download before it expires" steps={steps} interval={6500}>
      {(_, s) => {
        const tone = (w: Who) => (s.active === w ? 'var(--accent)' : 'var(--muted)');
        return (
          <SketchSvg width={720} height={290} label={`Video job. ${s.clock}. done flag ${s.done}. ${s.storeText}.`}>
            <SketchBox cx={X.app} cy={70} w={140} h={44} r={8} seed={seedOf('vj-app')} stroke={tone('app')} fill={s.active === 'app' ? 'var(--accent)' : undefined} />
            <HandText x={X.app} y={70} size={TEXT_SIZES.label}>Your app</HandText>
            <SketchBox cx={X.api} cy={70} w={140} h={44} r={8} seed={seedOf('vj-api')} stroke={tone('api')} fill={s.active === 'api' ? 'var(--accent)' : undefined} />
            <HandText x={X.api} y={70} size={TEXT_SIZES.label}>Video API</HandText>
            <SketchBox cx={X.gpu} cy={70} w={140} h={44} r={8} seed={seedOf('vj-gpu')} stroke={tone('gpu')} fill={s.active === 'gpu' ? 'var(--accent)' : undefined} />
            <HandText x={X.gpu} y={70} size={TEXT_SIZES.label}>GPU worker</HandText>
            <SketchArrow points={[[X.api + 74, 70], [X.gpu - 74, 70]]} stroke="var(--muted)" dashed seed={seedOf('vj-aw')} />
            {s.arrow && (
              <>
                <SketchArrow points={[[s.arrow.from + (s.arrow.to > s.arrow.from ? 74 : -74), s.arrow.y], [s.arrow.to + (s.arrow.to > s.arrow.from ? -74 : 74), s.arrow.y]]} stroke={s.arrow.tone} strokeWidth={2.2} seed={seedOf(`vj-ar${s.arrow.label}`)} />
                <HandText x={(s.arrow.from + s.arrow.to) / 2} y={s.arrow.y - 18} size={TEXT_SIZES.note} color={s.arrow.tone}>{s.arrow.label}</HandText>
              </>
            )}
            <SketchBox cx={X.app} cy={226} w={190} h={60} r={8} seed={seedOf('vj-clock')} stroke="var(--muted)" />
            <HandText x={X.app} y={226} size={TEXT_SIZES.label} mono>{s.clock}</HandText>
            <SketchBox cx={X.api} cy={226} w={160} h={60} r={8} seed={seedOf(`vj-done${s.done}`)} stroke={s.done === 'true' ? 'var(--ok)' : s.done === 'false' ? 'var(--warn)' : 'var(--muted)'} />
            <HandText x={X.api} y={226} size={TEXT_SIZES.label} mono>{`done: ${s.done}`}</HandText>
            <SketchBox cx={X.gpu + 10} cy={226} w={200} h={60} r={8} seed={seedOf(`vj-st${s.storeText}`)} stroke={s.storeTone ?? 'var(--muted)'} fill={s.storeTone} />
            <HandText x={X.gpu + 10} y={226} size={TEXT_SIZES.note}>{s.storeText}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
