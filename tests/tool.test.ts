import { describe, test, expect } from "vitest";
import { buildToolResult } from "../src/tool.js";

describe("buildToolResult", () => {
  test("formats index + content for successful run", () => {
    const result = buildToolResult(
      [
        { page: 1, class: "text-rich", charCount: 500, merged: "Page 1 content", vision_status: "ok" },
        { page: 2, class: "image-only", charCount: 300, merged: "Page 2 content", vision_status: "ok" },
      ],
      128000,
      "doc-slug",
      "/path/to/file.pdf",
    );

    expect(result).toContain("## Index");
    expect(result).toContain("page 1: text-rich, 500 chars, ok");
    expect(result).toContain("page 2: image-only, 300 chars, ok");
    expect(result).toContain("Page 1 content");
    expect(result).toContain("Page 2 content");
    expect(result).not.toContain("budget exceeded");
  });

  test("truncates when over budget", () => {
    const result = buildToolResult(
      [
        { page: 1, class: "text-rich", charCount: 5000, merged: "x".repeat(5000), vision_status: "ok" },
        { page: 2, class: "text-rich", charCount: 5000, merged: "y".repeat(5000), vision_status: "ok" },
      ],
      1000,
      "doc-slug",
      "/path/to/file.pdf",
    );

    expect(result).toContain("budget exceeded");
    expect(result).toContain('pages="2-"');
  });
});
