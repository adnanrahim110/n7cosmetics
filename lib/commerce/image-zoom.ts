export interface ZoomPoint { x: number; y: number }
export interface ZoomSize { width: number; height: number }
export interface ImageZoom extends ZoomPoint { scale: number }

export const MIN_IMAGE_ZOOM = 1;
export const MAX_IMAGE_ZOOM = 4;
export const INITIAL_IMAGE_ZOOM: ImageZoom = { scale: 1, x: 0, y: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function fitImage(image: ZoomSize, viewport: ZoomSize, padding = 16): ZoomSize {
  if (image.width <= 0 || image.height <= 0) return { width: 0, height: 0 };
  const ratio = Math.min(
    Math.max(0, viewport.width - padding * 2) / image.width,
    Math.max(0, viewport.height - padding * 2) / image.height,
  );
  return { width: image.width * ratio, height: image.height * ratio };
}

export function constrainImageZoom(zoom: ImageZoom, image: ZoomSize, viewport: ZoomSize): ImageZoom {
  const scale = clamp(zoom.scale, MIN_IMAGE_ZOOM, MAX_IMAGE_ZOOM);
  const maxX = Math.max(0, (image.width * scale - viewport.width) / 2);
  const maxY = Math.max(0, (image.height * scale - viewport.height) / 2);
  return { scale, x: maxX ? clamp(zoom.x, -maxX, maxX) : 0, y: maxY ? clamp(zoom.y, -maxY, maxY) : 0 };
}

// Keep the same image detail beneath a finger as the pinch midpoint moves.
// Coordinates are relative to the centre of the viewport.
export function zoomImageAt(
  zoom: ImageZoom,
  requestedScale: number,
  anchor: ZoomPoint,
  image: ZoomSize,
  viewport: ZoomSize,
  destination: ZoomPoint = anchor,
): ImageZoom {
  const scale = clamp(requestedScale, MIN_IMAGE_ZOOM, MAX_IMAGE_ZOOM);
  const ratio = scale / zoom.scale;
  return constrainImageZoom({
    scale,
    x: destination.x - (anchor.x - zoom.x) * ratio,
    y: destination.y - (anchor.y - zoom.y) * ratio,
  }, image, viewport);
}

export function pinchGeometry(first: ZoomPoint, second: ZoomPoint) {
  return {
    midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
    distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
  };
}
