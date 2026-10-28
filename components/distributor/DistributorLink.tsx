import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DistributorLinkProps {
  href: string;
  children: ReactNode;
  variant?: "text" | "primary";
}

export default function DistributorLink({
  href,
  children,
  variant = "text",
}: DistributorLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 min-w-11 max-w-full items-center justify-center py-2 text-base font-medium wrap-anywhere focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-800",
        variant === "text"
          ? "text-primary-800 underline underline-offset-4 hover:text-primary-950 active:text-dark-950"
          : "border border-primary-800 bg-primary-800 px-6 py-4 text-white hover:bg-primary-900 active:bg-primary-950",
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
