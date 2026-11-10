import Link from "next/link";
import type { PublishedBlogSummary } from "@/lib/blogs/storefront";
import BlogCover from "./BlogCover";
import BlogPublicationDate from "./BlogPublicationDate";

export default function BlogPostCard({ post, heading: Heading = "h2" }: { post: PublishedBlogSummary; heading?: "h2" | "h3" }) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-primary-200 bg-white">
      <BlogCover alt={post.cover_image_alt} src={post.cover_image_url} variant="card" />
      <div className="space-y-3 px-4 py-5 sm:px-6 sm:py-6">
        <BlogPublicationDate date={post.first_published_at} />
        <Heading className="text-2xl leading-tight text-dark-950 wrap-anywhere">
          <Link
            className="inline-flex min-h-11 items-center rounded-sm underline-offset-4 hover:text-primary-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800"
            href={`/blogs/${post.slug}`}
          >
            {post.title}
          </Link>
        </Heading>
        <p className="text-base leading-relaxed text-dark-800 wrap-anywhere">{post.excerpt}</p>
      </div>
    </article>
  );
}
