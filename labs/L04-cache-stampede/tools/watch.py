# Live view during `./lab break`: one line per second.
import sys
import time

import httpx

sys.path.insert(0, "/shared")
from labkit import BOLD, DIM, RED, RESET, db  # noqa: E402

COUNT_SQL = """
    SELECT coalesce(sum(calls), 0) FROM pg_stat_statements
    WHERE query ILIKE '%FROM products p%JOIN reviews r%'
"""
ACTIVE_SQL = """
    SELECT count(*) FROM pg_stat_activity
    WHERE state = 'active' AND query ILIKE '%JOIN reviews r%' AND pid <> pg_backend_pid()
"""

conn = db()
client = httpx.Client(timeout=10)
last = conn.execute(COUNT_SQL).fetchone()[0]
print(f"{BOLD}{'time':>8}  {'summary queries/s':>18}  {'running now':>11}  {'one request':>11}{RESET}")
while True:
    time.sleep(1)
    total = conn.execute(COUNT_SQL).fetchone()[0]
    active = conn.execute(ACTIVE_SQL).fetchone()[0]
    t0 = time.perf_counter()
    try:
        client.get("http://app:8000/products/42/summary")
        ms = f"{(time.perf_counter() - t0) * 1000:7.0f} ms"
    except httpx.HTTPError:
        ms = f"{RED}  timeout{RESET}"
    rate = total - last
    last = total
    bar = "#" * min(rate, 40)
    color = RED if rate > 3 else DIM
    print(f"{time.strftime('%H:%M:%S'):>8}  {rate:>18}  {active:>11}  {ms:>11}  {color}{bar}{RESET}", flush=True)
