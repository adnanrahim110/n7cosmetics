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
  copyright: globalContent.footer.copyright,
  legalLinks: [
    { label: "Contact Us", href: "/contact" },
    { label: "Shipping & Returns", href: "/shipping-returns" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

export const defaultHomepageConfiguration: HomepageConfiguration = {
  intro: {
    title: "Yusuf Bhai fragrances, delivered in the UK.",
    description: "Discover original compositions and inspired creations by Dubai’s Perfume Doctor, available from N7 Cosmetics — authorised UK distributor.",
  },
  hero: {
    ctaLabel: homeContent.hero.cta,
    backgroundImage: "/imgs/hero-bg.png",
    cloudImage: "/imgs/hero-cloud.png",
    productIds: [],
    products: [],
  },
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
    titleLead: "Art",
    titleAccent: "work",
    description: "A meticulously crafted masterpiece inspired by the world's most iconic aromas, elevated with our signature touch.",
    ctaLabel: "Discover Details",
    priceLabel: "From",
    selectorTitle: "Choose a fragrance",
    selectorDescription: "Swipe the index or use the arrow controls.",
    productIds: [],
  },
  weekly: {
    productId: "",
    eyebrow: homeContent.weeklyPick.eyebrow,
    titleLead: "Fragrance",
    titleAccent: "of the week",
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
    detailLabel: "A detail in motion",
    duration: homeContent.scentStory.duration,
  },
  audience: {
    eyebrow: "Find your expression",
    title: "Curated for you",
    titleAccent: "for you",
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
  faqs: {
    eyebrow: "A little guidance",
    titleLead: "Considered",
    titleAccent: "answers",
    description: "From finding your signature scent to caring for your collection, a few helpful details before you choose.",
    items: [
      {
        question: "How do I choose a fragrance that suits me?",
        answer: "Start with the notes you enjoy, whether fresh, floral, woody or warm. Explore the fragrance notes and descriptions on each product page, or contact our team for help narrowing down your choice.",
      },
      {
        question: "What is the difference between originals and recreations?",
        answer: "Originals are distinct compositions in the Yusuf Bhai collection. Recreations are independent interpretations of familiar scent profiles. Each product page includes details to help you explore the fragrance.",
      },
      {
        question: "Where can I find delivery information?",
        answer: "Visit our Shipping & Returns page for delivery information. The available delivery methods, charges and estimated times for your address are confirmed at checkout.",
      },
      {
        question: "How should I store my fragrance?",
        answer: "Keep your fragrance in a cool, dry place, away from direct sunlight and heat. Close the cap after use and avoid storing the bottle somewhere with frequent temperature changes.",
      },
      {
        question: "How can I get help with my order?",
        answer: "Visit our Contact page and select the topic that best matches your enquiry. Include your order number when asking about an existing order so our team can help you.",
      },
    ],
  },
  features: {
    items: [
      { title: "Reliable Delivery", subtitle: "Options confirmed at checkout" },
      { title: "Secure Payments", subtitle: "Encrypted transactions" },
      { title: "24/7 Concierge", subtitle: "Always here for your needs" },
    ],
  },
};
