import type { ReactNode } from "react";

export default function BlogArticleContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">{children}</div>;
}
