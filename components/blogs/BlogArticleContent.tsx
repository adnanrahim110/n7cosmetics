import { addBlogArticleNavigation } from "@/lib/blogs/article-navigation";
import BlogArticleBody from "./BlogArticleBody";
import BlogArticleContainer from "./BlogArticleContainer";
import BlogArticleCta from "./BlogArticleCta";
import BlogArticleSidebar from "./BlogArticleSidebar";

export default function BlogArticleContent({ html, hasRelatedPosts }: { html: string; hasRelatedPosts: boolean }) {
  const { body, headings } = addBlogArticleNavigation(html);

  return (
    <div className="bg-primary-100 py-12 sm:py-16 lg:py-20">
      <BlogArticleContainer>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8 xl:gap-12">
          <BlogArticleBody html={body} />
          <BlogArticleSidebar hasRelatedPosts={hasRelatedPosts} headings={headings} />
        </div>
        <BlogArticleCta />
      </BlogArticleContainer>
    </div>
  );
}
