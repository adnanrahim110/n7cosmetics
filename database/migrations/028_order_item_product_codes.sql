ALTER TABLE order_items
  ADD COLUMN product_code VARCHAR(100) NULL AFTER product_name;

-- Preserve the best available identifier for existing orders, including deleted products.
UPDATE order_items oi
LEFT JOIN products p ON p.id = oi.product_id
SET oi.product_code = COALESCE(NULLIF(TRIM(p.product_code), ''), NULLIF(TRIM(oi.sku), ''))
WHERE oi.product_code IS NULL;
