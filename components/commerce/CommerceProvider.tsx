"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import type { CartPricing } from "@/lib/commerce/quote";
import type { StorefrontProductLabels } from "@/lib/commerce/catalog";
import { MAX_CART_ITEM_QUANTITY, MAX_CART_LINES } from "@/lib/commerce/cart-limits";
import { unavailableStock, type StockAvailability, type StockIssue, type StockSnapshot } from "@/lib/commerce/stock";

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
  reservationKey: string | undefined;
  setReservationKey: (key: string | undefined) => void;
  addToCart: (product: CommerceProduct, quantity?: number, options?: { openCart?: boolean }) => Promise<boolean>;
  addItemsToCart: (items: Array<{ product: CommerceProduct; quantity: number }>) => Promise<boolean>;
  updateQuantity: (slug: string, quantity: number) => Promise<boolean>;
  cartBusy: boolean;
  getStock: (slug: string) => StockAvailability;
  getCartLimit: (slug: string) => number;
  getStockIssue: (slug: string) => StockIssue | undefined;
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
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) && item.slug.length <= 190
    && typeof item.name === "string"
    && typeof item.image === "string"
    && typeof item.pricePence === "number"
    && Number.isFinite(item.pricePence)
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
  const items = new Map<string, CartItem>();
  for (const item of loadProducts(CART_KEY)) {
    const raw = item as CommerceProduct & { quantity?: unknown };
    const quantity = typeof raw.quantity === "number" && Number.isFinite(raw.quantity) ? Math.max(1, Math.floor(raw.quantity)) : 1;
    items.set(item.slug, { ...item, quantity: Math.min(MAX_CART_ITEM_QUANTITY, (items.get(item.slug)?.quantity ?? 0) + quantity) });
  }
  return [...items.values()].slice(0, MAX_CART_LINES);
}

const stockKey = (items: readonly CartItem[], reservationKey?: string) => JSON.stringify({ items: items.map(({ slug, quantity }) => ({ slug, quantity })), reservationKey });

export default function CommerceProvider({ children, productLabels, initialStock }: { children: ReactNode; productLabels: Record<string, StorefrontProductLabels>; initialStock: StockSnapshot }) {
  const pathname = usePathname();
  const [storedCart, setCart] = useState<CartItem[]>([]);
  const cartRef = useRef<CartItem[]>([]);
  const cartRevision = useRef(0);
  const mutationLock = useRef(false);
  const stockSequence = useRef(0);
  const [cartBusy, setCartBusy] = useState(false);
  const [stockState, setStockState] = useState({ key: stockKey([]), snapshot: initialStock });
  const [stockError, setStockError] = useState<string | null>(null);
  const [storedWishlist, setWishlist] = useState<CommerceProduct[]>([]);
  // Refresh labels for saved items, including carts created before inspiration was stored.
  const cart = useMemo(() => storedCart.map((item) => Object.hasOwn(productLabels, item.slug) ? { ...item, ...productLabels[item.slug] } : item), [storedCart, productLabels]);
  const wishlist = useMemo(() => storedWishlist.map((item) => Object.hasOwn(productLabels, item.slug) ? { ...item, ...productLabels[item.slug] } : item), [storedWishlist, productLabels]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [reservationKey, setReservationKey] = useState<string>();
  const [pricingState, setPricingState] = useState<{ key: string; data?: CartPricing; error?: string } | null>(null);
  const stockRequest = stockKey(cart, reservationKey);
  const currentStock = stockState.key === stockRequest ? stockState.snapshot : null;
  const pricingRequest = JSON.stringify({ items: cart.map(({ slug, quantity }) => ({ slug, quantity })), couponCode: couponCode || undefined, reservationKey });
  const currentPricing = cart.length && pricingState?.key === pricingRequest ? pricingState : null;
  const cartPricing = currentPricing?.data ?? null;
  const pricingError = stockError ?? currentStock?.issues[0]?.message ?? currentPricing?.error ?? null;
  const pricingLoading = cartBusy || (hydrated && cart.length > 0 && (!currentPricing || (!currentStock && !stockError)));

  const replaceCart = useCallback((items: CartItem[]) => {
    cartRevision.current++;
    cartRef.current = items;
    setCart(items);
  }, []);

  const fetchStock = useCallback(async (items: CartItem[], signal?: AbortSignal): Promise<StockSnapshot> => {
    const sequence = ++stockSequence.current;
    const timeout = AbortSignal.timeout(15000);
    const response = await fetch("/api/commerce/stock", {
      method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
      body: stockKey(items, reservationKey),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to check stock. Please try again.");
    if (sequence === stockSequence.current && !signal?.aborted) {
      setStockState({ key: stockKey(items, reservationKey), snapshot: data });
      setStockError(null);
    }
    return data;
  }, [reservationKey]);

  const getStock = useCallback((slug: string) => Object.hasOwn(stockState.snapshot.products, slug) ? stockState.snapshot.products[slug] : unavailableStock, [stockState]);
  const getCartLimit = useCallback((slug: string) => currentStock && Object.hasOwn(currentStock.limits, slug) ? currentStock.limits[slug] : getStock(slug).maxQuantity, [currentStock, getStock]);
  const getStockIssue = useCallback((slug: string) => currentStock?.issues.find((issue) => issue.slug === slug), [currentStock]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      replaceCart(loadCart());
      setWishlist(loadProducts(WISHLIST_KEY));
      setCouponCode(localStorage.getItem(COUPON_KEY) ?? "");
      try {
        const attempt = JSON.parse(sessionStorage.getItem("n7-stripe-attempt") || "null");
        if (typeof attempt?.key === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attempt.key)) setReservationKey(attempt.key);
      } catch { /* A new cart does not need an existing payment reservation. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [replaceCart]);
  useEffect(() => { if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); }, [wishlist, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(COUPON_KEY, couponCode); }, [couponCode, hydrated]);

  // Layouts persist during navigation. Refresh stock on navigation, cart opening,
  // focus, and while the page is visible; never restore availability from storage.
  useEffect(() => {
    if (!hydrated || cartBusy) return;
    const controller = new AbortController();
    let checking = false;
    const refresh = async () => {
      if (checking || mutationLock.current || document.visibilityState === "hidden") return;
      checking = true;
      const sequence = stockSequence.current + 1;
      try { await fetchStock(cartRef.current, controller.signal); }
      catch { if (!controller.signal.aborted && sequence === stockSequence.current) setStockError("Unable to refresh stock. Please try again before checking out."); }
      finally { checking = false; }
    };
    void refresh();
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort(); window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [fetchStock, hydrated, pathname, isCartOpen, stockRequest, cartBusy]);

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
  }, [hasCart, hydrated, pricingRequest, stockState]);

  const commitCart = useCallback(async (next: CartItem[], open = false): Promise<boolean> => {
    if (!hydrated || mutationLock.current) return false;
    if (next.length > MAX_CART_LINES || next.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_CART_ITEM_QUANTITY)) {
      toast.error("The requested quantity exceeds the cart limit."); return false;
    }
    mutationLock.current = true;
    setCartBusy(true);
    const revision = cartRevision.current;
    try {
      const snapshot = await fetchStock(next);
      if (snapshot.issues.length) { toast.error(snapshot.issues[0].message); return false; }
      // A removal or payment completion during the request must never be undone.
      if (revision !== cartRevision.current) return false;
      replaceCart(next);
      if (open) setIsCartOpen(true);
      return true;
    } catch { toast.error("Unable to check stock. Your cart hasn’t changed. Please try again."); return false; }
    finally {
      if (stockKey(cartRef.current) !== stockKey(next)) {
        try { await fetchStock(cartRef.current); }
        catch { setStockError("Unable to refresh stock. Please try again before checking out."); }
      }
      mutationLock.current = false; setCartBusy(false);
    }
  }, [fetchStock, hydrated, replaceCart]);

  const addToCart = useCallback((product: CommerceProduct, quantity = 1, options?: { openCart?: boolean }) => {
    const current = cartRef.current;
    const existing = current.find((item) => item.slug === product.slug);
    const next = existing ? current.map((item) => item.slug === product.slug ? { ...item, quantity: item.quantity + quantity } : item) : [...current, { ...product, quantity }];
    return commitCart(next, options?.openCart !== false);
  }, [commitCart]);
  const addItemsToCart = useCallback((items: Array<{ product: CommerceProduct; quantity: number }>) => {
    const next = [...cartRef.current];
    for (const { product, quantity } of items) {
      const index = next.findIndex((item) => item.slug === product.slug);
      if (index >= 0) next[index] = { ...next[index], quantity: next[index].quantity + quantity };
      else next.push({ ...product, quantity });
    }
    return commitCart(next, true);
  }, [commitCart]);
  const updateQuantity = useCallback(async (slug: string, quantity: number) => {
    const current = cartRef.current;
    const item = current.find((item) => item.slug === slug);
    if (!item || !Number.isFinite(quantity)) return false;
    const next = quantity <= 0 ? current.filter((item) => item.slug !== slug) : current.map((item) => item.slug === slug ? { ...item, quantity: Math.floor(quantity) } : item);
    // Always allow reductions so an old, invalid cart can be repaired.
    if (quantity < item.quantity) { replaceCart(next); return true; }
    return commitCart(next);
  }, [commitCart, replaceCart]);
  const removeFromCart = useCallback((slug: string) => replaceCart(cartRef.current.filter((item) => item.slug !== slug)), [replaceCart]);
  const clearCart = useCallback(() => { replaceCart([]); setCouponCode(""); setReservationKey(undefined); }, [replaceCart]);
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
    reservationKey,
    setReservationKey,
    cartBusy,
    getStock,
    getCartLimit,
    getStockIssue,
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
  }), [addItemsToCart, addToCart, cart, clearCart, closeCart, isCartOpen, isInCart, isWishlisted, openCart, removeFromCart, toggleWishlist, updateQuantity, wishlist, hydrated, cartPricing, pricingLoading, pricingError, couponCode, reservationKey, cartBusy, getStock, getCartLimit, getStockIssue]);
  return <CommerceContext.Provider value={value}>{children}<Toaster position="bottom-center" /></CommerceContext.Provider>;
}

export function useCommerce(): CommerceContextValue {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used inside CommerceProvider");
  return context;
}
