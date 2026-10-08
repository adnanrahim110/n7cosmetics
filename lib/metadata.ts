import type { Metadata } from "next";
import { storefrontUrl } from "./commerce/seo";

interface SocialImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  image?: SocialImage;
  robots?: Metadata["robots"];
  referrer?: Metadata["referrer"];
}

const defaultSocialImage: SocialImage = {
  url: "/imgs/about/n7-arabella-our-story.webp",
  alt: "N7 Cosmetics Arabella fragrance bottle beside its presentation box",
  width: 1448,
  height: 1086,
};

export function pageMetadata({
  title,
  description,
  path,
  image = defaultSocialImage,
  robots,
  referrer,
}: PageMetadataInput): Metadata {
  const url = storefrontUrl(path);
  const socialImage = { ...image, url: storefrontUrl(image.url) };

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(robots ? { robots } : {}),
    ...(referrer ? { referrer } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: "N7 Cosmetics",
      locale: "en_GB",
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}
