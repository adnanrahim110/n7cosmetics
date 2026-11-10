import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogArticleContent from "@/components/blogs/BlogArticleContent";
import BlogArticleHeader from "@/components/blogs/BlogArticleHeader";
import RelatedBlogPosts from "@/components/blogs/RelatedBlogPosts";
import { getPublishedBlogPost, listRelatedBlogPosts } from "@/lib/blogs/storefront";
import { pageMetadata } from "@/lib/metadata";

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const post = await getPublishedBlogPost((await params).slug);
  if (!post) notFound();

  const metadata = pageMetadata({
    title: `${post.title} | N7 Cosmetics`,
    description: post.excerpt,
    path: `/blogs/${post.slug}`,
    image: post.cover_image_url ? { url: post.cover_image_url, alt: post.cover_image_alt } : undefined,
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: post.first_published_at.toISOString(),
      modifiedTime: post.updated_at.toISOString(),
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const post = await getPublishedBlogPost((await params).slug);
  if (!post) notFound();
  const relatedPosts = await listRelatedBlogPosts(post.slug);

  return (
    <>
      <article>
        <BlogArticleHeader
          coverAlt={post.cover_image_alt}
          coverUrl={post.cover_image_url}
          excerpt={post.excerpt}
          publishedAt={post.first_published_at}
          title={post.title}
        />
        <BlogArticleContent hasRelatedPosts={relatedPosts.length > 0} html={post.body_html} />
      </article>
      <RelatedBlogPosts posts={relatedPosts} />
    </>
  );
}
