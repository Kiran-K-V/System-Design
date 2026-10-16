import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Tone = 'ok' | 'bad' | 'warn' | 'muted' | 'fg';
type TileId = 'ttft' | 'tpot' | 'time' | 'err' | 'thr' | 'good' | 'gpu' | 'queue' | 'cache' | 'cost' | 'backup' | 'prompt';

interface Tile {
  v: string;
  sub?: string;
  tone: Tone;
}
type Tiles = Record<TileId, Tile>;

const LABELS: Record<TileId, string> = {
  ttft: 'TTFT p95',
  tpot: 'TPOT p95',
  time: 'Request time',
  err: 'Errors',
  thr: 'Throughput',
  good: 'Good req/s',
  gpu: 'GPU busy',
  queue: 'Queue',
  cache: 'Cache hit',
  cost: 'Cost/request',
  backup: 'Backup share',
  prompt: 'Prompt length',
};
const ORDER: TileId[] = ['ttft', 'tpot', 'time', 'err', 'thr', 'good', 'gpu', 'queue', 'cache', 'cost', 'backup', 'prompt'];
const COLOR: Record<Tone, string> = { ok: 'var(--ok)', bad: 'var(--bad)', warn: 'var(--warn)', muted: 'var(--muted)', fg: 'var(--fg)' };

const t = (v: string, tone: Tone = 'fg', sub?: string): Tile => ({ v, tone, sub });
const none = t('-', 'muted');

/** Self-hosted server, healthy. Numbers are illustrative. */
const HEALTHY: Tiles = {
  ttft: t('0.6 s', 'ok'),
  tpot: t('28 ms', 'ok'),
  time: t('12 s', 'ok', '400 tokens'),
  err: t('0%', 'ok'),
  thr: t('12 req/s', 'ok'),
  good: t('12 req/s', 'ok'),
  gpu: t('71%', 'fg'),
  queue: t('2', 'ok'),
  cache: none,
  cost: none,
  backup: none,
  prompt: t('1,800', 'fg', 'tokens'),
};

interface Step {
  caption: string;
  scene: string;
  active: TileId;
  tiles: Tiles;
}

const stepsData: Step[] = [
  {
    scene: 'Healthy self-hosted server',
    active: 'ttft',
    tiles: HEALTHY,
    caption:
      'A healthy server, as a dashboard shows it. TTFT is 0.6 s and TPOT is 28 ms. A 400-token answer takes about 0.6 + 0.028 x 400 = 11.8 s, shown as 12 s. Twelve requests per second all meet the targets, so good requests equal throughput. All numbers in scenes 1 and 3 are illustrative. Scene 2 uses measured numbers.',
  },
  {
    scene: 'Scene 1: long prompts arrive',
    active: 'ttft',
    tiles: { ...HEALTHY, ttft: t('3.4 s', 'bad', 'was 0.6 s'), time: t('15 s', 'warn'), gpu: t('72%', 'fg', 'was 71%'), good: t('1 req/s', 'bad') },
    caption:
      'Users complain about slow starts. TTFT rose from 0.6 s to 3.4 s. Look at the other tiles. TPOT is flat at 28 ms, so the pace after the first token is fine. GPU busy is 72%, almost the same as before. If you trust only that tile, you conclude that the GPU is fine. Good requests fell from 12 to 1 per second.',
  },
  {
    scene: 'Scene 1: long prompts arrive',
    active: 'queue',
    tiles: { ...HEALTHY, ttft: t('3.4 s', 'bad'), time: t('15 s', 'warn'), gpu: t('72%', 'fg'), good: t('1 req/s', 'bad'), queue: t('41', 'bad', 'was 2'), prompt: t('6,200', 'warn', 'was 1,800') },
    caption:
      'Now the other two tiles. The queue went from 2 waiting requests to 41. The average prompt grew from 1,800 to 6,200 tokens, because a new feature pastes whole documents. A longer prompt means more work before the first token, so each request holds the server longer and the line grows. The time shows up as TTFT, and GPU busy cannot see it.',
  },
  {
    scene: 'Scene 2: bigger batches (measured)',
    active: 'thr',
    tiles: {
      ...HEALTHY,
      ttft: none,
      tpot: none,
      time: t('4x', 'bad', 'vs batch 1'),
      err: none,
      thr: t('12.5 req/s', 'ok', 'was 0.9'),
      good: none,
      gpu: none,
      queue: none,
      prompt: none,
    },
    caption:
      'Databricks measured one A100 GPU running a 7B model. At batch size 1, one request is processed at a time. At batch size 64, 64 requests share each step. Throughput rose from 0.9 to 12.5 requests per second, about 14 times. A dashboard with only a throughput tile calls this a win. But Databricks also reports that latency rose 4 times.',
  },
  {
    scene: 'Scene 2: bigger batches (measured)',
    active: 'good',
    tiles: {
      ...HEALTHY,
      ttft: none,
      tpot: none,
      time: t('4x', 'bad', 'vs batch 1'),
      err: none,
      thr: t('12.5 req/s', 'ok', 'was 0.9'),
      good: t('~0 req/s', 'bad', 'target 2x'),
      gpu: none,
      queue: none,
      prompt: none,
    },
    caption:
      'Suppose the target is "at most 2 times the batch-1 request time". Every request at batch 64 takes about 4 times as long on average, so almost none meet the target. This is a simplified case: real requests vary, so the fall is less sharp. The point stands. Throughput rose 14 times, while the count of good requests fell.',
  },
  {
    scene: 'Scene 3: silent cache loss',
    active: 'cache',
    tiles: {
      ttft: t('0.5 s', 'ok'),
      tpot: none,
      time: none,
      err: t('0%', 'ok', 'no errors'),
      thr: none,
      good: none,
      gpu: none,
      queue: none,
      cache: t('0%', 'bad', 'was 82%'),
      cost: t('$0.0093', 'bad', 'was $0.0047'),
      backup: t('100%', 'warn'),
      prompt: t('800', 'fg', 'tokens'),
    },
    caption:
      'A provider API with failover. The primary fails over to a backup model. Errors stay at 0%. TTFT looks fine. But cache hit fell from 82% to 0%, and cost per request doubled from $0.0047 to $0.0093. The prefix is 800 tokens. The primary caches from 512 tokens. The backup needs 1,024, so it silently skips the cache. Only the cache and cost tiles show it.',
  },
];

const COLS = 4;
const TW = 158;
const TH = 76;
const GAP = 12;
const X0 = 26;
const Y0 = 62;

export default function Ai9DashScenes() {
  return (
    <AnimFrame title="A dashboard in three failures" steps={stepsData} interval={7000}>
      {(_, s) => (
        <SketchSvg width={720} height={330} label={`Dashboard tiles. ${s.scene}.`}>
          <HandText x={X0} y={26} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
            {s.scene}
          </HandText>
          {ORDER.map((id, i) => {
            const r = Math.floor(i / COLS);
            const c = i % COLS;
            const cx = X0 + TW / 2 + c * (TW + GAP);
            const cy = Y0 + TH / 2 + r * (TH + GAP);
            const tile = s.tiles[id];
            const act = s.active === id;
            return (
              <g key={id}>
                <SketchBox
                  cx={cx}
                  cy={cy}
                  w={TW}
                  h={TH}
                  r={8}
                  seed={seedOf(`tile-${id}`)}
                  stroke={act ? 'var(--accent)' : tile.tone === 'bad' ? 'var(--bad)' : tile.tone === 'warn' ? 'var(--warn)' : 'var(--muted)'}
                  strokeWidth={act ? 2.2 : 1.4}
                  fill={act ? 'var(--accent-soft)' : undefined}
                />
                <HandText x={cx} y={cy - 24} size={TEXT_SIZES.note} color="var(--muted)">
                  {LABELS[id]}
                </HandText>
                <HandText x={cx} y={cy + 2} size={TEXT_SIZES.heading} color={COLOR[tile.tone]}>
                  {tile.v}
                </HandText>
                {tile.sub && (
                  <HandText x={cx} y={cy + 26} size={TEXT_SIZES.note} color="var(--muted)">
                    {tile.sub}
                  </HandText>
                )}
              </g>
            );
          })}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
