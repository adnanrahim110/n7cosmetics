CREATE TABLE IF NOT EXISTS sales (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  status ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  offer_type ENUM('BUY_X_GET_Y_FREE') NOT NULL DEFAULT 'BUY_X_GET_Y_FREE',
  buy_quantity INT UNSIGNED NOT NULL DEFAULT 5,
  free_quantity INT UNSIGNED NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_sales_slug (slug),
  KEY idx_sales_status_sort (status, sort_order, created_at),
  CONSTRAINT chk_sales_quantities CHECK (
    buy_quantity >= 2 AND free_quantity >= 1 AND free_quantity < buy_quantity
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sale_products (
  sale_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (sale_id, product_id),
  KEY idx_sale_products_product (product_id),
  KEY idx_sale_products_sale_sort (sale_id, sort_order),
  CONSTRAINT fk_sale_products_sale
    FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_products_product
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO sales (name, slug, status, offer_type, buy_quantity, free_quantity, sort_order)
SELECT 'Buy 5, Get 1 Free', 'buy-5-get-1-free', 'ACTIVE', 'BUY_X_GET_Y_FREE', 5, 1, 0
WHERE NOT EXISTS (SELECT 1 FROM sales);

SET @initial_sale_id = (
  SELECT id FROM sales WHERE slug = 'buy-5-get-1-free' ORDER BY id LIMIT 1
);

INSERT IGNORE INTO sale_products (sale_id, product_id, sort_order)
SELECT @initial_sale_id, pc.product_id, pc.sort_order
FROM product_collections pc
INNER JOIN collections c ON c.id = pc.collection_id AND c.slug = 'sale'
WHERE @initial_sale_id IS NOT NULL;
