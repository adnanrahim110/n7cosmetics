CREATE TABLE order_number_sequence (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  next_number BIGINT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Keep existing order references; avoid collisions if sequential orders already exist.
INSERT INTO order_number_sequence (id, next_number)
SELECT 1, GREATEST(1001, COALESCE(MAX(CAST(SUBSTRING(order_number, 4) AS UNSIGNED)) + 1, 1001))
FROM orders WHERE order_number REGEXP '^N7-[0-9]+$';
