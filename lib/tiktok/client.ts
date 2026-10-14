"use client";

import { tiktokPageUrl } from "./pixel";

let frame: HTMLIFrameElement | undefined;
let currentPage = "";

export function stopTikTokPage(): void {
  try { frame?.remove(); } catch { /* A detached frame must not block withdrawal. */ }
  frame = undefined;
  currentPage = "";
}

export function stopTikTok(): void {
  stopTikTokPage();
  try {
    const names = document.cookie.split(";").map(cookie => cookie.trim().split("=")[0])
      .filter(name => name === "_ttp" || /^ttcsid(?:_|$)/.test(name));
    for (const name of names) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      const parts = location.hostname.split(".");
      for (let index = 0; index < parts.length - 1; index++)
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${parts.slice(index).join(".")}; SameSite=Lax`;
    }
  } catch { /* Cookie storage may be blocked independently of consent. */ }
}

export function trackTikTokPage(): void {
  const page = tiktokPageUrl(location.href, location.origin);
  if (!page || page === currentPage) return;
  stopTikTokPage();
  try {
    const next = document.createElement("iframe");
    next.hidden = true;
    next.title = "TikTok advertising measurement";
    next.tabIndex = -1;
    next.referrerPolicy = "no-referrer";
    next.src = `/api/tiktok/pixel-frame?page=${encodeURIComponent(page)}`;
    document.body.appendChild(next);
    frame = next;
    currentPage = page;
  } catch { /* Blocked optional measurement must not interrupt shopping. */ }
}
