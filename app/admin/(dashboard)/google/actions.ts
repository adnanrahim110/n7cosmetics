"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDatabaseId } from "@/lib/admin/form";
import { requireAdministrator } from "@/lib/auth/session";
import { saveMerchantMetadata, type MerchantFormState } from "@/lib/google-merchant/admin";
import { merchantMetadataInput, merchantMetadataSchema } from "@/lib/google-merchant/metadata";
import { googleReviewsSettingsSchema, type GoogleReviewsFormState } from "@/lib/google-reviews/config";
import { saveGoogleReviewsSettings } from "@/lib/google-reviews/settings";
import { formString } from "@/lib/admin/form";

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

export async function saveGoogleReviewsAction(_previous: GoogleReviewsFormState, form: FormData): Promise<GoogleReviewsFormState> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  const revision = formString(form, "revision");
  const parsed = googleReviewsSettingsSchema.safeParse({
    merchantId: formString(form, "merchantId"), surveyEnabled: form.get("surveyEnabled") === "on", widgetEnabled: form.get("widgetEnabled") === "on",
    fallbackDeliveryDays: Number(formString(form, "fallbackDeliveryDays")), widgetPosition: formString(form, "widgetPosition"),
    widgetRegion: formString(form, "widgetRegion"), widgetBottomMargin: Number(formString(form, "widgetBottomMargin")),
    widgetMobileBottomMargin: Number(formString(form, "widgetMobileBottomMargin")),
  });
  if (!parsed.success) return { error: "Check the highlighted review settings.", revision, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const result = await saveGoogleReviewsSettings(parsed.data, revision, administrator.id);
    if ("error" in result) return { ...result, revision };
    revalidatePath("/admin/google");
    revalidatePath("/", "layout");
    return { success: true, revision: result.revision };
  } catch { return { error: "The review settings could not be saved. Please try again.", revision }; }
}
