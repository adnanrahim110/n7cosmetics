"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FileVideo2, LoaderCircle, UploadCloud, X } from "lucide-react";

export interface MediaAssetValue {
  url: string;
  name?: string;
  mimeType?: string;
  type: "image" | "video";
}

interface MediaDropzoneProps {
  name: string;
  label: string;
  accept?: "image" | "video" | "both";
  multiple?: boolean;
  defaultAssets?: MediaAssetValue[];
  hint?: string;
  className?: string;
  onChange?: (assets: MediaAssetValue[]) => void;
}

const acceptMap = { image: "image/*", video: "video/*", both: "image/*,video/*" } as const;

export default function MediaDropzone({ name, label, accept = "both", multiple = false, defaultAssets = [], hint, className = "", onChange }: MediaDropzoneProps) {
  const [assets, setAssets] = useState<MediaAssetValue[]>(defaultAssets);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | File[]) {
    const selectedFiles = Array.from(files);
    if (!selectedFiles.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: MediaAssetValue[] = [];
      for (const file of selectedFiles) {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/admin/media", { method: "POST", body });
        const result = await response.json() as { url?: string; name?: string; mimeType?: string; type?: "image" | "video"; error?: string };
        if (!response.ok || !result.url || !result.type) throw new Error(result.error ?? "The upload failed.");
        uploaded.push({ url: result.url, name: result.name, mimeType: result.mimeType, type: result.type });
      }
      const next = multiple ? [...assets, ...uploaded] : uploaded.slice(-1);
      setAssets(next);
      onChange?.(next);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <span className="mb-1 block text-[13px] font-medium leading-5 text-zinc-700">{label}</span>
      {assets.map((asset) => <input key={asset.url} name={name} type="hidden" value={asset.url} />)}
      <div className={`grid gap-2 ${assets.length ? "sm:grid-cols-2" : ""}`}>
      <button
        className={`flex min-h-20 w-full items-center justify-center gap-3 rounded-lg border border-dashed px-3 py-3 text-left transition ${dragging ? "border-amber-600 bg-amber-50" : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-white"}`}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); setDragging(false); void upload(event.dataTransfer.files); }}
        type="button"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-zinc-400 shadow-sm ring-1 ring-zinc-200">
          {uploading ? <LoaderCircle className="animate-spin text-amber-700" size={19} /> : <UploadCloud size={19} />}
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-medium text-zinc-700">{uploading ? "Uploading…" : "Drop or browse"}</span>
          <span className="mt-0.5 block truncate text-[11px] text-zinc-400">{accept === "image" ? "Images up to 10 MB" : accept === "video" ? "MP4, MOV or WebM up to 75 MB" : "Images or videos"}</span>
        </span>
      </button>
        {assets.map((asset, index) => (
          <div className="group relative flex min-h-16 overflow-hidden rounded-lg border border-zinc-200 bg-white" key={`${asset.url}-${index}`}>
            <div className="relative h-full min-h-16 w-24 shrink-0 bg-zinc-100">
              {asset.type === "image" ? <Image alt={asset.name ?? "Uploaded image"} className="object-cover" fill sizes="96px" src={asset.url} unoptimized /> : <><video className="size-full object-cover" muted preload="metadata" src={asset.url} /><FileVideo2 className="absolute left-1.5 top-1.5 text-white drop-shadow" size={15} /></>}
            </div>
            <div className="min-w-0 self-center px-2.5 pr-9"><p className="truncate text-xs font-medium text-zinc-700">{asset.name ?? asset.url.split("/").at(-1)}</p><p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-zinc-400">{asset.type}</p></div>
            <button aria-label={`Remove ${asset.name ?? "media"}`} className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:text-red-600" onClick={() => { const next = assets.filter((_, assetIndex) => assetIndex !== index); setAssets(next); onChange?.(next); }} type="button"><X size={12} /></button>
          </div>
        ))}
      </div>
      <input className="sr-only" accept={acceptMap[accept]} multiple={multiple} onChange={(event) => { if (event.target.files) void upload(event.target.files); }} ref={inputRef} type="file" />
      {hint ? <p className="mt-1.5 text-xs leading-5 text-zinc-500">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}
