// Content hashes make these optimised copies safe to cache across deployments.
export const storefrontAssets = {
  heroBackground: "/imgs/hero-bg.e65f6e07432f.webp",
  heroCloud: "/imgs/hero-cloud.24a0d9be1c91.webp",
  brandFilm: "/videos/brand-film.9c7c5d3f7d50.mp4",
  brandFilmMobile: "/videos/brand-film-mobile.ccbdd9db6b31.mp4",
  brandFilmMobileLandscape: "/videos/brand-film-mobile-landscape.e6ed0c832b3b.mp4",
  brandFilmPoster: "/imgs/brand-film-poster.d842aa9a1f1f.webp",
  detailFilm: "/videos/detail-film.4b63038e567d.mp4",
  founderFilmPoster: "/imgs/founder-film-poster.a0ad05835bf3.webp",
} as const;

export type BrandFilmViewport = "desktop" | "mobile-portrait" | "mobile-landscape";

// Include landscape phones whose width grows beyond the portrait breakpoint.
export const brandFilmMobileMediaQuery = "(max-width: 767px), (max-width: 1023px) and (max-height: 767px) and (pointer: coarse)";
export const brandFilmPortraitMediaQuery = "(orientation: portrait)";

export function optimisedVideoSource(source: string): string {
  if (source === "/videos/v2.mp4") return storefrontAssets.brandFilm;
  if (source === "/videos/v1.mp4") return storefrontAssets.detailFilm;
  return source;
}

export function brandFilmVideoSource(source: string, viewport: BrandFilmViewport): string {
  const desktopSource = optimisedVideoSource(source);
  // Variants belong to this film; custom admin uploads keep their own source.
  if (desktopSource !== storefrontAssets.brandFilm) return desktopSource;
  if (viewport === "mobile-portrait") return storefrontAssets.brandFilmMobile;
  if (viewport === "mobile-landscape") return storefrontAssets.brandFilmMobileLandscape;
  return desktopSource;
}

export function videoPoster(source: string): string | undefined {
  if (source === "/videos/v2.mp4" || source === storefrontAssets.brandFilm || source === storefrontAssets.brandFilmMobile || source === storefrontAssets.brandFilmMobileLandscape) return storefrontAssets.brandFilmPoster;
  if (source === "/videos/v3.mp4") return storefrontAssets.founderFilmPoster;
  return undefined;
}
