"use client";

export interface PixelPort { post(message: unknown): void; remove(): void }
export type PixelPortFactory = (channel: string, receive: (message: unknown) => void) => PixelPort;
export interface PixelEnvelope { pixelId: string; externalId: string; eventId: string; name: string; matching?: object; data: object }
interface Options<T> {
  provider: "meta" | "tiktok";
  validPixel(id: string): boolean;
  safeLocation(url: string): boolean;
  matching(event: T): object | undefined;
}
interface Session {
  closed: boolean; channel: string; port: PixelPort; ready: Promise<boolean>;
  completeReady(value: boolean): void; pending: Map<string, (value: boolean) => void>;
  timeout: ReturnType<typeof setTimeout>; expiry?: ReturnType<typeof setTimeout>; renew(): void;
}
function browserPort(provider: string): PixelPortFactory {
  return (channel, receive) => {
    const frame = document.createElement("iframe");
    frame.hidden = true; frame.title = `${provider} advertising measurement`; frame.tabIndex = -1; frame.referrerPolicy = "no-referrer";
    frame.src = `/api/${provider}/pixel-frame?channel=${encodeURIComponent(channel)}`;
    const listener = (event: MessageEvent<unknown>) => {
      if (event.origin === location.origin && event.source === frame.contentWindow) receive(event.data);
    };
    window.addEventListener("message", listener);
    try { document.body.appendChild(frame); }
    catch (error) { window.removeEventListener("message", listener); throw error; }
    return { post: message => frame.contentWindow?.postMessage(message, location.origin), remove: () => { window.removeEventListener("message", listener); frame.remove(); } };
  };
}

// Providers share isolated documents and exact identity snapshots. Withdrawal
// cancels pending SDK calls and removes every document immediately.
export class MeasurementPixelTransport<T extends PixelEnvelope> {
  private sessions = new Map<string, Session>();
  private deliveries = new Map<string, Promise<boolean>>();
  private identity = "";
  private factory: PixelPortFactory;
  constructor(private options: Options<T>, factory?: PixelPortFactory) { this.factory = factory ?? browserPort(options.provider); }
  configure(pixelId: string, externalId: string | undefined, enabled: boolean): void {
    const identity = enabled && this.options.validPixel(pixelId) && externalId && /^[a-f0-9]{64}$/.test(externalId) ? `${pixelId}:${externalId}` : "";
    if (identity !== this.identity) {
      for (const session of this.sessions.values()) this.close(session);
      this.sessions.clear(); this.deliveries.clear();
    }
    this.identity = identity;
  }
  private type(action: string) { return `n7:${this.options.provider}-pixel-${action}`; }
  private close(session: Session): void {
    session.closed = true;
    clearTimeout(session.timeout); clearTimeout(session.expiry); session.completeReady(false);
    for (const finish of session.pending.values()) finish(false);
    session.pending.clear();
    try { session.port.post({ type: this.type("revoke"), channel: session.channel }); } catch { /* Optional SDK. */ }
    try { session.port.remove(); } catch { /* Detached frame. */ }
  }
  private session(event: T, url: string): Session | undefined {
    if (this.identity !== `${event.pixelId}:${event.externalId}` || !this.options.safeLocation(url)) return;
    const matching = this.options.matching(event);
    if (!matching) return;
    const key = JSON.stringify([this.identity, matching, url]);
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
      if (value.type === this.type("loaded")) {
        try { session.port.post({ type: this.type("init"), channel, pixelId: event.pixelId, externalId: event.externalId, matching, url }); }
        catch { remove(); }
      }
      if (value.type === this.type("ready")) { clearTimeout(session.timeout); session.renew(); completeReady(true); }
      if (value.type === this.type("error")) remove();
      if (value.type === this.type("queued") && "eventId" in value && typeof value.eventId === "string") {
        session.renew(); pending.get(value.eventId)?.(true); pending.delete(value.eventId);
      }
    };
    let port: PixelPort;
    try { port = this.factory(channel, receive); }
    catch { clearTimeout(timeout); completeReady(false); return; }
    const session: Session = { closed: false, channel, port, ready, completeReady, pending, timeout, renew() { clearTimeout(this.expiry); this.expiry = setTimeout(remove, 60000); } };
    this.sessions.set(key, session); session.renew(); return session;
  }
  async send(event: T, url: string): Promise<boolean> {
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
        try { session.port.post({ type: this.type("event"), channel: session.channel, event }); }
        catch { clearTimeout(timeout); session.pending.delete(event.eventId); resolve(false); }
      });
    })().catch(() => false);
    this.deliveries.set(key, delivery);
    void delivery.finally(() => { if (this.deliveries.get(key) === delivery) this.deliveries.delete(key); });
    return delivery;
  }
}
