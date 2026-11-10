import sanitizeHtml from "sanitize-html";

export interface BlogArticleHeading {
  id: string;
  label: string;
  level: 2 | 3;
}

export function addBlogArticleNavigation(html: string) {
  const headings: BlogArticleHeading[] = [];
  // The stored sanitizer output allows headings without attributes.
  const body = html.replace(/<h([23])>(.*?)<\/h\1>/gs, (heading: string, level: string, content: string) => {
    const label = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} })
      .replace(/&(amp|lt|gt);/g, (entity: string) => {
        if (entity === "&amp;") return "&";
        return entity === "&lt;" ? "<" : ">";
      })
      .replace(/\s+/g, " ")
      .trim();
    if (!label) return heading;

    const id = `blog-section-${headings.length + 1}`;
    headings.push({ id, label, level: level === "2" ? 2 : 3 });
    return `<h${level} id="${id}">${content}</h${level}>`;
  });
  return { body, headings };
}
