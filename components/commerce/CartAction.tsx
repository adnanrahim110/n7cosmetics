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
}: CartActionProps) {
  const { addToCart, isInCart } = useCommerce();
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
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      onClick={() => addToCart(product, quantity)}
      type="button"
    >
      {children}
    </button>
  );
}
