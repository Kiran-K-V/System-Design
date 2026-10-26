# Lab L04: Cache stampede.
# This is the only file you edit. Run `./lab restart` after each change.
#
# get_summary() is called on every request to /products/{id}/summary.
# The summary query scans 2,000,000 reviews. It takes about 100 ms with an idle database.
import json

TTL_SECONDS = 5

SUMMARY_SQL = """
    SELECT p.id, p.name, p.price,
           count(r.id)              AS reviews,
           round(avg(r.stars), 2)   AS rating
    FROM products p
    JOIN reviews r ON r.product_id = p.id
    WHERE p.id = $1
    GROUP BY p.id
"""


async def load_summary_from_db(db, product_id):
    row = await db.fetchrow(SUMMARY_SQL, product_id)
    if row is None:
        return None
    return {**dict(row), "rating": float(row["rating"])}


async def get_summary(product_id, redis, db):
    key = f"summary:{product_id}"

    cached = await redis.get(key)
    if cached is not None:
        return json.loads(cached)

    # Cache miss: go to the database, then fill the cache.
    summary = await load_summary_from_db(db, product_id)
    if summary is not None:
        await redis.set(key, json.dumps(summary), ex=TTL_SECONDS)
    return summary
