-- Owner confirmed on 2026-10-20: the 28 reviewed standard products and the
-- six reviewed complete gift sets have no assigned GTIN or MPN. Exact IDs/slugs
-- and bundle recipes prevent applying that fact to unreviewed replacement items.
-- Runtime catalogue data remains dynamic; existing admin choices are preserved.
START TRANSACTION;
INSERT IGNORE INTO google_merchant_products (variant_id, identifier_policy, bundle_kind)
SELECT v.id, 'NONE', IF(p.product_type = 'BUNDLE', 'SET', 'UNREVIEWED')
FROM products p INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
WHERE p.status = 'ACTIVE' AND (
  (p.product_type = 'STANDARD' AND NOT EXISTS
    (SELECT 1 FROM product_collections pc INNER JOIN collections c ON c.id = pc.collection_id
     WHERE pc.product_id = p.id AND c.slug = 'recreations') AND (
      (p.id = '93' AND p.slug = 'anemoia')
      OR (p.id = '95' AND p.slug = 'arabella')
      OR (p.id = '96' AND p.slug = 'ardor')
      OR (p.id = '97' AND p.slug = 'arousal')
      OR (p.id = '103' AND p.slug = 'bloody-oud')
      OR (p.id = '107' AND p.slug = 'city-walk')
      OR (p.id = '110' AND p.slug = 'dark-moon')
      OR (p.id = '114' AND p.slug = 'devoir-elixir')
      OR (p.id = '116' AND p.slug = 'domestic-noir')
      OR (p.id = '121' AND p.slug = 'forbidden-love')
      OR (p.id = '122' AND p.slug = 'french-oud')
      OR (p.id = '130' AND p.slug = 'indian-funk')
      OR (p.id = '139' AND p.slug = 'memoir')
      OR (p.id = '143' AND p.slug = 'myth')
      OR (p.id = '147' AND p.slug = 'nostalgia')
      OR (p.id = '156' AND p.slug = 'passio')
      OR (p.id = '157' AND p.slug = 'poem-arabic-gold')
      OR (p.id = '158' AND p.slug = 'poem-arabic-silver')
      OR (p.id = '159' AND p.slug = 'poem-french-gold')
      OR (p.id = '160' AND p.slug = 'poem-french-silver')
      OR (p.id = '161' AND p.slug = 'pour-femme')
      OR (p.id = '162' AND p.slug = 'pour-homme')
      OR (p.id = '163' AND p.slug = 'pragma')
      OR (p.id = '167' AND p.slug = 'rendezvous')
      OR (p.id = '173' AND p.slug = 'surreal')
      OR (p.id = '174' AND p.slug = 'tar')
      OR (p.id = '179' AND p.slug = 'xs-night-extreme')
      OR (p.id = '182' AND p.slug = 'legendry')
  )) OR (p.product_type = 'BUNDLE' AND (
      (p.id = '91' AND p.slug = 'allure-home-sport-sauvage-legendary' AND
      (SELECT GROUP_CONCAT(CONCAT(component.product_id, ':', bi.quantity, ':', LOWER(REPLACE(component.title, ' ', '')))
        ORDER BY component.product_id SEPARATOR '|') FROM bundle_items bi
        INNER JOIN product_variants component ON component.id = bi.component_variant_id
        WHERE bi.bundle_product_id = p.id) = '90:1:100ml|170:1:100ml|182:1:100ml')
      OR (p.id = '108' AND p.slug = 'city-walk-xs-night-extreme-indian-funk' AND
      (SELECT GROUP_CONCAT(CONCAT(component.product_id, ':', bi.quantity, ':', LOWER(REPLACE(component.title, ' ', '')))
        ORDER BY component.product_id SEPARATOR '|') FROM bundle_items bi
        INNER JOIN product_variants component ON component.id = bi.component_variant_id
        WHERE bi.bundle_product_id = p.id) = '107:1:100ml|130:1:100ml|179:1:100ml')
      OR (p.id = '111' AND p.slug = 'dark-moon-indian-funk-domestic-noir' AND
      (SELECT GROUP_CONCAT(CONCAT(component.product_id, ':', bi.quantity, ':', LOWER(REPLACE(component.title, ' ', '')))
        ORDER BY component.product_id SEPARATOR '|') FROM bundle_items bi
        INNER JOIN product_variants component ON component.id = bi.component_variant_id
        WHERE bi.bundle_product_id = p.id) = '110:1:100ml|116:1:100ml|130:1:100ml')
      OR (p.id = '124' AND p.slug = 'goddess-burberry-good-girl-forbidden-love' AND
      (SELECT GROUP_CONCAT(CONCAT(component.product_id, ':', bi.quantity, ':', LOWER(REPLACE(component.title, ' ', '')))
        ORDER BY component.product_id SEPARATOR '|') FROM bundle_items bi
        INNER JOIN product_variants component ON component.id = bi.component_variant_id
        WHERE bi.bundle_product_id = p.id) = '121:1:100ml|123:1:100ml|125:1:100ml')
      OR (p.id = '134' AND p.slug = 'jadore-ysl-libre-french-oud' AND
      (SELECT GROUP_CONCAT(CONCAT(component.product_id, ':', bi.quantity, ':', LOWER(REPLACE(component.title, ' ', '')))
        ORDER BY component.product_id SEPARATOR '|') FROM bundle_items bi
        INNER JOIN product_variants component ON component.id = bi.component_variant_id
        WHERE bi.bundle_product_id = p.id) = '122:1:100ml|133:1:100ml|180:1:100ml')
      OR (p.id = '146' AND p.slug = 'noir-extreme-forbidden-love-french-oud' AND
      (SELECT GROUP_CONCAT(CONCAT(component.product_id, ':', bi.quantity, ':', LOWER(REPLACE(component.title, ' ', '')))
        ORDER BY component.product_id SEPARATOR '|') FROM bundle_items bi
        INNER JOIN product_variants component ON component.id = bi.component_variant_id
        WHERE bi.bundle_product_id = p.id) = '121:1:100ml|122:1:100ml|145:1:100ml')
  ))
);
INSERT INTO audit_logs (action, entity_type, summary, metadata_json)
VALUES ('GOOGLE_MERCHANT_REVIEW', 'catalogue', 'Applied owner-confirmed identifier policy and reviewed gift-set classifications',
  JSON_OBJECT('confirmed_at', '2026-10-20', 'applied_rows', ROW_COUNT(), 'scope', '28 reviewed standard products and 6 exact gift-set recipes'));
COMMIT;

