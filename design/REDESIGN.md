# Multi-track redesign (Phase 0)

Uptime now has two tracks: **Backend System Design** and **AI System Design**. The shell was built for one course. This spec turns it into a hub with tracks. Phase 0 is UI only: the AI track ships as an outline where every lesson is "coming soon". No AI lesson content.

Keep the house style. Geist sans, Geist Mono eyebrows, Instrument Serif italic numerals, rough.js hand-drawn diagrams (`design/DIAGRAMS.md`), thin `line` borders, `surface` cards, `press` buttons. Do not add a new visual language. The only new idea is a per-track accent.

## 1. Information architecture

| Route | Page | Notes |
|---|---|---|
| `/` | Hub | Track picker, resume, daily practice, how tracks connect |
| `/learn/backend/` | Backend track home | Hero, course map, module grid |
| `/learn/backend/<id>/` | Backend lesson | `<id>` unchanged, e.g. `04-data/consensus` |
| `/learn/ai/` | AI track home | Same template, all lessons "soon" |
| `/learn/ai/<id>/` | AI lesson | No pages yet (none written) |
| `/learn/<id>/` | Legacy redirect | Meta refresh + `rel=canonical` to `/learn/backend/<id>/` for every backend id |
| `/review/` | Review | Add track filter chips: All, Backend, AI |

Lesson ids: backend ids stay as they are, so `sd-progress`, `sd-cards` and quiz ids in localStorage survive. AI ids start with `ai/` (content under `src/content/lessons/ai/`). The track of an id is `id.startsWith('ai/') ? 'ai' : 'backend'`.

## 2. Data model

`src/lib/tracks.ts` is the one place that knows tracks.

```ts
export type TrackId = 'backend' | 'ai';
export interface Part { title: string; modules: number[] }   // groups modules on the track home
export interface Track {
  id: TrackId;
  name: string;          // 'Backend System Design'
  short: string;         // 'Backend'
  tagline: string;
  outline: ModuleOutline[];   // backend: existing syllabus; ai: ai-syllabus.ts
  parts: Part[];
  numberPrefix: string;  // '' for backend (4.11), 'A' for ai (A5.1)
}
```

- `src/lib/syllabus.ts` keeps the backend outline and `buildSyllabus`. Generalise `buildSyllabus(outline, written, prefix)` so both tracks use it. Keep the requires check. Cross-track `requires` (an AI lesson requires a backend lesson) is allowed: AI comes after all backend lessons in one combined order.
- `src/lib/ai-syllabus.ts`: the AI outline from `AI_SYSTEM_DESIGN_PLAN.md` (module slugs like `a5-inference`, lesson slugs, titles). Titles only.
- `loadSyllabus()` returns `{ tracks: { backend, ai }, flat, entries }`.
- Replace the `parseInt(entry.id)` level logic in the lesson route with a `level` derived from module position per track.

Parts:
- Backend: Foundations (0-2), Building blocks (3-5), Distributed systems (6-8), Patterns and advanced (9-10), Practice (11-12).
- AI: Foundations (A0-A2), Models and training (A3-A4), Serving and retrieval (A5-A6), Applications and agents (A7-A8), Running it in production (A9-A11), Frontier and practice (A12-A14).

## 3. Track accent

`<html data-track="backend|ai">`, set by the layout for track pages. The hub has no `data-track` and uses the neutral brand accent.

- Backend keeps the current crimson `--accent`.
- AI gets an indigo-violet accent. Define light and dark values in `global.css` under `[data-track="ai"]`. Contrast for text on bg must be 4.5:1 or better in both themes. Check with a contrast script, not by eye.
- Everything that uses `accent` today (numerals, active sidebar item, progress ring, eyebrow rule) picks up the track color for free.

## 4. Shell (Layout.astro)

Header, left to right: menu (mobile) · logo · **track switcher** · search · Review · theme · progress pill.

- **Track switcher**: a segmented control of two links, "Backend" and "AI". `aria-current="page"` on the active one. The active segment uses the track accent. The AI segment has a small "new" dot until the person opens the AI track once (`sd-seen-ai` in localStorage, try/catch). On the hub, neither segment is active. Hidden below `md`; on mobile it moves to the top of the drawer.
- **Progress pill**: counts the current track only ("12 / 97 Backend"). On the hub it shows both tracks as two thin bars. Links to the current track home.
- **Sidebar**: scoped to the current track. At the top, a track card: track name, `ready/total`, and a "Switch to AI" text link. Then "Track home", "Roadmap", then modules. Module numbers use the prefix (`A5`). Modules with zero written lessons show a "soon" tag and expand to a muted list (not links).
- **Search palette**: results grouped by track with chips All / Backend / AI. Coming-soon lessons are listed with a "soon" tag and are not links. Default chip = current track.
- **Breadcrumb** on lesson pages: `Backend / Data: Storage From First Principles`. Track name links to the track home.

## 5. Hub page (`/`)

Order top to bottom. Max width 1040px. Each section has a mono eyebrow with the accent rule, as today.

1. **Hero.** Eyebrow `Uptime · two tracks, one foundation`. Keep the headline "Become the engineer who *knows stuff.*". Sub (one sentence): backend first principles, then the AI systems built on top of them.
2. **Resume strip.** One row card: "Continue: 4.11 Consensus · Backend" with a small progress bar and an arrow. Reads `sd-last` (`{id, track, at}`), written by the lesson page on load. Empty state: "Start here: 0.1 How to Use This Site". Hidden until JS runs; no layout shift (reserve height).
3. **Track cards.** Two equal cards side by side (stack below `md`). Each card:
   - Accent rule at top in the track color, track name, tagline.
   - Stats row in mono: modules · lessons · ready.
   - **Module strip**: one small segment per module, filled by state (done / ready / soon). Hover shows the module title (title attribute is enough).
   - Three "you will be able to" bullets (stub text, see section 9).
   - Primary CTA "Open track", secondary "Resume" when there is progress.
   - The AI card has a "Coming soon · outline ready" badge and CTA "See the outline".
4. **How the tracks connect.** A hand-drawn infographic (`TrackBridge`, static, no hooks): backend modules on the left (One Machine, Networking, Data, Caching, Async, Reliability) with arrows into AI modules on the right (Serving, RAG, LLM Apps, LLMOps). Caption: "AI lessons link back to the backend lesson they build on." Hidden below `sm` like `CourseMap`, with a text list fallback.
5. **Daily practice.** Three small cards in a row: Review due (real count from `mastery.ts`), Puzzle of the day (stub, "soon"), Streak (stub, "soon"). Stubs are visibly disabled, not fake numbers.
6. **How a lesson works.** The 7-part lesson shape as a compact numbered row (problem, naive, mechanism, numbers, trade-offs, interview lens, check yourself). Static.
7. Footer as today.

## 6. Track home (`/learn/<track>/`)

1. Hero: eyebrow `<Track name>`, title, one-paragraph promise, stats, CTA "Start with <first lesson>" (backend) or "Read the plan" disabled state (AI: "Lessons arrive module by module").
2. Course map figure: backend keeps `CourseMap`; AI gets `AiCourseMap` (same rough.js style, layers bottom-up: Model as a function → Hardware → Training / Serving → RAG / LLM apps → Agents → Evals and production → Case studies). Stub geometry is fine; follow DIAGRAMS.md.
3. Legend: done / ready / soon.
4. **Module grid by part.** Each part is an h2 with the part title. Under it a 2-col grid (1-col on mobile) of module cards. Card: italic serif number, title, `ready/total`, thin progress bar (done in this browser), and a `<details>` that lists the lessons (number, title, done check; soon lessons muted). The first module with unfinished ready lessons opens by default. This replaces the long vertical tree: 15 modules x 2 tracks is too long for it.
5. Lessons with a `requires` in the other track show a small "↔ Backend 5.1" chip in the AI lesson list (AI only, data from the outline when present; stub for now).

## 7. Lesson page

- Route moves to `src/pages/learn/backend/[...id].astro` and `src/pages/learn/ai/[...id].astro` (share one `LessonPage.astro` component; keep the route files thin).
- Prev/next stay inside the track.
- On load, write `sd-last`.
- "builds on" chips that point to the other track get the other track's accent and a small track label.
- Add `CrossTrackLink.astro`: a card with track tag, lesson number, title, 3-5 sentence summary slot, link. Used later by AI lessons that overlap backend lessons.

## 8. Links and redirects

- Backend MDX bodies contain `/learn/<id>/` links. The legacy redirect pages keep them working. Do not rewrite MDX in Phase 0 (another agent may be editing lessons). A later codemod rewrites them to `/learn/backend/<id>/`.
- `search.json.ts`, `questions.json.ts`, `review.astro`, `Review.tsx`: every built URL goes through one helper `lessonHref(id)` in `tracks.ts`. No string-built `/learn/` URLs anywhere else.

## 9. Stub copy (placeholder, replace later)

- Backend tagline: "How real systems stay fast, correct and up, from one machine to planet scale."
- AI tagline: "How models are trained, served, grounded and kept safe in production."
- Backend bullets: "Size a system on the back of an envelope." · "Pick the database and say why." · "Survive a failure you did not plan for."
- AI bullets: "Work out GPU memory and cost per request." · "Build retrieval that finds the right page." · "Ship an agent you can evaluate and trust."

## 10. Done means

- `npx astro check` clean; build to a scratch outDir passes.
- Playwright sweep of `/`, `/learn/backend/`, `/learn/ai/`, one backend lesson, one legacy URL, `/review/`, at 1440 and 390 wide, light and dark: no console errors, no horizontal overflow at 390, rendered text >= 12px, legacy URL lands on the new URL.
- Progress made before the redesign still shows (same localStorage keys).
