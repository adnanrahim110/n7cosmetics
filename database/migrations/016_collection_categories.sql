-- Reset the legacy global categories. Products and collections are retained.
START TRANSACTION;
UPDATE discounts SET is_active = 0 WHERE applies_to = 'CATEGORIES';
DELETE FROM discount_categories;
DELETE FROM product_categories;
DELETE FROM categories;
COMMIT;

ALTER TABLE categories
  DROP FOREIGN KEY fk_categories_parent,
  DROP INDEX idx_categories_parent,
  DROP INDEX uq_categories_slug,
  DROP COLUMN parent_id,
  ADD COLUMN collection_id BIGINT UNSIGNED NOT NULL AFTER id,
  ADD COLUMN seo_title VARCHAR(190) NULL,
  ADD COLUMN seo_description VARCHAR(320) NULL,
  ADD UNIQUE KEY uq_categories_collection_slug (collection_id, slug),
  ADD KEY idx_categories_collection_status_sort (collection_id, status, sort_order),
  ADD CONSTRAINT fk_categories_collection
    FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE RESTRICT;
