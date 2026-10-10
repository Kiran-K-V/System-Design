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
