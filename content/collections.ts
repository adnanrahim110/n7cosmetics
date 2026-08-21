export type CollectionSlug = "yusuf-bhai-originals" | "recreations" | "bundles";

export interface CollectionProduct {
  name: string;
  category: string;
  price: number;
  rating?: number;
  image: string;
}

export interface CollectionPageContent {
  slug: CollectionSlug;
  eyebrow: string;
  title: { lead: string; accent: string };
  intro: string;
  statement: string;
  highlights: string[];
  disclaimer?: string;
  products: CollectionProduct[];
}

const namedBottleImages: Record<string, number> = {
  "2025-02-01-2-removebg-preview-1.png": 14,
  "2025-02-Noble-1.png": 3,
  "2025-02-Noble-2.png": 2,
  "2025-03-Frame-22.webp": 4,
  "2025-09-Frame-35.webp": 1,
};

const unlabelledBottleImages = [5, 6, 7, 8, 9, 10, 11, 12, 13];

const catalogImage = (file: string): string => {
  const exactBottle = namedBottleImages[file];

  if (exactBottle) return `/imgs/products/${exactBottle}.png`;

  const imageIndex = [...file].reduce((total, character) => total + character.charCodeAt(0), 0);
  return `/imgs/products/${unlabelledBottleImages[imageIndex % unlabelledBottleImages.length]}.png`;
};

export const collectionPages: Record<
  "originals" | "recreations" | "bundles",
  CollectionPageContent
> = {
  originals: {
    slug: "yusuf-bhai-originals",
    eyebrow: "In-house blends / Dubai",
    title: { lead: "Yusuf Bhai", accent: "Originals" },
    intro: "Distinctive compositions created to move with every mood, moment and personality. From luminous citrus to deep woods and enveloping oud, each fragrance is an original expression of character.",
    statement: "Created without comparison. Remembered without introduction.",
    highlights: ["21 original scents", "Four signature families", "Crafted in Dubai"],
    products: [
      { name: "Anemoia", category: "Deja Vu", price: 45, rating: 4.57, image: catalogImage("2025-02-Deja-Vu.png") },
      { name: "Ardor", category: "Noble", price: 40, rating: 4.55, image: catalogImage("2025-02-Noble-1.png") },
      { name: "Arousal", category: "Deja Vu", price: 45, image: catalogImage("2025-03-Frame-28.webp") },
      { name: "Bloody Oud", category: "Teeb", price: 33, rating: 4.5, image: catalogImage("2025-02-Teeb1.png") },
      { name: "City Walk", category: "Teeb", price: 33, rating: 4.5, image: catalogImage("2025-02-Teeb.png") },
      { name: "Dark Moon", category: "Teeb", price: 33, rating: 4.4, image: catalogImage("2025-02-Teeb4.png") },
      { name: "Devoir Elixer", category: "Noble", price: 40, rating: 4.5, image: catalogImage("2025-09-Frame-35.webp") },
      { name: "Domestic Noir", category: "Teeb", price: 33, rating: 4.4, image: catalogImage("2025-02-Teeb6.png") },
      { name: "Forbidden Love", category: "Teeb", price: 33, rating: 4.2, image: catalogImage("2025-02-Teeb2.png") },
      { name: "French Oud", category: "Teeb", price: 33, rating: 4.27, image: catalogImage("2025-02-01-2-removebg-preview-1.png") },
      { name: "Indian Funk", category: "Teeb", price: 33, rating: 4, image: catalogImage("2025-02-Teeb-5.png") },
      { name: "Memoir", category: "Deja Vu", price: 45, rating: 5, image: catalogImage("2025-03-Frame-31.webp") },
      { name: "Myth", category: "Deja Vu", price: 45, image: catalogImage("2025-03-Frame-30.webp") },
      { name: "Nostalgia", category: "Deja Vu", price: 45, rating: 4.5, image: catalogImage("2025-02-Frame-26.webp") },
      { name: "Passio", category: "Noble", price: 40, rating: 4.57, image: catalogImage("2025-02-Noble-2.png") },
      { name: "Pragma", category: "Noble", price: 40, rating: 5, image: catalogImage("2025-03-Frame-22.webp") },
      { name: "Rendevous", category: "Deja Vu", price: 45, rating: 4.31, image: catalogImage("2025-02-Deja-Vu-1.png") },
      { name: "Surreal", category: "Deja Vu", price: 45, image: catalogImage("2025-02-Frame-27.webp") },
      { name: "Tar", category: "Male", price: 44, rating: 5, image: catalogImage("2026-06-01.webp") },
      { name: "XS Night Extreme", category: "Teeb", price: 33, rating: 4.23, image: catalogImage("2025-02-Teeb7.png") },
      { name: "Legendery", category: "Teeb", price: 33, rating: 4.33, image: catalogImage("2025-02-07-2.png") },
    ],
  },
  recreations: {
    slug: "recreations",
    eyebrow: "Familiar notes / New expression",
    title: { lead: "The Art of", accent: "Recreation" },
    intro: "An expansive fragrance library inspired by celebrated scent profiles. Each composition revisits a familiar mood through the craftsmanship and character of the Yusuf Bhai atelier.",
    statement: "Recognisable in spirit. Individual in expression.",
    highlights: ["60 interpretations", "For him, her and everyone", "Made for everyday ritual"],
    disclaimer: "Our perfumes and oils are independent artisanal interpretations inspired by well-known scent profiles. N7 Cosmetics is not affiliated with the referenced designers or manufacturers; their trademarks remain the property of their respective owners.",
    products: [
      { name: "1872 Vetiver", category: "Clive Christian", price: 45, rating: 5, image: catalogImage("2026-06-Group-106170.webp") },
      { name: "Absolu Aventus", category: "Creed", price: 40, rating: 5, image: catalogImage("2025-02-Group-105876-4.png") },
      { name: "Afternoon Swim", category: "Louis Vuittion", price: 40, image: catalogImage("2025-02-Group-105892.png") },
      { name: "Allure Home Sport", category: "Chanel", price: 34, rating: 4.6, image: catalogImage("2025-02-Group-105891.png") },
      { name: "Ambre Nuit", category: "Christian", price: 38, image: catalogImage("2026-06-Group-106163-1.webp") },
      { name: "Angels’ Share", category: "Kilian", price: 40, image: catalogImage("2026-08-Group-106175.png") },
      { name: "Attrape Rêves", category: "Female", price: 40, image: catalogImage("2025-02-Group-105892.png") },
      { name: "Aventus", category: "Creed", price: 37, rating: 4.69, image: catalogImage("2025-02-Group-105887.png") },
      { name: "Baccarat Rouge Extrait 540", category: "Female", price: 38, rating: 4.48, image: catalogImage("2025-02-Group-105909.png") },
      { name: "Black Opium", category: "Female", price: 34, rating: 4.61, image: catalogImage("2025-02-Group-105905.png") },
      { name: "Black Orchid", category: "Female", price: 36, image: catalogImage("2025-02-Group-105920.png") },
      { name: "Blue De Chanel", category: "Chanel", price: 34, rating: 4.7, image: catalogImage("2025-02-Group-105891.png") },
      { name: "Bvlgari Le Gemme", category: "Bvlgari", price: 38, rating: 4.61, image: catalogImage("2025-02-Group-105904-1.png") },
      { name: "Carmina", category: "Creed", price: 38, rating: 4.61, image: catalogImage("2025-02-Group-105876-4.png") },
      { name: "Costa Azzura", category: "Male", price: 36, rating: 4.64, image: catalogImage("2025-02-Group-105920.png") },
      { name: "Delina De Marly", category: "Female", price: 38, rating: 4.73, image: catalogImage("2025-02-Group-105913.png") },
      { name: "Dior Sauvage Elixir", category: "Male", price: 37, rating: 5, image: catalogImage("2025-09-Group-106163-1.webp") },
      { name: "Ebene Fume", category: "Male", price: 36, rating: 4.65, image: catalogImage("2025-02-Group-105920.png") },
      { name: "Equivoque", category: "Male", price: 40, rating: 4.89, image: catalogImage("2025-02-Group-106040.webp") },
      { name: "Falcon Leather", category: "Recreations", price: 40, image: catalogImage("2025-03-Group-106089.webp") },
      { name: "Flower Bomb", category: "Female", price: 34, rating: 4.61, image: catalogImage("2025-02-Group-105919.png") },
      { name: "Goddess Burberry", category: "Burberry", price: 34, rating: 4.43, image: catalogImage("2025-02-Group-105886.png") },
      { name: "Good Girl", category: "Carolina Herrera", price: 34, rating: 4.56, image: catalogImage("2025-02-Group-105903-1.png") },
      { name: "Homme", category: "Chanel", price: 34, rating: 4.45, image: catalogImage("2025-02-Group-105972.webp") },
      { name: "Homme Intense", category: "Dior", price: 34, rating: 4.65, image: catalogImage("2025-02-Group-105888.png") },
      { name: "Idole", category: "Female", price: 34, rating: 4.58, image: catalogImage("2025-02-Group-105914.png") },
      { name: "Imagination", category: "Louis Vuittion", price: 40, rating: 4.6, image: catalogImage("2025-02-Group-105892.png") },
      { name: "Interlude Man", category: "Amouage", price: 40, image: catalogImage("2026-06-Group-106172.webp") },
      { name: "Irish Green", category: "Creed", price: 36, rating: 4.55, image: catalogImage("2025-02-Group-105887.png") },
      { name: "Jadore", category: "Dior", price: 34, rating: 4.64, image: catalogImage("2025-02-Group-105888.png") },
      { name: "L’immensite", category: "Louis Vuittion", price: 40, rating: 5, image: catalogImage("2025-02-Group-105879.webp") },
      { name: "La Nuit De L’Homme", category: "Male", price: 35, rating: 5, image: catalogImage("2025-02-Group-106151-1.webp") },
      { name: "La Vie Est Belle", category: "Female", price: 34, rating: 4.56, image: catalogImage("2025-02-Group-105914.png") },
      { name: "Les Sables Roses", category: "Female", price: 38, rating: 4.58, image: catalogImage("2025-02-Group-105892.png") },
      { name: "Miss Dior", category: "Dior", price: 34, rating: 4.68, image: catalogImage("2025-02-Group-105888.png") },
      { name: "Moonlight Pathcholi", category: "Female", price: 38, rating: 4.72, image: catalogImage("2025-02-Group-105903.png") },
      { name: "Myrhh And Tonka", category: "Female", price: 38, rating: 4.72, image: catalogImage("2025-02-Group-105902.png") },
      { name: "N°5", category: "Male", price: 34, rating: 5, image: catalogImage("2025-05-Group-106159.webp") },
      { name: "Noir Extreme", category: "Male", price: 36, rating: 4.73, image: catalogImage("2025-02-Group-105920.png") },
      { name: "Ombre Leather", category: "Male", price: 35, rating: 4.71, image: catalogImage("2025-02-Group-105920.png") },
      { name: "Ombre Nomade", category: "Louis Vuittion", price: 40, rating: 4.75, image: catalogImage("2025-02-Group-105892.png") },
      { name: "One Million", category: "Male", price: 34, rating: 4.65, image: catalogImage("2025-02-Group-105890.png") },
      { name: "Oud for Greatness", category: "Unisex", price: 40, image: catalogImage("2026-08-ChatGPT-Image-Aug-18-2026-12_05_37-AM-1080x1080.webp") },
      { name: "Oud Intense", category: "Gucci", price: 34, rating: 4.67, image: catalogImage("2025-02-Group-105916.png") },
      { name: "Oud Stallion", category: "Male", price: 45, rating: 4.94, image: catalogImage("2025-02-Group-106083.webp") },
      { name: "Oud Zarian", category: "Creed", price: 40, image: catalogImage("2025-05-Group-105887.webp") },
      { name: "Pacific Chill", category: "Louis Vuittion", price: 40, image: catalogImage("2025-02-Group-105892.png") },
      { name: "Promise", category: "Frederic Malle", price: 36, rating: 4.5, image: catalogImage("2025-02-Group-105918.png") },
      { name: "Red Tobacco", category: "Male", price: 38, rating: 5, image: catalogImage("2025-02-Group-106085.webp") },
      { name: "Reflection Man", category: "Amouage", price: 40, rating: 5, image: catalogImage("2026-06-Group-106172.webp") },
      { name: "Royal Oud", category: "Male", price: 42, rating: 5, image: catalogImage("2025-05-Group-105887.webp") },
      { name: "Santal 33", category: "Le Labo", price: 40, image: catalogImage("2026-08-Group-106174.png") },
      { name: "Sauvage", category: "Male", price: 34, rating: 4.62, image: catalogImage("2025-02-Group-105888.png") },
      { name: "Srk Special", category: "Male", price: 40, rating: 4.74, image: catalogImage("2025-02-Group-105927.webp") },
      { name: "Stellar Times", category: "Female", price: 40, rating: 4.74, image: catalogImage("2025-02-Group-105892.png") },
      { name: "Terre De Hermes", category: "Hermes", price: 34, rating: 4.56, image: catalogImage("2025-02-Group-105889.png") },
      { name: "Tobacco Vanille", category: "Male", price: 36, rating: 4.53, image: catalogImage("2025-02-Group-105920.png") },
      { name: "Velvet Desert Oud", category: "Male", price: 38, rating: 4.9, image: catalogImage("2025-02-Group-106005.webp") },
      { name: "X Masculine", category: "Recreations", price: 45, rating: 5, image: catalogImage("2025-02-Group-105996.webp") },
      { name: "YSL Libre", category: "Female", price: 34, rating: 4.71, image: catalogImage("2025-02-Group-105905.png") },
    ],
  },
  bundles: {
    slug: "bundles",
    eyebrow: "Curated trios / Better together",
    title: { lead: "The Scent", accent: "Wardrobe" },
    intro: "Three considered fragrances, brought together for every side of your day. Each set moves from effortless freshness to evening depth while offering exceptional value.",
    statement: "One set. Three moods. Every occasion considered.",
    highlights: ["Six curated trios", "Three 100ml fragrances", "Ready to gift"],
    products: [
      { name: "Allure Home Sport, Sauvage, Legendary", category: "Bundles", price: 85.99, image: catalogImage("2025-02-Group-105950.webp") },
      { name: "City Walk, XS Night Extreme, Indian Funk", category: "Bundles", price: 80, image: catalogImage("2025-02-Group-105951.webp") },
      { name: "Dark Moon, Indian Funk, Domestic Noir", category: "Bundles", price: 80, image: catalogImage("2025-02-Group-105952-1.webp") },
      { name: "Goddess Burberry, Good Girl, Forbidden Love", category: "Bundles", price: 85.99, image: catalogImage("2025-02-Group-105953.webp") },
      { name: "Jadore, YSL Libre, French Oud", category: "Bundles", price: 85.99, image: catalogImage("2025-02-Group-105954.webp") },
      { name: "Noir Extreme, Forbidden Love, French Oud", category: "Bundles", price: 85.99, image: catalogImage("2025-02-Group-105949.webp") },
    ],
  },
};
