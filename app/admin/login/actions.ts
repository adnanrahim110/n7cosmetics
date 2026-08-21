"use server";

import { redirect } from "next/navigation";
import { authenticateAdministrator } from "@/lib/auth/login";
import { getRequestMetadata } from "@/lib/auth/request";

export async function loginAction(formData: FormData): Promise<void> {
  const metadata = await getRequestMetadata();
  const result = await authenticateAdministrator(
    {
      email: formData.get("email"),
      password: formData.get("password"),
    },
    metadata,
  );

  if (result === "SUCCESS") redirect("/admin");
  if (result === "RATE_LIMITED") redirect("/admin/login?error=rate-limited");
  redirect("/admin/login?error=invalid");
}
