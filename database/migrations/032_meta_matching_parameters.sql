-- Retain only encrypted, already hashed checkout matching fields for this consenting browser.
ALTER TABLE meta_consents ADD COLUMN matching_data_encrypted TEXT NULL;

-- Presence flags survive payload deletion; older events remain NULL (coverage unknown).
ALTER TABLE meta_event_jobs ADD COLUMN matching_fields_json JSON NULL;
