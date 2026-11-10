import { cn } from "@/lib/cn";

interface BlogTextFieldProps {
  defaultValue?: string;
  error?: string;
  hint?: string;
  label: string;
  maxLength: number;
  name: string;
  pattern?: string;
  readOnly?: boolean;
  required?: boolean;
  rows?: number;
}

export default function BlogTextField({
  defaultValue,
  error,
  hint,
  label,
  maxLength,
  name,
  pattern,
  readOnly,
  required,
  rows,
}: BlogTextFieldProps) {
  const id = `blog-${name}`;
  const fieldProps = {
    id,
    name,
    defaultValue,
    maxLength,
    required,
    readOnly,
    "aria-describedby": [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined,
    "aria-invalid": error ? true : undefined,
    className: cn(
      "min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 focus-visible:border-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 sm:text-sm",
      error && "border-red-600",
      readOnly && "bg-zinc-50 text-zinc-700",
    ),
  };

  return (
    <div className="min-w-0 space-y-2">
      <label className="block text-sm font-medium text-zinc-950" htmlFor={id}>{label}</label>
      {rows ? <textarea {...fieldProps} rows={rows} /> : <input {...fieldProps} autoComplete="off" pattern={pattern} type="text" />}
      {hint ? <p className="text-sm text-zinc-600" id={`${id}-hint`}>{hint}</p> : null}
      {error ? <p className="text-sm text-red-700" id={`${id}-error`}>{error}</p> : null}
    </div>
  );
}
