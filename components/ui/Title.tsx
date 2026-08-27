"use client";

import { motion, useReducedMotion } from "motion/react";
import { Fragment, createElement, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type TitleTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type TitleVariant =
  | "display"
  | "section"
  | "subsection"
  | "compact"
  | "small"
  | "custom";
export type TitleTone =
  | "ink"
  | "charcoal"
  | "gold"
  | "ivory"
  | "cream"
  | "cocoa"
  | "sage"
  | "rose"
  | "weekly"
  | "custom";

export interface TitleProps {
  as?: TitleTag;
  className?: string;
  highlight?: string;
  highlightClassName?: string;
  id?: string;
  text: string;
  tone?: TitleTone;
  variant?: TitleVariant;
}

const titleVariants: Record<TitleVariant, string> = {
  display:
    "text-[clamp(2.5rem,11vw,3.35rem)] leading-[0.94] tracking-[-0.035em] sm:text-[clamp(3.25rem,5.5vw,5.75rem)]",
  section:
    "text-[clamp(2.15rem,9vw,2.75rem)] leading-[0.98] tracking-[0.025em] sm:text-[clamp(2.75rem,4.6vw,4.75rem)]",
  subsection:
    "text-[clamp(1.65rem,7vw,2.15rem)] leading-[1.04] tracking-[0.02em] sm:text-[clamp(2rem,3.4vw,3.25rem)]",
  compact: "text-2xl leading-tight tracking-[0.02em] sm:text-3xl",
  small: "text-xl leading-tight tracking-[0.02em] sm:text-2xl",
  custom: "",
};

const titleTones: Record<TitleTone, { title: string; highlight: string }> = {
  ink: { title: "text-[#1c1814]", highlight: "text-[#8d6745]" },
  charcoal: { title: "text-[#1a1a1a]", highlight: "text-[#967C55]" },
  gold: { title: "text-primary-300", highlight: "text-[#967C55]" },
  ivory: { title: "text-[#f7f0e8]", highlight: "text-[#b99a6c]" },
  cream: { title: "text-[#f4eadf]", highlight: "text-[#c99b69]" },
  cocoa: { title: "text-[#211a15]", highlight: "text-[#9b6a35]" },
  sage: { title: "text-[#17201d]", highlight: "text-[#756449]" },
  rose: { title: "text-[#241a17]", highlight: "text-[#815b4c]" },
  weekly: { title: "text-[#1a1713]", highlight: "text-[#a67c49]" },
  custom: { title: "", highlight: "" },
};

const defaultVariants: Record<TitleTag, TitleVariant> = {
  h1: "display",
  h2: "section",
  h3: "subsection",
  h4: "compact",
  h5: "small",
  h6: "small",
};

const headingElements = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
};

const revealEase = [0.22, 1, 0.36, 1] as const;

type InlineTag =
  | "strong"
  | "em"
  | "u"
  | "s"
  | "mark"
  | "small"
  | "sup"
  | "sub"
  | "span"
  | "br";

type RichTextNode =
  | { type: "text"; value: string }
  | { type: "element"; tag: InlineTag; children: RichTextNode[] };

const inlineTagMap: Record<string, InlineTag> = {
  b: "strong",
  br: "br",
  del: "s",
  em: "em",
  i: "em",
  mark: "mark",
  s: "s",
  small: "small",
  span: "span",
  strong: "strong",
  sub: "sub",
  sup: "sup",
  u: "u",
};

const namedEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  copy: "©",
  hellip: "…",
  ldquo: "“",
  lsquo: "‘",
  mdash: "—",
  nbsp: "\u00a0",
  ndash: "–",
  raquo: "»",
  rdquo: "”",
  rsquo: "’",
  laquo: "«",
  lt: "<",
  gt: ">",
  quot: '"',
};

function decodeHtmlEntities(value: string): string {
  const decodeCodePoint = (entity: string, codePoint: number) =>
    Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : entity;

  return value.replace(
    /&(#x[\da-f]+|#\d+|[a-z][a-z\d]+);/gi,
    (entity, reference: string) => {
      if (reference.toLowerCase().startsWith("#x")) {
        const codePoint = Number.parseInt(reference.slice(2), 16);
        return decodeCodePoint(entity, codePoint);
      }

      if (reference.startsWith("#")) {
        const codePoint = Number.parseInt(reference.slice(1), 10);
        return decodeCodePoint(entity, codePoint);
      }

      return namedEntities[reference.toLowerCase()] ?? entity;
    },
  );
}

function parseTitleMarkup(value: string): RichTextNode[] {
  const root: RichTextNode[] = [];
  const stack: Array<{ tag: InlineTag | "root"; children: RichTextNode[] }> = [
    { tag: "root", children: root },
  ];
  const tokenPattern = /<!--[\s\S]*?-->|<\s*\/?\s*[a-z][\w:-]*(?:\s[^<>]*?)?\/?\s*>/gi;
  let cursor = 0;

  const appendText = (text: string) => {
    if (!text) return;
    stack[stack.length - 1].children.push({
      type: "text",
      value: decodeHtmlEntities(text),
    });
  };

  for (const match of value.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? cursor;
    appendText(value.slice(cursor, index));
    cursor = index + token.length;

    if (token.startsWith("<!--")) continue;

    const nameMatch = token.match(/^<\s*\/?\s*([a-z][\w:-]*)/i);
    const sourceTag = nameMatch?.[1]?.toLowerCase();
    const tag = sourceTag ? inlineTagMap[sourceTag] : undefined;
    if (!tag) continue;

    if (/^<\s*\//.test(token)) {
      let openIndex = -1;
      for (let stackIndex = stack.length - 1; stackIndex > 0; stackIndex -= 1) {
        if (stack[stackIndex].tag === tag) {
          openIndex = stackIndex;
          break;
        }
      }
      if (openIndex > 0) stack.splice(openIndex);
      continue;
    }

    const node: RichTextNode = { type: "element", tag, children: [] };
    stack[stack.length - 1].children.push(node);
    if (tag !== "br" && !/\/\s*>$/.test(token)) {
      stack.push(node);
    }
  }

  appendText(value.slice(cursor));
  return root;
}

function titleTextContent(nodes: RichTextNode[]): string {
  return nodes
    .map((node) =>
      node.type === "text"
        ? node.value
        : node.tag === "br"
          ? ""
          : titleTextContent(node.children),
    )
    .join("");
}

interface HighlightRange {
  end: number;
  start: number;
}

function renderTitleNodes(
  nodes: RichTextNode[],
  range: HighlightRange | undefined,
  tone: TitleTone,
  highlightClassName: string | undefined,
  offset: { value: number },
  keyPrefix: string,
): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;

    if (node.type === "element") {
      if (node.tag === "br") return createElement("br", { key });

      return createElement(
        node.tag,
        { key },
        renderTitleNodes(
          node.children,
          range,
          tone,
          highlightClassName,
          offset,
          key,
        ),
      );
    }

    const start = offset.value;
    const end = start + node.value.length;
    offset.value = end;

    if (!range || end <= range.start || start >= range.end) {
      return createElement(Fragment, { key }, node.value);
    }

    const pieces: ReactNode[] = [];
    const highlightStart = Math.max(range.start, start) - start;
    const highlightEnd = Math.min(range.end, end) - start;

    if (highlightStart > 0) pieces.push(node.value.slice(0, highlightStart));
    pieces.push(
      createElement(
        "span",
        {
          className: cn(
            "inline font-light italic tracking-normal",
            titleTones[tone].highlight,
            highlightClassName,
          ),
          key: `${key}-highlight`,
        },
        node.value.slice(highlightStart, highlightEnd),
      ),
    );
    if (highlightEnd < node.value.length) {
      pieces.push(node.value.slice(highlightEnd));
    }

    return createElement(Fragment, { key }, pieces);
  });
}

export default function Title({
  as = "h2",
  className,
  highlight,
  highlightClassName,
  id,
  text,
  tone = "ink",
  variant,
}: TitleProps) {
  const shouldReduceMotion = useReducedMotion();
  const Heading = headingElements[as] as typeof motion.h2;
  const resolvedVariant = variant ?? defaultVariants[as];
  const parsedText = parseTitleMarkup(text);
  const visibleText = titleTextContent(parsedText);
  const normalizedHighlight = highlight
    ? titleTextContent(parseTitleMarkup(highlight)).trim().toLocaleLowerCase()
    : "";
  const highlightIndex = normalizedHighlight
    ? visibleText.toLocaleLowerCase().indexOf(normalizedHighlight)
    : -1;
  const highlightRange =
    highlightIndex >= 0 && normalizedHighlight
      ? {
          start: highlightIndex,
          end: highlightIndex + normalizedHighlight.length,
        }
      : undefined;

  return (
    <Heading
      className={cn(
        "whitespace-normal wrap-normal font-heading",
        titleVariants[resolvedVariant],
        titleTones[tone].title,
        className,
      )}
      id={id}
      initial={false}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.85,
        ease: revealEase,
      }}
      viewport={{ once: true, margin: "-60px" }}
      whileInView={
        shouldReduceMotion
          ? undefined
          : { opacity: [0, 1], y: [24, 0] }
      }
    >
      {renderTitleNodes(
        parsedText,
        highlightRange,
        tone,
        highlightClassName,
        { value: 0 },
        "title",
      )}
    </Heading>
  );
}
