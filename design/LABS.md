# Hands-on Labs: Plan

Status: approved 2026-10-25. Pilot L04 built in `labs/` (Python FastAPI). Waiting for the user cold run (pilot step 6).

## Goal

Lessons teach the map. Labs make the learner walk it.
Each lab runs real software (Postgres, Redis, Kafka), breaks it on purpose, and makes the learner fix it.
A script checks the fix. Reading the lesson is not enough to pass.

## Lab shape (every lab)

1. **Goal**: one sentence. "Stop the cache stampede from melting Postgres."
2. **Setup**: `./lab up`. Services start in under 3 minutes.
3. **Predict**: the learner writes down what will happen before the break. Stored in the site.
4. **Break**: `./lab break`. Load starts, the flaw shows.
5. **Observe**: `./lab watch` prints 2-3 live numbers each second (DB QPS, p99, error rate). No Grafana; too heavy.
6. **Fix**: the learner edits one small file in `app/`. Hints unlock one at a time on the site.
7. **Check**: `./lab check` reruns the load and tests the outcome. Pass prints a completion code.
8. **Reflect**: 2 questions on the site. "What did the fix cost you?" "When would you not use it?"

Time target: 30-60 minutes per lab.

## Runtime

Recommended: **Docker Compose + GitHub Codespaces**.

- One public repo, `uptime-labs`, one folder per lab.
- A `.devcontainer/` makes "Open in Codespaces" one click. Free tier (60 core-hours a month) covers about 30 labs.
- The same repo runs locally with Docker for learners who have it.
- Budget per lab: 2 cores, under 4 GB RAM (fits the default Codespace).

Rejected:
- WebContainers: runs Node only. No real Postgres, Redis, or Kafka.
- Hosted sandboxes per learner: costs money and needs ops.
- Pure in-browser simulation: the site already has animations. Labs must be real.

App language: Python (FastAPI), short and readable for most freshers. Load tool: k6.

## Repo layout

```
uptime-labs/
  .devcontainer/devcontainer.json
  lab                      # CLI: up, break, watch, check, reset, hint
  shared/                  # load scripts, watch helper, code signer
  L04-cache-stampede/
    compose.yaml
    app/                   # the service the learner edits
    break.js               # k6 script that triggers the flaw
    check.py               # pass/fail rules
    solution/              # reference fix, hidden from the site
    README.md
```

## Site integration

- New page `/labs` with the lab list and progress.
- `<LabCard id="L04" />` at the end of the matching lesson, before the quiz.
- Lab page holds steps, prediction box, hints (one at a time), and the code box.
- Progress in localStorage `sd-labs`, same pattern as `sd-cards`.
- Completion code: `UPT-L04-<8 chars>`, an HMAC of lab id and the measured result. The key lives in the public repo, so this is an honor system. That is fine for a learning site; it marks progress, not credentials.
- Add labs to the hub streak heatmap (`sd-activity`).

## Lab list

Batch 1 (modules 3-7, the core):

| Id | Lesson | Break | Fix | Check |
|----|--------|-------|-----|-------|
| L01 | 04-data/indexing | Order lookup on 5M rows does a full scan | Read `EXPLAIN ANALYZE`, add the right composite index | p95 under 20 ms at 200 RPS |
| L02 | 04-data/transactions | 200 users book the last Tatkal seat at once; it oversells | Row lock (`SELECT ... FOR UPDATE`) or a constraint | 0 oversold seats in 5 runs |
| L03 | 04-data/replication | Write to primary, read from replica, see old data | Read-your-writes routing for that user | 0 stale reads after own write |
| L04 | 05-caching/invalidation-stampede | Hot key expires at 500 RPS; Postgres QPS spikes | Single-flight lock or early refresh | DB QPS peak under 20 at expiry |
| L05 | 03-api-design/idempotency | UPI-style pay API retried by client; double debit | Idempotency key table | 0 double debits under retries |
| L06 | 07-reliability/rate-limiting | One client floods the API | Token bucket in Redis (Lua script) | Flooder gets 429s; others p99 unchanged |
| L07 | 07-reliability/timeouts-retries, circuit-breaker | Slow downstream plus naive retries; retry storm | Timeouts, backoff with jitter, circuit breaker | Upstream recovers within 30 s of downstream fix |
| L08 | 06-async/delivery-semantics | Consumer crashes after work, before offset commit; duplicates | Dedupe by event id | 0 duplicate effects after 3 forced crashes |
| L09 | 06-async/backpressure-dlq | One poison message blocks the queue | Bounded retries, then DLQ | Queue drains; poison message in DLQ |

Batch 2 (fills gaps found in the 2026-10-25 review):

- L10 zero-downtime schema migration (expand, backfill, contract) while k6 traffic runs. Check: 0 errors during the migration.
- L11 load test to find the bottleneck (connection pool size). Check: learner names the bottleneck and doubles throughput.
- L12 feature flag rollout plus rollback under an error spike.
- AI track labs (later): prompt cache hit rate, eval harness on a broken RAG, agent loop with a runaway tool call.

## Pilot

Build **L04 cache stampede** first, end to end, before any other lab.

Pilot passes when:
1. A Codespace starts and `./lab up` finishes in under 3 minutes.
2. `./lab break` shows the spike clearly in `./lab watch`.
3. The unfixed app fails `./lab check`. The `solution/` app passes. Five runs each, no flakes.
4. Peak RAM under 4 GB.
5. The site page works at 1280 px and 390 px. The code box accepts a real code and rejects a fake one.
6. The user does the lab cold and reports time and confusion points.

Then review with the user before batch 1.

## Build pipeline

Same split as lessons:
- Haiku: research notes per lab (real numbers, docs links).
- Sonnet: one writer per lab writes app, break script, check, solution, README, site page.
- Orchestrator: runs every lab twice (broken must fail, solution must pass) before accepting it. A lab that cannot be checked by a script is not shipped.

## Open questions

1. Separate public repo `uptime-labs`, or a `labs/` folder in this repo first?
2. Python app OK, or Java/Node for the target reader?
3. Codespaces as default, or local Docker as default?
