UPDATE products p
INNER JOIN product_collections pc ON pc.product_id = p.id
INNER JOIN collections c ON c.id = pc.collection_id AND c.slug = 'recreations'
SET p.product_code = CASE p.slug
  WHEN '1872-vetiver' THEN '707'
  WHEN 'afternoon-swim' THEN '1790'
  WHEN 'allure-home-sport' THEN '453'
  WHEN 'ambre-nuit' THEN '222'
  WHEN 'angels-share' THEN '1542'
  WHEN 'attrape-reves' THEN '1467'
  WHEN 'aventus' THEN '253'
  WHEN 'baccarat-rouge-extrait-540' THEN '230'
  WHEN 'black-opium' THEN '971'
  WHEN 'black-orchid' THEN '579'
  WHEN 'blue-de-chanel' THEN '7060'
  WHEN 'bvlgari-le-gemme' THEN '1048'
  WHEN 'carmina' THEN '2400'
  WHEN 'costa-azzura' THEN '1405'
  WHEN 'delina-de-marly' THEN '1259'
  WHEN 'ebene-fume' THEN '1831'
  WHEN 'equivoque' THEN '1891'
  WHEN 'flower-bomb' THEN '290'
  WHEN 'goddess-burberry' THEN '2406'
  WHEN 'carolina-herrera-yb-good-girl-blush' THEN '1430'
  WHEN 'homme' THEN '1828'
  WHEN 'homme-intense' THEN '263'
  WHEN 'idole' THEN '1167'
  WHEN 'imagination' THEN '1772'
  WHEN 'interlude-man' THEN '562'
  WHEN 'irish-green' THEN '578'
  WHEN 'jadore' THEN '284'
  WHEN 'la-vie-est-belle' THEN '323'
  WHEN 'les-sables-roses' THEN '1473'
  WHEN 'miss-dior' THEN '1324'
  WHEN 'moonlight-pathcholi' THEN '1229'
  WHEN 'myrhh-and-tonka' THEN '1635'
  WHEN 'n5' THEN '277'
  WHEN 'noir-extreme' THEN '720'
  WHEN 'ombre-leather' THEN '879'
  WHEN 'ombre-nomade' THEN '2030'
  WHEN 'one-million' THEN '785'
  WHEN 'oud-for-greatness' THEN '1368'
  WHEN 'oud-intense' THEN '582'
  WHEN 'oud-stallion' THEN '777'
  WHEN 'oud-zarian' THEN '2728'
  WHEN 'pacific-chill' THEN '2480'
  WHEN 'promise' THEN '1906'
  WHEN 'reflection-man' THEN '1206'
  WHEN 'royal-oud' THEN '598'
  WHEN 'santal-33' THEN '1231'
  WHEN 'sauvage' THEN '2035'
  WHEN 'srk-special' THEN '2686'
  WHEN 'stellar-times' THEN '1890'
  WHEN 'terre-de-hermes' THEN '573'
  WHEN 'tobacco-vanille' THEN '428'
  WHEN 'velvet-desert-oud' THEN '361'
  WHEN 'ysl-libre' THEN '1168'
  ELSE p.product_code
END
WHERE p.product_type = 'STANDARD'
  AND p.slug IN (
    '1872-vetiver', 'afternoon-swim', 'allure-home-sport', 'ambre-nuit', 'angels-share',
    'attrape-reves', 'aventus', 'baccarat-rouge-extrait-540', 'black-opium', 'black-orchid',
    'blue-de-chanel', 'bvlgari-le-gemme', 'carmina', 'costa-azzura', 'delina-de-marly',
    'ebene-fume', 'equivoque', 'flower-bomb', 'goddess-burberry', 'carolina-herrera-yb-good-girl-blush',
    'homme', 'homme-intense', 'idole', 'imagination', 'interlude-man', 'irish-green', 'jadore',
    'la-vie-est-belle', 'les-sables-roses', 'miss-dior', 'moonlight-pathcholi', 'myrhh-and-tonka',
    'n5', 'noir-extreme', 'ombre-leather', 'ombre-nomade', 'one-million', 'oud-for-greatness',
    'oud-intense', 'oud-stallion', 'oud-zarian', 'pacific-chill', 'promise', 'reflection-man',
    'royal-oud', 'santal-33', 'sauvage', 'srk-special', 'stellar-times', 'terre-de-hermes',
    'tobacco-vanille', 'velvet-desert-oud', 'ysl-libre'
  );
