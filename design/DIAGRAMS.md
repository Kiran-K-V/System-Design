# Diagram standard

All lesson diagrams use the hand-drawn primitives in `src/components/anim/sketch.tsx`.
The primitives enforce most rules below. Do not draw raw SVG shapes or text when a primitive exists.

## Text

Use the hand font for labels. Use mono (`mono`) only for code, keys, numbers, and values.

| Token     | Size | Use                                   |
|-----------|------|---------------------------------------|
| `note`    | 14   | Side notes, axis labels, legends      |
| `label`   | 16   | Text inside boxes (default choice)    |
| `heading` | 18   | Group or lane titles                  |
| `title`   | 22   | One headline per diagram, at most     |
| `display` | 28   | Big single numbers or results         |

- Import `TEXT_SIZES` and write `size={TEXT_SIZES.label}`. Other sizes snap to the nearest step.
- The hand font has no bold. `HandText` always renders it at weight 400.
- Show emphasis with color. Do not use size, weight, and fill together for one emphasis.
- Text color is `var(--fg)` or `var(--muted)`, or a tone color for a short status word. Never `#fff`.
- Write labels in sentence case. Keep a box label to 3 words or fewer. Move detail to the caption.

## Shapes and strokes

- Two stroke widths: `STROKE.normal` (1.4) and `STROKE.emphasis` (2.2). Other values snap.
- Corner radius: 8 for boxes, 6 for small cells (under 40px).
- Box height: 44 for one line of text, 60 for two lines.
- Align boxes on a grid. Space peer boxes at equal steps. Arrows start and end 6px from the box edge.
- Use a dashed outline for an optional or not-yet-real step.

## Color and fill

- Color means state. Use one tone per state:
  - `--accent`: the active or current element.
  - `--ok`: success or committed.
  - `--bad`: failure or lost.
  - `--warn`: pending or at risk.
  - `--muted`: idle elements.
- Mark at most one element as active per step.
- A colored `fill` renders as a 20% tint of that color. Text on top stays readable in both themes.
- Neutral fills (`--bg`, `--surface`, `--node`, `--accent-soft`) render as they are.
- `fillStyle="cross-hatch"` is only for small number badges and "blocked" time segments. Never put text on hatching.

## Layout

- Use a `SketchSvg` viewBox about 720 wide. Text sizes assume that width.
- Keep 24px of empty space inside the diagram edge.
- Put the explanation in the step caption, not in the drawing.

## 3D scenes (rare)
Use 3D only when a third direction carries the idea (a score cube, a grid of GPUs). It must pass the value test in `design/NEXT_LESSONS.md` section 4.
- Build with `src/components/anim/three/` (`Stage3D`, `Cube`, `CellField`, `usePalette`). Pattern: a small file `Name.tsx` that is only `export default lazy3D(() => import('./Name3D'))`, and the scene in `Name3D.tsx`. The 3D library must never load on the server (build fails) or on pages without a scene.
- Wrap the scene in `AnimFrame`. The caption carries the teaching text, the legend names each axis, and the scene is a pure function of the step.
- Never name a color in text (the accent differs by track). Use `usePalette` so dark mode works. Never put an apostrophe in a single-quoted string.
- Check light, dark and 390px wide screenshots before you report done.

### 3D house style
The 3D look matches the hand-drawn 2D diagrams. The shared parts already draw it; do not build your own materials.
- **Fill and ink.** `Cube` and `Dot` use a three-band toon fill and pen outlines with small corner ticks. Do not use lit or glossy materials. For graph edges and pointers use `Links` (one call for many lines; `sketch` adds the faint second stroke).
- **Floor.** Give box scenes a `ground` (its height) and `groundSize`. Globes get no floor.
- **One idea per step, camera included.** Set `view` (tilt, turn) and `focus` (a point) per step to show the part the caption talks about. The scene turns around `focus`, so zooming to one tower works after any drag. Pull back on the last step to show the whole picture.
- **Hover notes.** Give every object a reader might wonder about a `hint` (one or two short sentences). The stage shows it on hover or tap.
- **Draw the eye with `pop`, sparingly.** `pop` lifts a box a little and bolds its outline. Never `pop` boxes that are stacked or touching: the lift breaks the stack. Use color for those.
- **Real data, not decoration.** Compute paths and counts from the lesson's own data (as `VecHnsw3D` does with `vecMath.ts`) so the 3D scene and the 2D animation agree. Label any toy number as an example in the caption.
- **Labels.** `Tag` labels stay sharp but can collide. Hide labels that are not about the current step (`show`). Keep labels off the frame edge at 390px.
- **Cost.** The stage draws only while something moves. Use `CellField` (one draw call) for more than about 60 equal boxes, with `h` for bars of different heights.
- **Globe turn.** Longitude L faces the camera at turn = −(L + 90)° in radians. Tilt about 0.65 centers the northern mid-latitudes.

