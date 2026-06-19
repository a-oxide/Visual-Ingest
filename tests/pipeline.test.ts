import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { processFile } from "../src/pipeline.js";
import { writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";

const tmpDir = join(tmpdir(), `vi-pipeline-test-${Date.now()}`);
const imgPath = join(tmpDir, "test.png");

beforeEach(async () => {
  mkdirSync(tmpDir, { recursive: true });
  const img = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "white" },
  }).png().toBuffer();
  writeFileSync(imgPath, img);
  global.fetch = vi.fn();
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const mockVisionResponse = (full: string, visual: string, extra: string | null) => ({
  choices: [{ message: { content: `## Full transcription\n${full}\n\n## Visual description\n${visual}` } }],
});

const mockConfig = {
  model: "mimo-v2.5-free",
  endpoint: "https://opencode.ai/zen/v1/chat/completions",
  concurrency: 4,
  token_budget: 128000,
  min_dim: 768,
  max_dim: 3072,
  max_tokens_per_call: 2048,
  image_extensions: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
};

describe("processFile — image", () => {
  test("processes a single image end-to-end", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockVisionResponse("Hello World", "A white rectangle", null)),
    });

    const results = await processFile(imgPath, {
      config: mockConfig as any,
      projectDir: tmpDir,
    });

    expect(results).toHaveLength(1);
    expect(results[0].class).toBe("image");
    expect(results[0].merged).toContain("Hello World");
    expect(results[0].merged).toContain("A white rectangle");
    expect(results[0].vision_status).toBe("ok");
  });

  test("stores page image and JSON in .opencode/visual-ingest/<slug>/", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockVisionResponse("Hello", "A rect", null)),
    });

    await processFile(imgPath, {
      config: mockConfig as any,
      projectDir: tmpDir,
    });

    const ingestDir = join(tmpDir, ".opencode", "visual-ingest");
    expect(existsSync(ingestDir)).toBe(true);
    const slugDir = readdirSync(ingestDir)[0];
    const docDir = join(ingestDir, slugDir);
    expect(existsSync(join(docDir, "meta.json"))).toBe(true);
    expect(existsSync(join(docDir, "page-001.png"))).toBe(true);
    expect(existsSync(join(docDir, "page-001.json"))).toBe(true);
  });

  test("falls back gracefully when vision fails", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    });

    const results = await processFile(imgPath, {
      config: mockConfig as any,
      projectDir: tmpDir,
    });

    expect(results).toHaveLength(1);
    expect(results[0].vision_status).toBe("failed");
    expect(results[0].merged).toContain("vision failed");
  });

  test("reuses stored output when source mtime unchanged", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockVisionResponse("First run", "A rect", null)),
    });

    await processFile(imgPath, { config: mockConfig as any, projectDir: tmpDir });
    const fetchCallsFirst = (global.fetch as any).mock.calls.length;

    await processFile(imgPath, { config: mockConfig as any, projectDir: tmpDir });
    const fetchCallsSecond = (global.fetch as any).mock.calls.length;

    expect(fetchCallsSecond).toBe(fetchCallsFirst);
  });

  test("rejects unsupported file extensions", async () => {
    const txtPath = join(tmpDir, "test.txt");
    writeFileSync(txtPath, "hello");

    await expect(
      processFile(txtPath, { config: mockConfig as any, projectDir: tmpDir }),
    ).rejects.toThrow(/supports PDF and image files/);
  });
});
