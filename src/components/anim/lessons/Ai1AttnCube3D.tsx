import { useMemo } from 'react';
import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { CellField, Cube, type GridCell } from '../three/blocks';
import { usePalette } from '../three/theme';

/** Illustrative: tiny counts so every tile is visible. Real models have far more words, heads and layers. */
interface Step {
  caption: string;
  words: number;
  heads: number;
  /** Colors the newest word's row, to show one word looking back. */
  focus: boolean;
}

const steps: Step[] = [
  {
    caption:
      'One attention head is one reader inside the model. It scores how much each word looks at the other words. Each tile is one score. The highlighted row is the newest word looking back. The faded tiles are the future, which it may not peek at.',
    words: 4,
    heads: 1,
    focus: true,
  },
  {
    caption:
      'Real models have many heads, and every head keeps its own grid. So the single grid becomes a stack. Here there are 6 heads. Real models have dozens, and the whole stack repeats in every layer.',
    words: 4,
    heads: 6,
    focus: false,
  },
  {
    caption: 'Now give the model twice as much text. Every grid gets twice as wide and twice as tall. That makes four times as many tiles in every grid.',
    words: 8,
    heads: 6,
    focus: false,
  },
  {
    caption:
      'Double the text again, and the tiles grow four times again. The cost follows the square of the text length. That is why long text gets expensive fast, and why writing the whole cube into GPU memory stops working.',
    words: 16,
    heads: 6,
    focus: false,
  },
];

const PITCH = 1.15; // distance between tile centers
const TILE: [number, number, number] = [1, 1, 0.3];
const LAYER = 0.95; // distance between stacked grids

export default function Ai1AttnCube3D() {
  const p = usePalette();
  return (
    <AnimFrame title="The score cube: how attention grows with text length" steps={steps} interval={4200}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: ReturnType<typeof usePalette> }) {
  const { words: n, heads, focus } = step;
  const { kept, faded } = useMemo(() => {
    const kept: GridCell[] = [];
    const faded: GridCell[] = [];
    for (let l = 0; l < heads; l++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const cell = {
            x: (j - (n - 1) / 2) * PITCH,
            y: ((n - 1) / 2 - i) * PITCH,
            z: (l - (heads - 1) / 2) * LAYER,
            color: j <= i ? (focus && i === n - 1 ? p.accent : p.ok) : p.muted,
          };
          (j <= i ? kept : faded).push(cell);
        }
      }
    }
    return { kept, faded };
  }, [n, heads, focus, p.accent, p.ok, p.muted]);

  const w = n * PITCH;
  const d = heads * LAYER;
  const distance = Math.max(8, Math.sqrt(2 * w * w + d * d) * 1.85);

  const legend = [
    { label: 'Tile: how much one word looks at another', color: p.ok },
    { label: 'Faded tile: a word in the future, off limits', color: p.muted },
    ...(focus ? [{ label: 'Highlighted row: the newest word', color: p.accent }] : []),
    ...(heads > 1 ? [{ label: 'Front to back: one grid per head', color: p.fg }] : []),
  ];

  return (
    <Stage3D label={`A block of attention scores: ${n} words by ${n} words, ${heads} ${heads === 1 ? 'head' : 'heads'} deep.`} distance={distance} legend={legend} angle={[0.42, -0.85]}>
      <CellField key={`k-${n}-${heads}-${focus}`} cells={kept} size={TILE} opacity={0.62} />
      <CellField key={`f-${n}-${heads}-${focus}`} cells={faded} size={TILE} opacity={0.1} />
      <Cube pos={[0, 0, 0]} size={[w, w, d + 0.3]} color={p.fg} face={0} edge={0.5} edgeColor={p.fg} />
    </Stage3D>
  );
}
