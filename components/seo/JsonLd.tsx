import { structuredDataJson } from "@/lib/commerce/seo";

export default function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataJson(data) }} />;
}
