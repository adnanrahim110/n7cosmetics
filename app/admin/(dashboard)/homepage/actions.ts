"use server";

import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAllowedDestinationHref } from "@/lib/admin/destination";
import { formString, formStringList } from "@/lib/admin/form";
import { cleanupUnreferencedMediaUrls, mergeMediaSubmission, removeStoredMediaFiles, retainedMediaUrls, storeMediaFiles, submittedMediaFiles, type StoredMediaAsset } from "@/lib/admin/media";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne, selectRows } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max);
const link = z.string().trim().max(1000).refine(isAllowedDestinationHref, "Invalid link");
const media = z.string().trim().max(1000).refine((value) => value.startsWith("/") || z.url().safeParse(value).success, "Invalid media URL");
const idList = z.array(z.string().regex(/^[1-9]\d*$/)).min(1).max(24);
const navigationSubItem = z.object({ name: text(120), href: link, image: z.union([z.literal(""), media]).optional() });
const navigationItem = z.object({ label: text(120), href: link, type: z.enum(["link", "mega", "dropdown"]), items: z.array(navigationSubItem).max(20) });
const review = z.object({ text: text(1000), author: text(120) });
const footerLink = z.object({ label: text(120), href: link });
interface ProductSlugRow extends RowDataPacket { slug: string }
interface SectionContentRow extends RowDataPacket { content_json: unknown }
interface HeroProductRow extends RowDataPacket { id: string; name: string }

async function writeSection(pageKey: "home" | "global", sectionKey: string, displayName: string, content: unknown, connection?: PoolConnection): Promise<void> {
  await executeMutation(
    `INSERT INTO page_sections (page_key, section_key, section_type, display_name, content_json, is_enabled, sort_order)
     VALUES (?, ?, 'fixed', ?, ?, 1, 0)
     ON DUPLICATE KEY UPDATE section_type = 'fixed', display_name = VALUES(display_name), content_json = VALUES(content_json), is_enabled = 1`,
    [pageKey, sectionKey, displayName, JSON.stringify(content)],
    connection,
  );
}

async function finishSectionSave(administratorId: string, pageKey: "home" | "global", sectionKey: string, displayName: string): Promise<never> {
  const metadata = await getRequestMetadata();
  await writeAuditLog({ administratorId, action: "STOREFRONT_CONTENT_UPDATE", entityType: "page_section", entityId: `${pageKey}.${sectionKey}`, summary: `Updated ${displayName}`, ipAddress: metadata.ipAddress });
  revalidatePath("/", "layout");
  revalidatePath("/admin/homepage");
  redirect(`/admin/homepage?saved=${encodeURIComponent(sectionKey)}#${sectionKey}`);
}

async function saveSection(pageKey: "home" | "global", sectionKey: string, displayName: string, content: unknown): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  await writeSection(pageKey, sectionKey, displayName, content);
  await finishSectionSave(administrator.id, pageKey, sectionKey, displayName);
}

interface SectionMediaField {
  name: string;
  type: "image" | "video";
  folder: string;
  altText: string;
  required?: boolean;
}

function stringsInContent(value: unknown, found = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    if (value.startsWith("/") || z.url().safeParse(value).success) found.add(value);
  } else if (Array.isArray(value)) {
    for (const entry of value) stringsInContent(entry, found);
  } else if (value && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) stringsInContent(entry, found);
  }
  return found;
}

async function saveMediaSection(
  pageKey: "home" | "global",
  sectionKey: string,
  displayName: string,
  formData: FormData,
  fields: SectionMediaField[],
  buildContent: (mediaValues: Record<string, string | null>) => unknown,
  authenticatedAdministratorId?: string,
): Promise<void> {
  const administratorId = authenticatedAdministratorId ?? (await requireAdministrator(["OWNER", "MANAGER"])).id;
  const written: StoredMediaAsset[] = [];
  let oldMediaUrls: string[] = [];
  try {
    await withTransaction(async (connection) => {
      const existing = await selectOne<SectionContentRow>("SELECT content_json FROM page_sections WHERE page_key = ? AND section_key = ? FOR UPDATE", [pageKey, sectionKey], connection);
      let previousContent = existing?.content_json;
      if (typeof previousContent === "string") {
        try { previousContent = JSON.parse(previousContent) as unknown; } catch { previousContent = null; }
      }
      oldMediaUrls = [...stringsInContent(previousContent)];
      const values: Record<string, string | null> = {};
      for (const field of fields) {
        const stored = await storeMediaFiles(submittedMediaFiles(formData, field.name), { uploadedBy: administratorId, connection, expectedType: field.type, folder: field.folder, altTexts: [field.altText], maximumFiles: 1 });
        written.push(...stored);
        const allowed = new Set(retainedMediaUrls(formData, field.name).filter((url) => media.safeParse(url).success));
        const urls = mergeMediaSubmission(formData, field.name, stored, allowed);
        if (urls.length > 1 || (field.required && urls.length !== 1)) throw new Error(`${field.altText} is required.`);
        values[field.name] = urls[0] ?? null;
      }
      await writeSection(pageKey, sectionKey, displayName, buildContent(values), connection);
    });
  } catch (error) {
    await removeStoredMediaFiles(written);
    console.error(`Unable to save ${sectionKey}`, error);
    invalid(sectionKey);
  }
  await cleanupUnreferencedMediaUrls(oldMediaUrls).catch((error) => console.error(`Unable to clean replaced ${sectionKey} media`, error));
  await finishSectionSave(administratorId, pageKey, sectionKey, displayName);
}

function parseJson(value: string): unknown { try { return JSON.parse(value) as unknown; } catch { return null; } }
function invalid(section: string): never { redirect(`/admin/homepage?error=${encodeURIComponent(section)}#${section}`); }

export async function saveHeaderAction(formData: FormData): Promise<void> {
  const parsed = z.object({ topbarText: text(300), topbarRightText: text(300), navigation: z.array(navigationItem).min(1).max(12) }).safeParse({ topbarText: formString(formData, "topbarText"), topbarRightText: formString(formData, "topbarRightText"), navigation: parseJson(formString(formData, "navigationJson")) });
  if (!parsed.success) invalid("header");
  const fields = parsed.data.navigation.flatMap((item, index) => item.type === "link" ? [] : item.items.map((subItem, subIndex) => ({ name: `navigationThumbnail${index}-${subIndex}`, type: "image" as const, folder: "navigation/images", altText: `${subItem.name} navigation thumbnail` })));
  await saveMediaSection("global", "header", "Header", formData, fields, (mediaValues) => {
    const navigation = parsed.data.navigation.map((item, index) => item.type === "link" ? { label: item.label, href: item.href } : { label: item.label, href: item.href, type: item.type, items: item.items.map((sub, subIndex) => ({ name: sub.name, href: sub.href, image: mediaValues[`navigationThumbnail${index}-${subIndex}`] })) });
    return { topbarText: parsed.data.topbarText, topbarRightText: parsed.data.topbarRightText, navigation };
  });
}

export async function saveHeroAction(formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  const productIds = formStringList(formData, "productIds");
  const products = productIds.map((productId, index) => ({
    productId: formString(formData, `hero${index}ProductId`) || productId,
    title: formString(formData, `hero${index}Title`),
    tagline: formString(formData, `hero${index}Tagline`),
    description: formString(formData, `hero${index}Description`),
  }));
  const parsed = z.object({
    productIds: idList.refine((ids) => new Set(ids).size === ids.length, "Duplicate products are not allowed"),
    products: z.array(z.object({
      productId: z.string().regex(/^[1-9]\d*$/),
      title: optionalText(190),
      tagline: optionalText(300),
      description: optionalText(1200),
    })).min(1).max(24),
  }).superRefine((value, context) => {
    if (value.productIds.length !== value.products.length || value.products.some((product, index) => product.productId !== value.productIds[index])) {
      context.addIssue({ code: "custom", path: ["products"], message: "Hero products are out of sync." });
    }
  }).safeParse({ productIds, products });
  if (!parsed.success) invalid("hero");
  const placeholders = parsed.data.productIds.map(() => "?").join(", ");
  const catalogProducts = await selectRows<HeroProductRow>(
    `SELECT CAST(id AS CHAR) AS id, name FROM products WHERE status = 'ACTIVE' AND id IN (${placeholders})`,
    parsed.data.productIds,
  );
  const productNames = new Map(catalogProducts.map((product) => [product.id, product.name]));
  if (productNames.size !== parsed.data.productIds.length) invalid("hero");
  const fields: SectionMediaField[] = parsed.data.products.map((product, index) => ({
    name: `hero${index}Image`,
    type: "image",
    folder: "homepage/images",
    altText: `${product.title || productNames.get(product.productId) || "Hero product"} promotional image`,
  }));
  await saveMediaSection("home", "hero", "Hero products", formData, fields, (mediaValues) => ({
    productIds: parsed.data.productIds,
    products: parsed.data.products.map((product, index) => ({ ...product, image: mediaValues[`hero${index}Image`] ?? "" })),
  }), administrator.id);
}

export async function saveSignatureAction(formData: FormData): Promise<void> {
  const parsed = z.object({ eyebrow: text(150), titleLead: text(150), titleAccent: text(150), description: text(1000), ctaLabel: text(120), ctaUrl: link, productIds: idList }).safeParse({ eyebrow: formString(formData, "eyebrow"), titleLead: formString(formData, "titleLead"), titleAccent: formString(formData, "titleAccent"), description: formString(formData, "description"), ctaLabel: formString(formData, "ctaLabel"), ctaUrl: formString(formData, "ctaUrl"), productIds: formStringList(formData, "productIds") });
  if (!parsed.success) invalid("signature-fragrances");
  await saveSection("home", "signature-fragrances", "Signature Fragrances", parsed.data);
}

export async function saveBrandFilmAction(formData: FormData): Promise<void> {
  const parsed = z.object({ eyebrow: text(150), titleLead: text(150), titleAccent: text(150), description: text(1500), location: text(150), duration: text(100) }).safeParse({ eyebrow: formString(formData, "eyebrow"), titleLead: formString(formData, "titleLead"), titleAccent: formString(formData, "titleAccent"), description: formString(formData, "description"), location: formString(formData, "location"), duration: formString(formData, "duration") });
  if (!parsed.success) invalid("brand-film");
  await saveMediaSection("home", "brand-film", "Brand Film", formData, [{ name: "video", type: "video", folder: "homepage/videos", altText: "Brand film", required: true }], (mediaValues) => ({ ...parsed.data, video: mediaValues.video }));
}

export async function saveRecreationsAction(formData: FormData): Promise<void> {
  const parsed = z.object({ label: text(150), description: text(1000), ctaLabel: text(120), productIds: idList }).safeParse({ label: formString(formData, "label"), description: formString(formData, "description"), ctaLabel: formString(formData, "ctaLabel"), productIds: formStringList(formData, "productIds") });
  if (!parsed.success) invalid("recreations");
  await saveSection("home", "recreations", "Recreations Slider", parsed.data);
}

export async function saveWeeklyAction(formData: FormData): Promise<void> {
  const parsed = z.object({ productId: z.string().regex(/^[1-9]\d*$/), eyebrow: text(150), description: optionalText(1000), ctaLabel: text(120) }).safeParse({ productId: formString(formData, "productId"), eyebrow: formString(formData, "eyebrow"), description: formString(formData, "description"), ctaLabel: formString(formData, "ctaLabel") });
  if (!parsed.success) invalid("fragrance-week");
  const product = await selectOne<ProductSlugRow>("SELECT slug FROM products WHERE id = ? AND status = 'ACTIVE' LIMIT 1", [parsed.data.productId]);
  if (!product) invalid("fragrance-week");
  await saveSection("home", "fragrance-week", "Fragrance of the Week", { ...parsed.data, ctaUrl: `/products/${product.slug}` });
}

export async function saveScentStoryAction(formData: FormData): Promise<void> {
  const parsed = z.object({ eyebrow: text(150), titleLead: text(150), titleAccent: text(150), description: text(2000), quote: text(1000), filmLabel: text(150), duration: text(100) }).safeParse({ eyebrow: formString(formData, "eyebrow"), titleLead: formString(formData, "titleLead"), titleAccent: formString(formData, "titleAccent"), description: formString(formData, "description"), quote: formString(formData, "quote"), filmLabel: formString(formData, "filmLabel"), duration: formString(formData, "duration") });
  if (!parsed.success) invalid("scent-story");
  await saveMediaSection("home", "scent-story", "Scent Story", formData, [
    { name: "mainVideo", type: "video", folder: "homepage/videos", altText: "Main scent story film", required: true },
    { name: "detailVideo", type: "video", folder: "homepage/videos", altText: "Scent story detail film", required: true },
  ], (mediaValues) => ({ ...parsed.data, mainVideo: mediaValues.mainVideo, detailVideo: mediaValues.detailVideo }));
}

export async function saveAudienceAction(formData: FormData): Promise<void> {
  const cardSchema = z.object({ eyebrow: text(150), title: text(150), description: text(1000), ctaLabel: text(120), ctaUrl: link });
  const cards = [0, 1].map((index) => ({ eyebrow: formString(formData, `card${index}Eyebrow`), title: formString(formData, `card${index}Title`), description: formString(formData, `card${index}Description`), ctaLabel: formString(formData, `card${index}CtaLabel`), ctaUrl: formString(formData, `card${index}CtaUrl`) }));
  const parsed = z.object({ title: text(150), description: text(1000), cards: z.array(cardSchema).length(2) }).safeParse({ title: formString(formData, "title"), description: formString(formData, "description"), cards });
  if (!parsed.success) invalid("audience-collections");
  const fields: SectionMediaField[] = parsed.data.cards.flatMap((card, index) => [
    { name: `card${index}Image`, type: "image", folder: "homepage/images", altText: `${card.title} product image`, required: true },
    { name: `card${index}Background`, type: "image", folder: "homepage/images", altText: `${card.title} background image`, required: true },
  ]);
  await saveMediaSection("home", "audience-collections", "Audience Collections", formData, fields, (mediaValues) => ({
    title: parsed.data.title,
    description: parsed.data.description,
    cards: parsed.data.cards.map((card, index) => ({ ...card, image: mediaValues[`card${index}Image`], background: mediaValues[`card${index}Background`] })),
  }));
}

export async function saveReviewsAction(formData: FormData): Promise<void> {
  const parsed = z.object({ eyebrow: text(150), titleLead: text(150), titleAccent: text(150), description: text(1500), reviews: z.array(review).min(1).max(12) }).safeParse({ eyebrow: formString(formData, "eyebrow"), titleLead: formString(formData, "titleLead"), titleAccent: formString(formData, "titleAccent"), description: formString(formData, "description"), reviews: parseJson(formString(formData, "reviewsJson")) });
  if (!parsed.success) invalid("reviews");
  await saveSection("home", "reviews", "Reviews", parsed.data);
}

export async function saveFooterAction(formData: FormData): Promise<void> {
  const parsed = z.object({ description: text(3000), newsletterTitle: text(150), newsletterDescription: text(1000), newsletterPlaceholder: text(120), newsletterButtonLabel: text(80), copyright: text(300), legalLinks: z.array(footerLink).min(1).max(12) }).safeParse({ description: formString(formData, "description"), newsletterTitle: formString(formData, "newsletterTitle"), newsletterDescription: formString(formData, "newsletterDescription"), newsletterPlaceholder: formString(formData, "newsletterPlaceholder"), newsletterButtonLabel: formString(formData, "newsletterButtonLabel"), copyright: formString(formData, "copyright"), legalLinks: parseJson(formString(formData, "legalLinksJson")) });
  if (!parsed.success) invalid("footer");
  await saveSection("global", "footer", "Footer", parsed.data);
}
