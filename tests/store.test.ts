import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { writeMeta, readMeta, shouldReuse, writePage, readPage } from "../src/store.js";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const tmpDir = join(tmpdir(), `vi-store-test-${Date.now()}`);

beforeEach(() => mkdirSync(tmpDir, { recursive: true }));
afterEach(() => rmSync(tmpDir, { recursive: true, force: true }));

describe("store", () => {
  test("writeMeta + readMeta roundtrip", async () => {
    const meta = {
      source_path: "/tmp/test.pdf",
      source_mtime: 1000,
      page_count: 5,
      model: "mimo-v2.5-free",
      endpoint: "https://opencode.ai/zen/v1/chat/completions",
      rendered_at: 1234567890,
      question: undefined,
      status: "ok" as const,
    };
    await writeMeta(tmpDir, meta);
    const read = await readMeta(tmpDir);
    expect(read).toEqual(meta);
  });

  test("shouldReuse: true when mtime unchanged and no question", () => {
    const meta = {
      source_path: "/tmp/test.pdf",
      source_mtime: 1000,
      page_count: 5,
      model: "mimo-v2.5-free",
      endpoint: "https://opencode.ai/zen/v1/chat/completions",
      rendered_at: 1234567890,
      question: undefined,
      status: "ok" as const,
    };
    expect(shouldReuse(meta, 1000, undefined)).toBe(true);
  });

  test("shouldReuse: false when mtime changed", () => {
    const meta = {
      source_path: "/tmp/test.pdf",
      source_mtime: 1000,
      page_count: 5,
      model: "mimo-v2.5-free",
      endpoint: "https://opencode.ai/zen/v1/chat/completions",
      rendered_at: 1234567890,
      question: undefined,
      status: "ok" as const,
    };
    expect(shouldReuse(meta, 2000, undefined)).toBe(false);
  });

  test("shouldReuse: false when question differs", () => {
    const meta = {
      source_path: "/tmp/test.pdf",
      source_mtime: 1000,
      page_count: 5,
      model: "mimo-v2.5-free",
      endpoint: "https://opencode.ai/zen/v1/chat/completions",
      rendered_at: 1234567890,
      question: "old question",
      status: "ok" as const,
    };
    expect(shouldReuse(meta, 1000, "new question")).toBe(false);
  });

  test("shouldReuse: false when meta is null", () => {
    expect(shouldReuse(null, 1000, undefined)).toBe(false);
  });

  test("writePage + readPage roundtrip", async () => {
    const pageData = {
      page: 1,
      class: "text-rich" as const,
      embedded_text: "body text",
      full_transcription: "body text",
      visual_description: "a diagram",
      extra_text: "logo text",
      merged: "body text\n\n## Visual description\na diagram",
      vision_status: "ok" as const,
    };
    await writePage(tmpDir, 1, pageData);
    const read = await readPage(tmpDir, 1);
    expect(read).toEqual(pageData);
  });
});
