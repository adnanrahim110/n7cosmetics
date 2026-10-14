# TikTok Pixel

The storefront uses pixel `DB7Q61BC77UCS546PMGG` for page views. The existing marketing cookie choice controls both Meta and TikTok, including when Meta is disabled. No TikTok SDK is loaded before permission or while configuration is unavailable. Withdrawal removes active measurement and first-party TikTok cookies; cross-tab preference changes also stop it.

Each storefront route gets one measurement document using the supplied official bootstrap. Like the existing Meta integration, this document is separate from the checkout and uses a public page URL, retaining only advertising parameters such as `ttclid` and UTM values. Payment credentials, receipt keys, search text and URL fragments are excluded. Admin, API, media and newsletter action routes are not measured. The frame endpoint also verifies the saved marketing permission before returning the pixel code.

This installs base page-view measurement only. TikTok commerce events, Events API and advanced matching are not configured. Script blocking does not interrupt shopping. Cookie copy and the privacy page identify TikTok. The implementation follows [TikTok’s consent mode documentation](https://business-api.tiktok.com/portal/docs/pixel-cookie-consent-mode/v1.3).

Run `pnpm test:unit`, `pnpm lint`, `pnpm typecheck` and `pnpm build`. Tests exercise URL filtering, the exact bootstrap and withdrawal using Node mocks; they make no TikTok requests and do not run a browser.
