-- Fail before changing persistent tables if old free methods need manual mapping.
DROP TEMPORARY TABLE IF EXISTS shipping_migration_guard;
CREATE TEMPORARY TABLE shipping_migration_guard (
  ok TINYINT NOT NULL,
  CONSTRAINT free_shipping_requires_one_delivery_method CHECK (ok = 1)
);
INSERT INTO shipping_migration_guard (ok)
SELECT 0 FROM shipping_methods free_method
WHERE free_method.method_type = 'FREE_SHIPPING'
  AND (SELECT COUNT(*) FROM shipping_methods delivery
       WHERE delivery.zone_id=free_method.zone_id AND delivery.method_type='FLAT_RATE') <> 1;
DROP TEMPORARY TABLE shipping_migration_guard;

CREATE TABLE shipping_zone_postcodes (
  zone_id BIGINT UNSIGNED NOT NULL,
  pattern VARCHAR(30) NOT NULL,
  PRIMARY KEY (zone_id, pattern),
  FOREIGN KEY (zone_id) REFERENCES shipping_zones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE shipping_method_rates (
  method_id BIGINT UNSIGNED NOT NULL,
  zone_id BIGINT UNSIGNED NOT NULL,
  price_pence INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (method_id, zone_id),
  FOREIGN KEY (method_id) REFERENCES shipping_methods(id) ON DELETE CASCADE,
  FOREIGN KEY (zone_id) REFERENCES shipping_zones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE shipping_rules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  minimum_subtotal_pence INT UNSIGNED NOT NULL DEFAULT 0,
  threshold_basis ENUM('BEFORE_DISCOUNT','AFTER_DISCOUNT') NOT NULL DEFAULT 'BEFORE_DISCOUNT',
  zone_id BIGINT UNSIGNED NULL,
  priority INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  legacy_id BIGINT UNSIGNED NULL,
  migration_method_id BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_shipping_rule_legacy (legacy_id),
  UNIQUE KEY uq_shipping_rule_migration (migration_method_id),
  FOREIGN KEY (zone_id) REFERENCES shipping_zones(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE shipping_rule_methods (
  rule_id BIGINT UNSIGNED NOT NULL,
  method_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (rule_id, method_id),
  FOREIGN KEY (rule_id) REFERENCES shipping_rules(id) ON DELETE CASCADE,
  FOREIGN KEY (method_id) REFERENCES shipping_methods(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO shipping_method_rates (method_id,zone_id,price_pence)
SELECT id,zone_id,price_pence FROM shipping_methods WHERE method_type <> 'FREE_SHIPPING';
INSERT INTO shipping_rules (name,minimum_subtotal_pence,threshold_basis,zone_id,is_active,legacy_id,migration_method_id)
SELECT CONCAT('Free ',delivery.name),COALESCE(free_method.free_over_pence,0),free_method.threshold_basis,
  free_method.zone_id,free_method.is_active,free_method.legacy_id,free_method.id
FROM shipping_methods free_method JOIN shipping_methods delivery
  ON delivery.zone_id=free_method.zone_id AND delivery.method_type='FLAT_RATE'
WHERE free_method.method_type='FREE_SHIPPING';
INSERT INTO shipping_rule_methods (rule_id,method_id)
SELECT r.id,m.id FROM shipping_rules r JOIN shipping_methods m ON m.zone_id=r.zone_id AND m.method_type='FLAT_RATE';
INSERT INTO shipping_rules (name,minimum_subtotal_pence,threshold_basis,zone_id,is_active,migration_method_id)
SELECT CONCAT('Free ',name),free_over_pence,threshold_basis,zone_id,is_active,id
FROM shipping_methods WHERE method_type='FLAT_RATE' AND free_over_pence IS NOT NULL;
INSERT IGNORE INTO shipping_rule_methods (rule_id,method_id)
SELECT r.id,m.id FROM shipping_rules r JOIN shipping_methods m ON m.id=r.migration_method_id
WHERE m.method_type='FLAT_RATE';

DELETE FROM shipping_methods WHERE method_type='FREE_SHIPPING';
ALTER TABLE shipping_methods
  ADD COLUMN pricing_mode ENUM('FLAT_RATE','ZONE_RATES') NOT NULL DEFAULT 'FLAT_RATE',
  ADD COLUMN allow_free_shipping_coupon TINYINT(1) NOT NULL DEFAULT 0,
  MODIFY COLUMN method_type ENUM('FLAT_RATE','DELIVERY','LOCAL_PICKUP') NOT NULL;
UPDATE shipping_methods SET method_type='DELIVERY',allow_free_shipping_coupon=1 WHERE method_type='FLAT_RATE';
ALTER TABLE shipping_methods
  DROP FOREIGN KEY fk_shipping_methods_zone,
  DROP INDEX idx_shipping_methods_zone,
  DROP COLUMN zone_id,
  DROP COLUMN free_over_pence,
  DROP COLUMN threshold_basis,
  MODIFY COLUMN method_type ENUM('DELIVERY','LOCAL_PICKUP') NOT NULL DEFAULT 'DELIVERY',
  ADD KEY idx_shipping_methods_active (is_active,sort_order);
-- Historical orders retain their amounts and names; new orders retain the full calculation.
ALTER TABLE orders ADD COLUMN shipping_snapshot_json JSON NULL;
