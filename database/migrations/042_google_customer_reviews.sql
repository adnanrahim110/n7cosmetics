-- Merchant ID supplied in the owner's Google Customer Reviews setup screenshots.
-- Preserve any existing configuration; all values are editable in Admin > Google.
INSERT IGNORE INTO site_settings (setting_key, setting_group, value_json, is_public) VALUES
('google.customer_reviews', 'google', '{"merchantId":"5876486574","surveyEnabled":true,"widgetEnabled":true,"fallbackDeliveryDays":5,"widgetPosition":"LEFT_BOTTOM","widgetRegion":"GB","widgetBottomMargin":24,"widgetMobileBottomMargin":112}', 0);
