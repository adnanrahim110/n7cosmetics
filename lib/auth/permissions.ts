import type { Administrator } from "./types";

const META_ADS_ADMIN_EMAIL = "shozaba261@gmail.com";

export function canAccessMetaAds(
  administrator: Pick<Administrator, "email">,
): boolean {
  return administrator.email.trim().toLowerCase() === META_ADS_ADMIN_EMAIL;
}
