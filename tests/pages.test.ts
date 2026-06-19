import { describe, test, expect } from "vitest";
import { parsePages } from "../src/pages.js";

describe("parsePages", () => {
  test("undefined returns all pages", () => {
    expect(parsePages(undefined, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test("single range '1-3'", () => {
    expect(parsePages("1-3", 10)).toEqual([1, 2, 3]);
  });

  test("open-ended range '5-'", () => {
    expect(parsePages("5-", 10)).toEqual([5, 6, 7, 8, 9, 10]);
  });

  test("comma list '3,7,12'", () => {
    expect(parsePages("3,7,12", 15)).toEqual([3, 7, 12]);
  });

  test("clamps out-of-range pages", () => {
    expect(parsePages("1-20", 5)).toEqual([1, 2, 3, 4, 5]);
  });

  test("deduplicates overlapping ranges", () => {
    expect(parsePages("1-3,2-4", 10)).toEqual([1, 2, 3, 4]);
  });

  test("rejects reversed range", () => {
    expect(parsePages("5-2", 10)).toBeInstanceOf(Error);
  });

  test("rejects non-numeric input", () => {
    expect(parsePages("abc", 10)).toBeInstanceOf(Error);
  });

  test("rejects zero or negative", () => {
    expect(parsePages("0-3", 10)).toBeInstanceOf(Error);
  });
});
