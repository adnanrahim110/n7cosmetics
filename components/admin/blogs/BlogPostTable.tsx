import { ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import type { listAdminBlogs } from "@/lib/admin/blogs";
import AdminThumbnail from "../AdminThumbnail";
import StatusBadge from "../StatusBadge";
import DeleteBlogPostButton from "./DeleteBlogPostButton";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Europe/London" });
const columns = ["Post", "Slug", "Status", "First published", "Last edited", "Actions"];
const actionClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium whitespace-nowrap text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700";

function PostDate({ date }: { date: Date | null }) {
  return date ? <time dateTime={date.toISOString()}>{dateFormat.format(date)}</time> : <span aria-label="Never published">—</span>;
}

export default function BlogPostTable({ posts }: { posts: Awaited<ReturnType<typeof listAdminBlogs>> }) {
  return (
    <div className="mt-6 min-w-0 rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div
        aria-label="Blog posts table"
        className="overflow-x-auto rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        role="region"
        tabIndex={0}
      >
        <table className="w-full min-w-208 text-left text-sm">
          <caption className="sr-only">Blog posts</caption>
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium tracking-wide text-zinc-600 uppercase">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 text-start whitespace-nowrap last:text-end" key={column} scope="col">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {posts.map((post) => {
              const editHref = `/admin/blogs/${post.id}`;
              return (
                <tr className="hover:bg-zinc-50" key={post.id}>
                  <th className="min-w-48 px-4 py-3 font-semibold text-zinc-950" scope="row">
                    <div className="flex items-center gap-3">
                      <AdminThumbnail alt="" src={post.cover_image_url} />
                      <span className="min-w-0 wrap-anywhere">{post.title}</span>
                    </div>
                  </th>
                  <td className="min-w-32 px-4 py-3 text-xs text-zinc-600 wrap-anywhere">{post.slug}</td>
                  <td className="px-4 py-3"><StatusBadge status={post.status} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-600"><PostDate date={post.first_published_at} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-600"><PostDate date={post.updated_at} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {post.status === "PUBLISHED" ? (
                        <Link
                          aria-label={`View ${post.title} on the storefront (opens in a new tab)`}
                          className={actionClass}
                          href={`/blogs/${post.slug}`}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <ExternalLink aria-hidden="true" size={16} /> View
                        </Link>
                      ) : null}
                      <Link aria-label={`Edit ${post.title}`} className={actionClass} href={editHref}>
                        <Pencil aria-hidden="true" size={16} /> Edit
                      </Link>
                      <DeleteBlogPostButton id={post.id} title={post.title} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!posts.length ? (
              <tr>
                <td className="px-4 py-12 text-center text-zinc-600" colSpan={columns.length}>
                  No blog posts yet. Select Add post to create your first draft.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
