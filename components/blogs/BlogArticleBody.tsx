export default function BlogArticleBody({ html }: { html: string }) {
  return (
    <div className="min-w-0 border border-primary-200 border-t-2 border-t-primary-600 bg-primary-50 px-5 py-8 sm:px-8 sm:py-10 xl:px-12 xl:py-12">
      <div
        className="max-w-prose space-y-6 text-base leading-relaxed text-dark-900 wrap-anywhere sm:text-lg
          [&>p:first-child]:font-heading [&>p:first-child]:text-xl [&>p:first-child]:leading-relaxed [&>p:first-child]:text-dark-950 sm:[&>p:first-child]:text-2xl
          [&>p:first-child]:first-letter:font-semibold [&>p:first-child]:first-letter:text-primary-800
          [&_h2]:mt-10 [&_h2]:border-t [&_h2]:border-primary-300 [&_h2]:pt-5 [&_h2]:text-3xl [&_h2]:leading-tight [&_h2]:text-dark-950 sm:[&_h2]:pt-6 sm:[&_h2]:text-4xl
          [&_h3]:mt-8 [&_h3]:text-2xl [&_h3]:text-primary-900 [&_h4]:mt-6 [&_h4]:text-xl [&_[id]]:scroll-mt-28
          [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:space-y-3 [&_ul]:space-y-3 [&_ol]:pl-6 [&_ul]:pl-6 [&_li::marker]:font-semibold [&_li::marker]:text-primary-800
          [&_strong]:font-semibold [&_strong]:text-dark-950
          [&_blockquote]:space-y-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-500 [&_blockquote]:bg-primary-100
          [&_blockquote]:px-5 [&_blockquote]:py-6 [&_blockquote]:font-heading [&_blockquote]:text-2xl [&_blockquote]:leading-snug [&_blockquote]:text-primary-950 [&_blockquote]:italic
          sm:[&_blockquote]:px-8 sm:[&_blockquote]:py-8 sm:[&_blockquote]:text-3xl
          [&_a]:font-medium [&_a]:text-primary-800 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary-950
          [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-primary-800"
        // Article HTML is sanitized on the server before it is stored.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
