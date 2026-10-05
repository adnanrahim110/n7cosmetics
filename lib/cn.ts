import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type { ClassValue } from "clsx";

export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
