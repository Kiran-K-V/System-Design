import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchEllipse, SketchSvg, TEXT_SIZES, STROKE, seedOf } from '../sketch';
import { BASE32, bitSteps, cellSize } from './proxGeo';

/** Encodes one point by hand, bit by bit: lat 10, lng 20, two characters. The math lives in proxGeo.ts. */
const LAT = 10;
const LNG = 20;
const STEPS = bitSteps(LAT, LNG, 10);
const BITS = STEPS.map((s) => s.bit).join('');
const GROUPS = [BITS.slice(0, 5), BITS.slice(5)];
const CODES = GROUPS.map((g) => parseInt(g, 2));
const WORLD = { latMin: -90, latMax: 90, lngMin: -180, lngMax: 180 };
const SIZE2 = cellSize(2);
const num = (n: number) => String(Math.round(n * 1000) / 1000);

const boxBefore = (k: number) => (k === 0 ? WORLD : STEPS[k - 1].box);

const captions: string[] = [
  `Start with the whole world: longitude −180 to 180, latitude −90 to 90. Our point is at lat ${LAT}, lng ${LNG}. We will turn it into 10 bits, then 2 characters.`,
  ...STEPS.map((s, k) => {
    const v = s.axis === 'lng' ? LNG : LAT;
    return `Bit ${k + 1} (${s.axis}): the range is [${num(s.lo)}, ${num(s.hi)}] and its middle is ${num(s.mid)}. ${v} is ${s.bit ? 'at or above' : 'below'} ${num(s.mid)}, so the bit is ${s.bit}. Keep the ${s.bit ? 'upper' : 'lower'} half.`;
  }),
  `Cut the 10 bits into groups of 5. ${GROUPS[0]} is ${CODES[0]}, which is "${BASE32[CODES[0]]}" in the base32 alphabet. ${GROUPS[1]} is ${CODES[1]}, which is "${BASE32[CODES[1]]}". The geohash is "${BASE32[CODES[0]]}${BASE32[CODES[1]]}". Its cell is about ${Math.round(SIZE2.widthKm).toLocaleString('en-US')} km wide and ${Math.round(SIZE2.heightKm)} km tall at the equator.`,
];
const steps = captions.map((caption) => ({ caption }));

const BX = 190;
const BY = 160;
const BW = 340;
const BH = 170;

export default function ProxGeohash() {
  return (
    <AnimFrame title="Encoding one point as a geohash, one bit at a time" steps={steps} interval={2600}>
      {(i) => {
        const done = i === 11;
        const frame = done ? STEPS[9].box : boxBefore(Math.max(0, i - 1));
        const cur = i >= 1 && !done ? STEPS[i - 1] : null;
        const fw = frame.lngMax - frame.lngMin;
        const fh = frame.latMax - frame.latMin;
        const px = BX - BW / 2 + ((LNG - frame.lngMin) / fw) * BW;
        const py = BY - BH / 2 + ((frame.latMax - LAT) / fh) * BH;
        const shown = Math.min(i, 10);
        return (
          <SketchSvg width={720} height={290} label="A map cell that halves each step, and the bits that build the geohash">
            <HandText x={20} y={22} size={TEXT_SIZES.note} anchor="start" color="var(--muted)" mono>
              {`lng [${num(frame.lngMin)}, ${num(frame.lngMax)}]   lat [${num(frame.latMin)}, ${num(frame.latMax)}]`}
            </HandText>
            <SketchBox cx={BX} cy={BY} w={BW} h={BH} r={8} seed={seedOf('prox-frame')} stroke="var(--muted)" fill="var(--surface)" fillStyle="solid" />
            {cur && (
              <>
                {cur.axis === 'lng' ? (
                  <SketchBox
                    cx={BX - BW / 2 + (cur.bit ? 0.75 : 0.25) * BW}
                    cy={BY}
                    w={BW / 2 - 6}
                    h={BH - 8}
                    r={6}
                    seed={seedOf(`keep${i}`)}
                    stroke="var(--ok)"
                    fill="var(--ok)"
                    fillStyle="solid"
                  />
                ) : (
                  <SketchBox
                    cx={BX}
                    cy={BY - BH / 2 + (cur.bit ? 0.25 : 0.75) * BH}
                    w={BW - 8}
                    h={BH / 2 - 6}
                    r={6}
                    seed={seedOf(`keep${i}`)}
                    stroke="var(--ok)"
                    fill="var(--ok)"
                    fillStyle="solid"
                  />
                )}
                <SketchArrow
                  points={cur.axis === 'lng' ? [[BX, BY - BH / 2], [BX, BY + BH / 2]] : [[BX - BW / 2, BY], [BX + BW / 2, BY]]}
                  head="none"
                  stroke="var(--accent)"
                  strokeWidth={STROKE.emphasis}
                  seed={seedOf(`split${i}`)}
                />
                <HandText x={BX} y={BY + BH / 2 + 22} size={TEXT_SIZES.note} color="var(--accent)" mono>
                  {`split at ${cur.axis} ${num(cur.mid)}`}
                </HandText>
              </>
            )}
            <SketchEllipse cx={px} cy={py} w={14} h={14} seed={seedOf('prox-pt')} stroke="var(--bad)" fill="var(--bad)" fillStyle="solid" />
            <HandText x={px + 12} y={py - 12} size={TEXT_SIZES.note} anchor="start" color="var(--bad)">
              point
            </HandText>

            {/* bit strip */}
            <HandText x={392} y={52} size={TEXT_SIZES.label} anchor="start">
              Bits, longitude first
            </HandText>
            {STEPS.map((s, k) => {
              const x = 404 + k * 30;
              const on = k < shown;
              const active = !done && k === i - 1;
              return (
                <g key={k}>
                  <SketchBox
                    cx={x}
                    cy={100}
                    w={28}
                    h={40}
                    r={6}
                    seed={seedOf(`bit${k}`)}
                    stroke={active ? 'var(--accent)' : on ? 'var(--ok)' : 'var(--border)'}
                    fill={active ? 'var(--accent)' : undefined}
                    dashed={!on}
                    fillStyle="solid"
                  />
                  {on && (
                    <HandText x={x} y={100} size={TEXT_SIZES.label} mono>
                      {String(s.bit)}
                    </HandText>
                  )}
                  <HandText x={x} y={132} size={TEXT_SIZES.note} color="var(--muted)">
                    {s.axis === 'lng' ? 'lng' : 'lat'}
                  </HandText>
                </g>
              );
            })}
            {done &&
              GROUPS.map((g, gi) => {
                const cx = 404 + gi * 150 + 60;
                return (
                  <g key={gi}>
                    <SketchBox cx={cx} cy={190} w={136} h={44} r={8} seed={seedOf(`grp${gi}`)} stroke="var(--ok)" fill="var(--ok)" fillStyle="solid" />
                    <HandText x={cx} y={190} size={TEXT_SIZES.label} mono>
                      {`${g} = ${CODES[gi]} → ${BASE32[CODES[gi]]}`}
                    </HandText>
                  </g>
                );
              })}
            {done && (
              <HandText x={554} y={252} size={TEXT_SIZES.display} color="var(--ok)" mono>
                {`${BASE32[CODES[0]]}${BASE32[CODES[1]]}`}
              </HandText>
            )}
            {!done && (
              <HandText x={554} y={200} size={TEXT_SIZES.note} color="var(--muted)">
                {'Each frame is the current cell,\nstretched to the same size.'}
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
