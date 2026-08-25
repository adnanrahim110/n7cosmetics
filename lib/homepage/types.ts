import type { NavigationItem } from "@/content/global";

export interface HomepageProduct {
  id: string;
  slug: string;
  name: string;
  type: string;
  price: string;
  pricePence: number;
  image: string;
  description: string;
  tagline: string;
  notes: string[];
  size: string;
}

export interface HeroProductPresentation {
  productId: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
}

export interface HeroContent {
  productIds: string[];
  products: HeroProductPresentation[];
}

export interface HeaderContent {
  topbarText: string;
  topbarRightText: string;
  navigation: NavigationItem[];
}

export interface FooterLink { label: string; href: string }
export interface FooterContent {
  description: string;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterPlaceholder: string;
  newsletterButtonLabel: string;
  copyright: string;
  legalLinks: FooterLink[];
}

export interface SignatureContent {
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  productIds: string[];
}

export interface BrandFilmContent {
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  description: string;
  video: string;
  location: string;
  duration: string;
}

export interface RecreationsContent {
  label: string;
  description: string;
  ctaLabel: string;
  productIds: string[];
}

export interface WeeklyContent {
  productId: string;
  eyebrow: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface ScentStoryContent {
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  description: string;
  quote: string;
  mainVideo: string;
  detailVideo: string;
  filmLabel: string;
  duration: string;
}

export interface AudienceCardContent {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  background: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface AudienceContent {
  title: string;
  description: string;
  cards: AudienceCardContent[];
}

export interface ReviewContent { text: string; author: string }
export interface ReviewsContent {
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  description: string;
  reviews: ReviewContent[];
}

export interface HomepageConfiguration {
  hero: HeroContent;
  signature: SignatureContent;
  brandFilm: BrandFilmContent;
  recreations: RecreationsContent;
  weekly: WeeklyContent;
  scentStory: ScentStoryContent;
  audience: AudienceContent;
  reviews: ReviewsContent;
}

export interface HomepageStorefrontContent {
  configuration: HomepageConfiguration;
  heroProducts: HomepageProduct[];
  signatureProducts: HomepageProduct[];
  recreationProducts: HomepageProduct[];
  weeklyProduct: HomepageProduct | null;
}
