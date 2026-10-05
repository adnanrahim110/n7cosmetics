import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { scheduleAfterLoad } from "../lib/browser/schedule-after-load";
import { storefrontAssets, optimisedVideoSource, videoPoster } from "../lib/media/storefront-assets";

function environment({ complete = false, idle = true } = {}) {
  const listeners = new Map<string, () => void>();
  const callbacks = new Map<number, () => void>();
  const cancelled: number[] = [];
  let nextId = 0;
  const enqueue = (callback: () => void) => { callbacks.set(++nextId, callback); return nextId; };
  const cancel = (id: number) => { callbacks.delete(id); cancelled.push(id); };
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    addEventListener: (name: string, callback: () => void) => listeners.set(name, callback),
    removeEventListener: (name: string) => listeners.delete(name),
    setTimeout: enqueue,
    clearTimeout: cancel,
    ...(idle ? { requestIdleCallback: enqueue, cancelIdleCallback: cancel } : {}),
  } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { readyState: complete ? "complete" : "loading" } });
  return {
    listeners, callbacks, cancelled,
    restore() {
      if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
      else Reflect.deleteProperty(globalThis, "document");
    },
  };
}

test("optional startup work waits for load and an idle slot", () => {
  const fixture = environment();
  try {
    let calls = 0;
    scheduleAfterLoad(() => calls++);
    assert.equal(fixture.callbacks.size, 0);
    fixture.listeners.get("load")?.();
    assert.equal(calls, 0);
    fixture.callbacks.get(1)?.();
    assert.equal(calls, 1);
  } finally { fixture.restore(); }
});

test("unmount before load prevents later media activation", () => {
  const fixture = environment();
  try {
    let calls = 0;
    const cancel = scheduleAfterLoad(() => calls++);
    const pendingLoad = fixture.listeners.get("load");
    cancel();
    pendingLoad?.();
    assert.equal(fixture.listeners.size, 0);
    assert.equal(fixture.callbacks.size, 0);
    assert.equal(calls, 0);
  } finally { fixture.restore(); }
});

test("queued callbacks cannot activate a disposed component", () => {
  const fixture = environment({ complete: true });
  try {
    let calls = 0;
    const cancel = scheduleAfterLoad(() => calls++);
    const queued = fixture.callbacks.get(1);
    cancel();
    queued?.();
    assert.deepEqual(fixture.cancelled, [1]);
    assert.equal(calls, 0);
  } finally { fixture.restore(); }
});

test("browsers without idle callbacks retain cancellable media startup", () => {
  const fixture = environment({ complete: true, idle: false });
  try {
    let calls = 0;
    const cancel = scheduleAfterLoad(() => calls++);
    fixture.callbacks.get(1)?.();
    assert.equal(calls, 1);
    cancel();
    assert.deepEqual(fixture.cancelled, [1]);
  } finally { fixture.restore(); }
});

test("immutable asset URLs resolve to files with matching content hashes", () => {
  for (const asset of Object.values(storefrontAssets)) {
    const buffer = readFileSync(`public${asset}`);
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
    assert.ok(asset.includes(`.${hash}.`), `${asset} must be renamed when its content changes`);
  }
});

test("custom admin-selected videos never receive another film's source or poster", () => {
  for (const source of ["/media/12345678-1234-1234-1234-123456789012", "https://example.com/custom.mp4", "/videos/another.mp4"]) {
    assert.equal(optimisedVideoSource(source), source);
    assert.equal(videoPoster(source), undefined);
  }
});
