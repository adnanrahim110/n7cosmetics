import test from "node:test";
import assert from "node:assert/strict";
import { parseSqlRows, phpValue, pence, normalizedEmail } from "../lib/legacy/format";
import { csvRow } from "../lib/admin/csv";

test("SQL data preserves nulls, large identifiers, quotes, Unicode and embedded delimiters", () => {
  const rows = parseSqlRows("(18446744073709551615, 'O\\'Brien, (rose) 🌹\\nline', NULL),\n(2, 'it''s \\\\ ok', '');", ["id", "text", "empty"]);
  assert.deepEqual(rows, [{ id: "18446744073709551615", text: "O'Brien, (rose) 🌹\nline", empty: null }, { id: "2", text: "it's \\ ok", empty: "" }]);
  assert.throws(() => parseSqlRows("(1, NOW());", ["id", "text"]));
  assert.throws(() => parseSqlRows("(1); DELETE FROM orders;", ["id"]));
  assert.throws(() => parseSqlRows("(1, 'unclosed);", ["id", "text"]));
  assert.throws(() => parseSqlRows("(1);", ["id", "text"]));
});

test("PHP values respect byte lengths and never instantiate objects", () => {
  assert.equal(phpValue('s:5:"Rêve";'), "Rêve");
  assert.deepEqual({ ...(phpValue('a:2:{s:3:"qty";i:2;s:4:"paid";b:1;}') as object) }, { qty: 2, paid: true });
  assert.throws(() => phpValue('O:8:"Exploit":0:{}'));
  assert.throws(() => phpValue('s:20:"short";'));
});

test("GBP conversion preserves refund signs and decimal rounding", () => {
  assert.equal(pence("187769.28"), 18776928);
  assert.equal(pence("-12.995"), -1300);
  assert.equal(pence("0.29"), 29);
  assert.equal(pence(null), 0);
  assert.throws(() => pence("12 pounds"));
  assert.equal(normalizedEmail(" Example@Email.com "), "example@email.com");
});

test("CSV export escapes quotes, multiline names and spreadsheet formulas", () => {
  assert.equal(csvRow(['Name, "quoted"', "line\nbreak", null]), '"Name, ""quoted""","line\nbreak",""\r\n');
  assert.equal(csvRow(["=HYPERLINK(1)", "+441234", "  @SUM(1)"]), '"\'=HYPERLINK(1)","\'+441234","\'  @SUM(1)"\r\n');
});
