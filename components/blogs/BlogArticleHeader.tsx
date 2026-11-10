import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import BlogArticleContainer from "./BlogArticleContainer";
import BlogCover from "./BlogCover";
import BlogPublicationDate from "./BlogPublicationDate";

interface BlogArticleHeaderProps {
  coverAlt: string;
  coverUrl: string | null;
  title: string;
  excerpt: string;
  publishedAt: Date;
}

export default function BlogArticleHeader({ coverAlt, coverUrl, title, excerpt, publishedAt }: BlogArticleHeaderProps) {
  return (
    <header className="bg-dark-950 bg-linear-to-br from-dark-950 via-dark-950 to-primary-950 pt-36 pb-12 sm:pt-44 sm:pb-16">
      <BlogArticleContainer>
        <Link
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-primary-200 underline-offset-4 hover:text-primary-50 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 sm:mb-8"
          href="/blogs"
        >
          <ArrowLeft aria-hidden="true" size={16} /> All blog posts
        </Link>
        <div className={cn("grid items-center gap-8 xl:gap-12", coverUrl && "lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]")}>
          <div className="min-w-0 max-w-2xl space-y-5 sm:space-y-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-primary-400" />
              <span className="text-xs font-semibold tracking-widest text-primary-300 uppercase">N7 Journal</span>
              <BlogPublicationDate className="text-primary-100/80" date={publishedAt} />
            </div>
            <h1 className="font-heading text-4xl leading-tight tracking-tight text-primary-50 wrap-anywhere sm:text-5xl xl:text-6xl">{title}</h1>
            <p className="max-w-xl text-lg leading-relaxed text-primary-100/85 wrap-anywhere">{excerpt}</p>
          </div>
          <BlogCover alt={coverAlt} src={coverUrl} variant="article" />
        </div>
      </BlogArticleContainer>
    </header>
  );
}
