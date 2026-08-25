ALTER TABLE media_assets
  ADD UNIQUE KEY uq_media_assets_public_url (public_url(191));
