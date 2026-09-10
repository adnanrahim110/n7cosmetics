"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartPricing } from "@/lib/commerce/quote";
import type { StorefrontProductLabels } from "@/lib/commerce/catalog";
import { MAX_CART_ITEM_QUANTITY, MAX_CART_LINES } from "@/lib/commerce/cart-limits";

export interface CommerceProduct {
  slug: string;
  href?: string;
  name: string;
  productCode?: string | null;
  inspiredBy?: string | null;
  image: string;
  pricePence: number;
}

export interface CartItem extends CommerceProduct { quantity: number }

interface CommerceContextValue {
  cart: CartItem[];
  wishlist: CommerceProduct[];
  cartCount: number;
  cartSubtotalPence: number;
  wishlistCount: number;
  isCartOpen: boolean;
  hydrated: boolean;
  cartPricing: CartPricing | null;
  pricingLoading: boolean;
  pricingError: string | null;
  couponCode: string;
  setCouponCode: (code: string) => void;
  addToCart: (product: CommerceProduct, quantity?: number, options?: { openCart?: boolean; maxQuantity?: number }) => void;
  addItemsToCart: (items: Array<{ product: CommerceProduct; quantity: number }>) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  isInCart: (slug: string) => boolean;
  toggleWishlist: (product: CommerceProduct) => void;
  isWishlisted: (slug: string) => boolean;
}

const CommerceContext = createContext<CommerceContextValue | null>(null);
const CART_KEY = "n7-cart-v1";
const WISHLIST_KEY = "n7-wishlist-v1";
const COUPON_KEY = "n7-coupon-v1";

function isProduct(value: unknown): value is CommerceProduct {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.slug === "string"
    && typeof item.name === "string"
    && typeof item.image === "string"
    && typeof item.pricePence === "number"
    && (item.productCode == null || typeof item.productCode === "string")
    && (item.inspiredBy == null || typeof item.inspiredBy === "string")
    && (item.href === undefined || (typeof item.href === "string" && /^\/(?:products|bundles)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.href)));
}

export function commerceProductHref(product: CommerceProduct): string {
  return product.href ?? `/products/${product.slug}`;
}

function loadProducts(key: string): CommerceProduct[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isProduct).slice(0, 100) : [];
  } catch { return []; }
}

function loadCart(): CartItem[] {
  return loadProducts(CART_KEY).map((item) => {
    const raw = item as CommerceProduct & { quantity?: unknown };
    return { ...item, quantity: typeof raw.quantity === "number" ? Math.max(1, Math.min(99, Math.floor(raw.quantity))) : 1 };
  });
}

export default function CommerceProvider({ children, productLabels }: { children: ReactNode; productLabels: Record<string, StorefrontProductLabels> }) {
  const [storedCart, setCart] = useState<CartItem[]>([]);
  const [storedWishlist, setWishlist] = useState<CommerceProduct[]>([]);
  // Refresh labels for saved items, including carts created before inspiration was stored.
  const cart = useMemo(() => storedCart.map((item) => Object.hasOwn(productLabels, item.slug) ? { ...item, ...productLabels[item.slug] } : item), [storedCart, productLabels]);
  const wishlist = useMemo(() => storedWishlist.map((item) => Object.hasOwn(productLabels, item.slug) ? { ...item, ...productLabels[item.slug] } : item), [storedWishlist, productLabels]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [pricingState, setPricingState] = useState<{ key: string; data?: CartPricing; error?: string } | null>(null);
  const pricingRequest = JSON.stringify({ items: cart.map(({ slug, quantity }) => ({ slug, quantity })), couponCode: couponCode || undefined });
  const currentPricing = cart.length && pricingState?.key === pricingRequest ? pricingState : null;
  const cartPricing = currentPricing?.data ?? null;
  const pricingError = currentPricing?.error ?? null;
  const pricingLoading = hydrated && cart.length > 0 && !currentPricing;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCart(loadCart());
      setWishlist(loadProducts(WISHLIST_KEY));
      setCouponCode(localStorage.getItem(COUPON_KEY) ?? "");
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); }, [wishlist, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(COUPON_KEY, couponCode); }, [couponCode, hydrated]);

  const hasCart = cart.length > 0;
  useEffect(() => {
    if (!hydrated || !hasCart) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/commerce/cart", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: pricingRequest, signal: controller.signal,
        });
        const data = await response.json() as CartPricing & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Unable to calculate cart prices.");
        if (!controller.signal.aborted) setPricingState({ key: pricingRequest, data });
      } catch (error) {
        if (!controller.signal.aborted) setPricingState({ key: pricingRequest, error: error instanceof Error ? error.message : "Unable to calculate cart prices." });
      }
    }, 150);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [hasCart, hydrated, pricingRequest]);

  const addToCart = useCallback((product: CommerceProduct, quantity = 1, options?: { openCart?: boolean; maxQuantity?: number }) => {
    setCart((current) => {
      const maximum = Math.min(MAX_CART_ITEM_QUANTITY, options?.maxQuantity ?? MAX_CART_ITEM_QUANTITY);
      if (maximum <= 0) return current;
      const safeQuantity = Math.max(1, Math.min(maximum, Math.floor(quantity)));
      const existing = current.find((item) => item.slug === product.slug);
      if (!existing && current.length >= MAX_CART_LINES) return current;
      return existing ? current.map((item) => item.slug === product.slug ? { ...item, quantity: Math.min(maximum, item.quantity + safeQuantity) } : item) : [...current, { ...product, quantity: safeQuantity }];
    });
    if (options?.openCart !== false) setIsCartOpen(true);
  }, []);
  const addItemsToCart = useCallback((items: Array<{ product: CommerceProduct; quantity: number }>) => {
    setCart((current) => {
      const next = [...current];
      for (const { product, quantity } of items) {
        const safeQuantity = Math.max(1, Math.min(99, Math.floor(quantity)));
        const index = next.findIndex((item) => item.slug === product.slug);
        if (index >= 0) next[index] = { ...next[index], quantity: Math.min(99, next[index].quantity + safeQuantity) };
        else if (next.length < MAX_CART_LINES) next.push({ ...product, quantity: safeQuantity });
      }
      return next;
    });
    setIsCartOpen(true);
  }, []);
  const updateQuantity = useCallback((slug: string, quantity: number) => setCart((current) => quantity <= 0 ? current.filter((item) => item.slug !== slug) : current.map((item) => item.slug === slug ? { ...item, quantity: Math.min(99, Math.floor(quantity)) } : item)), []);
  const removeFromCart = useCallback((slug: string) => setCart((current) => current.filter((item) => item.slug !== slug)), []);
  const clearCart = useCallback(() => { setCart([]); setCouponCode(""); }, []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const isInCart = useCallback((slug: string) => cart.some((item) => item.slug === slug), [cart]);
  const toggleWishlist = useCallback((product: CommerceProduct) => setWishlist((current) => current.some((item) => item.slug === product.slug) ? current.filter((item) => item.slug !== product.slug) : [...current, product]), []);
  const isWishlisted = useCallback((slug: string) => wishlist.some((item) => item.slug === slug), [wishlist]);
  const value = useMemo(() => ({
    cart,
    wishlist,
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    cartSubtotalPence: cart.reduce((sum, item) => sum + item.pricePence * item.quantity, 0),
    wishlistCount: wishlist.length,
    isCartOpen,
    hydrated,
    cartPricing,
    pricingLoading,
    pricingError,
    couponCode,
    setCouponCode,
    addToCart,
    addItemsToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    openCart,
    closeCart,
    isInCart,
    toggleWishlist,
    isWishlisted,
  }), [addItemsToCart, addToCart, cart, clearCart, closeCart, isCartOpen, isInCart, isWishlisted, openCart, removeFromCart, toggleWishlist, updateQuantity, wishlist, hydrated, cartPricing, pricingLoading, pricingError, couponCode]);
  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export function useCommerce(): CommerceContextValue {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used inside CommerceProvider");
  return context;
}
