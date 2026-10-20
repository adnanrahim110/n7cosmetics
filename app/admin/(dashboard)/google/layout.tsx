import type { ReactNode } from "react";
import { requireAdministrator } from "@/lib/auth/session";

export default async function GoogleMerchantLayout({ children }: { children: ReactNode }) {
  await requireAdministrator(["OWNER", "MANAGER"]);
  return children;
}
