INSERT IGNORE INTO site_settings
  (setting_key, setting_group, value_json, is_public, updated_by)
VALUES
  ('inventory.low_stock_threshold', 'inventory', '5', 0, NULL);

UPDATE product_variants
SET low_stock_threshold = 5;
