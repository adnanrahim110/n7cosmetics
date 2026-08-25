import Image from "next/image";
import Link from "next/link";
import type { RowDataPacket } from "mysql2/promise";
import { BadgeCheck, Check, Eye, Search, Star, X } from "lucide-react";
import CustomSelect from "@/components/admin/CustomSelect";
import AdminMutationForm from "@/components/admin/AdminMutationForm";
import PageHeader from "@/components/admin/PageHeader";
import Pagination, { parsePage } from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import { selectOne, selectRows } from "@/lib/db/query";
import { updateReviewStatusAction } from "./actions";

interface ReviewRow extends RowDataPacket {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  rating: number;
  reviewer_name: string;
  reviewer_email: string;
  title: string;
  body: string;
  recommends_product: number;
  is_verified_purchase: number;
  submitted_at: Date;
}

interface ReviewMediaRow extends RowDataPacket {
  review_id: string;
  public_url: string;
  mime_type: string;
  original_name: string;
}

interface CountRow extends RowDataPacket { total_count: number | string }
interface ReviewsPageProps { searchParams: Promise<{ q?: string; status?: string; page?: string }> }

const statuses = ["ALL", "PENDING", "PUBLISHED", "REJECTED"] as const;
const pageSize = 20;

export default async function ReviewsAdminPage({ searchParams }: ReviewsPageProps) {
  const query = await searchParams;
  const q = query.q?.trim().slice(0, 100) ?? "";
  const status = statuses.includes(query.status as (typeof statuses)[number]) ? query.status! : "ALL";
  const term = `%${q}%`;
  const count = await selectOne<CountRow>(
    `SELECT COUNT(*) AS total_count
     FROM product_reviews pr
     INNER JOIN products p ON p.id = pr.product_id
     WHERE (p.name LIKE ? OR pr.reviewer_name LIKE ? OR pr.reviewer_email LIKE ? OR pr.title LIKE ?)
       AND (? = 'ALL' OR pr.status = ?)`,
    [term, term, term, term, status, status],
  );
  const totalItems = Number(count?.total_count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(parsePage(query.page), totalPages);
  const reviews = await selectRows<ReviewRow>(
    `SELECT CAST(pr.id AS CHAR) AS id, CAST(pr.product_id AS CHAR) AS product_id,
       p.name AS product_name, p.slug AS product_slug, pr.status, pr.rating,
       pr.reviewer_name, pr.reviewer_email, pr.title, pr.body, pr.recommends_product,
       pr.is_verified_purchase, pr.submitted_at,
       (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS product_image
     FROM product_reviews pr
     INNER JOIN products p ON p.id = pr.product_id
     WHERE (p.name LIKE ? OR pr.reviewer_name LIKE ? OR pr.reviewer_email LIKE ? OR pr.title LIKE ?)
       AND (? = 'ALL' OR pr.status = ?)
     ORDER BY FIELD(pr.status, 'PENDING', 'PUBLISHED', 'REJECTED'), pr.submitted_at DESC
     LIMIT ? OFFSET ?`,
    [term, term, term, term, status, status, pageSize, (page - 1) * pageSize],
  );
  const reviewIds = reviews.map((review) => review.id);
  const media = reviewIds.length ? await selectRows<ReviewMediaRow>(
    `SELECT CAST(prm.review_id AS CHAR) AS review_id, ma.public_url, ma.mime_type, ma.original_name
     FROM product_review_media prm
     INNER JOIN media_assets ma ON ma.id = prm.media_asset_id
     WHERE prm.review_id IN (${reviewIds.map(() => "?").join(", ")})
     ORDER BY prm.review_id, prm.sort_order, prm.id`,
    reviewIds,
  ) : [];
  const mediaByReview = new Map<string, ReviewMediaRow[]>();
  for (const item of media) mediaByReview.set(item.review_id, [...(mediaByReview.get(item.review_id) ?? []), item]);

  return (
    <div>
      <PageHeader eyebrow="Community" title="Product reviews" description="Read customer submissions and choose which reviews appear on product pages." />
      <form className="mt-7 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_190px_auto]">
        <label className="flex items-center rounded-lg border border-zinc-300 px-3 focus-within:border-amber-700 focus-within:ring-2 focus-within:ring-amber-100"><Search className="text-zinc-400" size={16} /><input aria-label="Search reviews" className="w-full px-2 py-2 text-sm outline-none" defaultValue={q} name="q" placeholder="Product, customer, email, or title" /></label>
        <CustomSelect defaultValue={status} name="status" options={statuses.map((value) => ({ value, label: value === "ALL" ? "All statuses" : value.toLowerCase() }))} searchable={false} />
        <button className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800" type="submit">Filter</button>
      </form>

      <div className="mt-5 space-y-4">
        {reviews.map((review) => {
          const attachments = mediaByReview.get(review.id) ?? [];
          return (
            <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm" key={review.id}>
              <div className="flex flex-col gap-4 border-b border-zinc-100 bg-zinc-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-zinc-100">{review.product_image ? <Image alt="" className="object-cover" fill sizes="44px" src={review.product_image} /> : null}</div>
                  <div className="min-w-0"><Link className="block truncate text-sm font-semibold text-zinc-950 hover:text-amber-700" href={`/admin/products/${review.product_id}`}>{review.product_name}</Link><p className="mt-0.5 text-xs text-zinc-400">Submitted {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(review.submitted_at))}</p></div>
                </div>
                <div className="flex items-center gap-2"><StatusBadge status={review.status} /><Link aria-label="View product page" className="grid size-8 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-amber-700" href={`/products/${review.product_slug}#reviews`} target="_blank"><Eye size={15} /></Link></div>
              </div>

              <div className="grid gap-6 p-5 lg:grid-cols-[12rem_minmax(0,1fr)_auto]">
                <div className="text-sm"><p className="font-semibold text-zinc-950">{review.reviewer_name}</p><p className="mt-1 break-all text-xs text-zinc-500">{review.reviewer_email}</p>{review.is_verified_purchase ? <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"><BadgeCheck size={13} />Verified purchase</p> : null}{review.recommends_product ? <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500"><Check size={13} />Recommends</p> : null}</div>
                <div className="min-w-0">
                  <div aria-label={`${review.rating} out of 5 stars`} className="flex gap-0.5 text-amber-600">{[1, 2, 3, 4, 5].map((value) => <Star className={value <= review.rating ? "fill-current" : ""} key={value} size={14} />)}</div>
                  <h2 className="mt-3 font-body text-base font-semibold text-zinc-950">{review.title}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-600">{review.body}</p>
                  {attachments.length ? <div className="mt-4 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">{attachments.map((item) => <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100" key={item.public_url}>{item.mime_type.startsWith("video/") ? <video aria-label={item.original_name} className="size-full object-cover" controls preload="metadata" src={item.public_url} /> : <Image alt={item.original_name} className="object-cover" fill sizes="150px" src={item.public_url} />}</div>)}</div> : null}
                </div>
                <div className="flex flex-row gap-2 lg:w-28 lg:flex-col">
                  {review.status !== "PUBLISHED" ? <AdminMutationForm action={updateReviewStatusAction} errorMessage="The review couldn’t be published" loadingMessage="Publishing review…" successDescription="The review can now appear on the product page." successMessage="Review published"><input name="reviewId" type="hidden" value={review.id} /><input name="status" type="hidden" value="PUBLISHED" /><button className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800" type="submit"><Check size={14} />Publish</button></AdminMutationForm> : null}
                  {review.status !== "REJECTED" ? <AdminMutationForm action={updateReviewStatusAction} errorMessage="The review couldn’t be rejected" loadingMessage="Rejecting review…" successDescription="The review will not appear on the storefront." successMessage="Review rejected" successType="warning"><input name="reviewId" type="hidden" value={review.id} /><input name="status" type="hidden" value="REJECTED" /><button className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50" type="submit"><X size={14} />Reject</button></AdminMutationForm> : null}
                  {review.status !== "PENDING" ? <AdminMutationForm action={updateReviewStatusAction} errorMessage="The review couldn’t be moved to pending" loadingMessage="Updating review…" successDescription="It is ready for another moderation decision." successMessage="Review moved to pending"><input name="reviewId" type="hidden" value={review.id} /><input name="status" type="hidden" value="PENDING" /><button className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50" type="submit">Pending</button></AdminMutationForm> : null}
                </div>
              </div>
            </article>
          );
        })}
        {!reviews.length ? <div className="rounded-xl border border-zinc-200 bg-white px-4 py-14 text-center text-sm text-zinc-500 shadow-sm">No reviews found.</div> : null}
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white"><Pagination page={page} pageSize={pageSize} pathname="/admin/reviews" query={{ q, status: status === "ALL" ? undefined : status }} totalItems={totalItems} /></div>
    </div>
  );
}
