"use server";

import type { RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { getRequestMetadata } from "@/lib/auth/request";
import { MediaUploadError, removeStoredMediaFiles, storeMediaFiles, type StoredMediaAsset } from "@/lib/admin/media";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import { hasDatabaseConfig } from "@/lib/env";
import { reviewInputSchema } from "@/lib/commerce/reviews-validation";

type ReviewField = "name" | "email" | "rating" | "title" | "body" | "consent" | "media";

export interface ReviewFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<ReviewField, string>>;
}

interface AttemptCountRow extends RowDataPacket { attempt_count: number | string }
interface ProductRow extends RowDataPacket { id: string }

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function reviewFiles(formData: FormData): File[] {
  return formData.getAll("reviewMediaFiles").filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function validationErrors(error: ReturnType<typeof reviewInputSchema.safeParse>): ReviewFormState["fieldErrors"] {
  if (error.success) return undefined;
  const fields = error.error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(fields).filter((entry) => entry[1]?.length).map(([field, messages]) => [field, messages?.[0]]));
}

async function recordAttempt(ipAddress: string, productId: string | null, succeeded: boolean): Promise<void> {
  await executeMutation(
    "INSERT INTO review_submission_attempts (ip_address, product_id, succeeded) VALUES (?, ?, ?)",
    [ipAddress, productId, succeeded],
  );
}

export async function submitProductReviewAction(
  previousState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  void previousState;

  if (formValue(formData, "companyWebsite")) {
    return { status: "success", message: "Thank you. Your review has been received." };
  }
  if (!hasDatabaseConfig()) {
    return { status: "error", message: "Reviews are temporarily unavailable. Please try again later." };
  }

  const metadata = await getRequestMetadata();
  let parsedProductId: string | null = null;
  try {
    const recentAttempts = await selectOne<AttemptCountRow>(
      "SELECT COUNT(*) AS attempt_count FROM review_submission_attempts WHERE ip_address = ? AND attempted_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 60 MINUTE)",
      [metadata.ipAddress],
    );
    if (Number(recentAttempts?.attempt_count ?? 0) >= 4) {
      return { status: "error", message: "Too many reviews have been submitted from this connection. Please try again later." };
    }

    const parsed = reviewInputSchema.safeParse({
      productId: formValue(formData, "productId"),
      productSlug: formValue(formData, "productSlug"),
      name: formValue(formData, "name"),
      email: formValue(formData, "email"),
      rating: formValue(formData, "rating"),
      title: formValue(formData, "title"),
      body: formValue(formData, "body"),
      recommendsProduct: formValue(formData, "recommendsProduct") === "on",
      consent: formValue(formData, "consent"),
    });
    parsedProductId = /^[1-9]\d*$/.test(formValue(formData, "productId")) ? formValue(formData, "productId") : null;
    if (!parsed.success) {
      await recordAttempt(metadata.ipAddress, parsedProductId, false);
      return { status: "error", message: "Check the highlighted fields and try again.", fieldErrors: validationErrors(parsed) };
    }

    const files = reviewFiles(formData);
    if (files.length > 4) {
      await recordAttempt(metadata.ipAddress, parsed.data.productId, false);
      return { status: "error", message: "Choose no more than four photos or videos.", fieldErrors: { media: "Choose no more than four files." } };
    }
    if (files.reduce((total, file) => total + file.size, 0) > 100 * 1024 * 1024) {
      await recordAttempt(metadata.ipAddress, parsed.data.productId, false);
      return { status: "error", message: "The selected media is too large.", fieldErrors: { media: "Your selected files must total 100 MB or less." } };
    }

    const product = await selectOne<ProductRow>(
      "SELECT CAST(id AS CHAR) AS id FROM products WHERE id = ? AND slug = ? AND status = 'ACTIVE' LIMIT 1",
      [parsed.data.productId, parsed.data.productSlug],
    );
    if (!product) {
      await recordAttempt(metadata.ipAddress, parsed.data.productId, false);
      return { status: "error", message: "This product is no longer available for review." };
    }

    const writtenAssets: StoredMediaAsset[] = [];
    try {
      await withTransaction(async (connection) => {
        const stored = await storeMediaFiles(files, {
          uploadedBy: null,
          connection,
          folder: "reviews/media",
          maximumFiles: 4,
        });
        writtenAssets.push(...stored);

        const created = await executeMutation(
          `INSERT INTO product_reviews
             (product_id, rating, reviewer_name, reviewer_email, title, body, recommends_product,
              is_verified_purchase, ip_address, user_agent)
           VALUES (?, ?, ?, ?, ?, ?, ?,
             EXISTS(
               SELECT 1 FROM orders o
               INNER JOIN order_items oi ON oi.order_id = o.id
               WHERE LOWER(o.customer_email) = ? AND oi.product_id = ?
                 AND o.status NOT IN ('CANCELLED', 'REFUNDED')
                 AND o.payment_status IN ('PAID', 'PARTIALLY_REFUNDED')
               LIMIT 1
             ), ?, ?)`,
          [parsed.data.productId, parsed.data.rating, parsed.data.name, parsed.data.email, parsed.data.title,
           parsed.data.body, parsed.data.recommendsProduct, parsed.data.email, parsed.data.productId,
           metadata.ipAddress, metadata.userAgent],
          connection,
        );
        const reviewId = String(created.insertId);
        for (const [index, asset] of stored.entries()) {
          await executeMutation(
            "INSERT INTO product_review_media (review_id, media_asset_id, sort_order) VALUES (?, ?, ?)",
            [reviewId, asset.id, index],
            connection,
          );
        }
        await executeMutation(
          "INSERT INTO review_submission_attempts (ip_address, product_id, succeeded) VALUES (?, ?, 1)",
          [metadata.ipAddress, parsed.data.productId],
          connection,
        );
      });
    } catch (error) {
      await removeStoredMediaFiles(writtenAssets);
      throw error;
    }

    revalidatePath(`/products/${parsed.data.productSlug}`);
    revalidatePath(`/bundles/${parsed.data.productSlug}`);
    return { status: "success", message: "Thank you. Your review was submitted and will appear after it has been approved." };
  } catch (error) {
    if (error instanceof MediaUploadError) {
      await recordAttempt(metadata.ipAddress, parsedProductId, false).catch(() => undefined);
      return { status: "error", message: error.message, fieldErrors: { media: error.message } };
    }
    console.error("Product review submission failed", error);
    return { status: "error", message: "We could not submit your review right now. Please try again later." };
  }
}
