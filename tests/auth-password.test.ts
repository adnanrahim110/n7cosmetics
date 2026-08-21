import assert from "node:assert/strict";
import test from "node:test";
import { strongPasswordSchema } from "../lib/auth/password";

test("administrator passwords require length and character variety", () => {
  assert.equal(strongPasswordSchema.safeParse("N7-Local-Admin-2026!").success, true);
  assert.equal(strongPasswordSchema.safeParse("short").success, false);
  assert.equal(strongPasswordSchema.safeParse("alllowercase123!").success, false);
  assert.equal(strongPasswordSchema.safeParse("NO-LOWERCASE-123!").success, false);
  assert.equal(strongPasswordSchema.safeParse("NoNumbersHere!").success, false);
  assert.equal(strongPasswordSchema.safeParse("NoSymbolHere123").success, false);
});
