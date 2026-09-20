import { gzipSync, gunzipSync } from "node:zlib";
import { encryptSecret, decryptSecret } from "../security/encryption";

export type LegacyRow = Record<string, string | null>;

export function packRecord(row: LegacyRow): string {
  return encryptSecret(gzipSync(JSON.stringify(row)).toString("base64"));
}
export function unpackRecord(value: string): LegacyRow {
  return JSON.parse(gunzipSync(Buffer.from(decryptSecret(value), "base64")).toString("utf8")) as LegacyRow;
}

/** Parse literals, never SQL expressions. Numeric lexemes remain exact strings. */
export function parseSqlRows(text: string, columns: string[]): LegacyRow[] {
  let i = 0;
  const rows: LegacyRow[] = [];
  const space = () => { while (/\s/.test(text[i] ?? "") && i < text.length) i++; };
  const escapes: Record<string, string> = { "0": "\0", n: "\n", r: "\r", t: "\t", b: "\b", Z: "\x1a" };
  space();
  while (i < text.length) {
    if (text[i++] !== "(") throw new Error("Expected a literal row.");
    const values: (string | null)[] = [];
    while (true) {
      space();
      let value: string | null = "";
      if (text[i] === "'") {
        i++;
        let closed = false;
        while (i < text.length) {
          const character = text[i++];
          if (character === "\\") {
            if (i >= text.length) throw new Error("Incomplete escape.");
            const next = text[i++];
            value += next === "%" || next === "_" ? `\\${next}` : escapes[next] ?? next;
          } else if (character === "'") {
            if (text[i] === "'") { value += "'"; i++; }
            else { closed = true; break; }
          } else value += character;
        }
        if (!closed) throw new Error("Unterminated string.");
      } else {
        const start = i;
        while (i < text.length && text[i] !== "," && text[i] !== ")") i++;
        const literal = text.slice(start, i).trim();
        if (literal === "NULL") value = null;
        else if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(literal)) value = literal;
        else throw new Error("Unsupported SQL literal.");
      }
      values.push(value);
      space();
      const separator = text[i++];
      if (separator === ")") break;
      if (separator !== ",") throw new Error("Expected a value separator.");
    }
    if (values.length !== columns.length) throw new Error("Source column count mismatch.");
    rows.push(Object.fromEntries(columns.map((column, index) => [column, values[index]])));
    space();
    if (i === text.length) break;
    const ending = text[i++];
    if (ending !== "," && ending !== ";") throw new Error("Unexpected row suffix.");
    space();
    if (ending === ";" && i !== text.length) throw new Error("Unexpected SQL after values.");
  }
  return rows;
}

/** PHP serialization is data only: objects/references are deliberately not instantiated. */
export function phpValue(input: string | null | undefined): unknown {
  if (!input) return null;
  const data = Buffer.from(input, "utf8");
  let position = 0;
  function expect(value: string) { if (data.subarray(position, position + value.length).toString() !== value) throw new Error("Invalid PHP data."); position += value.length; }
  function until(marker: string) { const end = data.indexOf(marker, position); if (end < 0) throw new Error("Invalid PHP length."); const value = data.subarray(position, end).toString(); position = end + marker.length; return value; }
  function read(depth = 0): unknown {
    if (depth > 50) throw new Error("PHP data is too deeply nested.");
    const type = String.fromCharCode(data[position++]);
    if (type === "N") { expect(";"); return null; }
    expect(":");
    if (type === "i" || type === "d") return Number(until(";"));
    if (type === "b") return until(";") === "1";
    if (type === "s") {
      const size = Number(until(":")); expect('"');
      if (!Number.isSafeInteger(size) || size < 0 || position + size > data.length) throw new Error("Invalid PHP string size.");
      const value = data.subarray(position, position + size).toString("utf8"); position += size; expect('";'); return value;
    }
    if (type === "a") {
      const size = Number(until(":")); expect("{");
      if (!Number.isSafeInteger(size) || size < 0 || size > 100000) throw new Error("Invalid PHP array size.");
      const values: Record<string, unknown> = Object.create(null);
      for (let n = 0; n < size; n++) { const key = read(depth + 1); if (typeof key !== "string" && typeof key !== "number") throw new Error("Invalid PHP key."); values[String(key)] = read(depth + 1); }
      expect("}"); return values;
    }
    throw new Error("Unsupported PHP value; original text remains archived.");
  }
  const value = read();
  if (position !== data.length) throw new Error("Trailing PHP data.");
  return value;
}

export function pence(value: string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (!/^-?\d+(?:\.\d+)?$/.test(value)) throw new Error("Invalid monetary value.");
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  const result = Number(whole) * 100 + Number(fraction.slice(0, 2).padEnd(2, "0")) + (Number(fraction[2] ?? 0) >= 5 ? 1 : 0);
  if (!Number.isSafeInteger(result)) throw new Error("Monetary value exceeds safe precision.");
  return negative ? -result : result;
}

export function sourceDate(value: string | null | undefined): string | null {
  return value && /^\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d/.test(value) && !value.startsWith("0000") ? value.replace("T", " ").slice(0, 19) : null;
}

export function normalizedEmail(value: string | null | undefined): string | null { return value?.trim().toLowerCase() || null; }
