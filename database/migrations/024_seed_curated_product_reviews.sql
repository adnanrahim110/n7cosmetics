-- Seed curated reviews for 11 fragrances (8 recreations + 3 originals)

-- Ambre Nuit (Product Code 222)
INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'James Mitchell', NULL, NULL, 'Really classy fragrance. Warm, smooth and smells expensive.', 1, 0, '127.0.0.1', '2026-07-06 00:00:00.000', '2026-07-06 00:00:00.000'
FROM products p
WHERE p.slug = 'ambre-nuit'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'James Mitchell'
      AND pr.submitted_at = '2026-07-06 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Oliver Harris', NULL, NULL, 'Yusuf Bhai has done a brilliant job with this recreation. One of my favourites.', 1, 0, '127.0.0.1', '2026-07-15 00:00:00.000', '2026-07-15 00:00:00.000'
FROM products p
WHERE p.slug = 'ambre-nuit'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Oliver Harris'
      AND pr.submitted_at = '2026-07-15 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Sophie Bennett', NULL, NULL, 'Amazing smell, just not my absolute favourite from the collection.', 1, 0, '127.0.0.1', '2026-07-27 00:00:00.000', '2026-07-27 00:00:00.000'
FROM products p
WHERE p.slug = 'ambre-nuit'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Sophie Bennett'
      AND pr.submitted_at = '2026-07-27 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Daniel Cooper', NULL, NULL, 'Arrived quickly and was packed really well. Very happy with my order.', 1, 0, '127.0.0.1', '2026-08-08 00:00:00.000', '2026-08-08 00:00:00.000'
FROM products p
WHERE p.slug = 'ambre-nuit'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Daniel Cooper'
      AND pr.submitted_at = '2026-08-08 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Jack Thompson', NULL, NULL, 'Such a smooth evening fragrance. Gets even better after it settles.', 1, 0, '127.0.0.1', '2026-08-19 00:00:00.000', '2026-08-19 00:00:00.000'
FROM products p
WHERE p.slug = 'ambre-nuit'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Jack Thompson'
      AND pr.submitted_at = '2026-08-19 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Emily Carter', NULL, NULL, 'First time ordering and really impressed with the quality and service.', 1, 0, '127.0.0.1', '2026-08-29 00:00:00.000', '2026-08-29 00:00:00.000'
FROM products p
WHERE p.slug = 'ambre-nuit'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Emily Carter'
      AND pr.submitted_at = '2026-08-29 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Callum Foster', NULL, NULL, 'Lovely scent, just a little stronger than what I normally wear.', 1, 0, '127.0.0.1', '2026-09-04 00:00:00.000', '2026-09-04 00:00:00.000'
FROM products p
WHERE p.slug = 'ambre-nuit'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Callum Foster'
      AND pr.submitted_at = '2026-09-04 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Harry Collins', NULL, NULL, 'Customer service replied very quickly and helped me with my order.', 1, 0, '127.0.0.1', '2026-09-10 00:00:00.000', '2026-09-10 00:00:00.000'
FROM products p
WHERE p.slug = 'ambre-nuit'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Harry Collins'
      AND pr.submitted_at = '2026-09-10 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Thomas Walker', NULL, NULL, 'Yusuf Bhai has really nailed this one. Smooth and very premium smelling.', 1, 0, '127.0.0.1', '2026-09-16 00:00:00.000', '2026-09-16 00:00:00.000'
FROM products p
WHERE p.slug = 'ambre-nuit'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Thomas Walker'
      AND pr.submitted_at = '2026-09-16 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Ryan Matthews', NULL, NULL, 'Took a little longer than expected but very pleased once it arrived.', 1, 0, '127.0.0.1', '2026-09-20 00:00:00.000', '2026-09-20 00:00:00.000'
FROM products p
WHERE p.slug = 'ambre-nuit'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Ryan Matthews'
      AND pr.submitted_at = '2026-09-20 00:00:00.000'
  )
LIMIT 1;


-- Angels’ Share (Product Code 1542)
INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'George Wilson', NULL, NULL, 'Absolutely love this fragrance. Warm, sweet and perfect for evenings.', 1, 0, '127.0.0.1', '2026-07-03 00:00:00.000', '2026-07-03 00:00:00.000'
FROM products p
WHERE p.slug = 'angels-share'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'George Wilson'
      AND pr.submitted_at = '2026-07-03 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Charlie Evans', NULL, NULL, 'Yusuf Bhai has smashed this recreation. Smells rich and lasts well on me.', 1, 0, '127.0.0.1', '2026-07-12 00:00:00.000', '2026-07-12 00:00:00.000'
FROM products p
WHERE p.slug = 'angels-share'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Charlie Evans'
      AND pr.submitted_at = '2026-07-12 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Lucy Parker', NULL, NULL, 'Really nice fragrance, just slightly sweeter than I normally wear.', 1, 0, '127.0.0.1', '2026-07-24 00:00:00.000', '2026-07-24 00:00:00.000'
FROM products p
WHERE p.slug = 'angels-share'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Lucy Parker'
      AND pr.submitted_at = '2026-07-24 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Adam Richardson', NULL, NULL, 'First order from here and everything went smoothly. Fast delivery too.', 1, 0, '127.0.0.1', '2026-08-05 00:00:00.000', '2026-08-05 00:00:00.000'
FROM products p
WHERE p.slug = 'angels-share'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Adam Richardson'
      AND pr.submitted_at = '2026-08-05 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Ben Harrison', NULL, NULL, 'Smells luxurious and gets plenty of compliments. Great value.', 1, 0, '127.0.0.1', '2026-08-17 00:00:00.000', '2026-08-17 00:00:00.000'
FROM products p
WHERE p.slug = 'angels-share'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Ben Harrison'
      AND pr.submitted_at = '2026-08-17 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Sophie Davies', NULL, NULL, 'Ordered this as a present and it arrived in time. Really pleased.', 1, 0, '127.0.0.1', '2026-08-26 00:00:00.000', '2026-08-26 00:00:00.000'
FROM products p
WHERE p.slug = 'angels-share'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Sophie Davies'
      AND pr.submitted_at = '2026-08-26 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Lewis Clark', NULL, NULL, 'Great quality, although I personally prefer something a little fresher.', 1, 0, '127.0.0.1', '2026-09-02 00:00:00.000', '2026-09-02 00:00:00.000'
FROM products p
WHERE p.slug = 'angels-share'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Lewis Clark'
      AND pr.submitted_at = '2026-09-02 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Nathan Roberts', NULL, NULL, 'Another really good recreation from Yusuf Bhai. Warm and addictive.', 1, 0, '127.0.0.1', '2026-09-09 00:00:00.000', '2026-09-09 00:00:00.000'
FROM products p
WHERE p.slug = 'angels-share'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Nathan Roberts'
      AND pr.submitted_at = '2026-09-09 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Katie Morgan', NULL, NULL, 'Got tracking quickly and the parcel arrived without any problems. 10/10 service.', 1, 0, '127.0.0.1', '2026-09-14 00:00:00.000', '2026-09-14 00:00:00.000'
FROM products p
WHERE p.slug = 'angels-share'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Katie Morgan'
      AND pr.submitted_at = '2026-09-14 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Sam Turner', NULL, NULL, 'Opening was a little strong for me but the dry-down is lovely.', 1, 0, '127.0.0.1', '2026-09-21 00:00:00.000', '2026-09-21 00:00:00.000'
FROM products p
WHERE p.slug = 'angels-share'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Sam Turner'
      AND pr.submitted_at = '2026-09-21 00:00:00.000'
  )
LIMIT 1;


-- Attrape Rêves (Product Code 1467)
INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Amelia Hughes', NULL, NULL, 'Beautiful fragrance. Sweet, elegant and very easy to wear.', 1, 0, '127.0.0.1', '2026-07-07 00:00:00.000', '2026-07-07 00:00:00.000'
FROM products p
WHERE p.slug = 'attrape-reves'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Amelia Hughes'
      AND pr.submitted_at = '2026-07-07 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Jacob Taylor', NULL, NULL, 'Really impressed with Yusuf Bhai’s recreation. Smells much more expensive than £40.', 1, 0, '127.0.0.1', '2026-07-18 00:00:00.000', '2026-07-18 00:00:00.000'
FROM products p
WHERE p.slug = 'attrape-reves'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Jacob Taylor'
      AND pr.submitted_at = '2026-07-18 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Ella Thompson', NULL, NULL, 'Lovely scent, just a little sweeter than my usual fragrances.', 1, 0, '127.0.0.1', '2026-07-30 00:00:00.000', '2026-07-30 00:00:00.000'
FROM products p
WHERE p.slug = 'attrape-reves'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Ella Thompson'
      AND pr.submitted_at = '2026-07-30 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Luke Anderson', NULL, NULL, 'Delivery was quick and everything came packed really nicely.', 1, 0, '127.0.0.1', '2026-08-06 00:00:00.000', '2026-08-06 00:00:00.000'
FROM products p
WHERE p.slug = 'attrape-reves'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Luke Anderson'
      AND pr.submitted_at = '2026-08-06 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Grace Roberts', NULL, NULL, 'Wasn’t sure what to expect but I’m really glad I ordered.', 1, 0, '127.0.0.1', '2026-08-15 00:00:00.000', '2026-08-15 00:00:00.000'
FROM products p
WHERE p.slug = 'attrape-reves'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Grace Roberts'
      AND pr.submitted_at = '2026-08-15 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Joseph Martin', NULL, NULL, 'Yusuf Bhai has done a great job with this one. Smooth and easy to wear.', 1, 0, '127.0.0.1', '2026-08-25 00:00:00.000', '2026-08-25 00:00:00.000'
FROM products p
WHERE p.slug = 'attrape-reves'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Joseph Martin'
      AND pr.submitted_at = '2026-08-25 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Megan Lewis', NULL, NULL, 'Nice fragrance and good quality. Not my number one but still very good.', 1, 0, '127.0.0.1', '2026-09-03 00:00:00.000', '2026-09-03 00:00:00.000'
FROM products p
WHERE p.slug = 'attrape-reves'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Megan Lewis'
      AND pr.submitted_at = '2026-09-03 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Alex Wood', NULL, NULL, 'Had a question before ordering and customer service replied straight away.', 1, 0, '127.0.0.1', '2026-09-08 00:00:00.000', '2026-09-08 00:00:00.000'
FROM products p
WHERE p.slug = 'attrape-reves'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Alex Wood'
      AND pr.submitted_at = '2026-09-08 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Charlotte Green', NULL, NULL, 'Very pleasant scent and excellent value for money.', 1, 0, '127.0.0.1', '2026-09-15 00:00:00.000', '2026-09-15 00:00:00.000'
FROM products p
WHERE p.slug = 'attrape-reves'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Charlotte Green'
      AND pr.submitted_at = '2026-09-15 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Matthew Hall', NULL, NULL, 'Quickly becoming one of my favourites. Perfect for evenings.', 1, 0, '127.0.0.1', '2026-09-19 00:00:00.000', '2026-09-19 00:00:00.000'
FROM products p
WHERE p.slug = 'attrape-reves'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Matthew Hall'
      AND pr.submitted_at = '2026-09-19 00:00:00.000'
  )
LIMIT 1;


-- Black Orchid (Product Code 579)
INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Joshua Brown', NULL, NULL, 'Dark, rich and really classy. Exactly the sort of fragrance I like.', 1, 0, '127.0.0.1', '2026-07-04 00:00:00.000', '2026-07-04 00:00:00.000'
FROM products p
WHERE p.slug = 'black-orchid'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Joshua Brown'
      AND pr.submitted_at = '2026-07-04 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'William Scott', NULL, NULL, 'Yusuf Bhai has done an excellent job with this recreation.', 1, 0, '127.0.0.1', '2026-07-14 00:00:00.000', '2026-07-14 00:00:00.000'
FROM products p
WHERE p.slug = 'black-orchid'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'William Scott'
      AND pr.submitted_at = '2026-07-14 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Olivia King', NULL, NULL, 'Very good fragrance but quite bold. I prefer it for evenings.', 1, 0, '127.0.0.1', '2026-07-25 00:00:00.000', '2026-07-25 00:00:00.000'
FROM products p
WHERE p.slug = 'black-orchid'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Olivia King'
      AND pr.submitted_at = '2026-07-25 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Dylan Moore', NULL, NULL, 'Arrived quickly and was packed safely. Really pleased.', 1, 0, '127.0.0.1', '2026-08-04 00:00:00.000', '2026-08-04 00:00:00.000'
FROM products p
WHERE p.slug = 'black-orchid'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Dylan Moore'
      AND pr.submitted_at = '2026-08-04 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Jack Davies', NULL, NULL, 'Smells expensive and lasts really well on me.', 1, 0, '127.0.0.1', '2026-08-16 00:00:00.000', '2026-08-16 00:00:00.000'
FROM products p
WHERE p.slug = 'black-orchid'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Jack Davies'
      AND pr.submitted_at = '2026-08-16 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Hannah Wright', NULL, NULL, 'Good quality and definitely unique, just a bit heavier than I normally wear.', 1, 0, '127.0.0.1', '2026-08-28 00:00:00.000', '2026-08-28 00:00:00.000'
FROM products p
WHERE p.slug = 'black-orchid'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Hannah Wright'
      AND pr.submitted_at = '2026-08-28 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Connor Lee', NULL, NULL, 'Customer service helped me choose this fragrance and I’m glad they did.', 1, 0, '127.0.0.1', '2026-09-05 00:00:00.000', '2026-09-05 00:00:00.000'
FROM products p
WHERE p.slug = 'black-orchid'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Connor Lee'
      AND pr.submitted_at = '2026-09-05 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Aaron Phillips', NULL, NULL, 'Another great recreation by Yusuf Bhai. Strong, smooth and gets noticed.', 1, 0, '127.0.0.1', '2026-09-11 00:00:00.000', '2026-09-11 00:00:00.000'
FROM products p
WHERE p.slug = 'black-orchid'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Aaron Phillips'
      AND pr.submitted_at = '2026-09-11 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Lauren Hill', NULL, NULL, 'Second order from here and again everything was perfect.', 1, 0, '127.0.0.1', '2026-09-17 00:00:00.000', '2026-09-17 00:00:00.000'
FROM products p
WHERE p.slug = 'black-orchid'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Lauren Hill'
      AND pr.submitted_at = '2026-09-17 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Jamie Ward', NULL, NULL, 'Took me a couple of wears to get used to it but really like it now.', 1, 0, '127.0.0.1', '2026-09-22 00:00:00.000', '2026-09-22 00:00:00.000'
FROM products p
WHERE p.slug = 'black-orchid'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Jamie Ward'
      AND pr.submitted_at = '2026-09-22 00:00:00.000'
  )
LIMIT 1;


-- Interlude Man (Product Code 562)
INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Daniel Brooks', NULL, NULL, 'Powerful, smoky and very masculine. Really impressive fragrance.', 1, 0, '127.0.0.1', '2026-07-05 00:00:00.000', '2026-07-05 00:00:00.000'
FROM products p
WHERE p.slug = 'interlude-man'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Daniel Brooks'
      AND pr.submitted_at = '2026-07-05 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Oliver Price', NULL, NULL, 'Yusuf Bhai has done a brilliant recreation. Smells serious and expensive.', 1, 0, '127.0.0.1', '2026-07-16 00:00:00.000', '2026-07-16 00:00:00.000'
FROM products p
WHERE p.slug = 'interlude-man'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Oliver Price'
      AND pr.submitted_at = '2026-07-16 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Samuel Baker', NULL, NULL, 'Very strong and lasts ages. A bit much for daytime but brilliant at night.', 1, 0, '127.0.0.1', '2026-07-28 00:00:00.000', '2026-07-28 00:00:00.000'
FROM products p
WHERE p.slug = 'interlude-man'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Samuel Baker'
      AND pr.submitted_at = '2026-07-28 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Chloe Adams', NULL, NULL, 'Fast delivery and good packaging. Everything arrived perfectly.', 1, 0, '127.0.0.1', '2026-08-07 00:00:00.000', '2026-08-07 00:00:00.000'
FROM products p
WHERE p.slug = 'interlude-man'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Chloe Adams'
      AND pr.submitted_at = '2026-08-07 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Henry Campbell', NULL, NULL, 'If you like deeper fragrances this is definitely worth trying.', 1, 0, '127.0.0.1', '2026-08-18 00:00:00.000', '2026-08-18 00:00:00.000'
FROM products p
WHERE p.slug = 'interlude-man'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Henry Campbell'
      AND pr.submitted_at = '2026-08-18 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Ben Stewart', NULL, NULL, 'Another winner from Yusuf Bhai. Strong performance and premium quality.', 1, 0, '127.0.0.1', '2026-08-30 00:00:00.000', '2026-08-30 00:00:00.000'
FROM products p
WHERE p.slug = 'interlude-man'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Ben Stewart'
      AND pr.submitted_at = '2026-08-30 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Lucy Bell', NULL, NULL, 'Good fragrance, just not something I’d personally wear every day.', 1, 0, '127.0.0.1', '2026-09-02 00:00:00.000', '2026-09-02 00:00:00.000'
FROM products p
WHERE p.slug = 'interlude-man'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Lucy Bell'
      AND pr.submitted_at = '2026-09-02 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'George Murphy', NULL, NULL, 'Had a tracking question and customer service responded straight away.', 1, 0, '127.0.0.1', '2026-09-09 00:00:00.000', '2026-09-09 00:00:00.000'
FROM products p
WHERE p.slug = 'interlude-man'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'George Murphy'
      AND pr.submitted_at = '2026-09-09 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Liam Cook', NULL, NULL, 'Really impressed for the price. Wasn’t expecting this quality.', 1, 0, '127.0.0.1', '2026-09-14 00:00:00.000', '2026-09-14 00:00:00.000'
FROM products p
WHERE p.slug = 'interlude-man'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Liam Cook'
      AND pr.submitted_at = '2026-09-14 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Emma Bailey', NULL, NULL, 'Ordered a few perfumes and this was definitely one of the standouts.', 1, 0, '127.0.0.1', '2026-09-20 00:00:00.000', '2026-09-20 00:00:00.000'
FROM products p
WHERE p.slug = 'interlude-man'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Emma Bailey'
      AND pr.submitted_at = '2026-09-20 00:00:00.000'
  )
LIMIT 1;


-- Oud For Greatness (Product Code 1368)
INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Harry Foster', NULL, NULL, 'Absolutely brilliant fragrance. Rich, woody and very luxurious.', 1, 0, '127.0.0.1', '2026-07-02 00:00:00.000', '2026-07-02 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-for-greatness'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Harry Foster'
      AND pr.submitted_at = '2026-07-02 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Theo Russell', NULL, NULL, 'Yusuf Bhai has nailed this recreation. One of the best from the collection.', 1, 0, '127.0.0.1', '2026-07-13 00:00:00.000', '2026-07-13 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-for-greatness'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Theo Russell'
      AND pr.submitted_at = '2026-07-13 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Rebecca Collins', NULL, NULL, 'Really good smell and lasts well, just stronger than what I normally wear.', 1, 0, '127.0.0.1', '2026-07-23 00:00:00.000', '2026-07-23 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-for-greatness'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Rebecca Collins'
      AND pr.submitted_at = '2026-07-23 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Alfie Hughes', NULL, NULL, 'Quick service from start to finish and tracking came through straight away.', 1, 0, '127.0.0.1', '2026-08-03 00:00:00.000', '2026-08-03 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-for-greatness'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Alfie Hughes'
      AND pr.submitted_at = '2026-08-03 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'James Parker', NULL, NULL, 'Smells expensive and I’ve already had a few compliments.', 1, 0, '127.0.0.1', '2026-08-14 00:00:00.000', '2026-08-14 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-for-greatness'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'James Parker'
      AND pr.submitted_at = '2026-08-14 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Sarah Wilson', NULL, NULL, 'I’ve ordered before and Yusuf Bhai’s fragrances keep impressing me.', 1, 0, '127.0.0.1', '2026-08-27 00:00:00.000', '2026-08-27 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-for-greatness'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Sarah Wilson'
      AND pr.submitted_at = '2026-08-27 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Michael Turner', NULL, NULL, 'Very nice oud fragrance. I prefer it for evenings rather than daytime.', 1, 0, '127.0.0.1', '2026-09-01 00:00:00.000', '2026-09-01 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-for-greatness'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Michael Turner'
      AND pr.submitted_at = '2026-09-01 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Ellie Cooper', NULL, NULL, 'Messaged customer service before buying and they were really helpful.', 1, 0, '127.0.0.1', '2026-09-07 00:00:00.000', '2026-09-07 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-for-greatness'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Ellie Cooper'
      AND pr.submitted_at = '2026-09-07 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Tom Harrison', NULL, NULL, 'Bottle arrived safely packed and the fragrance is excellent.', 1, 0, '127.0.0.1', '2026-09-13 00:00:00.000', '2026-09-13 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-for-greatness'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Tom Harrison'
      AND pr.submitted_at = '2026-09-13 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Ryan Edwards', NULL, NULL, 'Delivery took a little longer than expected but the fragrance itself is great.', 1, 0, '127.0.0.1', '2026-09-18 00:00:00.000', '2026-09-18 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-for-greatness'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Ryan Edwards'
      AND pr.submitted_at = '2026-09-18 00:00:00.000'
  )
LIMIT 1;


-- Oud Zarian (Product Code 2728)
INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Edward Taylor', NULL, NULL, 'Really rich and sophisticated fragrance. Smells very high end.', 1, 0, '127.0.0.1', '2026-07-01 00:00:00.000', '2026-07-01 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-zarian'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Edward Taylor'
      AND pr.submitted_at = '2026-07-01 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Max Roberts', NULL, NULL, 'Yusuf Bhai has done an amazing job with this recreation. Very classy.', 1, 0, '127.0.0.1', '2026-07-11 00:00:00.000', '2026-07-11 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-zarian'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Max Roberts'
      AND pr.submitted_at = '2026-07-11 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Isla Johnson', NULL, NULL, 'Lovely scent although it’s slightly heavier than my usual style.', 1, 0, '127.0.0.1', '2026-07-22 00:00:00.000', '2026-07-22 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-zarian'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Isla Johnson'
      AND pr.submitted_at = '2026-07-22 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Archie Lewis', NULL, NULL, 'First time ordering and really impressed. Delivery was fast.', 1, 0, '127.0.0.1', '2026-08-02 00:00:00.000', '2026-08-02 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-zarian'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Archie Lewis'
      AND pr.submitted_at = '2026-08-02 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Freddie Walker', NULL, NULL, 'Smells fantastic once it settles. Deep and woody.', 1, 0, '127.0.0.1', '2026-08-13 00:00:00.000', '2026-08-13 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-zarian'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Freddie Walker'
      AND pr.submitted_at = '2026-08-13 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Sophie Martin', NULL, NULL, 'Another quality fragrance from Yusuf Bhai. Definitely feels premium.', 1, 0, '127.0.0.1', '2026-08-24 00:00:00.000', '2026-08-24 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-zarian'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Sophie Martin'
      AND pr.submitted_at = '2026-08-24 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Noah Clark', NULL, NULL, 'Good performance and very nice smell, just not my favourite of the range.', 1, 0, '127.0.0.1', '2026-08-31 00:00:00.000', '2026-08-31 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-zarian'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Noah Clark'
      AND pr.submitted_at = '2026-08-31 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Jessica Hall', NULL, NULL, 'Had a small issue with my parcel but customer service sorted it immediately.', 1, 0, '127.0.0.1', '2026-09-06 00:00:00.000', '2026-09-06 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-zarian'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Jessica Hall'
      AND pr.submitted_at = '2026-09-06 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Charlie Green', NULL, NULL, 'Easy website to order from and the perfume arrived quickly.', 1, 0, '127.0.0.1', '2026-09-12 00:00:00.000', '2026-09-12 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-zarian'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Charlie Green'
      AND pr.submitted_at = '2026-09-12 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Ethan Morgan', NULL, NULL, 'Wasn’t sure what to expect but genuinely impressed. Definitely buying again.', 1, 0, '127.0.0.1', '2026-09-19 00:00:00.000', '2026-09-19 00:00:00.000'
FROM products p
WHERE p.slug = 'oud-zarian'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Ethan Morgan'
      AND pr.submitted_at = '2026-09-19 00:00:00.000'
  )
LIMIT 1;


-- Santal 33 (Product Code 1231)
INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Alexander White', NULL, NULL, 'Really clean, woody and easy to wear. Great everyday fragrance.', 1, 0, '127.0.0.1', '2026-07-08 00:00:00.000', '2026-07-08 00:00:00.000'
FROM products p
WHERE p.slug = 'santal-33'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Alexander White'
      AND pr.submitted_at = '2026-07-08 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Jack Robinson', NULL, NULL, 'Yusuf Bhai’s recreation is excellent. Smooth, classy and smells premium.', 1, 0, '127.0.0.1', '2026-07-19 00:00:00.000', '2026-07-19 00:00:00.000'
FROM products p
WHERE p.slug = 'santal-33'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Jack Robinson'
      AND pr.submitted_at = '2026-07-19 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Emily Scott', NULL, NULL, 'Nice fragrance and good quality. Took me a couple of wears to appreciate it.', 1, 0, '127.0.0.1', '2026-07-29 00:00:00.000', '2026-07-29 00:00:00.000'
FROM products p
WHERE p.slug = 'santal-33'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Emily Scott'
      AND pr.submitted_at = '2026-07-29 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Thomas Young', NULL, NULL, 'Delivery only took a couple of days and everything arrived perfectly.', 1, 0, '127.0.0.1', '2026-08-09 00:00:00.000', '2026-08-09 00:00:00.000'
FROM products p
WHERE p.slug = 'santal-33'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Thomas Young'
      AND pr.submitted_at = '2026-08-09 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Matthew Harris', NULL, NULL, 'Very happy with this one. Different from the sweeter scents I normally buy.', 1, 0, '127.0.0.1', '2026-08-20 00:00:00.000', '2026-08-20 00:00:00.000'
FROM products p
WHERE p.slug = 'santal-33'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Matthew Harris'
      AND pr.submitted_at = '2026-08-20 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Amelia Jones', NULL, NULL, 'Yusuf Bhai has done a great job. Simple, sophisticated and easy to wear.', 1, 0, '127.0.0.1', '2026-08-29 00:00:00.000', '2026-08-29 00:00:00.000'
FROM products p
WHERE p.slug = 'santal-33'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Amelia Jones'
      AND pr.submitted_at = '2026-08-29 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Louis Baker', NULL, NULL, 'Good smell, just not my absolute favourite. Still very nice quality.', 1, 0, '127.0.0.1', '2026-09-04 00:00:00.000', '2026-09-04 00:00:00.000'
FROM products p
WHERE p.slug = 'santal-33'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Louis Baker'
      AND pr.submitted_at = '2026-09-04 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Grace Evans', NULL, NULL, 'Messaged before ordering and got a quick helpful reply.', 1, 0, '127.0.0.1', '2026-09-10 00:00:00.000', '2026-09-10 00:00:00.000'
FROM products p
WHERE p.slug = 'santal-33'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Grace Evans'
      AND pr.submitted_at = '2026-09-10 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Jacob Wilson', NULL, NULL, 'Really good quality for the price. Will definitely try more.', 1, 0, '127.0.0.1', '2026-09-16 00:00:00.000', '2026-09-16 00:00:00.000'
FROM products p
WHERE p.slug = 'santal-33'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Jacob Wilson'
      AND pr.submitted_at = '2026-09-16 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Molly Davies', NULL, NULL, 'Parcel took slightly longer than expected but arrived safely and I’m happy with it.', 1, 0, '127.0.0.1', '2026-09-21 00:00:00.000', '2026-09-21 00:00:00.000'
FROM products p
WHERE p.slug = 'santal-33'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Molly Davies'
      AND pr.submitted_at = '2026-09-21 00:00:00.000'
  )
LIMIT 1;


-- Arousal (Yusuf Bhai Original)
INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Oliver Bennett', NULL, NULL, 'Really impressed with Arousal. Smooth, distinctive and feels very premium.', 1, 0, '127.0.0.1', '2026-07-05 00:00:00.000', '2026-07-05 00:00:00.000'
FROM products p
WHERE p.slug = 'arousal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Oliver Bennett'
      AND pr.submitted_at = '2026-07-05 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'James Walker', NULL, NULL, 'You can tell Yusuf Bhai has put a lot into creating this one. Really unique fragrance.', 1, 0, '127.0.0.1', '2026-07-16 00:00:00.000', '2026-07-16 00:00:00.000'
FROM products p
WHERE p.slug = 'arousal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'James Walker'
      AND pr.submitted_at = '2026-07-16 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Sophie Carter', NULL, NULL, 'Lovely smell and very good quality. Just not my absolute favourite from the range.', 1, 0, '127.0.0.1', '2026-07-28 00:00:00.000', '2026-07-28 00:00:00.000'
FROM products p
WHERE p.slug = 'arousal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Sophie Carter'
      AND pr.submitted_at = '2026-07-28 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Daniel Hughes', NULL, NULL, 'First time trying one of Yusuf Bhai’s originals and I’m genuinely impressed.', 1, 0, '127.0.0.1', '2026-08-07 00:00:00.000', '2026-08-07 00:00:00.000'
FROM products p
WHERE p.slug = 'arousal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Daniel Hughes'
      AND pr.submitted_at = '2026-08-07 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Ryan Cooper', NULL, NULL, 'Arrived quickly and everything was packed really well. Fragrance is excellent too.', 1, 0, '127.0.0.1', '2026-08-18 00:00:00.000', '2026-08-18 00:00:00.000'
FROM products p
WHERE p.slug = 'arousal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Ryan Cooper'
      AND pr.submitted_at = '2026-08-18 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Emily Foster', NULL, NULL, 'Arousal smells classy and different from the usual fragrances I come across.', 1, 0, '127.0.0.1', '2026-08-29 00:00:00.000', '2026-08-29 00:00:00.000'
FROM products p
WHERE p.slug = 'arousal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Emily Foster'
      AND pr.submitted_at = '2026-08-29 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Callum Parker', NULL, NULL, 'Really nice fragrance. Took me a couple of wears to appreciate it properly.', 1, 0, '127.0.0.1', '2026-09-04 00:00:00.000', '2026-09-04 00:00:00.000'
FROM products p
WHERE p.slug = 'arousal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Callum Parker'
      AND pr.submitted_at = '2026-09-04 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Thomas Evans', NULL, NULL, 'Yusuf Bhai’s own creations are definitely worth trying. This one smells fantastic.', 1, 0, '127.0.0.1', '2026-09-10 00:00:00.000', '2026-09-10 00:00:00.000'
FROM products p
WHERE p.slug = 'arousal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Thomas Evans'
      AND pr.submitted_at = '2026-09-10 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Jack Collins', NULL, NULL, 'Quick customer service, fast delivery and a really nice fragrance. No complaints.', 1, 0, '127.0.0.1', '2026-09-16 00:00:00.000', '2026-09-16 00:00:00.000'
FROM products p
WHERE p.slug = 'arousal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Jack Collins'
      AND pr.submitted_at = '2026-09-16 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Lauren Mitchell', NULL, NULL, 'Very good quality and smells lovely. Personally I prefer some of the fresher options.', 1, 0, '127.0.0.1', '2026-09-21 00:00:00.000', '2026-09-21 00:00:00.000'
FROM products p
WHERE p.slug = 'arousal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Lauren Mitchell'
      AND pr.submitted_at = '2026-09-21 00:00:00.000'
  )
LIMIT 1;


-- Myth (Yusuf Bhai Original)
INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Harry Thompson', NULL, NULL, 'Myth is really impressive. Rich, smooth and has a proper premium feel to it.', 1, 0, '127.0.0.1', '2026-07-03 00:00:00.000', '2026-07-03 00:00:00.000'
FROM products p
WHERE p.slug = 'myth'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Harry Thompson'
      AND pr.submitted_at = '2026-07-03 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'George Wilson', NULL, NULL, 'Another excellent original creation from Yusuf Bhai. Definitely stands out.', 1, 0, '127.0.0.1', '2026-07-14 00:00:00.000', '2026-07-14 00:00:00.000'
FROM products p
WHERE p.slug = 'myth'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'George Wilson'
      AND pr.submitted_at = '2026-07-14 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Amelia Roberts', NULL, NULL, 'Really nice scent, just a little richer than what I normally wear.', 1, 0, '127.0.0.1', '2026-07-26 00:00:00.000', '2026-07-26 00:00:00.000'
FROM products p
WHERE p.slug = 'myth'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Amelia Roberts'
      AND pr.submitted_at = '2026-07-26 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Adam Richardson', NULL, NULL, 'Ordered after seeing it online and I’m glad I did. Smells brilliant.', 1, 0, '127.0.0.1', '2026-08-05 00:00:00.000', '2026-08-05 00:00:00.000'
FROM products p
WHERE p.slug = 'myth'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Adam Richardson'
      AND pr.submitted_at = '2026-08-05 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Charlie Harris', NULL, NULL, 'Yusuf Bhai has created something really special with Myth. Very classy fragrance.', 1, 0, '127.0.0.1', '2026-08-17 00:00:00.000', '2026-08-17 00:00:00.000'
FROM products p
WHERE p.slug = 'myth'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Charlie Harris'
      AND pr.submitted_at = '2026-08-17 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Lucy Morgan', NULL, NULL, 'Delivery was quick and the bottle arrived safely packed. Very happy with everything.', 1, 0, '127.0.0.1', '2026-08-27 00:00:00.000', '2026-08-27 00:00:00.000'
FROM products p
WHERE p.slug = 'myth'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Lucy Morgan'
      AND pr.submitted_at = '2026-08-27 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Ben Taylor', NULL, NULL, 'Great quality fragrance. Not my everyday choice but I really enjoy wearing it in the evening.', 1, 0, '127.0.0.1', '2026-09-02 00:00:00.000', '2026-09-02 00:00:00.000'
FROM products p
WHERE p.slug = 'myth'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Ben Taylor'
      AND pr.submitted_at = '2026-09-02 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Samuel Clarke', NULL, NULL, 'One of the best Yusuf Bhai originals I’ve tried so far. Really smooth and distinctive.', 1, 0, '127.0.0.1', '2026-09-08 00:00:00.000', '2026-09-08 00:00:00.000'
FROM products p
WHERE p.slug = 'myth'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Samuel Clarke'
      AND pr.submitted_at = '2026-09-08 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Katie Davies', NULL, NULL, 'Messaged customer service before ordering and they replied straight away. Very helpful.', 1, 0, '127.0.0.1', '2026-09-15 00:00:00.000', '2026-09-15 00:00:00.000'
FROM products p
WHERE p.slug = 'myth'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Katie Davies'
      AND pr.submitted_at = '2026-09-15 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Nathan Brooks', NULL, NULL, 'Very nice scent and good performance. Just not quite my number one from the collection.', 1, 0, '127.0.0.1', '2026-09-20 00:00:00.000', '2026-09-20 00:00:00.000'
FROM products p
WHERE p.slug = 'myth'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Nathan Brooks'
      AND pr.submitted_at = '2026-09-20 00:00:00.000'
  )
LIMIT 1;


-- Surreal (Yusuf Bhai Original)
INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Alexander Scott', NULL, NULL, 'Surreal is such an easy fragrance to wear. Really clean, smooth and pleasant.', 1, 0, '127.0.0.1', '2026-07-06 00:00:00.000', '2026-07-06 00:00:00.000'
FROM products p
WHERE p.slug = 'surreal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Alexander Scott'
      AND pr.submitted_at = '2026-07-06 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Jack Robinson', NULL, NULL, 'Yusuf Bhai has done a brilliant job creating this one. Smells unique and very polished.', 1, 0, '127.0.0.1', '2026-07-18 00:00:00.000', '2026-07-18 00:00:00.000'
FROM products p
WHERE p.slug = 'surreal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Jack Robinson'
      AND pr.submitted_at = '2026-07-18 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Emily Parker', NULL, NULL, 'Lovely fragrance and very wearable. I just wish it was slightly stronger on my skin.', 1, 0, '127.0.0.1', '2026-07-30 00:00:00.000', '2026-07-30 00:00:00.000'
FROM products p
WHERE p.slug = 'surreal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Emily Parker'
      AND pr.submitted_at = '2026-07-30 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Lewis Anderson', NULL, NULL, 'First order from here and very impressed. Delivery was quick and Surreal smells amazing.', 1, 0, '127.0.0.1', '2026-08-08 00:00:00.000', '2026-08-08 00:00:00.000'
FROM products p
WHERE p.slug = 'surreal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Lewis Anderson'
      AND pr.submitted_at = '2026-08-08 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Grace Turner', NULL, NULL, 'Really pleasant fragrance. I can see myself wearing this one a lot.', 1, 0, '127.0.0.1', '2026-08-19 00:00:00.000', '2026-08-19 00:00:00.000'
FROM products p
WHERE p.slug = 'surreal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Grace Turner'
      AND pr.submitted_at = '2026-08-19 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Matthew Green', NULL, NULL, 'Great original scent from Yusuf Bhai. Different without being difficult to wear.', 1, 0, '127.0.0.1', '2026-08-28 00:00:00.000', '2026-08-28 00:00:00.000'
FROM products p
WHERE p.slug = 'surreal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Matthew Green'
      AND pr.submitted_at = '2026-08-28 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Sophie White', NULL, NULL, 'Very nice smell, just not my absolute favourite. Quality is still excellent.', 1, 0, '127.0.0.1', '2026-09-03 00:00:00.000', '2026-09-03 00:00:00.000'
FROM products p
WHERE p.slug = 'surreal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Sophie White'
      AND pr.submitted_at = '2026-09-03 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Jacob Martin', NULL, NULL, 'Customer service was quick and helpful. Really pleased with the fragrance as well.', 1, 0, '127.0.0.1', '2026-09-09 00:00:00.000', '2026-09-09 00:00:00.000'
FROM products p
WHERE p.slug = 'surreal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Jacob Martin'
      AND pr.submitted_at = '2026-09-09 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 5, 'Charlotte Hall', NULL, NULL, 'Surreal has become one of my favourites. Smells classy and gets compliments.', 1, 0, '127.0.0.1', '2026-09-17 00:00:00.000', '2026-09-17 00:00:00.000'
FROM products p
WHERE p.slug = 'surreal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Charlotte Hall'
      AND pr.submitted_at = '2026-09-17 00:00:00.000'
  )
LIMIT 1;

INSERT INTO product_reviews (product_id, status, rating, reviewer_name, reviewer_email, title, body, recommends_product, is_verified_purchase, ip_address, submitted_at, published_at)
SELECT p.id, 'PUBLISHED', 4, 'Oliver Moore', NULL, NULL, 'Took a little while to decide on this one but glad I ordered. Really good fragrance overall.', 1, 0, '127.0.0.1', '2026-09-22 00:00:00.000', '2026-09-22 00:00:00.000'
FROM products p
WHERE p.slug = 'surreal'
  AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
      AND pr.reviewer_name = 'Oliver Moore'
      AND pr.submitted_at = '2026-09-22 00:00:00.000'
  )
LIMIT 1;

