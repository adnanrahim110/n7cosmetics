INSERT IGNORE INTO collections
  (name, slug, description, status, sort_order, seo_title, seo_description)
VALUES
  (
    'N7 Collection',
    'n7',
    'A signature edit shaped by the N7 point of view: expressive fragrances chosen for presence, individuality and lasting character.',
    'ACTIVE',
    5,
    'N7 Collection | N7 Cosmetics',
    'Discover the N7 Collection: expressive fragrances selected for presence, individuality and lasting character.'
  );

INSERT IGNORE INTO page_sections
  (page_key, section_key, section_type, display_name, content_json, is_enabled, sort_order)
VALUES
  (
    'collection-page:n7', 'hero', 'fixed', 'Hero section',
    JSON_OBJECT(
      'eyebrow', 'The house collection / United Kingdom',
      'title', JSON_OBJECT('lead', 'The N7', 'accent', 'Collection'),
      'intro', 'A signature edit shaped by the N7 point of view: expressive fragrances chosen for presence, individuality and lasting character.',
      'statement', 'Curated with intent. Worn as a signature.',
      'highlights', JSON_ARRAY('N7 signature selection', 'Distinctive everyday compositions', 'Curated in the United Kingdom'),
      'productIds', JSON_ARRAY()
    ), 1, 10
  ),
  (
    'collection-page:n7', 'detail', 'fixed', 'Detail section',
    JSON_OBJECT(
      'eyebrow', 'Complete collection',
      'title', 'The N7 signature edit',
      'description', 'Curated with intent. Worn as a signature.',
      'credit', 'A house edit by N7 Cosmetics'
    ), 1, 20
  );
