// Content hashes make these optimised copies safe to cache across deployments.
export const storefrontAssets = {
  heroBackground: "/imgs/hero-bg.e65f6e07432f.webp",
  heroCloud: "/imgs/hero-cloud.24a0d9be1c91.webp",
  brandFilm: "/videos/brand-film.9c7c5d3f7d50.mp4",
  brandFilmPoster: "/imgs/brand-film-poster.d842aa9a1f1f.webp",
  detailFilm: "/videos/detail-film.4b63038e567d.mp4",
  founderFilmPoster: "/imgs/founder-film-poster.a0ad05835bf3.webp",
} as const;

export function optimisedVideoSource(source: string): string {
  if (source === "/videos/v2.mp4") return storefrontAssets.brandFilm;
  if (source === "/videos/v1.mp4") return storefrontAssets.detailFilm;
  return source;
}

export function videoPoster(source: string): string | undefined {
  if (source === "/videos/v2.mp4" || source === storefrontAssets.brandFilm) return storefrontAssets.brandFilmPoster;
  if (source === "/videos/v3.mp4") return storefrontAssets.founderFilmPoster;
  return undefined;
}
