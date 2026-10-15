"use client";
import { MeasurementPixelTransport, type PixelPortFactory } from "../marketing/pixel-transport";
import { safeMetaPixelLocation } from "./browser-policy";
import { prepareMetaPixelMatching } from "./pixel-matching";
import type { MetaBrowserEvent } from "./shared";
export type { PixelPort as MetaPixelPort, PixelPortFactory as MetaPixelPortFactory } from "../marketing/pixel-transport";
export class MetaPixelTransport extends MeasurementPixelTransport<MetaBrowserEvent> {
  constructor(factory?: PixelPortFactory) {
    super({ provider: "meta", validPixel: id => /^\d{5,30}$/.test(id), safeLocation: url => safeMetaPixelLocation(url, ""), matching: event => prepareMetaPixelMatching(undefined, event.externalId, event.matching)?.identity.matching }, factory);
  }
}
export const metaPixelTransport = new MetaPixelTransport();
