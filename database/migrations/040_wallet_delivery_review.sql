ALTER TABLE orders
  ADD COLUMN delivery_address_review_required TINYINT(1) NOT NULL DEFAULT 0;
