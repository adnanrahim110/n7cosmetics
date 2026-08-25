"use client";

import { Plus, Share2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import CustomSelect from "@/components/admin/CustomSelect";
import {
  socialMediaPlatforms,
  type SocialMediaLink,
  type SocialMediaPlatform,
} from "@/lib/social-media";

interface EditableSocialMediaLink extends SocialMediaLink {
  editorId: string;
}

const input = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100";

function initialLinks(links: SocialMediaLink[]): EditableSocialMediaLink[] {
  return links.map((link, index) => ({ ...link, editorId: `saved-${index}` }));
}

export default function SocialMediaLinksEditor({ defaultLinks }: { defaultLinks: SocialMediaLink[] }) {
  const [links, setLinks] = useState<EditableSocialMediaLink[]>(() => initialLinks(defaultLinks));
  const nextId = useRef(0);

  function updatePlatform(editorId: string, values: string[]) {
    const platform = values[0] as SocialMediaPlatform | undefined;
    if (!platform) return;
    setLinks((current) => current.map((link) => link.editorId === editorId ? { ...link, platform } : link));
  }

  function addLink() {
    setLinks((current) => {
      if (current.length >= 20) return current;
      const unusedPlatform = socialMediaPlatforms.find((option) => !current.some((link) => link.platform === option.value));
      return [...current, {
        editorId: `new-${nextId.current++}`,
        platform: unusedPlatform?.value ?? "instagram",
        url: "",
      }];
    });
  }

  const serializedLinks = links.map(({ platform, url }) => ({ platform, url: url.trim() }));

  return (
    <div>
      <input name="socialLinksJson" type="hidden" value={JSON.stringify(serializedLinks)} />
      {links.length ? (
        <div className="space-y-3">
          {links.map((link, index) => (
            <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 sm:grid-cols-[minmax(11rem,0.7fr)_minmax(16rem,1.3fr)_auto] sm:items-end" key={link.editorId}>
              <CustomSelect
                defaultValue={link.platform}
                label="Platform"
                name={`socialPlatform-${link.editorId}`}
                onChange={(values) => updatePlatform(link.editorId, values)}
                options={socialMediaPlatforms.map((option) => ({ ...option }))}
                required
                searchable={false}
              />
              <label className="text-[13px] font-medium leading-5 text-zinc-700">
                Profile URL
                <input
                  aria-label={`${socialMediaPlatforms.find((option) => option.value === link.platform)?.label ?? "Social media"} profile URL`}
                  className={input}
                  maxLength={1000}
                  onChange={(event) => setLinks((current) => current.map((item) => item.editorId === link.editorId ? { ...item, url: event.target.value } : item))}
                  placeholder="https://..."
                  required
                  type="url"
                  value={link.url}
                />
              </label>
              <button
                aria-label={`Remove social media link ${index + 1}`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-100 sm:size-10 sm:px-0"
                onClick={() => setLinks((current) => current.filter((item) => item.editorId !== link.editorId))}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
                <span className="sm:sr-only">Remove</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 px-5 text-center">
          <div>
            <Share2 aria-hidden="true" className="mx-auto text-zinc-400" size={22} />
            <p className="mt-2 text-sm font-medium text-zinc-700">No social profiles added</p>
            <p className="mt-1 text-xs text-zinc-500">The storefront will hide social icons until a profile is added.</p>
          </div>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-zinc-500">{links.length}/20 profiles</p>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={links.length >= 20}
          onClick={addLink}
          type="button"
        >
          <Plus aria-hidden="true" size={16} /> Add social profile
        </button>
      </div>
    </div>
  );
}
