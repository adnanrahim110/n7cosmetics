SET @social_links = JSON_ARRAY();

SET @instagram_url = (
  SELECT NULLIF(TRIM(JSON_UNQUOTE(value_json)), '')
  FROM site_settings
  WHERE setting_key = 'social.instagram'
  LIMIT 1
);
SET @social_links = IF(
  @instagram_url IS NULL OR @instagram_url = '#',
  @social_links,
  JSON_ARRAY_APPEND(@social_links, '$', JSON_OBJECT('platform', 'instagram', 'url', @instagram_url))
);

SET @facebook_url = (
  SELECT NULLIF(TRIM(JSON_UNQUOTE(value_json)), '')
  FROM site_settings
  WHERE setting_key = 'social.facebook'
  LIMIT 1
);
SET @social_links = IF(
  @facebook_url IS NULL OR @facebook_url = '#',
  @social_links,
  JSON_ARRAY_APPEND(@social_links, '$', JSON_OBJECT('platform', 'facebook', 'url', @facebook_url))
);

SET @twitter_url = (
  SELECT NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(content_json, '$.twitterUrl'))), '')
  FROM page_sections
  WHERE page_key = 'global' AND section_key = 'footer'
  LIMIT 1
);
SET @social_links = IF(
  @twitter_url IS NULL OR @twitter_url = '#',
  @social_links,
  JSON_ARRAY_APPEND(@social_links, '$', JSON_OBJECT('platform', 'x', 'url', @twitter_url))
);

INSERT IGNORE INTO site_settings
  (setting_key, setting_group, value_json, is_public, updated_by)
VALUES
  ('social.links', 'social', @social_links, 1, NULL);

DELETE FROM site_settings
WHERE setting_key IN ('social.instagram', 'social.facebook');

UPDATE page_sections
SET content_json = JSON_REMOVE(content_json, '$.twitterUrl')
WHERE page_key = 'global'
  AND section_key = 'footer'
  AND JSON_CONTAINS_PATH(content_json, 'one', '$.twitterUrl') = 1;
