# Lab L04 reference fix: one refresher per key, everyone else serves the last good value.
#
# 1. Two keys per product: "fresh" expires after TTL, "stale" never expires.
# 2. On a fresh miss, try to take a lock with SET NX PX. The lock is in Redis,
#    so it works across all 4 app processes (an asyncio.Lock would give one
#    query per process, so 4 per expiry).
# 3. The lock winner queries the database and writes both keys.
# 4. Losers return the stale copy at once. With no stale copy yet (cold start),
#    they wait for the winner. They never query the database themselves, so a
#    slow database cannot restart the stampede.
import asyncio
import json
import uuid

TTL_SECONDS = 5
LOCK_MS = 3000

SUMMARY_SQL = """
    SELECT p.id, p.name, p.price,
           count(r.id)              AS reviews,
           round(avg(r.stars), 2)   AS rating
    FROM products p
    JOIN reviews r ON r.product_id = p.id
    WHERE p.id = $1
    GROUP BY p.id
"""

RELEASE_LUA = """
if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end
return 0
"""


async def load_summary_from_db(db, product_id):
    row = await db.fetchrow(SUMMARY_SQL, product_id)
    if row is None:
        return None
    return {**dict(row), "rating": float(row["rating"])}


async def get_summary(product_id, redis, db):
    fresh_key = f"summary:{product_id}"
    stale_key = f"summary:{product_id}:stale"
    lock_key = f"summary:{product_id}:lock"

    cached = await redis.get(fresh_key)
    if cached is not None:
        return json.loads(cached)

    stale = await redis.get(stale_key)
    token = str(uuid.uuid4())
    # Up to about 5 s: become the refresher, or serve stale, or wait for the refresher.
    for _ in range(100):
        if await redis.set(lock_key, token, nx=True, px=LOCK_MS):
            try:
                summary = await load_summary_from_db(db, product_id)
                if summary is not None:
                    payload = json.dumps(summary)
                    await redis.set(fresh_key, payload, ex=TTL_SECONDS)
                    await redis.set(stale_key, payload)
                return summary
            finally:
                # Delete the lock only if it is still ours (it may have expired and been retaken).
                await redis.eval(RELEASE_LUA, 1, lock_key, token)

        if stale is not None:
            return json.loads(stale)

        # Cold start: no stale copy yet. Wait for the refresher. If it crashed,
        # its lock expires and one of us takes over on a later loop.
        await asyncio.sleep(0.05)
        cached = await redis.get(fresh_key)
        if cached is not None:
            return json.loads(cached)

    raise TimeoutError("summary refresh took too long")
