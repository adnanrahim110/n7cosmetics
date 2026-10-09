"use client";

import { safeMetaPixelLocation } from "./browser-policy";
import { prepareMetaPixelMatching } from "./pixel-matching";
import type { MetaBrowserEvent } from "./shared";

export interface MetaPixelPort {
  post(message: unknown): void;
  remove(): void;
}
export type MetaPixelPortFactory = (channel: string, receive: (message: unknown) => void) => MetaPixelPort;

function browserPort(channel: string, receive: (message: unknown) => void): MetaPixelPort {
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.title = "Advertising measurement";
  frame.tabIndex = -1;
  frame.referrerPolicy = "no-referrer";
  frame.src = `/api/meta/pixel-frame?channel=${encodeURIComponent(channel)}`;
  const listener = (event: MessageEvent<unknown>) => {
    if (event.origin === location.origin && event.source === frame.contentWindow) receive(event.data);
  };
  window.addEventListener("message", listener);
  try { document.body.appendChild(frame); }
  catch (error) { window.removeEventListener("message", listener); throw error; }
  return {
    post: message => frame.contentWindow?.postMessage(message, location.origin),
    remove: () => { window.removeEventListener("message", listener); frame.remove(); },
  };
}

interface Session {
  closed: boolean;
  channel: string;
  port: MetaPixelPort;
  ready: Promise<boolean>;
  completeReady(value: boolean): void;
  pending: Map<string, (value: boolean) => void>;
  timeout: ReturnType<typeof setTimeout>;
  expiry?: ReturnType<typeof setTimeout>;
  renew(): void;
}

// Each document initializes the official SDK once with its complete snapshot.
// Frames share first-party cookies but never share an SDK buyer identity.
export class MetaPixelTransport {
  private sessions = new Map<string, Session>();
  private deliveries = new Map<string, Promise<boolean>>();
  private identity = "";

  constructor(private factory: MetaPixelPortFactory = browserPort) {}

  configure(pixelId: string, externalId: string | undefined, enabled: boolean): void {
    const identity = enabled && /^\d{5,30}$/.test(pixelId) && externalId && /^[a-f0-9]{64}$/.test(externalId) ? `${pixelId}:${externalId}` : "";
    if (identity !== this.identity) {
      for (const session of this.sessions.values()) this.close(session);
      this.sessions.clear();
      this.deliveries.clear();
    }
    this.identity = identity;
  }

  private close(session: Session): void {
    session.closed = true;
    clearTimeout(session.timeout);
    clearTimeout(session.expiry);
    session.completeReady(false);
    for (const finish of session.pending.values()) finish(false);
    session.pending.clear();
    try { session.port.post({ type: "n7:meta-pixel-revoke", channel: session.channel }); }
    catch { /* A blocked/detached frame must not block withdrawal. */ }
    try { session.port.remove(); }
    catch { /* Optional measurement must not interrupt the storefront. */ }
  }

  private session(event: Pick<MetaBrowserEvent, "pixelId" | "externalId" | "matching">, url: string): Session | undefined {
    if (this.identity !== `${event.pixelId}:${event.externalId}` || !safeMetaPixelLocation(url, "")) return;
    const profile = prepareMetaPixelMatching(undefined, event.externalId, event.matching);
    if (!profile) return;
    const key = JSON.stringify([this.identity, profile.userData, url]);
    const existing = this.sessions.get(key);
    if (existing) { existing.renew(); return existing; }
    const channel = crypto.randomUUID();
    let completeReady: (value: boolean) => void = () => undefined;
    const ready = new Promise<boolean>(resolve => { completeReady = resolve; });
    const remove = () => { const current = this.sessions.get(key); if (current?.channel === channel) { this.close(current); this.sessions.delete(key); } };
    const pending = new Map<string, (value: boolean) => void>();
    const timeout = setTimeout(remove, 20000);
    const receive = (value: unknown) => {
      if (!value || typeof value !== "object" || !("channel" in value) || value.channel !== channel || !("type" in value)) return;
      const session = this.sessions.get(key);
      if (!session || session.closed || session.channel !== channel) return;
      if (value.type === "n7:meta-pixel-loaded") {
        try { session.port.post({ type: "n7:meta-pixel-init", channel, pixelId: event.pixelId, externalId: event.externalId, matching: profile.identity.matching, url }); }
        catch { remove(); }
      }
      if (value.type === "n7:meta-pixel-ready") { clearTimeout(session.timeout); session.renew(); completeReady(true); }
      if (value.type === "n7:meta-pixel-error") remove();
      if (value.type === "n7:meta-pixel-queued" && "eventId" in value && typeof value.eventId === "string") {
        session.renew();
        pending.get(value.eventId)?.(true);
        pending.delete(value.eventId);
      }
    };
    let port: MetaPixelPort;
    try { port = this.factory(channel, receive); }
    catch { clearTimeout(timeout); completeReady(false); return; }
    const session: Session = { closed: false, channel, port, ready, completeReady, pending, timeout,
      renew() { clearTimeout(this.expiry); this.expiry = setTimeout(remove, 60000); },
    };
    this.sessions.set(key, session);
    // Retain queued SDK/config requests long enough to finish after a route or
    // buyer changes. Withdrawal removes every frame immediately.
    session.renew();
    return session;
  }

  async send(event: MetaBrowserEvent, url: string): Promise<boolean> {
    const identity = this.identity;
    if (identity !== `${event.pixelId}:${event.externalId}`) return false;
    const key = `${identity}:${event.name}:${event.eventId}`;
    const existing = this.deliveries.get(key);
    if (existing) return existing;
    const delivery = (async () => {
      const session = this.session(event, url);
      if (!session || !await session.ready || session.closed || identity !== this.identity) return false;
      return new Promise<boolean>(resolve => {
        const timeout = setTimeout(() => { session.pending.delete(event.eventId); resolve(false); }, 8000);
        session.pending.set(event.eventId, value => { clearTimeout(timeout); resolve(value); });
        try { session.port.post({ type: "n7:meta-pixel-event", channel: session.channel, event }); }
        catch { clearTimeout(timeout); session.pending.delete(event.eventId); resolve(false); }
      });
    })().catch(() => false);
    this.deliveries.set(key, delivery);
    void delivery.finally(() => { if (this.deliveries.get(key) === delivery) this.deliveries.delete(key); });
    return delivery;
  }
}

export const metaPixelTransport = new MetaPixelTransport();
