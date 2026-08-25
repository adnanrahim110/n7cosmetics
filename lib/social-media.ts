export const socialMediaPlatforms = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X (Twitter)" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "pinterest", label: "Pinterest" },
  { value: "snapchat", label: "Snapchat" },
  { value: "threads", label: "Threads" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "discord", label: "Discord" },
  { value: "website", label: "Website" },
] as const;

export const socialMediaPlatformValues = socialMediaPlatforms.map((platform) => platform.value);

export type SocialMediaPlatform = (typeof socialMediaPlatforms)[number]["value"];

export interface SocialMediaLink {
  platform: SocialMediaPlatform;
  url: string;
}

const allowedPlatforms = new Set<string>(socialMediaPlatformValues);

function parsedValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function normalizedHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 1000) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

export function normalizeSocialMediaLinks(value: unknown): SocialMediaLink[] {
  const candidate = parsedValue(value);
  if (!Array.isArray(candidate)) return [];

  const links: SocialMediaLink[] = [];
  const seen = new Set<string>();
  for (const item of candidate) {
    if (!item || typeof item !== "object") continue;
    const platform = "platform" in item ? item.platform : null;
    const url = normalizedHttpUrl("url" in item ? item.url : null);
    if (typeof platform !== "string" || !allowedPlatforms.has(platform) || !url) continue;

    const key = `${platform}\u0000${url.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ platform: platform as SocialMediaPlatform, url });
    if (links.length === 20) break;
  }
  return links;
}

export function socialMediaPlatformLabel(platform: SocialMediaPlatform): string {
  return socialMediaPlatforms.find((option) => option.value === platform)?.label ?? platform;
}
