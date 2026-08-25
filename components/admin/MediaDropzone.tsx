"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, FileVideo2, ImagePlus, UploadCloud, X } from "lucide-react";
import { showAdminToast } from "@/components/admin/AdminToastProvider";

export interface MediaAssetValue {
  url: string;
  name?: string;
  mimeType?: string;
  type: "image" | "video";
  pending?: boolean;
}

interface MediaDropzoneProps {
  name: string;
  label: string;
  accept?: "image" | "video" | "both";
  multiple?: boolean;
  maxFiles?: number;
  defaultAssets?: MediaAssetValue[];
  hint?: string;
  className?: string;
  onChange?: (assets: MediaAssetValue[]) => void;
}

interface ExistingAsset extends MediaAssetValue {
  key: string;
  kind: "existing";
}

interface PendingAsset extends MediaAssetValue {
  key: string;
  kind: "pending";
  file: File;
  previewUrl: string;
  pending: true;
}

type DropzoneAsset = ExistingAsset | PendingAsset;

const acceptMap = { image: "image/jpeg,image/png,image/gif,image/webp,image/avif", video: "video/mp4,video/quicktime,video/webm", both: "image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/quicktime,video/webm" } as const;

function publicAssets(assets: DropzoneAsset[]): MediaAssetValue[] {
  return assets.map((asset) => ({
    url: asset.kind === "existing" ? asset.url : "",
    name: asset.name,
    mimeType: asset.mimeType,
    type: asset.type,
    pending: asset.kind === "pending",
  }));
}

function initialAssets(defaultAssets: MediaAssetValue[]): ExistingAsset[] {
  return defaultAssets.map((asset, index) => ({ ...asset, key: `existing-${index}-${asset.url}`, kind: "existing", pending: false }));
}

export default function MediaDropzone({
  name,
  label,
  accept = "both",
  multiple = false,
  maxFiles = multiple ? 12 : 1,
  defaultAssets = [],
  hint,
  className = "",
  onChange,
}: MediaDropzoneProps) {
  const [assets, setAssets] = useState<DropzoneAsset[]>(() => initialAssets(defaultAssets));
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const assetsRef = useRef(assets);

  useEffect(() => { assetsRef.current = assets; }, [assets]);

  useEffect(() => () => {
    for (const asset of assetsRef.current) if (asset.kind === "pending") URL.revokeObjectURL(asset.previewUrl);
  }, []);

  useEffect(() => {
    if (!inputRef.current || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    for (const asset of assets) if (asset.kind === "pending") transfer.items.add(asset.file);
    inputRef.current.files = transfer.files;
  }, [assets]);

  function commit(next: DropzoneAsset[]) {
    setAssets(next);
    onChange?.(publicAssets(next));
  }

  function reportError(message: string) {
    setError(message);
    showAdminToast({ id: `media:${name}:${message}`, type: "warning", title: "File not added", description: message });
  }

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;
    setError("");

    const validFiles: File[] = [];
    for (const file of files) {
      const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
      if (!type || (accept !== "both" && accept !== type)) {
        reportError(accept === "image" ? "Choose an image file." : accept === "video" ? "Choose an MP4, MOV, or WebM video." : "Choose a supported image or video.");
        continue;
      }
      const limit = type === "image" ? 10 * 1024 * 1024 : 75 * 1024 * 1024;
      if (file.size > limit) {
        reportError(`${type === "image" ? "Images" : "Videos"} cannot exceed ${limit / 1024 / 1024} MB each.`);
        continue;
      }
      validFiles.push(file);
    }
    if (!validFiles.length) return;

    const available = multiple ? Math.max(0, maxFiles - assets.length) : 1;
    if (!available) {
      reportError(`This area accepts up to ${maxFiles} ${maxFiles === 1 ? "file" : "files"}.`);
      return;
    }
    if (validFiles.length > available) reportError(`Only the first ${available} selected ${available === 1 ? "file was" : "files were"} added.`);
    const pending: PendingAsset[] = validFiles.slice(0, available).map((file) => ({
      key: `pending-${crypto.randomUUID()}`,
      kind: "pending",
      file,
      previewUrl: URL.createObjectURL(file),
      url: "",
      name: file.name,
      mimeType: file.type,
      type: file.type.startsWith("video/") ? "video" : "image",
      pending: true,
    }));
    if (multiple) commit([...assets, ...pending]);
    else {
      for (const asset of assets) if (asset.kind === "pending") URL.revokeObjectURL(asset.previewUrl);
      commit(pending.slice(-1));
    }
  }

  function remove(index: number) {
    const removed = assets[index];
    if (removed?.kind === "pending") URL.revokeObjectURL(removed.previewUrl);
    commit(assets.filter((_, assetIndex) => assetIndex !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= assets.length) return;
    const next = [...assets];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  const pendingAssets = assets.filter((asset): asset is PendingAsset => asset.kind === "pending");
  const pendingIndexes = new Map(pendingAssets.map((asset, index) => [asset.key, index]));
  const serializedOrder = assets.map((asset) => asset.kind === "existing"
    ? { kind: "existing", url: asset.url }
    : { kind: "new", index: pendingIndexes.get(asset.key) ?? 0 });

  return (
    <div className={className}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <span className="block text-[13px] font-semibold leading-5 text-zinc-800">{label}</span>
          {hint ? <p className="mt-0.5 text-xs leading-5 text-zinc-500">{hint}</p> : null}
        </div>
        {assets.length ? <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{assets.length}/{maxFiles}</span> : null}
      </div>

      {assets.filter((asset): asset is ExistingAsset => asset.kind === "existing").map((asset) => <input key={asset.key} name={name} type="hidden" value={asset.url} />)}
      <input name={`${name}Order`} type="hidden" value={JSON.stringify(serializedOrder)} />

      <button
        className={`group flex min-h-28 w-full items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-5 text-left transition ${dragging ? "border-amber-600 bg-amber-50 ring-2 ring-amber-100" : "border-zinc-300 bg-zinc-50 hover:border-amber-500 hover:bg-amber-50/40"}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
        type="button"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition group-hover:text-amber-700">
          {accept === "image" ? <ImagePlus size={20} /> : <UploadCloud size={20} />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-zinc-800">Drop files here or browse</span>
          <span className="mt-1 block text-xs text-zinc-500">{accept === "image" ? "JPG, PNG, GIF, WebP or AVIF · 10 MB max" : accept === "video" ? "MP4, MOV or WebM · 75 MB max each" : "Supported images and videos"}</span>
          <span className="mt-1 block text-[11px] font-medium text-amber-700">Files are stored only when you save the form.</span>
        </span>
      </button>

      {assets.length ? (
        <div className={`mt-3 grid gap-2 ${multiple ? "sm:grid-cols-2" : ""}`}>
          {assets.map((asset, index) => {
            const previewUrl = asset.kind === "pending" ? asset.previewUrl : asset.url;
            return (
              <div className="group relative flex min-h-20 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm" key={asset.key}>
                <div className="relative min-h-20 w-24 shrink-0 bg-zinc-100">
                  {asset.type === "image" ? <Image alt={asset.name ?? "Selected image"} className="object-cover" fill sizes="96px" src={previewUrl} unoptimized /> : <><video className="size-full object-cover" muted preload="metadata" src={previewUrl} /><FileVideo2 className="absolute left-2 top-2 text-white drop-shadow" size={16} /></>}
                </div>
                <div className="min-w-0 self-center px-3 pr-16">
                  <p className="truncate text-xs font-semibold text-zinc-800">{asset.name ?? asset.url.split("/").at(-1)}</p>
                  <p className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${asset.kind === "pending" ? "text-amber-700" : "text-emerald-700"}`}>{asset.kind === "pending" ? "Ready to save" : "Stored"}</p>
                </div>
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {multiple ? <><button aria-label="Move media up" className="grid size-6 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950 disabled:opacity-30" disabled={index === 0} onClick={() => move(index, -1)} type="button"><ChevronUp size={12} /></button><button aria-label="Move media down" className="grid size-6 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950 disabled:opacity-30" disabled={index === assets.length - 1} onClick={() => move(index, 1)} type="button"><ChevronDown size={12} /></button></> : null}
                  <button aria-label={`Remove ${asset.name ?? "media"}`} className="grid size-6 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-500 hover:border-red-200 hover:text-red-600" onClick={() => remove(index)} type="button"><X size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <input className="sr-only" accept={acceptMap[accept]} multiple={multiple} name={`${name}Files`} onChange={(event) => { if (event.target.files) addFiles(event.target.files); }} ref={inputRef} type="file" />
      {error ? <p className="mt-2 text-xs font-medium text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}
