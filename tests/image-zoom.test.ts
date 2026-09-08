import assert from "node:assert/strict";
import test from "node:test";
import { constrainImageZoom, fitImage, pinchGeometry, zoomImageAt } from "../lib/commerce/image-zoom";

test("portrait and landscape images fit the viewport without distortion", () => {
  assert.deepEqual(fitImage({ width: 1000, height: 2000 }, { width: 320, height: 600 }), { width: 284, height: 568 });
  assert.deepEqual(fitImage({ width: 2000, height: 1000 }, { width: 320, height: 600 }), { width: 288, height: 144 });
  assert.deepEqual(fitImage({ width: 1000, height: 2000 }, { width: 0, height: 0 }), { width: 0, height: 0 });
});

test("zoom keeps the selected image detail under the finger", () => {
  const initial = { scale: 2, x: 30, y: -20 };
  const anchor = { x: 60, y: 40 };
  const zoom = zoomImageAt(initial, 3, anchor, { width: 400, height: 500 }, { width: 300, height: 400 });
  assert.equal((anchor.x - zoom.x) / zoom.scale, (anchor.x - initial.x) / initial.scale);
  assert.equal((anchor.y - zoom.y) / zoom.scale, (anchor.y - initial.y) / initial.scale);
});

test("a moving pinch midpoint pans and zooms around the original detail", () => {
  const start = pinchGeometry({ x: -40, y: 0 }, { x: 40, y: 0 });
  const end = pinchGeometry({ x: -60, y: 20 }, { x: 100, y: 20 });
  const zoom = zoomImageAt({ scale: 1, x: 0, y: 0 }, end.distance / start.distance, start.midpoint, { width: 300, height: 500 }, { width: 320, height: 540 }, end.midpoint);
  assert.deepEqual(zoom, { scale: 2, x: 20, y: 20 });
});

test("dragging stops at image edges and centres dimensions smaller than the viewport", () => {
  const image = { width: 200, height: 400 };
  const viewport = { width: 360, height: 640 };
  assert.deepEqual(constrainImageZoom({ scale: 4, x: 10000, y: -10000 }, image, viewport), { scale: 4, x: 220, y: -480 });
  assert.deepEqual(constrainImageZoom({ scale: 1.5, x: 50, y: -50 }, image, viewport), { scale: 1.5, x: 0, y: 0 });
});

test("reset and zoom limits do not leave an image displaced", () => {
  const image = { width: 300, height: 500 };
  const viewport = { width: 320, height: 540 };
  assert.deepEqual(zoomImageAt({ scale: 4, x: 180, y: -160 }, 0.5, { x: 80, y: 60 }, image, viewport), { scale: 1, x: 0, y: 0 });
  const capped = zoomImageAt({ scale: 2, x: 0, y: 0 }, 10, { x: 20, y: 30 }, image, viewport);
  assert.deepEqual(capped, { scale: 4, x: -20, y: -30 });
});

test("rotation reclamps the zoom to the resized image and viewport", () => {
  const viewport = { width: 844, height: 240 };
  const image = fitImage({ width: 1000, height: 1500 }, viewport);
  const zoom = constrainImageZoom({ scale: 3, x: 200, y: 500 }, image, viewport);
  assert.equal(zoom.x, 0);
  assert.equal(zoom.y, 192);
});

test("coincident fingers still produce a finite pinch measurement", () => {
  const pinch = pinchGeometry({ x: 20, y: 30 }, { x: 20, y: 30 });
  assert.equal(pinch.distance, 1);
  assert.deepEqual(pinch.midpoint, { x: 20, y: 30 });
});
