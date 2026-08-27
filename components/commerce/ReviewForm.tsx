"use client";

import Image from "next/image";
import { CheckCircle2, FileVideo2, LoaderCircle, Send, Star, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitProductReviewAction, type ReviewFormState } from "@/app/(storefront)/products/[slug]/actions";
import Title from "@/components/ui/Title";

interface SelectedMedia {
  key: string;
  file: File;
  previewUrl: string;
  type: "image" | "video";
}

const initialState: ReviewFormState = { status: "idle", message: "" };
const inputClass = "mt-2 w-full border border-black/15 bg-white/65 px-4 py-3.5 text-sm text-[#1c1814] outline-none transition placeholder:text-black/30 focus:border-[#967c55] focus:bg-white focus:ring-2 focus:ring-[#967c55]/12 disabled:cursor-not-allowed disabled:opacity-55";
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "video/mp4", "video/quicktime", "video/webm"]);

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p className="mt-1.5 text-xs text-red-700" id={id}>{message}</p> : null;
}

export default function ReviewForm({ productId, productSlug, productName }: { productId: string; productSlug: string; productName: string }) {
  const [state, formAction, pending] = useActionState(submitProductReviewAction, initialState);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [files, setFiles] = useState<SelectedMedia[]>([]);
  const [dragging, setDragging] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const filesRef = useRef(files);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => () => {
    for (const item of filesRef.current) URL.revokeObjectURL(item.previewUrl);
  }, []);

  useEffect(() => {
    if (!inputRef.current || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    for (const item of files) transfer.items.add(item.file);
    inputRef.current.files = transfer.files;
  }, [files]);

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    const frame = requestAnimationFrame(() => {
      setRating(0);
      setHoveredRating(0);
      setFiles((current) => {
        for (const item of current) URL.revokeObjectURL(item.previewUrl);
        return [];
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [state.status]);

  function addFiles(fileList: FileList | File[]) {
    const candidates = Array.from(fileList);
    if (!candidates.length) return;
    setMediaError("");
    const valid: File[] = [];
    for (const file of candidates) {
      if (!acceptedTypes.has(file.type)) {
        setMediaError("Choose a supported JPG, PNG, GIF, WebP, AVIF, MP4, MOV, or WebM file.");
        continue;
      }
      const isVideo = file.type.startsWith("video/");
      const sizeLimit = (isVideo ? 75 : 10) * 1024 * 1024;
      if (file.size > sizeLimit) {
        setMediaError(`${isVideo ? "Videos" : "Images"} cannot exceed ${isVideo ? 75 : 10} MB each.`);
        continue;
      }
      valid.push(file);
    }
    const available = Math.max(0, 4 - files.length);
    if (!available) {
      setMediaError("You can attach up to four files.");
      return;
    }
    if (valid.length > available) setMediaError(`Only the first ${available} ${available === 1 ? "file was" : "files were"} added.`);
    const additions = valid.slice(0, available).map((file) => ({
      key: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" as const : "image" as const,
    }));
    setFiles((current) => [...current, ...additions]);
  }

  function removeFile(key: string) {
    setFiles((current) => {
      const removed = current.find((item) => item.key === key);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((item) => item.key !== key);
    });
  }

  const disabled = pending;
  const visibleRating = hoveredRating || rating;

  return (
    <form action={formAction} className="mt-10" id="write-review" ref={formRef}>
      <input name="productId" type="hidden" value={productId} />
      <input name="productSlug" type="hidden" value={productSlug} />
      <input name="rating" type="hidden" value={rating || ""} />

      <div aria-live="polite" className={state.status === "idle" ? "sr-only" : `mb-7 flex items-start gap-3 border px-4 py-3.5 text-sm leading-6 ${state.status === "success" ? "border-emerald-700/25 bg-emerald-50 text-emerald-900" : "border-red-700/20 bg-red-50 text-red-800"}`} role={state.status === "error" ? "alert" : "status"}>
        {state.status === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} /> : null}
        <span>{state.message}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-12">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8d6745]">Your experience</p>
          <Title
            as="h3"
            className="mt-3"
            text={`Review ${productName}`}
            tone="ink"
            variant="compact"
          />
          <p className="mt-4 max-w-md text-sm font-light leading-7 text-black/55">Your honest notes help other fragrance lovers choose with confidence. Reviews are checked before publication.</p>

          <fieldset className="mt-8">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/58">Your rating</legend>
            <div aria-label="Choose a rating" className="mt-3 flex w-fit gap-1" onMouseLeave={() => setHoveredRating(0)} role="radiogroup">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  aria-checked={rating === star}
                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  className="p-1 text-[#ad8b62] transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d6745]"
                  disabled={disabled}
                  key={star}
                  onClick={() => setRating(star)}
                  onFocus={() => setHoveredRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  role="radio"
                  type="button"
                >
                  <Star className={star <= visibleRating ? "fill-current" : ""} size={28} strokeWidth={1.4} />
                </button>
              ))}
            </div>
            <FieldError id="review-rating-error" message={state.fieldErrors?.rating} />
          </fieldset>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/58">Photos or video <span className="font-normal normal-case tracking-normal text-black/35">(optional)</span></p>
              {files.length ? <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">{files.length}/4</span> : null}
            </div>
            <button
              className={`mt-2 flex min-h-32 w-full items-center justify-center gap-3 border border-dashed px-4 py-5 text-left transition ${dragging ? "border-[#8d6745] bg-[#eee4d6]" : "border-black/20 bg-white/35 hover:border-[#8d6745] hover:bg-white/60"}`}
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
              type="button"
            >
              <span className="grid size-10 shrink-0 place-items-center bg-white text-[#8d6745] shadow-sm"><UploadCloud size={19} /></span>
              <span><span className="block text-sm font-medium text-[#1c1814]">Drop media here or browse</span><span className="mt-1 block text-xs leading-5 text-black/42">Up to 4 files · images 10 MB · video 75 MB</span></span>
            </button>
            <input accept="image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/quicktime,video/webm" className="sr-only" multiple name="reviewMediaFiles" onChange={(event) => { if (event.target.files) addFiles(event.target.files); }} ref={inputRef} type="file" />
            {files.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                {files.map((item) => (
                  <div className="group relative aspect-square overflow-hidden bg-[#e9e0d3]" key={item.key}>
                    {item.type === "image" ? <Image alt={item.file.name} className="object-cover" fill sizes="160px" src={item.previewUrl} unoptimized /> : <><video className="size-full object-cover" muted preload="metadata" src={item.previewUrl} /><FileVideo2 className="absolute bottom-2 left-2 text-white drop-shadow" size={17} /></>}
                    <button aria-label={`Remove ${item.file.name}`} className="absolute right-2 top-2 grid size-7 place-items-center bg-white/90 text-black/65 transition hover:bg-white hover:text-red-700" onClick={() => removeFile(item.key)} type="button"><X size={14} /></button>
                  </div>
                ))}
              </div>
            ) : null}
            <FieldError id="review-media-error" message={mediaError || state.fieldErrors?.media} />
          </div>
        </div>

        <div className="grid content-start gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/58">Name<input aria-invalid={Boolean(state.fieldErrors?.name)} autoComplete="name" className={inputClass} disabled={disabled} maxLength={120} name="name" placeholder="Your name" required /><FieldError id="review-name-error" message={state.fieldErrors?.name} /></label>
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/58">Email<input aria-invalid={Boolean(state.fieldErrors?.email)} autoComplete="email" className={inputClass} disabled={disabled} maxLength={190} name="email" placeholder="you@example.com" required type="email" /><span className="mt-1.5 block text-[11px] font-normal normal-case tracking-normal text-black/35">Never displayed publicly.</span><FieldError id="review-email-error" message={state.fieldErrors?.email} /></label>
          </div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/58">Review title<input aria-invalid={Boolean(state.fieldErrors?.title)} className={inputClass} disabled={disabled} maxLength={120} minLength={3} name="title" placeholder="Sum up your experience" required /><FieldError id="review-title-error" message={state.fieldErrors?.title} /></label>
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/58">Your review<textarea aria-invalid={Boolean(state.fieldErrors?.body)} className={`${inputClass} min-h-44 resize-y leading-7`} disabled={disabled} maxLength={3000} minLength={20} name="body" placeholder="How did the fragrance wear? What stood out to you?" required rows={6} /><FieldError id="review-body-error" message={state.fieldErrors?.body} /></label>

          <div className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true"><label>Company website<input autoComplete="off" name="companyWebsite" tabIndex={-1} /></label></div>

          <label className="flex items-start gap-3 text-sm leading-6 text-black/55"><input className="mt-1 size-4 shrink-0 accent-[#8d6745]" defaultChecked disabled={disabled} name="recommendsProduct" type="checkbox" /><span>I recommend this product.</span></label>
          <div>
            <label className="flex items-start gap-3 text-sm leading-6 text-black/55"><input aria-invalid={Boolean(state.fieldErrors?.consent)} className="mt-1 size-4 shrink-0 accent-[#8d6745]" disabled={disabled} name="consent" required type="checkbox" /><span>I confirm this is my own experience and agree that N7 Cosmetics may publish this review under my first name, in line with the <Link className="text-[#7a5825] underline underline-offset-4" href="/privacy">privacy policy</Link>.</span></label>
            <FieldError id="review-consent-error" message={state.fieldErrors?.consent} />
          </div>
          <button className="group inline-flex min-h-13 w-fit items-center justify-center gap-3 bg-[#1c1814] px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#8d6745] disabled:cursor-not-allowed disabled:opacity-45" disabled={disabled} type="submit">
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />}
            {pending ? "Submitting…" : "Submit review"}
          </button>
        </div>
      </div>
    </form>
  );
}
