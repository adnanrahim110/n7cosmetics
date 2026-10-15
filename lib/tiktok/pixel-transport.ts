"use client";
import { MeasurementPixelTransport, type PixelPortFactory } from "../marketing/pixel-transport";
import { tiktokMatching, type TikTokBrowserEvent } from "./shared";
import { safeTikTokPixelLocation } from "./pixel";
export class TikTokPixelTransport extends MeasurementPixelTransport<TikTokBrowserEvent> {
  constructor(factory?: PixelPortFactory) {
    super({ provider: "tiktok", validPixel: id => /^[A-Z0-9]{20}$/.test(id), safeLocation: url => safeTikTokPixelLocation(url, ""), matching: event => tiktokMatching(event.matching) }, factory);
  }
}
export const tiktokPixelTransport = new TikTokPixelTransport();
