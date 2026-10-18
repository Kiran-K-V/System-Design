import { HandText, SketchBox, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { geohash, ring9 } from './proxGeo';

/** Static infographic: a query near a cell edge touches 9 cells, and two close points can share no prefix. */
const LAT = 51.5;
const WEST = geohash(LAT, -0.001, 6);
const EAST = geohash(LAT, 0.001, 6);
const CELLS = ring9(WEST); // [self, NW, N, NE, W, E, SW, S, SE] in the order built
const ORDER = [1, 2, 3, 4, 0, 5, 6, 7, 8];

export default function ProxNeighbors() {
  const cs = 96;
  const x0 = 70;
  const y0 = 52;
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <div>
        <SketchSvg width={720} height={400} label="A 3 by 3 block of geohash cells around a query point near the right edge of the middle cell. Two nearby points on either side of longitude 0 have no common prefix.">
          <HandText x={x0 + 1.5 * cs} y={22} size={TEXT_SIZES.heading}>
            {`Query near the east edge of cell ${WEST}`}
          </HandText>
          {ORDER.map((idx, k) => {
            const r = Math.floor(k / 3);
            const c = k % 3;
            const mid = idx === 0;
            return (
              <g key={k}>
                <SketchBox
                  cx={x0 + c * cs + cs / 2}
                  cy={y0 + r * cs + cs / 2 + 10}
                  w={cs - 4}
                  h={cs - 4}
                  r={8}
                  seed={seedOf(`nb${k}`)}
                  stroke={mid ? 'var(--accent)' : 'var(--muted)'}
                  fill={mid ? 'var(--accent)' : 'var(--surface)'}
                  fillStyle="solid"
                />
                <HandText x={x0 + c * cs + cs / 2} y={y0 + r * cs + cs / 2 + 10} size={TEXT_SIZES.label} mono color={mid ? 'var(--fg)' : 'var(--muted)'}>
                  {CELLS[idx]}
                </HandText>
              </g>
            );
          })}
          <SketchEllipse cx={x0 + 1 * cs + cs / 2 + 42} cy={y0 + 1 * cs + cs / 2 + 36} w={14} h={14} seed={seedOf('nbq')} stroke="var(--bad)" fill="var(--bad)" fillStyle="solid" />
          <SketchEllipse cx={x0 + 1 * cs + cs / 2 + 42} cy={y0 + 1 * cs + cs / 2 + 36} w={40} h={40} seed={seedOf('nbr')} stroke="var(--bad)" dashed />

          <HandText x={400} y={90} size={TEXT_SIZES.label} anchor="start">
            Two points 0.002° of longitude apart:
          </HandText>
          <HandText x={400} y={125} size={TEXT_SIZES.label} anchor="start" mono color="var(--ok)">
            {`west  ${WEST}`}
          </HandText>
          <HandText x={400} y={155} size={TEXT_SIZES.label} anchor="start" mono color="var(--bad)">
            {`east  ${EAST}`}
          </HandText>
          <HandText x={400} y={222} size={TEXT_SIZES.label} anchor="start">
            {'About 140 m apart, yet no shared\nfirst character. The line at\nlongitude 0 is the first split.'}
          </HandText>
          <HandText x={400} y={312} size={TEXT_SIZES.label} anchor="start" color="var(--muted)">
            {'The circle crosses the right edge.\nSo the query reads the middle cell\nand its 8 neighbors, then filters\nby true distance.'}
          </HandText>
        </SketchSvg>
      </div>
      <figcaption className="px-2 pt-2 text-sm text-muted">Cells are 6 characters: about 1.2 km by 0.6 km. Not to scale. Neighbors were computed by stepping one cell width and re-encoding.</figcaption>
    </figure>
  );
}
