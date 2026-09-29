-- Earlier order snapshots used the SKU when the product had no product code.
-- Replace those fallback snapshots with the actual catalog code, or NULL.
-- Keep genuine product codes, including snapshots that differ from the SKU.
UPDATE order_items oi
LEFT JOIN products p ON p.id = oi.product_id
SET oi.product_code = NULLIF(TRIM(p.product_code), '')
WHERE NULLIF(TRIM(oi.product_code), '') = NULLIF(TRIM(oi.sku), '')
  AND NOT (NULLIF(TRIM(oi.product_code), '') <=> NULLIF(TRIM(p.product_code), ''));
