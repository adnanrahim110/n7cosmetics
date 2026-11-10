"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useState } from "react";
import { blogArticleTags } from "@/lib/blogs/content-format";

const editorOptions = {
  height: 384,
  menubar: false,
  branding: false,
  promotion: false,
  convert_urls: false,
  paste_data_images: false,
  block_formats: "Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4; Quote=blockquote",
  valid_elements: blogArticleTags.map((tag) => tag === "a" ? "a[href]" : tag).join(","),
};

interface BlogBodyEditorProps {
  apiKey?: string;
  defaultValue: string;
  disabled: boolean;
  error?: string;
  onChange: (html: string) => void;
  onReadyChange: (ready: boolean) => void;
}

export default function BlogBodyEditor({
  apiKey,
  defaultValue,
  disabled,
  error,
  onChange,
  onReadyChange,
}: BlogBodyEditorProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!apiKey || status !== "loading") return;
    const timeout = window.setTimeout(() => setStatus("error"), 15_000);
    return () => window.clearTimeout(timeout);
  }, [apiKey, status]);

  function showLoadError() {
    setStatus("error");
    onReadyChange(false);
  }

  return (
    <div
      aria-describedby={error ? "blog-bodyHtml-error" : "blog-bodyHtml-hint"}
      aria-labelledby="blog-bodyHtml-label"
      className="min-w-0 space-y-2"
      id="blog-bodyHtml"
      role="group"
      tabIndex={-1}
    >
      <p className="text-sm font-medium text-zinc-950" id="blog-bodyHtml-label">Article body</p>
      <p className="text-sm text-zinc-600" id="blog-bodyHtml-hint">Use headings, lists, quotes, and links to format your post. Required to publish.</p>
      {!apiKey || status === "error" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="alert">
          {apiKey
            ? "TinyMCE could not load. Check your connection and the approved domains for your Tiny Cloud key, then reopen the editor."
            : "Set TINYMCE_API_KEY in the app environment and approve this domain in Tiny Cloud to edit the article."}
          {" "}You can still save other post details.
        </p>
      ) : (
        <div aria-busy={status === "loading"} className="relative min-h-96 min-w-0">
          <Editor
            apiKey={apiKey}
            cloudChannel="8"
            disabled={disabled && status === "ready"}
            initialValue={defaultValue}
            init={editorOptions}
            onEditorChange={onChange}
            onIconsLoadError={showLoadError}
            onInit={(_event, editor) => {
              if (editor.mode.isReadOnly() || editor.options.get("disabled")) {
                showLoadError();
                return;
              }
              editor.getContentAreaContainer().querySelector("iframe")?.setAttribute("title", "Blog article body");
              setStatus("ready");
              onReadyChange(true);
            }}
            onModelLoadError={showLoadError}
            onPluginLoadError={showLoadError}
            onScriptsLoadError={showLoadError}
            onSkinLoadError={showLoadError}
            onThemeLoadError={showLoadError}
            plugins="lists link"
            scriptLoading={{ async: true }}
            toolbar="undo redo | blocks | bold italic | bullist numlist | link removeformat"
          />
          {status === "loading" ? (
            <div className="absolute inset-0 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600" role="status">
              Loading article editor…
            </div>
          ) : null}
        </div>
      )}
      {error ? <p className="text-sm text-red-700" id="blog-bodyHtml-error">{error}</p> : null}
    </div>
  );
}
