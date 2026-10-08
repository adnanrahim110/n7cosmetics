import assert from "node:assert/strict";
import test from "node:test";
import { collectionPageHref, collectionPageNumber, collectionPagination } from "../lib/commerce/collection-pagination";

test("malformed page parameters cannot produce an invalid slice", () => {
  for (const input of [undefined, "", "0", "-1", "1.5", "2e2", "abc", "9007199254740992", []]) {
    assert.equal(collectionPageNumber(input), 1);
  }
  assert.equal(collectionPageNumber("5"), 5);
  assert.equal(collectionPageNumber(["2", "3"]), 2);
});

test("all sixty products are covered once across the five page URLs", () => {
  const products = Array.from({ length: 60 }, (_, index) => `product-${index + 1}`);
  const discovered: string[] = [];
  for (let page = 1; page <= 5; page++) {
    const pagination = collectionPagination(products.length, page);
    const batch = products.slice(pagination.offset, pagination.end);
    assert.equal(batch.length, 12);
    discovered.push(...batch);
    assert.equal(collectionPageHref("/recreations", page), page === 1 ? "/recreations" : `/recreations?page=${page}`);
  }
  assert.deepEqual(discovered, products);
  assert.equal(new Set(discovered).size, products.length);
});

test("the last page contains only the remaining products", () => {
  const pagination = collectionPagination(25, 3);
  assert.equal(pagination.offset, 24);
  assert.equal(pagination.end, 25);
  assert.equal(pagination.totalPages, 3);
});

test("out-of-range pages resolve to valid pages, including empty collections", () => {
  assert.equal(collectionPagination(25, 99).page, 3);
  for (const requested of [-5, 0, 1.5, NaN, Infinity]) {
    assert.equal(collectionPagination(25, requested).page, 1);
  }
  const empty = collectionPagination(0, 99);
  assert.equal(empty.page, 1);
  assert.equal(empty.totalPages, 1);
  assert.equal(empty.offset, 0);
  assert.equal(empty.end, 0);
});
