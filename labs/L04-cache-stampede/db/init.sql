-- 1,000 products and 2,000,000 reviews. reviews.product_id has no index on purpose:
-- the summary query scans the whole table, so each run costs real CPU.
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE TABLE products (
  id    int PRIMARY KEY,
  name  text NOT NULL,
  price int  NOT NULL
);

CREATE TABLE reviews (
  id         bigserial PRIMARY KEY,
  product_id int      NOT NULL,
  stars      smallint NOT NULL
);

INSERT INTO products
SELECT i, 'Product ' || i, 500 + (i * 37) % 4500
FROM generate_series(1, 1000) AS i;

INSERT INTO reviews (product_id, stars)
SELECT 1 + (i::bigint * 7919) % 1000, 1 + (i % 5)
FROM generate_series(1, 2000000) AS i;

UPDATE products SET name = 'Flash Sale Phone', price = 9999 WHERE id = 42;
ANALYZE;
