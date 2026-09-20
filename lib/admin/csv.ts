export function csvRow(values: readonly (string | number | null | undefined)[]): string {
  return values.map(value => {
    let text = String(value ?? "");
    if (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }).join(",") + "\r\n";
}
