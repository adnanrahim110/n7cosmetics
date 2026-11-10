import type { PublishedBlogSummary } from "@/lib/blogs/storefront";
import BlogPostCard from "./BlogPostCard";

export default function BlogPostGrid({ posts }: { posts: PublishedBlogSummary[] }) {
  if (!posts.length) {
    return (
      <p className="rounded-xl border border-primary-200 bg-white px-4 py-12 text-center text-dark-800">
        No articles have been published yet. Check back for fragrance guides and stories from N7.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => <li key={post.slug}><BlogPostCard post={post} /></li>)}
    </ul>
  );
}
