# Runs alongside a 40 s load test (started by ./lab check) and decides pass or fail.
import random
import sys
import time

import httpx

sys.path.insert(0, "/shared")
from labkit import db, report, wait_for_k6_summary  # noqa: E402

MAX_DB_QUERIES = 20       # about 8 cache expiries in 40 s; a fix needs about 1 query each
MAX_P99_MS = 300
MAX_ERROR_RATE = 0.01
FRESH_WITHIN_S = 8        # TTL is 5 s; a price change must show within 8 s

started_at = float(sys.argv[1])
conn = db()
client = httpx.Client(timeout=10)

# Measure only this run.
conn.execute("SELECT pg_stat_statements_reset()")

# Halfway through, change the price. The cache must not hide it forever.
time.sleep(18)
new_price = random.randint(10000, 99999)
conn.execute("UPDATE products SET price = %s WHERE id = 42", (new_price,))
changed_at = time.time()
seen_after = None
while time.time() - changed_at < 15:
    try:
        if client.get("http://app:8000/products/42/summary").json().get("price") == new_price:
            seen_after = time.time() - changed_at
            break
    except (httpx.HTTPError, ValueError):
        pass
    time.sleep(0.25)

summary = wait_for_k6_summary("/shared/out/summary.json", started_at)
calls = conn.execute(
    "SELECT coalesce(sum(calls), 0) FROM pg_stat_statements "
    "WHERE query ILIKE '%FROM products p%JOIN reviews r%'"
).fetchone()[0]

m = summary["metrics"]
p99 = m["http_req_duration"]["p(99)"]
errors = m["http_req_failed"]["value"]
requests = m["http_reqs"]["count"]

sys.exit(report("L04", [
    ("Database protected", calls <= MAX_DB_QUERIES,
     f"{calls} summary queries for {requests} requests (limit {MAX_DB_QUERIES})"),
    ("Fast for users", p99 <= MAX_P99_MS, f"p99 {p99:.0f} ms (limit {MAX_P99_MS} ms)"),
    ("No errors", errors <= MAX_ERROR_RATE, f"{errors:.1%} failed (limit {MAX_ERROR_RATE:.0%})"),
    ("Price change visible", seen_after is not None and seen_after <= FRESH_WITHIN_S,
     f"new price seen after {seen_after:.1f} s" if seen_after is not None else "new price never seen"),
]))
