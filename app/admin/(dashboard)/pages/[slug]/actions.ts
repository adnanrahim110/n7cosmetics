"use server";

import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formCheckbox, formString, formStringList } from "@/lib/admin/form";
import { cleanupUnreferencedMediaUrls, mergeMediaSubmission, removeStoredMediaFiles, storeMediaFiles, submittedMediaFiles, type StoredMediaAsset } from "@/lib/admin/media";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne, selectRows } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import {
  isEditableStorefrontPageSlug,
  normalizeStorefrontPageDetail,
  storefrontPageDatabaseKey,
  storefrontPageDefinitions,
  type EditableStorefrontPageSlug,
} from "@/lib/storefront-pages/config";

const requiredText = (maximum: number) => z.string().trim().min(1).max(maximum);
const optionalText = (maximum: number) => z.string().trim().max(maximum);
const productId = z.string().regex(/^[1-9]\d*$/);
const productIds = (maximum: number) => z.array(productId).max(maximum).transform((values) => [...new Set(values)]);

const heroSchema = z.object({
  eyebrow: requiredText(160),
  titleLead: requiredText(160),
  titleAccent: requiredText(160),
  intro: requiredText(1600),
  statement: requiredText(500),
  highlights: z.array(requiredText(160)).length(3),
  productIds: productIds(3),
});

const detailSchema = z.object({
  eyebrow: requiredText(160),
  title: requiredText(190),
  description: requiredText(1000),
  credit: requiredText(190),
  showComingSoon: z.boolean(),
  comingSoonEyebrow: optionalText(160),
  comingSoonTitle: optionalText(190),
  comingSoonDescription: optionalText(1000),
}).superRefine((value, context) => {
  if (!value.showComingSoon) return;
  if (!value.comingSoonEyebrow) context.addIssue({ code: "custom", message: "Coming soon eyebrow is required", path: ["comingSoonEyebrow"] });
  if (!value.comingSoonTitle) context.addIssue({ code: "custom", message: "Coming soon title is required", path: ["comingSoonTitle"] });
  if (!value.comingSoonDescription) context.addIssue({ code: "custom", message: "Coming soon description is required", path: ["comingSoonDescription"] });
});

interface ActiveProductRow extends RowDataPacket { id: string }
interface SectionContentRow extends RowDataPacket { content_json: unknown }

function invalid(slug: EditableStorefrontPageSlug, section: "hero" | "detail"): never {
  redirect(`/admin/pages/${slug}?error=${section}#${section}`);
}

async function validateActiveProductIds(ids: string[]): Promise<boolean> {
  if (!ids.length) return true;
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await selectRows<ActiveProductRow>(
    `SELECT CAST(id AS CHAR) AS id FROM products WHERE status = 'ACTIVE' AND id IN (${placeholders})`,
    ids,
  );
  const found = new Set(rows.map((row) => row.id));
  return ids.every((id) => found.has(id));
}

async function writeSection(
  slug: EditableStorefrontPageSlug,
  section: "hero" | "detail",
  displayName: string,
  content: unknown,
  connection?: PoolConnection,
): Promise<void> {
  const pageKey = storefrontPageDatabaseKey(slug);
  await executeMutation(
    `INSERT INTO page_sections (page_key, section_key, section_type, display_name, content_json, is_enabled, sort_order)
     VALUES (?, ?, 'fixed', ?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE section_type = 'fixed', display_name = VALUES(display_name), content_json = VALUES(content_json), is_enabled = 1, sort_order = VALUES(sort_order)`,
    [pageKey, section, displayName, JSON.stringify(content), section === "hero" ? 10 : 20],
    connection,
  );
}

async function finishSectionSave(
  slug: EditableStorefrontPageSlug,
  section: "hero" | "detail",
  displayName: string,
  administratorId: string,
): Promise<never> {
  const pageKey = storefrontPageDatabaseKey(slug);
  const metadata = await getRequestMetadata();
  await writeAuditLog({
    administratorId,
    action: "STOREFRONT_PAGE_UPDATE",
    entityType: "page_section",
    entityId: `${pageKey}.${section}`,
    summary: `Updated ${storefrontPageDefinitions[slug].name} ${displayName.toLowerCase()}`,
    ipAddress: metadata.ipAddress,
  });
  revalidatePath(storefrontPageDefinitions[slug].path);
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${slug}`);
  redirect(`/admin/pages/${slug}?saved=${section}#${section}`);
}

async function saveSection(
  slug: EditableStorefrontPageSlug,
  section: "hero" | "detail",
  displayName: string,
  content: unknown,
  administratorId: string,
): Promise<never> {
  await writeSection(slug, section, displayName, content);
  return finishSectionSave(slug, section, displayName, administratorId);
}

function parseContentJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export async function saveStorefrontPageHeroAction(slugValue: string, formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isEditableStorefrontPageSlug(slugValue)) redirect("/admin/pages");
  const parsed = heroSchema.safeParse({
    eyebrow: formString(formData, "eyebrow"),
    titleLead: formString(formData, "titleLead"),
    titleAccent: formString(formData, "titleAccent"),
    intro: formString(formData, "intro"),
    statement: formString(formData, "statement"),
    highlights: formStringList(formData, "highlights"),
    productIds: formStringList(formData, "productIds"),
  });
  if (!parsed.success || !(await validateActiveProductIds(parsed.data.productIds))) invalid(slugValue, "hero");
  await saveSection(slugValue, "hero", "Hero section", {
    eyebrow: parsed.data.eyebrow,
    title: { lead: parsed.data.titleLead, accent: parsed.data.titleAccent },
    intro: parsed.data.intro,
    statement: parsed.data.statement,
    highlights: parsed.data.highlights,
    productIds: parsed.data.productIds,
  }, administrator.id);
}

export async function saveStorefrontPageDetailAction(slugValue: string, formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isEditableStorefrontPageSlug(slugValue)) redirect("/admin/pages");
  const parsed = detailSchema.safeParse({
    eyebrow: formString(formData, "eyebrow"),
    title: formString(formData, "title"),
    description: formString(formData, "description"),
    credit: formString(formData, "credit"),
    showComingSoon: formCheckbox(formData, "showComingSoon"),
    comingSoonEyebrow: formString(formData, "comingSoonEyebrow"),
    comingSoonTitle: formString(formData, "comingSoonTitle"),
    comingSoonDescription: formString(formData, "comingSoonDescription"),
  });
  if (!parsed.success) invalid(slugValue, "detail");

  const written: StoredMediaAsset[] = [];
  let previousImage = "";
  try {
    await withTransaction(async (connection) => {
      const pageKey = storefrontPageDatabaseKey(slugValue);
      const existing = await selectOne<SectionContentRow>(
        "SELECT content_json FROM page_sections WHERE page_key = ? AND section_key = 'detail' FOR UPDATE",
        [pageKey],
        connection,
      );
      const previousDetail = normalizeStorefrontPageDetail(parseContentJson(existing?.content_json));
      previousImage = previousDetail.comingSoon.image;
      const stored = await storeMediaFiles(submittedMediaFiles(formData, "comingSoonImage"), {
        uploadedBy: administrator.id,
        connection,
        expectedType: "image",
        folder: "storefront-pages/coming-soon",
        altTexts: [`${parsed.data.comingSoonTitle || storefrontPageDefinitions[slugValue].name} coming soon visual`],
        maximumFiles: 1,
      });
      written.push(...stored);
      const allowedExistingUrls = new Set(previousImage ? [previousImage] : []);
      const imageUrls = mergeMediaSubmission(formData, "comingSoonImage", stored, allowedExistingUrls);
      if (imageUrls.length > 1) throw new Error("Choose no more than one coming soon image.");

      await writeSection(slugValue, "detail", "Detail section", {
        eyebrow: parsed.data.eyebrow,
        title: parsed.data.title,
        description: parsed.data.description,
        credit: parsed.data.credit,
        comingSoon: {
          enabled: parsed.data.showComingSoon,
          eyebrow: parsed.data.comingSoonEyebrow,
          title: parsed.data.comingSoonTitle,
          description: parsed.data.comingSoonDescription,
          image: imageUrls[0] ?? "",
        },
      }, connection);
    });
  } catch (error) {
    await removeStoredMediaFiles(written);
    console.error(`Unable to save ${slugValue} detail section`, error);
    invalid(slugValue, "detail");
  }

  await cleanupUnreferencedMediaUrls(previousImage ? [previousImage] : []).catch((error) => console.error(`Unable to clean replaced ${slugValue} detail media`, error));
  await finishSectionSave(slugValue, "detail", "Detail section", administrator.id);
}
