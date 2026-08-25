INSERT IGNORE INTO page_sections
  (page_key, section_key, section_type, display_name, content_json, is_enabled, sort_order)
VALUES
  (
    'collection-page:yusuf-bhai-originals', 'hero', 'fixed', 'Hero section',
    JSON_OBJECT(
      'eyebrow', 'In-house blends / Dubai',
      'title', JSON_OBJECT('lead', 'Yusuf Bhai', 'accent', 'Originals'),
      'intro', 'Distinctive compositions created to move with every mood, moment and personality. From luminous citrus to deep woods and enveloping oud, each fragrance is an original expression of character.',
      'statement', 'Created without comparison. Remembered without introduction.',
      'highlights', JSON_ARRAY('21 original scents', 'Four signature families', 'Crafted in Dubai'),
      'productIds', JSON_ARRAY()
    ), 1, 10
  ),
  (
    'collection-page:yusuf-bhai-originals', 'detail', 'fixed', 'Detail section',
    JSON_OBJECT(
      'eyebrow', 'Complete collection',
      'title', 'House signatures',
      'description', 'Created without comparison. Remembered without introduction.',
      'credit', 'A collection composed by Yusuf Bhai'
    ), 1, 20
  ),
  (
    'collection-page:premium-collection', 'hero', 'fixed', 'Hero section',
    JSON_OBJECT(
      'eyebrow', 'Rare profiles / House selection',
      'title', JSON_OBJECT('lead', 'The Private', 'accent', 'Collection'),
      'intro', 'A considered edit of distinctive fragrances selected for depth, refinement and lasting presence. From polished woods to luminous signatures, every composition earns its place through character rather than convention.',
      'statement', 'Selected with intention. Worn without compromise.',
      'highlights', JSON_ARRAY('Twelve elevated compositions', 'Distinctive profiles and signatures', 'Curated by the N7 atelier'),
      'productIds', JSON_ARRAY()
    ), 1, 10
  ),
  (
    'collection-page:premium-collection', 'detail', 'fixed', 'Detail section',
    JSON_OBJECT(
      'eyebrow', 'Complete collection',
      'title', 'The private edit',
      'description', 'Selected with intention. Worn without compromise.',
      'credit', 'A private edit by N7 Cosmetics'
    ), 1, 20
  ),
  (
    'collection-page:recreations', 'hero', 'fixed', 'Hero section',
    JSON_OBJECT(
      'eyebrow', 'Familiar notes / New expression',
      'title', JSON_OBJECT('lead', 'The Art of', 'accent', 'Recreation'),
      'intro', 'An expansive fragrance library inspired by celebrated scent profiles. Each composition revisits a familiar mood through the craftsmanship and character of the Yusuf Bhai atelier.',
      'statement', 'Recognisable in spirit. Individual in expression.',
      'highlights', JSON_ARRAY('60 interpretations', 'For him, her and everyone', 'Made for everyday ritual'),
      'productIds', JSON_ARRAY()
    ), 1, 10
  ),
  (
    'collection-page:recreations', 'detail', 'fixed', 'Detail section',
    JSON_OBJECT(
      'eyebrow', 'Complete collection',
      'title', 'The scent index',
      'description', 'Recognisable in spirit. Individual in expression.',
      'credit', 'A collection composed by Yusuf Bhai'
    ), 1, 20
  ),
  (
    'collection-page:bundles', 'hero', 'fixed', 'Hero section',
    JSON_OBJECT(
      'eyebrow', 'Curated trios / Better together',
      'title', JSON_OBJECT('lead', 'The Scent', 'accent', 'Wardrobe'),
      'intro', 'Three considered fragrances, brought together for every side of your day. Each set moves from effortless freshness to evening depth while offering exceptional value.',
      'statement', 'One set. Three moods. Every occasion considered.',
      'highlights', JSON_ARRAY('Six curated trios', 'Three 100ml fragrances', 'Ready to gift'),
      'productIds', JSON_ARRAY()
    ), 1, 10
  ),
  (
    'collection-page:bundles', 'detail', 'fixed', 'Detail section',
    JSON_OBJECT(
      'eyebrow', 'Complete collection',
      'title', 'The complete wardrobe',
      'description', 'One set. Three moods. Every occasion considered.',
      'credit', 'A collection composed by Yusuf Bhai'
    ), 1, 20
  );

UPDATE page_sections
SET content_json = JSON_REMOVE(content_json, '$.megaMenu')
WHERE section_key = 'detail'
  AND page_key IN (
    'collection-page:yusuf-bhai-originals',
    'collection-page:premium-collection',
    'collection-page:recreations',
    'collection-page:bundles'
  );
