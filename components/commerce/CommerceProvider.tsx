"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface CommerceProduct {
  slug: string;
  name: string;
  image: string;
  pricePence: number;
}

export interface CartItem extends CommerceProduct { quantity: number }

interface CommerceContextValue {
  cart: CartItem[];
  wishlist: CommerceProduct[];
  cartCount: number;
  wishlistCount: number;
  addToCart: (product: CommerceProduct, quantity?: number) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: CommerceProduct) => void;
  isWishlisted: (slug: string) => boolean;
}

const CommerceContext = createContext<CommerceContextValue | null>(null);
const CART_KEY = "n7-cart-v1";
const WISHLIST_KEY = "n7-wishlist-v1";

function isProduct(value: unknown): value is CommerceProduct {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.slug === "string" && typeof item.name === "string" && typeof item.image === "string" && typeof item.pricePence === "number";
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

export default function CommerceProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<CommerceProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCart(loadCart());
      setWishlist(loadProducts(WISHLIST_KEY));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); }, [wishlist, hydrated]);

  const addToCart = useCallback((product: CommerceProduct, quantity = 1) => setCart((current) => {
    const safeQuantity = Math.max(1, Math.min(99, Math.floor(quantity)));
    const existing = current.find((item) => item.slug === product.slug);
    return existing ? current.map((item) => item.slug === product.slug ? { ...item, quantity: Math.min(99, item.quantity + safeQuantity) } : item) : [...current, { ...product, quantity: safeQuantity }];
  }), []);
  const updateQuantity = useCallback((slug: string, quantity: number) => setCart((current) => quantity <= 0 ? current.filter((item) => item.slug !== slug) : current.map((item) => item.slug === slug ? { ...item, quantity: Math.min(99, Math.floor(quantity)) } : item)), []);
  const removeFromCart = useCallback((slug: string) => setCart((current) => current.filter((item) => item.slug !== slug)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const toggleWishlist = useCallback((product: CommerceProduct) => setWishlist((current) => current.some((item) => item.slug === product.slug) ? current.filter((item) => item.slug !== product.slug) : [...current, product]), []);
  const isWishlisted = useCallback((slug: string) => wishlist.some((item) => item.slug === slug), [wishlist]);
  const value = useMemo(() => ({ cart, wishlist, cartCount: cart.reduce((sum, item) => sum + item.quantity, 0), wishlistCount: wishlist.length, addToCart, updateQuantity, removeFromCart, clearCart, toggleWishlist, isWishlisted }), [addToCart, cart, clearCart, isWishlisted, removeFromCart, toggleWishlist, updateQuantity, wishlist]);
  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export function useCommerce(): CommerceContextValue {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used inside CommerceProvider");
  return context;
}
