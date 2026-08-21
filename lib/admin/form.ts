export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function nullableFormString(formData: FormData, key: string): string | null {
  return formString(formData, key) || null;
}

export function formCheckbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export function formStringList(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 190);
}

export function poundsToPence(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, decimals = ""] = value.split(".");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

export function penceToPounds(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return (Number(value) / 100).toFixed(2);
}

export function isDatabaseId(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}
