import { describe, test, expect } from "vitest";
import { classifyPage } from "../src/pdf.js";

describe("classifyPage", () => {
  test("text-rich: high char count and density", () => {
    expect(classifyPage(2000, 10)).toBe("text-rich");
  });

  test("image-only: very low char count", () => {
    expect(classifyPage(30, 0.1)).toBe("image-only");
  });

  test("mixed: moderate char count", () => {
    expect(classifyPage(200, 1.0)).toBe("mixed");
  });

  test("boundary: exactly 500 chars with high density is text-rich", () => {
    expect(classifyPage(500, 10)).toBe("text-rich");
  });

  test("boundary: exactly 50 chars is not image-only (it's mixed)", () => {
    expect(classifyPage(50, 1.0)).toBe("mixed");
  });

  test("boundary: 49 chars is image-only", () => {
    expect(classifyPage(49, 0.5)).toBe("image-only");
  });
});
