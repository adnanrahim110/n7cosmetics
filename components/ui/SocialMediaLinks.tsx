import type { IconType } from "react-icons";
import {
  FaDiscord,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaSnapchatGhost,
  FaTelegramPlane,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { FaThreads, FaXTwitter } from "react-icons/fa6";
import {
  socialMediaPlatformLabel,
  type SocialMediaLink,
  type SocialMediaPlatform,
} from "@/lib/social-media";

const icons: Record<SocialMediaPlatform, IconType> = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  x: FaXTwitter,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  linkedin: FaLinkedinIn,
  pinterest: FaPinterestP,
  snapchat: FaSnapchatGhost,
  threads: FaThreads,
  whatsapp: FaWhatsapp,
  telegram: FaTelegramPlane,
  discord: FaDiscord,
  website: FaGlobe,
};

export default function SocialMediaLinks({
  links,
  className = "flex gap-3",
  linkClassName = "",
  iconSize = 18,
}: {
  links: SocialMediaLink[];
  className?: string;
  linkClassName?: string;
  iconSize?: number;
}) {
  if (!links.length) return null;
  return (
    <div className={className}>
      {links.map((link, index) => {
        const Icon = icons[link.platform];
        const label = socialMediaPlatformLabel(link.platform);
        return (
          <a
            aria-label={`N7 Cosmetics on ${label}`}
            className={linkClassName}
            href={link.url}
            key={`${link.platform}-${link.url}-${index}`}
            rel="noreferrer"
            target="_blank"
          >
            <Icon aria-hidden="true" size={iconSize} />
          </a>
        );
      })}
    </div>
  );
}
