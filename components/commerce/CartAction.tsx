"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { CommerceProduct } from "./CommerceProvider";
import { useCommerce } from "./CommerceProvider";

interface CartActionProps {
  product: CommerceProduct;
  quantity?: number;
  className?: string;
  inCartClassName?: string;
  children: ReactNode;
  inCartChildren?: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
  unavailableChildren?: ReactNode;
}

export default function CartAction({
  product,
  quantity = 1,
  className,
  inCartClassName,
  children,
  inCartChildren = "View in cart",
  disabled = false,
  ariaLabel,
  unavailableChildren,
}: CartActionProps) {
  const { addToCart, isInCart, getStock, getCartLimit, cartBusy, hydrated } = useCommerce();
  const soldOut = getStock(product.slug).soldOut;
  const maximum = getCartLimit(product.slug);
  const inCart = isInCart(product.slug);

  if (inCart) {
    return (
      <Link
        aria-label={`View ${product.name} in cart`}
        className={inCartClassName ?? className}
        href="/cart"
      >
        {inCartChildren}
      </Link>
    );
  }

  return (
    <button
      aria-label={soldOut ? `${product.name} is sold out` : maximum === 0 ? `Stock limit reached for ${product.name}` : ariaLabel}
      className={className}
      disabled={disabled || soldOut || cartBusy || !hydrated || quantity > maximum}
      onClick={() => addToCart(product, quantity)}
      type="button"
    >
      {soldOut ? unavailableChildren ?? "Sold Out" : maximum === 0 ? unavailableChildren ?? "Stock limit reached" : children}
    </button>
  );
}
