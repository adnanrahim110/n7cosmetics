import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { MEDIA_TOKEN_PATTERN, MEDIA_URL_PREFIX } from "../media/storage";
import { blogArticleTags } from "./content-format";
import { BLOG_SLUG_MAX_LENGTH, blogSlugPattern } from "./slug";

const blogPostSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(190),
  slug: z.string().trim().max(BLOG_SLUG_MAX_LENGTH).refine(
    (value) => !value || blogSlugPattern.test(value),
    "Use lowercase letters and numbers separated by single hyphens.",
  ).default(""),
  excerpt: z.string().trim().max(300).default(""),
  bodyHtml: z.string().trim().max(200_000).default(""),
  coverImageUrl: z.string().trim().refine(
    (value) => {
      const prefix = `${MEDIA_URL_PREFIX}/`;
      return !value || (value.startsWith(prefix) && MEDIA_TOKEN_PATTERN.test(value.slice(prefix.length)));
    },
    "Upload a cover image.",
  ).default(""),
  coverImageAlt: z.string().trim().max(255).default(""),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
}).transform((post) => ({
  ...post,
  bodyHtml: sanitizeHtml(post.bodyHtml, {
    allowedTags: blogArticleTags,
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    nestingLimit: 20,
  }).trim(),
})).superRefine((post, context) => {
  if (post.status !== "PUBLISHED") return;

  const text = sanitizeHtml(post.bodyHtml, { allowedTags: [], allowedAttributes: {} });
  if (!text.replace(/[\s\p{Default_Ignorable_Code_Point}]/gu, "")) {
    context.addIssue({ code: "custom", path: ["bodyHtml"], message: "Write the article before publishing." });
  }
  if (!post.excerpt) {
    context.addIssue({ code: "custom", path: ["excerpt"], message: "Enter an excerpt before publishing." });
  }
  if (!post.coverImageUrl) {
    context.addIssue({ code: "custom", path: ["coverImageUrl"], message: "Upload a cover image before publishing." });
  }
  if (!post.coverImageAlt) {
    context.addIssue({ code: "custom", path: ["coverImageAlt"], message: "Describe the cover image before publishing." });
  }
});

export class BlogPostValidationError extends Error {
  constructor(readonly fieldErrors: Partial<Record<keyof z.output<typeof blogPostSchema>, string[]>>) {
    super("Review the highlighted blog details and try again.");
    this.name = "BlogPostValidationError";
  }
}

export function validateBlogPost(input: unknown) {
  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) {
    throw new BlogPostValidationError(z.flattenError(parsed.error).fieldErrors);
  }
  return parsed.data;
}
