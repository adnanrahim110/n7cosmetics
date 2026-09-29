export async function readMetaJson(request: Request, maxBytes: number): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) throw new Error("Request too large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty request");
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new Error("Request too large"); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(parts).toString("utf8"));
}
