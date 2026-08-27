UPDATE products p
INNER JOIN product_collections pc ON pc.product_id = p.id
INNER JOIN collections c ON c.id = pc.collection_id AND c.slug = 'recreations'
SET p.product_code = CASE p.slug
  WHEN 'dior-sauvage-elixir' THEN '1727'
  WHEN 'falcon-leather' THEN '1874'
  WHEN 'limmensite' THEN '1710'
  WHEN 'la-nuit-de-lhomme' THEN '669'
  WHEN 'red-tobacco' THEN '1201'
  WHEN 'x-masculine' THEN '709'
  WHEN 'absolu-aventus' THEN '2235'
  ELSE p.product_code
END
WHERE p.product_type = 'STANDARD'
  AND p.slug IN (
    'dior-sauvage-elixir', 'falcon-leather', 'limmensite', 'la-nuit-de-lhomme',
    'red-tobacco', 'x-masculine', 'absolu-aventus'
  );
