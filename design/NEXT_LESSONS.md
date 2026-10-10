# Writing the next lessons: handoff for agents

Read this file first. It is the whole context you need. Then read the files it names.

Site: **Uptime** (brand constant `SITE` in `src/layouts/Layout.astro`). Subject: System Design, taught from first principles, for interview prep at mid to staff level. Stack: Astro 7, MDX, React islands, Motion, Tailwind 4, rough.js. Write "System Design" in Title Case in titles and UI labels. Plain prose may say "system design".

## 1. Status

| Module | State |
|---|---|
| 0 Orientation, 1 One Machine, 2 Networking, 3 API Design, 4 Data, 5 Caching, 6 Asynchronous Systems, 7 Reliability, 8 Key Technologies | Done. 57 lessons. |
| 9 Patterns (7), 10 Advanced Topics (5), 11 Case Studies (24), 12 In the Wild (4) | **To write. 40 lessons.** |

Module 6 to 8 reusable components: `AsyncQueueViz`, `AsyncPartitionViz` (queue and consumer-group visuals), `Rel*` (retry, breaker, token bucket, trace waterfall), `TechParts`. Prefix new components per module to avoid collisions between parallel writers. Lessons in Modules 6 to 8 link back with `/learn/<id>/` markdown links; never link forward to an unwritten lesson (write "lesson 9.5" as plain text).

`src/lib/syllabus.ts` is the single source of truth for lesson ids, titles, and order. Do not rename, add, or reorder lessons without the orchestrator's approval.

## 2. Read these first (they are the house standard)

- `design/DIAGRAMS.md`: the diagram rules. Mandatory.
- `src/components/anim/sketch.tsx`: hand-drawn primitives (`SketchSvg`, `SketchBox`, `SketchEllipse`, `SketchCylinder`, `SketchArrow`, `HandText`, `Badge`, `TEXT_SIZES`, `STROKE`, `seedOf`). The primitives enforce size and stroke rules.
- `src/components/anim/{AnimFrame,FlowDiagram,SequenceDiagram}.tsx`: step player and diagram kits.
- Two finished lessons as templates: `src/content/lessons/04-data/consensus.mdx` (deep concept) and `src/content/lessons/02-networking/load-balancing.mdx` (shows `Diagnose`). Open their components in `src/components/anim/lessons/`.
- `src/content/lessons/00-orientation/design-method.mdx`: the six-step method every case study follows.
- Lesson components in `src/components/lesson/`: `Callout.astro`, `Quiz.tsx`, `Diagnose.tsx`, `Ballpark.tsx`, `Table.astro`.

## 3. Lesson file contract

Path: `src/content/lessons/<module-slug>/<lesson-slug>.mdx`.

Frontmatter, exactly two keys:
```
---
summary: 'One sentence. Single-quote it. A double quote or colon at the start breaks the build for everyone.'
requires: ['04-data/replication']
---
```
`requires` lists 1 to 3 real prerequisites, only **earlier** lessons in the syllabus. The build fails otherwise.

Imports use relative paths: `../../../components/lesson/Callout.astro`, `../../../components/lesson/Quiz.tsx`, `../../../components/anim/lessons/<Name>.tsx`. Use `client:visible` on every React component that has state.

### Sections (h2), in this order. Names may vary.
1. **The problem.** A concrete pain, with numbers.
2. **Naive solution** and where it fails. Animate the failure when you can.
3. **The mechanism.** Build the real solution step by step from earlier lessons.
4. **Numbers.** Latency, throughput, sizes. Link lesson 1.5.
5. **Trade-offs.** A table: gain, pay, when to choose.
6. **Interview lens.** `<Callout type="tip">` and `<Callout type="mistake">`. Optional `<Callout type="deep" title="...">`. These are the only three callout types.
7. **Check yourself.** `Quiz` (3 to 5 questions). Add one `Diagnose` (a short incident puzzle) or one `Ballpark` (estimation practice) where it fits.
8. **Further reading.** 2 to 4 links you fetched yourself and confirmed load.

Length: 900 to 1800 words of prose plus visuals.

### Writing style
- Plain, direct English. One idea per sentence. Short sentences. Active voice. Define every term at first use. No filler, no hype.
- Teach why, then how, then numbers. Show a failing naive design before the fix.
- Concrete numbers. Mark rough ones with `~`. Use only numbers you verified from a source or derived and showed.
- Original text. Hello Interview and other sites are for checking topic coverage only. Never copy their sentences, structure, or diagrams.
- Cite only what you read. If a claim has no source, say it without a number or leave it out. Never invent numbers.

### Quiz rules (a script reads them)
- `/review` and `src/pages/questions.json.ts` extract every `questions={[...]}` from the raw MDX and run it as JavaScript. So each quiz must be a **plain literal**: no imports, variables, template-literal expressions, or function calls inside it.
- Question text must be **unique across all lessons**. A duplicate fails the build ("Duplicate question id"). You may set a stable `id: 'slug'` on a question.
- Shape: `{ q, options: string[], answer: index, explain }`. Test understanding (predict, compute, choose). `explain` says why the right answer is right and why a tempting wrong one is wrong.
- Spread the correct `answer` index across questions. Make the right option no longer than the others.
- `Diagnose` needs a unique `id`. `Ballpark` takes `answer` and `within` (factor tolerance; use 1.1 to 1.3 for small exact integers).

## 4. Visual contract

Every lesson has at least **one step-through animation** (`AnimFrame` with `steps: {caption}[]`, rendering a pure function of the step index) and **one more visual**: a second animation, a live simulator with sliders or buttons, or a static infographic. Static infographics are React components with no hooks and no client directive.

- Follow `design/DIAGRAMS.md`. Use `TEXT_SIZES` tokens, `STROKE`, tone colors that mean state (`accent` active, `ok`, `bad`, `warn`, `muted`), one active element per step. Hatch only on number badges.
- Build with the primitives and kits. Do not draw raw SVG shapes or text when a primitive exists.
- viewBox about 720 wide so text stays at least 13px on screen. Phones scroll diagrams sideways (global rule), so do not shrink fonts to fit.
- Use CSS variables only (`var(--accent)`, `--ok`, `--bad`, `--warn`, `--muted`, `--fg`, `--bg`, `--surface`, `--border`, `--node`) so dark mode works.
- Step captions explain what just happened and why, in plain English. One idea per step. No autoplay.
- **Server-side render safety:** no `Math.random()`, `Date.now()`, or `window` or `localStorage` reads during render (hydration mismatch). Randomness and storage go in effects or handlers. Use `seedOf('key')` for sketch seeds.
- Interactive logic (simulators, calculators) gets its logic in a separate `.ts` file and a quick node test of the numbers. State the model's assumptions in the lesson.
- New components go in `src/components/anim/lessons/<UniqueName>.tsx`. Run `ls` first. Reuse and compose. Do not copy near-duplicates.

## 5. Process and model routing

The orchestrator (main session) owns design decisions, integration, and final review. Workers do narrow jobs.

1. **Research (Haiku 5.5, `model: "haiku"`).** One agent per 3 to 5 lessons. Output one fact sheet per lesson at `<scratch>/research/<slug>.md`, under 700 words, with: core facts (each with a fetched source URL), numbers that matter, trade-offs, common interview probes and wrong answers, real-world examples, a coverage checklist from hellointerview.com (topic names only), two animation ideas as step lists, sources. Mark anything not verified as `UNVERIFIED`.
2. **Write (stronger model, e.g. Sonnet 5.5).** One agent per 3 to 5 lessons. Reads this file, the fact sheets, and two template lessons. Writes the MDX and its components, and verifies them. A wrong lesson is costly and hard to spot, so do not give writing to Haiku. If a Haiku result is weak, rerun that task on a stronger model. Do not retry Haiku in a loop.
3. **Verify (orchestrator).** Type check, scratch build, page sweep, link check, look at screenshots, spot-check numbers against the fact sheets.
4. **Integrate.** Fix cross-lesson links, duplicate questions, and tone. Update this file's status table.

Parallel writers must touch **only their own lesson files and their own new components**. They must not edit shared files: `sketch.tsx`, `FlowDiagram.tsx`, `SequenceDiagram.tsx`, `AnimFrame.tsx`, `Callout.astro`, `Quiz.tsx`, `QuestionCard.tsx`, `Layout.astro`, `global.css`, `syllabus.ts`, `content.config.ts`, `astro.config.mjs`, or another agent's lessons. If a shared file needs a change, report it to the orchestrator.

## 6. Verify before you report

- `npx astro check` shows 0 errors.
- Test build into a scratch folder: `npx astro build --outDir <scratch>`. Never build into `dist/` while others work. It must pass, including the `requires` order check and the duplicate-question check.
- Use the dev server at http://localhost:4321. Only one `astro dev` can run per project. If it will not start, a lesson frontmatter or MDX error is usually the cause: read the log.
- Screenshot the first, a middle, and the last step of every animation in light and dark. Look for overlapping text, clipped labels, arrows through boxes, wrong captions, empty areas. Fix and shoot again. Check one lesson at width 390.
- Drive each interactive widget with a script and check the numbers against a hand calculation.
- Sweep every lesson page at widths 1280 and 390. Pass means: no console or page errors, `scrollWidth` equals the viewport width, rendered SVG text at least 12px. Rendered size is `fontSize * (svgRenderedWidth / viewBoxWidth)`.
- Check every Further reading URL returns 200 (a 403 from a site that blocks scripts is acceptable if the page exists).
- Keep helper scripts outside the repo (the session scratchpad). Install `playwright-core` there and launch `/usr/bin/google-chrome`. The old `pw/` helper folder no longer works.

## 7. Gotchas that cost time before

- Astro 7 ignores `markdown.rehypePlugins` unless an extra package is installed. Tables get their scroll frame from `components={{ table: Table }}` in `src/pages/learn/[...id].astro`. Do not add a rehype plugin.
- Content is cached: after edits to config, restart the dev server.
- Wrapped static diagram: an SVG that is a direct child of a `div` or `figure` gets the phone scroll rule. Keep that structure.
- `SketchSvg` collapses runs of spaces. For mono tables use explicit x positions.
- Hand font has no bold. Show emphasis with color.
- Do not leave a quote or colon at the start of the `summary` unquoted.
- Do not run a second dev server, and do not delete `node_modules/` or the `.astro/` cache while agents work.

## 8. Work queue

Work module by module, in syllabus order. Lessons in a module can be written in parallel (they may only `requires` earlier lessons). Suggested batches:

| Batch | Lessons | Notes |
|---|---|---|
| A | Module 6: queues, pubsub-logs, delivery-semantics, backpressure-dlq, cdc | Build a reusable `QueueViz` (buffer, workers, lag meter) and a partition/consumer-group visual once, then reuse. Sources: Kafka and RabbitMQ docs, outbox pattern write-ups, Debezium docs. |
| B | Module 7: failure-modes, timeouts-retries, circuit-breaker, rate-limiting, observability | Retries with and without jitter, circuit breaker state machine, token bucket. Sources: AWS Builders' Library, Google SRE book. |
| C1, C2 | Module 8: C1 postgresql, redis, cassandra, dynamodb, elasticsearch. C2 kafka, flink, zookeeper, temporal, api-gateway, blob-storage | Each page: what it is, its internal model (link the Module 4 to 6 lessons it builds on), when to use it, limits with verified numbers, interview phrases. Official docs are the primary source. |
| D1, D2 | Module 9: D1 scaling-reads, scaling-writes, real-time-updates, contention. D2 multi-step, large-blobs, long-running-tasks | Each pattern is a composition of earlier lessons. Show the "builds on" graph and a before/after QPS meter. |
| E | Module 10: proximity-search, time-series, big-data-structures, vector-databases, ids-and-time | Geohash and quadtree, Bloom filter, HyperLogLog, HNSW, Snowflake IDs. Compute examples by hand and show them. |
| F1 to F5 | Module 11 Case Studies, 24 lessons in table order, about 5 per batch | See the template below. |
| G | Module 12 In the Wild: discord-messages, figma-multiplayer, shopify-inventory, slack-job-queue | Research-heavy. Primary source is the company's engineering post. Show a "before and after" diagram. State what is the company's claim and what is our reading. |

### Case study template (Module 11)
Follow the six steps from `00-orientation/design-method.mdx` as h2 sections: Requirements (functional, below the line, non-functional with numbers), Core entities, API, Data flow (only if the problem needs it), High-level design, Deep dives. Then Trade-offs, Interview lens, Check yourself, Further reading.
- Animation 1: the high-level design **builds up step by step**, one box per requirement, each step naming which requirement it satisfies.
- Animation 2 or interactive: one deep dive (for example ID generation, fan-out, or the hot key) with a toggle between a naive design and the improved one.
- Include a `Ballpark` for the scale numbers and one `Diagnose` for a failure.
- Each case study adds 1 or 2 new ideas and **links back** to the lessons that taught the parts (`requires` and inline links). Do not re-teach a mechanism. Point to it.
- Order and "new ideas" per case study are in section 2 of the plan: `/home/ll-kv-kirababu/.claude/plans/i-need-to-create-delightful-crescent.md`.

## 9. Prompt template for a writer agent

```
You are an expert system-design teacher and front-end engineer. Read
design/NEXT_LESSONS.md and design/DIAGRAMS.md first and follow them exactly.
Read src/content/lessons/04-data/consensus.mdx and the lesson components it uses.

Your slice: write these lessons in src/content/lessons/<module>/: <slug list>.
Fact sheets (verified, with sources): <scratch>/research/<slug>.md. Verify any
UNVERIFIED claim against a primary source or drop the number.
Existing components you may reuse: <names>.
Touch only your own lesson files and new component files. Do not edit shared files.
Verify per section 6. Final report under 200 words: lessons written, components
created, shared-file problems found, anything unverified.
```

## 10. Definition of done for a batch

All lessons written, check and scratch build pass, sweep is clean at both widths, every animation step viewed, widgets tested, links checked, no duplicate questions. The orchestrator updates the status table in section 1 and the project memory note.
