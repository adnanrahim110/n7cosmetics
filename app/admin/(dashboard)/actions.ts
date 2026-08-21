"use server";

import { redirect } from "next/navigation";
import { revokeCurrentAdministratorSession } from "@/lib/auth/session";

export async function logoutAction(): Promise<void> {
  await revokeCurrentAdministratorSession();
  redirect("/admin/login");
}
