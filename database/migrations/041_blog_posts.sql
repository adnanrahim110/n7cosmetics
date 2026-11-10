CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  excerpt VARCHAR(300) NOT NULL DEFAULT '',
  body_html MEDIUMTEXT NOT NULL,
  cover_image_url VARCHAR(190) NULL,
  cover_image_alt VARCHAR(255) NOT NULL DEFAULT '',
  status ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  first_published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_blog_posts_slug (slug),
  KEY idx_blog_posts_publication (status, first_published_at, id),
  KEY idx_blog_posts_cover_image (cover_image_url),
  CONSTRAINT chk_blog_posts_published_at CHECK (
    status = 'DRAFT' OR first_published_at IS NOT NULL
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
