# Mobile homepage performance

The supplied Lighthouse 13.4.1 report scored Performance 77, with LCP 5.1 seconds,
FCP 1.7 seconds, TBT 100 ms and CLS 0. The target is 95+ on mobile. A new live
Lighthouse run is required to verify the score; browser testing was not performed.

## Implemented changes

- The existing hero film has a 14,498-byte poster extracted from its first frame.
  The poster is preloaded at high priority, and the same film starts after critical
  resources load. Custom admin-selected films without a known poster retain their
  existing eager loading behaviour.
- Offscreen founder/detail videos attach their sources near the viewport.
  Decorative playback pauses outside the visible section. Existing play, pause,
  sound and film controls remain in place.
- Hero artwork is losslessly converted to WebP, rendered through Next Image,
  and loaded lazily. Product-card image sizes match their responsive containers.
  The below-fold featured bottle no longer preloads at startup.
- The two autoplaying/decorative MP4 copies are remuxed with their metadata at
  the start of the file. Video encoding, resolution and audio are retained.
- Content-hashed media receives `public, max-age=31536000, immutable`.
  Other bundled images and videos receive a 30-day cache lifetime. Uploaded
  `/media/` content retains its existing immutable URL/cache policy.
- Motion's slim `motion/react-m` components load `domMax` separately through
  `LazyMotion`. The complete feature set retains existing layout/gesture animations.
- Sliders retain Swiper and their existing breakpoints, slide counts, controls,
  keyboard support and autoplay settings. The engine and only the required
  feature modules load near the viewport; slide content remains server-rendered.
- Search and cart drawers load on first use and stay mounted for exit animations
  and focus cleanup. Custom cursor and Lenis load only for suitable desktop inputs.
- Native passive scroll handling and a CSS transform transition replace the
  header's eager GSAP/ScrollTrigger dependency.
- Kindred fonts are no longer preloaded ahead of above-the-fold typography.
- Next.js CSS inlining removes the three blocking stylesheet requests while
  retaining the generated font, Tailwind and Swiper styles.

## Non-browser verification

- Production build, TypeScript and 183 unit tests pass.
- ESLint has no errors; two existing admin `<img>` warnings remain.
- Homepage client-reference chunks went from 665,965 to 342,953
  uncompressed bytes, or 224,650 to 117,686 gzip bytes: 47.6% less route-specific
  JavaScript. This comparison excludes shared framework bootstrap code and is
  not a Lighthouse performance score.
- Production HTTP checks confirmed server-rendered content and links, the hero
  poster preload, zero blocking stylesheet links, and all three video sources
  deferred in initial HTML for the default homepage.
- Asset HTTP checks confirmed one-year immutable caching and working `206`
  byte-range responses for the remuxed film.
- Background decoded pixels are identical. Cloud artwork has identical visible
  pixels and alpha; only invisible RGB values under fully transparent pixels differ.
- HTTP page checks used the existing database-free content fallback because the
  configured local MySQL service was unavailable. Commerce rules are covered by
  the existing unit suite.

## Deployment and retest

Deploy the new build together with the new `public/imgs/` and `public/videos/`
assets. The deployment packaging script already includes these directories.
Purge stale CDN responses if existing cache rules override the new origin headers,
then repeat the same mobile Lighthouse run on the live homepage.

CSS inlining is a documented **experimental Next.js flag**. It removes the
stylesheet waterfall but makes HTML larger and prevents styles from being cached
independently during full page loads. If the new report shows HTML/parse costs
outweighing that benefit, disable `experimental.inlineCss` and compare again.

The public storefront remains dynamically rendered so inventory, pricing and
admin edits stay fresh. Sensitive stock, payment and consent responses retain
their `no-store` policies. The supplied report marks its two back/forward-cache
failure reasons as not actionable; these policies were not weakened.

Cloudflare controls its injected beacon/email-obfuscation scripts and their cache
lifetimes. Framework/vendor compatibility code is retained to preserve supported
browser behaviour. These can remain advisory findings after the app optimisations.

## References

- [Motion's documented bundle reduction](https://motion.dev/docs/react-reduce-bundle-size)
- [Video posters and loading priority](https://web.dev/learn/performance/video-performance)
- Installed Next.js guides: `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`,
  `03-api-reference/02-components/image.md`, and
  `03-api-reference/05-config/01-next-config-js/inlineCss.md`.
