import type { PublishedBlogSummary } from "@/lib/blogs/storefront";
import BlogArticleContainer from "./BlogArticleContainer";
import BlogPostCard from "./BlogPostCard";
import BlogSlider from "./BlogSlider";

export default function RelatedBlogPosts({ posts }: { posts: PublishedBlogSummary[] }) {
  if (!posts.length) return null;

  return (
    <section aria-labelledby="related-blogs-title" className="scroll-mt-28 border-t border-primary-200 bg-primary-100 py-12 sm:py-16" id="related-blogs">
      <BlogArticleContainer>
        <p className="mb-3 text-xs font-semibold tracking-widest text-primary-800 uppercase">N7 Journal</p>
        <h2 className="font-heading text-3xl text-dark-950 sm:text-4xl" id="related-blogs-title">Related posts</h2>
        <BlogSlider>
          {posts.map((post) => (
            <li className="min-w-0 snap-start" key={post.slug}>
              <BlogPostCard heading="h3" post={post} />
            </li>
          ))}
        </BlogSlider>
      </BlogArticleContainer>
    </section>
  );
}
