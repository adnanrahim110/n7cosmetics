"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDatabaseId } from "@/lib/admin/form";
import { requireAdministrator } from "@/lib/auth/session";
import { saveMerchantMetadata, type MerchantFormState } from "@/lib/google-merchant/admin";
import { merchantMetadataInput, merchantMetadataSchema } from "@/lib/google-merchant/metadata";

export async function saveMerchantProductAction(variantId: string, _previous: MerchantFormState, form: FormData): Promise<MerchantFormState> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(variantId)) return { error: "Return to the Google catalogue and select a valid product." };
  const parsed = merchantMetadataSchema.safeParse(merchantMetadataInput(form));
  if (!parsed.success) return { error: "Review the highlighted Google product details.", fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;
  let storefrontPath = "";
  try {
    const result = await saveMerchantMetadata(variantId, data, String(form.get("revision") ?? ""), administrator.id);
    if ("error" in result) return { error: result.error };
    storefrontPath = result.storefrontPath;
  } catch {
    return { error: "The Google details could not be saved. Check the database connection and migrations 036–037, then try again." };
  }
  revalidatePath("/admin/google");
  revalidatePath(`/admin/google/${variantId}`);
  revalidatePath(storefrontPath);
  redirect(`/admin/google/${variantId}?saved=1`);
}
