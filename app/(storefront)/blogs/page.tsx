import BlogPostGrid from "@/components/blogs/BlogPostGrid";
import { listPublishedBlogPosts } from "@/lib/blogs/storefront";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Blogs | N7 Cosmetics",
  description: "Explore fragrance guides, scent notes, and stories from N7 Cosmetics.",
  path: "/blogs",
});

export default async function BlogsPage() {
  const posts = await listPublishedBlogPosts();

  return (
    <section aria-labelledby="blog-index-title" className="bg-primary-50 px-4 pt-36 pb-16 text-dark-950 sm:px-8 sm:pt-44 sm:pb-20">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 space-y-3 border-b border-primary-200 pb-8 sm:mb-12">
          <p className="text-sm font-medium tracking-widest text-primary-800 uppercase">N7 Journal</p>
          <h1 className="text-4xl text-dark-950 sm:text-5xl" id="blog-index-title">Blogs</h1>
          <p className="max-w-prose text-lg leading-relaxed text-dark-800">Fragrance guides, scent notes, and stories from N7 Cosmetics.</p>
        </header>
        <BlogPostGrid posts={posts} />
      </div>
    </section>
  );
}
