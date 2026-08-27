ALTER TABLE bundle_items
  ADD COLUMN sort_order INT UNSIGNED NOT NULL DEFAULT 0 AFTER quantity,
  ADD KEY idx_bundle_items_bundle_sort (bundle_product_id, sort_order);

DELETE FROM categories WHERE slug = 'bundles';
DELETE FROM collections WHERE slug = 'bundles';
