import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { TC, TOY, TOY_NAIVE_TOTAL, TR, toyTraffic } from './AiE3FlashLogic';

/** A tile is [Q block i, K/V block j], both zero-based. */
type Tile = [number, number];
interface Step {
  caption: string;
  kv: number;
  done: Tile[];
  active: Tile[];
  sram: string;
}

const col = (j: number): Tile[] => Array.from({ length: TR }, (_, i) => [i, j]);
const steps: Step[] = [
  {
    caption:
      'Toy sizes: 8 tokens, a score matrix of 8 by 8, SRAM that fits a 2-row by 4-column tile. Standard attention would write all 64 scores to HBM, read them back for the softmax, write 64 probabilities, and read them again. FlashAttention computes the same answer one tile at a time and writes none of the 64 scores. The bar on the right shows the HBM traffic it needs.',
    kv: 0,
    done: [],
    active: [],
    sram: 'empty',
  },
  {
    caption: 'Outer loop, first pass. Load the first block of keys and values (K1, V1) from HBM into SRAM. They stay there for this whole pass.',
    kv: 1,
    done: [],
    active: [],
    sram: 'K1, V1',
  },
  {
    caption:
      'Inner loop. Load the first block of queries Q1 with its partial output and two running numbers per row: the largest score seen so far (m) and the running sum of exponentials (l). Compute the 2 by 4 tile of scores on chip, update m and l, add this tile\'s part to the output, and write the output and statistics back. The tile of scores is never written.',
    kv: 1,
    done: [],
    active: [[0, 0]],
    sram: 'K1, V1, Q1, O1, m, l, and the tile',
  },
  {
    caption: 'The same for Q2, Q3 and Q4. Each time the engine reads the queries and partial output, works on chip, and writes the partial output back. After this pass every row has seen only the first four tokens.',
    kv: 1,
    done: [[0, 0]],
    active: [[1, 0], [2, 0], [3, 0]],
    sram: 'K1, V1, and one Q block at a time',
  },
  {
    caption: 'Outer loop, second pass. Load the next block of keys and values (K2, V2). Every row of the output is still unfinished, so Q must be read again for every tile. That re-reading is the price of tiling.',
    kv: 2,
    done: col(0),
    active: [],
    sram: 'K2, V2',
  },
  {
    caption:
      'First tile of the second pass. The new tile may hold a larger score than the old maximum m. If so, the old partial output and sum l are scaled down by the right factor, and the new tile\'s part is added. Because of this rescale, the final output is exactly the softmax over all 8 tokens, not an approximation.',
    kv: 2,
    done: col(0),
    active: [[0, 1]],
    sram: 'K2, V2, Q1, O1, m, l, and the tile',
  },
  {
    caption: 'The same for Q2, Q3 and Q4. Each row has now seen all 8 tokens, so the output is final.',
    kv: 2,
    done: [...col(0), [0, 1]],
    active: [[1, 1], [2, 1], [3, 1]],
    sram: 'K2, V2, and one Q block at a time',
  },
  {
    caption: 'Done. The result is identical to standard attention. In this toy, FlashAttention moved fewer elements, and none of the traffic was scores. At real sizes the scores are the part that grows with the square of the length. The tile loop is why FlashAttention does not store them.',
    kv: 2,
    done: [...col(0), ...col(1)],
    active: [],
    sram: 'free again',
  },
];

const CELL = 28;
const GX = 64;
const GY = 92;
const TW = TOY.Bc * CELL;
const TH = TOY.Br * CELL;
const same = (a: Tile, b: Tile) => a[0] === b[0] && a[1] === b[1];

function Scene({ s }: { s: Step }) {
  const tiles: Tile[] = [];
  for (let j = 0; j < TC; j++) for (let i = 0; i < TR; i++) tiles.push([i, j]);
  const count = s.done.length + s.active.length;
  const flash = toyTraffic(s.kv, count);
  const barW = (v: number) => (v / TOY_NAIVE_TOTAL) * 270;
  return (
    <>
      <HandText x={24} y={24} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">Score matrix S: 8 by 8, never written to HBM</HandText>
      {[0, 1].map((j) => (
        <HandText key={j} x={GX + j * TW + TW / 2} y={GY - 22} size={TEXT_SIZES.label} color={s.kv === j + 1 ? 'var(--accent)' : 'var(--muted)'}>{`K${j + 1}, V${j + 1}`}</HandText>
      ))}
      {Array.from({ length: TR }, (_, i) => (
        <HandText key={i} x={GX - 10} y={GY + i * TH + TH / 2} anchor="end" size={TEXT_SIZES.label} color="var(--muted)">{`Q${i + 1}`}</HandText>
      ))}
      {tiles.map((t) => {
        const act = s.active.some((a) => same(a, t));
        const done = s.done.some((a) => same(a, t));
        const stroke = act ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--muted)';
        return (
          <SketchBox key={`${t[0]}-${t[1]}`} cx={GX + t[1] * TW + TW / 2} cy={GY + t[0] * TH + TH / 2} w={TW - 6} h={TH - 6} r={6} seed={seedOf(`tile-${t[0]}-${t[1]}`)} stroke={stroke} strokeWidth={act ? 2.2 : 1.4} fill={act || done ? stroke : undefined} dashed={!act && !done} />
        );
      })}
      <HandText x={GX + TW} y={GY + 4 * TH + 26} size={TEXT_SIZES.note} color="var(--muted)">accent: computing now, green: finished, dashed: not yet</HandText>

      <HandText x={360} y={60} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">On chip (SRAM, small and fast)</HandText>
      <SketchBox cx={540} cy={112} w={340} h={60} r={8} seed={seedOf('sram')} stroke="var(--accent)" fill={s.kv > 0 ? 'var(--accent)' : undefined} dashed={s.kv === 0} />
      <HandText x={540} y={113} size={TEXT_SIZES.label} color="var(--fg)">{s.sram.length > 28 ? s.sram.replace(', and', '\nand') : s.sram}</HandText>

      <HandText x={360} y={210} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">Elements moved to and from HBM</HandText>
      <HandText x={360} y={244} anchor="start" size={TEXT_SIZES.label} color="var(--fg)">FlashAttention so far</HandText>
      <SketchBox cx={360 + Math.max(barW(flash), 2) / 2} cy={274} w={Math.max(barW(flash), 4)} h={26} r={6} seed={seedOf('bar-f')} stroke="var(--ok)" fill="var(--ok)" />
      <HandText x={372 + Math.max(barW(flash), 4)} y={274} anchor="start" size={TEXT_SIZES.label} mono color="var(--fg)">{String(flash)}</HandText>
      <HandText x={360} y={318} anchor="start" size={TEXT_SIZES.label} color="var(--fg)">Standard attention, whole run</HandText>
      <SketchBox cx={360 + barW(TOY_NAIVE_TOTAL) / 2} cy={348} w={barW(TOY_NAIVE_TOTAL)} h={26} r={6} seed={seedOf('bar-n')} stroke="var(--warn)" fill="var(--warn)" />
      <HandText x={372 + barW(TOY_NAIVE_TOTAL)} y={348} anchor="start" size={TEXT_SIZES.label} mono color="var(--fg)">{String(TOY_NAIVE_TOTAL)}</HandText>
      <HandText x={360} y={392} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">{`Of the standard total, ${4 * TOY.N * TOY.N} are scores written and read. FlashAttention: 0.`}</HandText>
    </>
  );
}

export default function AiE3FlashTiles() {
  return (
    <AnimFrame title="FlashAttention: tiles through SRAM, one toy run" steps={steps} interval={7500}>
      {(_, s) => (
        <SketchSvg width={720} height={430} label="A score matrix split into tiles. Key and value blocks are loaded into on-chip memory once per pass. Query blocks stream through. A counter shows memory traffic compared with standard attention.">
          <Scene s={s} />
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
