# Storefront stock

`lib/commerce/stock.ts` defines availability and cart limits. `stock-data.ts` loads current inventory from active products and variants. Product cards, homepage features, search, product and bundle pages, sales, wishlist, cart, and checkout all use this source. Do not add independent stock checks to individual components or persist availability in browser storage.

- Tracked stock at zero or below is sold out. Untracked stock has no inventory limit; the existing 99-per-line and 50-line cart caps still apply.
- A bundle is limited by its own tracked stock and every required tracked component, accounting for the component quantity. Empty bundles and unavailable components cannot be purchased.
- Cart limits account for stock shared between individual products and bundles, or multiple bundles. Free sale units also consume inventory.
- Server-rendered pages receive initial availability. The provider refreshes on navigation, cart opening, focus, and every 60 seconds while visible. Saved carts and wishlists receive current availability.
- Additions and quantity increases wait for `/api/commerce/stock` validation before changing the cart. A failed check leaves the cart unchanged. Reductions and removals remain available to repair an invalid saved cart.
- Cart pricing and checkout quotes use the same stock rules. Order creation remains the final authority: guarded inventory updates inside a transaction prevent concurrent customers from buying the same final unit. Cart validation does not reserve inventory.

Read-only stock and quote requests can include the browser's pending checkout key. Only unexpired, reserved units for that key are included, so a customer's own payment reservation does not prevent payment retries. Other shoppers cannot use those units. New order creation never credits another reservation; the existing payment flow cancels a changed attempt before creating its replacement. Released and committed reservations are never added back by availability reads.

No database migration is needed for this change; it uses the existing checkout reservation tables. `pnpm test:unit` covers stock calculations. `pnpm stock:verify-flow` uses an isolated local database to check shared inventory, stock changes, checkout retries, cancellation, and concurrent purchases. It makes no Stripe calls and sends no emails. Browser testing is performed manually by the owner.
