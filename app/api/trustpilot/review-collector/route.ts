export const dynamic = "force-static";

const bootstrapUrl = "https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";

export function GET() {
  // Trustpilot reads its document's URL and referrer. This frame gives it a fixed URL.
  return new Response(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Review N7 Cosmetics on Trustpilot</title>
    <script src="${bootstrapUrl}" async></script>
  </head>
  <body>
    <div class="trustpilot-widget" data-locale="en-US" data-template-id="56278e9abfbbba0bdcd568bc" data-businessunit-id="67f43d4dd68b154e79a1d614" data-style-height="52px" data-style-width="100%">
      <a href="https://www.trustpilot.com/review/n7cosmetics.co.uk" target="_blank" rel="noopener noreferrer">Review N7 Cosmetics on Trustpilot</a>
    </div>
  </body>
</html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": `default-src 'none'; script-src ${bootstrapUrl}; style-src 'unsafe-inline'; frame-src https://widget.trustpilot.com; frame-ancestors 'self'; base-uri 'none'`,
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
