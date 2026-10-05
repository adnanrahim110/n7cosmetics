import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export default function UkFlagIcon({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg {...props} aria-hidden="true" className={cn("h-4 w-8 shrink-0 overflow-hidden rounded-xs", className)} focusable="false" viewBox="0 0 60 30">
      <path fill="#012169" d="M0 0h60v30H0z" />
      <path stroke="#fff" strokeWidth="6" d="m0 0 60 30M60 0 0 30" />
      <path fill="#c8102e" d="M0 0v2l26 13h4L0 0Zm60 0h-4L30 13v2L60 0ZM0 30h4l26-13v-2L0 30Zm60 0v-2L34 15h-4l30 15Z" />
      <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60" />
      <path stroke="#c8102e" strokeWidth="6" d="M30 0v30M0 15h60" />
    </svg>
  );
}
