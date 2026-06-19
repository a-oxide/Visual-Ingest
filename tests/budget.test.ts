import { describe, test, expect } from "vitest";
import { estimateTokens, truncateToBudget, type PageResult } from "../src/budget.js";

describe("estimateTokens", () => {
  test("estimates tokens as chars / 3.5", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("hello")).toBe(2);
    expect(estimateTokens("a".repeat(350))).toBe(100);
  });
});

describe("truncateToBudget", () => {
  const makePage = (n: number, chars: number): PageResult => ({
    page: n,
    class: "text-rich",
    charCount: chars,
    merged: "x".repeat(chars),
    visionStatus: "ok",
  });

  test("returns all pages when under budget", () => {
    const pages = [makePage(1, 100), makePage(2, 100)];
    const result = truncateToBudget(pages, 10000, "doc-slug");
    expect(result.truncated).toBe(false);
    expect(result.content).toContain("page 1");
    expect(result.content).toContain("page 2");
  });

  test("truncates when over budget and provides follow-up note", () => {
    const pages = [makePage(1, 1000), makePage(2, 1000), makePage(3, 1000)];
    const result = truncateToBudget(pages, 500, "doc-slug");
    expect(result.truncated).toBe(true);
    expect(result.content).toContain("page 1");
    expect(result.content).toContain("budget exceeded");
    expect(result.nextFrom).toBe(2);
  });

  test("includes per-page index always", () => {
    const pages = [makePage(1, 100), makePage(2, 200)];
    const result = truncateToBudget(pages, 10000, "doc-slug");
    expect(result.content).toContain("text-rich");
    expect(result.content).toContain("100 chars");
    expect(result.content).toContain("200 chars");
  });
});
