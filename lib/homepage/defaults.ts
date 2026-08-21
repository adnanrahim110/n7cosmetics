import { globalContent } from "@/content/global";
import { homeContent } from "@/content/home";
import type { FooterContent, HeaderContent, HomepageConfiguration } from "./types";

export const defaultHeaderContent: HeaderContent = {
  topbarText: globalContent.header.topbarText,
  topbarRightText: globalContent.header.topbarRightText,
  navigation: globalContent.header.navigation,
};

export const defaultFooterContent: FooterContent = {
  description: globalContent.footer.description,
  newsletterTitle: "Join the Inner Circle",
  newsletterDescription: "Subscribe to receive exclusive access to new releases, private events, and masterclasses.",
  newsletterPlaceholder: "EMAIL ADDRESS",
  newsletterButtonLabel: "Submit",
  twitterUrl: "#",
  copyright: globalContent.footer.copyright,
  legalLinks: [
    { label: "Contact Us", href: "/contact" },
    { label: "Shipping & Returns", href: "/shipping-returns" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

export const defaultHomepageConfiguration: HomepageConfiguration = {
  hero: { productIds: [] },
  signature: {
    eyebrow: "The Masterpiece Collection",
    titleLead: "Signature",
    titleAccent: "Fragrances",
    description: "Discover our most coveted, timeless creations. Handcrafted with the rarest ingredients for an unforgettable aura.",
    ctaLabel: "Explore Collection",
    ctaUrl: "/yusuf-bhai-originals",
    productIds: [],
  },
  brandFilm: {
    eyebrow: homeContent.brandFilm.eyebrow,
    titleLead: homeContent.brandFilm.title.lead,
    titleAccent: homeContent.brandFilm.title.accent,
    description: homeContent.brandFilm.description,
    video: homeContent.brandFilm.video,
    location: homeContent.brandFilm.location,
    duration: homeContent.brandFilm.duration,
  },
  recreations: {
    label: "Masterpiece Collection",
    description: "A meticulously crafted masterpiece inspired by the world's most iconic aromas, elevated with our signature touch.",
    ctaLabel: "Discover Details",
    productIds: [],
  },
  weekly: {
    productId: "",
    eyebrow: homeContent.weeklyPick.eyebrow,
    description: homeContent.weeklyPick.description,
    ctaLabel: homeContent.weeklyPick.cta,
    ctaUrl: "/yusuf-bhai-originals",
  },
  scentStory: {
    eyebrow: homeContent.scentStory.eyebrow,
    titleLead: homeContent.scentStory.title.lead,
    titleAccent: homeContent.scentStory.title.accent,
    description: homeContent.scentStory.description,
    quote: homeContent.scentStory.quote,
    mainVideo: homeContent.scentStory.mainVideo,
    detailVideo: homeContent.scentStory.detailVideo,
    filmLabel: homeContent.scentStory.filmLabel,
    duration: homeContent.scentStory.duration,
  },
  audience: {
    title: "Curated for you",
    description: "Distinctive compositions shaped around presence, personality and the art of leaving an impression.",
    cards: homeContent.audienceCollections.map((card) => ({ ...card, ctaLabel: card.cta, ctaUrl: "/yusuf-bhai-originals" })),
  },
  reviews: {
    eyebrow: homeContent.reviewsSection.eyebrow,
    titleLead: homeContent.reviewsSection.title.lead,
    titleAccent: homeContent.reviewsSection.title.accent,
    description: homeContent.reviewsSection.description,
    reviews: homeContent.reviews,
  },
};
