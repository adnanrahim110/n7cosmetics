import assert from "node:assert/strict";
import test from "node:test";
import { poundsToPence, penceToPounds, slugify } from "../lib/admin/form";

test("money conversion uses integer pence", () => {
  assert.equal(poundsToPence("29.99"), 2999);
  assert.equal(poundsToPence("10"), 1000);
  assert.equal(poundsToPence("1.999"), null);
  assert.equal(penceToPounds(2999), "29.99");
});

test("slugs are normalized and bounded", () => {
  assert.equal(slugify("  N7's Amber & Oud  "), "n7-s-amber-oud");
  assert.ok(slugify("x".repeat(300)).length <= 190);
});
