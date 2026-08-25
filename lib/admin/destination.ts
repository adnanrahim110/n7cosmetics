export type DestinationKind = "page" | "product" | "custom";

export interface DestinationValue {
  label: string;
  href: string;
  kind: DestinationKind;
  description?: string;
  mediaUrl?: string | null;
}

export const storefrontDestinations: DestinationValue[] = [
  { label: "Home", href: "/", kind: "page", description: "Storefront home page" },
  { label: "N7 Collection", href: "/n7", kind: "page", description: "Collection page" },
  { label: "Yusuf Bhai Originals", href: "/yusuf-bhai-originals", kind: "page", description: "Collection page" },
  { label: "Recreations", href: "/recreations", kind: "page", description: "Collection page" },
  { label: "Bundles", href: "/bundles", kind: "page", description: "Collection page" },
  { label: "Contact Us", href: "/contact", kind: "page", description: "Customer contact page" },
  { label: "Shipping & Returns", href: "/shipping-returns", kind: "page", description: "Delivery and returns policy" },
  { label: "Privacy Policy", href: "/privacy", kind: "page", description: "Privacy policy" },
  { label: "Cart", href: "/cart", kind: "page", description: "Shopping cart" },
  { label: "Wishlist", href: "/wishlist", kind: "page", description: "Customer wishlist" },
  { label: "Checkout", href: "/checkout", kind: "page", description: "Checkout page" },
];

export function isAllowedDestinationHref(value: string): boolean {
  const href = value.trim();
  if (!href || href.length > 1000) return false;
  if (/^\/(?!\/)[^\s]*$/.test(href)) return true;
  if (href === "#" || /^#[a-z0-9][\w:.-]*$/i.test(href)) return true;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(href)) return true;
  if (/^tel:\+?[0-9(). -]{3,30}$/i.test(href)) return true;
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function humanizeSlug(value: string): string {
  return decodeURIComponent(value).replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function destinationFromHref(href: string, fallbackLabel?: string): DestinationValue {
  const known = storefrontDestinations.find((destination) => destination.href === href);
  if (known) return known;
  const productMatch = href.match(/^\/products\/([^/?#]+)$/);
  if (productMatch) return { label: fallbackLabel || humanizeSlug(productMatch[1]), href, kind: "product", description: "Product page" };
  const segment = href.split(/[/?#]/).filter(Boolean).at(-1);
  return { label: fallbackLabel || (segment ? humanizeSlug(segment) : href), href, kind: "custom", description: "Saved destination" };
}
