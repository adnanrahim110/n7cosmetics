export interface NavigationSubItem {
  name: string;
  href: string;
  image?: string | null;
}

export type NavigationItem =
  | { label: string; href: string; type?: undefined; items?: undefined }
  | { label: string; href: string; type: "mega"; items: NavigationSubItem[] }
  | { label: string; href: string; type: "dropdown"; items: NavigationSubItem[] };

export type MegaNavigationItem = Extract<NavigationItem, { type: "mega" }>;
export type DropdownNavigationItem = Extract<NavigationItem, { type: "dropdown" }>;

interface GlobalContent {
  header: {
    logo: string;
    name: string;
    topbarText: string;
    topbarRightText: string;
    navigation: NavigationItem[];
  };
  footer: {
    description: string;
    quickLinks: Array<{ label: string; href: string }>;
    copyright: string;
  };
}

export const globalContent: GlobalContent = {
  header: {
    logo: "/imgs/logo-w.png",
    name: "N7 Cosmetics",
    topbarText: "Free shipping on orders over £ 99",
    topbarRightText: "Authorised distributors of Yusuf Bhai perfumes in the UK",
    navigation: [
      {
        label: "Yusuf Bhai Originals",
        href: "/yusuf-bhai-originals",
      },
      { 
        label: "Premium Collection",
        href: "/premium-collection",
        type: "mega",
        items: [
          { name: "Anemoia", href: "/products/anemoia", image: "/imgs/products/8.png" },
          { name: "1872 Vetiver", href: "/products/1872-vetiver", image: "/imgs/products/11.png" },
          { name: "Oud Stallion", href: "/products/oud-stallion", image: "/imgs/products/9.png" },
          { name: "View All", href: "/premium-collection", image: null }
        ]
      },
      { label: "Recreations", href: "/recreations" },
      { label: "Sale", href: "/sale" },
      { label: "Bundles", href: "/bundles" },
      { label: "About Us", href: "/about" },
    ],
  },
  footer: {
    description: "At N7 Cosmetics, we are proud to be the first company in the UK to officially introduce the exquisite fragrances of Yusuf Bhai from the UAE. Yusuf Bhai is renowned for crafting luxurious perfumes that capture the essence of sophistication and elegance.",
    quickLinks: [
      { label: "Shipping", href: "/shipping" },
      { label: "Customer Service", href: "/customer-service" },
      { label: "Secure Payments", href: "/payments" },
    ],
    copyright: "© 2026 N7 Cosmetics. All rights reserved.",
  }
};
