import { describe, test, expect } from "vitest";
import { mergePage, type PageClass, type VisionResult } from "../src/merge.js";

const goodVision = (full: string, visual: string, extra: string | null): VisionResult => ({
  full_transcription: full,
  visual_description: visual,
  extra_text: extra,
  vision_status: "ok",
});

describe("mergePage — image-only", () => {
  test("uses vision as sole source", () => {
    const v = goodVision("Body text here", "A diagram of a pump", null);
    const merged = mergePage("image-only", null, v);
    expect(merged).toBe("Body text here\n\n## Visual description\nA diagram of a pump");
  });
});

describe("mergePage — text-rich", () => {
  test("embedded text as body + visual description + extra text", () => {
    const v = goodVision("Body text here", "Figure 1: pump diagram", "ACME Corp (logo)");
    const merged = mergePage("text-rich", "Body text here", v);
    expect(merged).toContain("Body text here");
    expect(merged).toContain("## Visual description\nFigure 1: pump diagram");
    expect(merged).toContain("## Text not in embedded layer\nACME Corp (logo)");
    expect(merged).not.toContain("## Full transcription");
  });
});

describe("mergePage — mixed", () => {
  test("embedded text + image-region content (extra_text) + visual description", () => {
    const v = goodVision("Body here", "Chart showing data", "Caption: Figure 1");
    const merged = mergePage("mixed", "Body here", v);
    expect(merged).toContain("Body here");
    expect(merged).toContain("## Image-region content\nCaption: Figure 1");
    expect(merged).toContain("## Visual description\nChart showing data");
  });
});

describe("mergePage — image (standalone image file)", () => {
  test("full transcription + visual description, no embedded text", () => {
    const v = goodVision("Button: Submit", "A web form with fields", null);
    const merged = mergePage("image", null, v);
    expect(merged).toBe("Button: Submit\n\n## Visual description\nA web form with fields");
  });
});

describe("mergePage — vision failure fallback", () => {
  test("text-rich falls back to embedded text only", () => {
    const v: VisionResult = {
      full_transcription: "",
      visual_description: "",
      extra_text: null,
      vision_status: "failed",
    };
    const merged = mergePage("text-rich", "Body text here", v);
    expect(merged).toContain("Body text here");
    expect(merged).toContain("vision failed");
  });

  test("image-only with failed vision gets placeholder", () => {
    const v: VisionResult = {
      full_transcription: "",
      visual_description: "",
      extra_text: null,
      vision_status: "failed",
    };
    const merged = mergePage("image-only", null, v);
    expect(merged).toContain("vision failed");
  });
});
