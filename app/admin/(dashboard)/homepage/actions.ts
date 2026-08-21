"use server";

import type { RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAllowedDestinationHref } from "@/lib/admin/destination";
import { formString, formStringList } from "@/lib/admin/form";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne } from "@/lib/db/query";

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

async function saveSection(pageKey: "home" | "global", sectionKey: string, displayName: string, content: unknown): Promise<void> {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  await executeMutation(`INSERT INTO page_sections (page_key, section_key, section_type, display_name, content_json, is_enabled, sort_order) VALUES (?, ?, 'fixed', ?, ?, 1, 0) ON DUPLICATE KEY UPDATE section_type = 'fixed', display_name = VALUES(display_name), content_json = VALUES(content_json), is_enabled = 1`, [pageKey, sectionKey, displayName, JSON.stringify(content)]);
  const metadata = await getRequestMetadata();
  await writeAuditLog({ administratorId: admin.id, action: "STOREFRONT_CONTENT_UPDATE", entityType: "page_section", entityId: `${pageKey}.${sectionKey}`, summary: `Updated ${displayName}`, ipAddress: metadata.ipAddress });
  revalidatePath("/", "layout");
  revalidatePath("/admin/homepage");
  redirect(`/admin/homepage?saved=${encodeURIComponent(sectionKey)}#${sectionKey}`);
}

function parseJson(value: string): unknown { try { return JSON.parse(value) as unknown; } catch { return null; } }
function invalid(section: string): never { redirect(`/admin/homepage?error=${encodeURIComponent(section)}#${section}`); }

export async function saveHeaderAction(formData: FormData): Promise<void> {
  const parsed = z.object({ topbarText: text(300), topbarRightText: text(300), navigation: z.array(navigationItem).min(1).max(12) }).safeParse({ topbarText: formString(formData, "topbarText"), topbarRightText: formString(formData, "topbarRightText"), navigation: parseJson(formString(formData, "navigationJson")) });
  if (!parsed.success) invalid("header");
  const navigation = parsed.data.navigation.map((item) => item.type === "link" ? { label: item.label, href: item.href } : { label: item.label, href: item.href, type: item.type, items: item.items.map((sub) => ({ name: sub.name, href: sub.href, image: sub.image || null })) });
  await saveSection("global", "header", "Header", { topbarText: parsed.data.topbarText, topbarRightText: parsed.data.topbarRightText, navigation });
}

export async function saveHeroAction(formData: FormData): Promise<void> {
  const parsed = idList.safeParse(formStringList(formData, "productIds"));
  if (!parsed.success) invalid("hero");
  await saveSection("home", "hero", "Hero products", { productIds: parsed.data });
}

export async function saveSignatureAction(formData: FormData): Promise<void> {
  const parsed = z.object({ eyebrow: text(150), titleLead: text(150), titleAccent: text(150), description: text(1000), ctaLabel: text(120), ctaUrl: link, productIds: idList }).safeParse({ eyebrow: formString(formData, "eyebrow"), titleLead: formString(formData, "titleLead"), titleAccent: formString(formData, "titleAccent"), description: formString(formData, "description"), ctaLabel: formString(formData, "ctaLabel"), ctaUrl: formString(formData, "ctaUrl"), productIds: formStringList(formData, "productIds") });
  if (!parsed.success) invalid("signature-fragrances");
  await saveSection("home", "signature-fragrances", "Signature Fragrances", parsed.data);
}

export async function saveBrandFilmAction(formData: FormData): Promise<void> {
  const parsed = z.object({ eyebrow: text(150), titleLead: text(150), titleAccent: text(150), description: text(1500), video: media, location: text(150), duration: text(100) }).safeParse({ eyebrow: formString(formData, "eyebrow"), titleLead: formString(formData, "titleLead"), titleAccent: formString(formData, "titleAccent"), description: formString(formData, "description"), video: formString(formData, "video"), location: formString(formData, "location"), duration: formString(formData, "duration") });
  if (!parsed.success) invalid("brand-film");
  await saveSection("home", "brand-film", "Brand Film", parsed.data);
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
  const parsed = z.object({ eyebrow: text(150), titleLead: text(150), titleAccent: text(150), description: text(2000), quote: text(1000), mainVideo: media, detailVideo: media, filmLabel: text(150), duration: text(100) }).safeParse({ eyebrow: formString(formData, "eyebrow"), titleLead: formString(formData, "titleLead"), titleAccent: formString(formData, "titleAccent"), description: formString(formData, "description"), quote: formString(formData, "quote"), mainVideo: formString(formData, "mainVideo"), detailVideo: formString(formData, "detailVideo"), filmLabel: formString(formData, "filmLabel"), duration: formString(formData, "duration") });
  if (!parsed.success) invalid("scent-story");
  await saveSection("home", "scent-story", "Scent Story", parsed.data);
}

export async function saveAudienceAction(formData: FormData): Promise<void> {
  const cardSchema = z.object({ eyebrow: text(150), title: text(150), description: text(1000), image: media, background: media, ctaLabel: text(120), ctaUrl: link });
  const cards = [0, 1].map((index) => ({ eyebrow: formString(formData, `card${index}Eyebrow`), title: formString(formData, `card${index}Title`), description: formString(formData, `card${index}Description`), image: formString(formData, `card${index}Image`), background: formString(formData, `card${index}Background`), ctaLabel: formString(formData, `card${index}CtaLabel`), ctaUrl: formString(formData, `card${index}CtaUrl`) }));
  const parsed = z.object({ title: text(150), description: text(1000), cards: z.array(cardSchema).length(2) }).safeParse({ title: formString(formData, "title"), description: formString(formData, "description"), cards });
  if (!parsed.success) invalid("audience-collections");
  await saveSection("home", "audience-collections", "Audience Collections", parsed.data);
}

export async function saveReviewsAction(formData: FormData): Promise<void> {
  const parsed = z.object({ eyebrow: text(150), titleLead: text(150), titleAccent: text(150), description: text(1500), reviews: z.array(review).min(1).max(12) }).safeParse({ eyebrow: formString(formData, "eyebrow"), titleLead: formString(formData, "titleLead"), titleAccent: formString(formData, "titleAccent"), description: formString(formData, "description"), reviews: parseJson(formString(formData, "reviewsJson")) });
  if (!parsed.success) invalid("reviews");
  await saveSection("home", "reviews", "Reviews", parsed.data);
}

export async function saveFooterAction(formData: FormData): Promise<void> {
  const parsed = z.object({ description: text(3000), newsletterTitle: text(150), newsletterDescription: text(1000), newsletterPlaceholder: text(120), newsletterButtonLabel: text(80), twitterUrl: z.union([z.literal("#"), z.url().max(1000)]), copyright: text(300), legalLinks: z.array(footerLink).min(1).max(12) }).safeParse({ description: formString(formData, "description"), newsletterTitle: formString(formData, "newsletterTitle"), newsletterDescription: formString(formData, "newsletterDescription"), newsletterPlaceholder: formString(formData, "newsletterPlaceholder"), newsletterButtonLabel: formString(formData, "newsletterButtonLabel"), twitterUrl: formString(formData, "twitterUrl") || "#", copyright: formString(formData, "copyright"), legalLinks: parseJson(formString(formData, "legalLinksJson")) });
  if (!parsed.success) invalid("footer");
  await saveSection("global", "footer", "Footer", parsed.data);
}
