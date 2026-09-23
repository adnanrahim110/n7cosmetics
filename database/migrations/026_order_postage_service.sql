ALTER TABLE orders
  ADD COLUMN postage_service VARCHAR(190) NULL AFTER tracking_reference;
